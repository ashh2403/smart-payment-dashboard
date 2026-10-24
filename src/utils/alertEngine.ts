// ---------------------------------------------------------------
// MONITORING & ALERT MODULE
// Applies simple, predefined rules to the user's transactions to flag
// patterns worth a human review. Alerts are prompts, not a fraud
// verdict — always confirm with the payment provider.
// ---------------------------------------------------------------
import type { Alert, AlertRule, AlertStatus, Severity, Transaction } from '../types';
import { formatINR } from './format';

export const ALERT_RULES: Record<AlertRule, { label: string; explanation: string }> = {
  HIGH_VALUE: {
    label: 'High-value transaction',
    explanation: 'A single transaction of ₹50,000 or more.',
  },
  RAPID_REPEAT: {
    label: 'Rapid repeated payments',
    explanation: 'Three or more transactions by the same customer within 10 minutes.',
  },
  REPEATED_FAILURE: {
    label: 'Repeated failures',
    explanation: 'Three or more failed transactions by the same customer within 6 hours.',
  },
  ODD_HOUR: {
    label: 'Unusual-hour activity',
    explanation: 'A transaction of ₹20,000 or more between 01:00 and 04:59.',
  },
};

const HIGH_VALUE_LIMIT = 50_000;
const ODD_HOUR_LIMIT = 20_000;
const RAPID_WINDOW_MS = 10 * 60_000;
const FAILURE_WINDOW_MS = 6 * 3_600_000;

function defaultStatus(iso: string, now: number): AlertStatus {
  const daysAgo = (now - Date.parse(iso)) / 86_400_000;
  if (daysAgo > 45) return 'Resolved';
  if (daysAgo > 20) return 'Under Review';
  return 'Open';
}

/** Finds clusters of >= minSize items within `windowMs` (non-overlapping). */
function clusters(list: Transaction[], windowMs: number, minSize: number): Transaction[][] {
  const sorted = [...list].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const out: Transaction[][] = [];
  let i = 0;
  while (i < sorted.length) {
    const start = Date.parse(sorted[i].timestamp);
    let j = i;
    while (j + 1 < sorted.length && Date.parse(sorted[j + 1].timestamp) - start <= windowMs) j++;
    if (j - i + 1 >= minSize) {
      out.push(sorted.slice(i, j + 1));
      i = j + 1;
    } else i++;
  }
  return out;
}

export function detectAlerts(txns: Transaction[], now = Date.now()): Alert[] {
  const alerts: Alert[] = [];
  const push = (rule: AlertRule, severity: Severity, group: Transaction[], description: string) => {
    const first = group[0];
    alerts.push({
      // full transaction ID keeps alert IDs unique and stable, so saved review statuses stay attached
      id: `ALR-${rule.slice(0, 2)}-${first.id}`,
      rule,
      title: ALERT_RULES[rule].label,
      description,
      severity,
      timestamp: group[group.length - 1].timestamp,
      customerId: first.customerId,
      transactionIds: group.map((t) => t.id),
      amount: Math.round(group.reduce((s, t) => s + t.amount, 0) * 100) / 100,
      status: defaultStatus(first.timestamp, now),
    });
  };

  // Rule 1 & 4: single-transaction rules
  for (const t of txns) {
    if (t.amount >= HIGH_VALUE_LIMIT) {
      push('HIGH_VALUE', t.amount >= 100_000 ? 'High' : 'Medium', [t],
        `${formatINR(t.amount)} paid via ${t.method} to ${t.merchant}.`);
    }
    const hour = new Date(t.timestamp).getHours();
    if (hour >= 1 && hour <= 4 && t.amount >= ODD_HOUR_LIMIT && t.amount < HIGH_VALUE_LIMIT) {
      push('ODD_HOUR', t.amount >= 30_000 ? 'Medium' : 'Low', [t],
        `${formatINR(t.amount)} via ${t.method} at ${String(hour).padStart(2, '0')}:${String(new Date(t.timestamp).getMinutes()).padStart(2, '0')}.`);
    }
  }

  // Group by customer for rules 2 & 3
  const byCustomer = new Map<string, Transaction[]>();
  txns.forEach((t) => {
    const l = byCustomer.get(t.customerId) ?? [];
    l.push(t);
    byCustomer.set(t.customerId, l);
  });

  byCustomer.forEach((list) => {
    clusters(list, RAPID_WINDOW_MS, 3).forEach((g) => {
      push('RAPID_REPEAT', g.length >= 4 ? 'Medium' : 'Low', g,
        `${g.length} payments totalling ${formatINR(g.reduce((s, t) => s + t.amount, 0))} within ${Math.max(1, Math.round((Date.parse(g[g.length - 1].timestamp) - Date.parse(g[0].timestamp)) / 60000))} minutes.`);
    });
    clusters(list.filter((t) => t.status === 'Failed'), FAILURE_WINDOW_MS, 3).forEach((g) => {
      push('REPEATED_FAILURE', 'High', g,
        `${g.length} failed attempts within ${Math.max(1, Math.round((Date.parse(g[g.length - 1].timestamp) - Date.parse(g[0].timestamp)) / 60000))} minutes. Last reason: ${g[g.length - 1].failureReason ?? 'n/a'}.`);
    });
  });

  return alerts.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}
