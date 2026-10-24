// ---------------------------------------------------------------
// DATA PROCESSING MODULE
// Validates, cleans and organizes raw transaction records.
// ---------------------------------------------------------------
import { PAYMENT_METHODS, TXN_STATUSES } from '../types';
import type { Device, PaymentMethod, ProcessingReport, RawTransaction, Transaction, TxnStatus } from '../types';

const DEVICES: Device[] = ['Mobile App', 'Web', 'POS Terminal'];

export function processTransactions(raw: RawTransaction[]): { transactions: Transaction[]; report: ProcessingReport } {
  const seen = new Set<string>();
  const rejected = new Map<string, number>();
  const reject = (reason: string) => rejected.set(reason, (rejected.get(reason) ?? 0) + 1);
  const valid: Transaction[] = [];

  for (const r of raw) {
    const id = r.id?.trim();
    if (!id) { reject('Missing transaction ID'); continue; }
    if (seen.has(id)) { reject('Duplicate transaction ID'); continue; }
    if (!r.customerId || !r.customerId.trim()) { reject('Missing customer ID'); continue; }
    if (!r.timestamp || Number.isNaN(Date.parse(r.timestamp))) { reject('Invalid date / time'); continue; }
    if (typeof r.amount !== 'number' || !Number.isFinite(r.amount) || r.amount <= 0) { reject('Invalid amount (≤ 0)'); continue; }
    if (!PAYMENT_METHODS.includes(r.method as PaymentMethod)) { reject('Unknown payment method'); continue; }
    if (!TXN_STATUSES.includes(r.status as TxnStatus)) { reject('Unknown status'); continue; }

    seen.add(id);
    valid.push({
      id,
      timestamp: new Date(r.timestamp).toISOString(),
      customerId: r.customerId.trim().toUpperCase(),
      method: r.method as PaymentMethod,
      amount: Math.round(r.amount * 100) / 100,
      status: r.status as TxnStatus,
      merchant: r.merchant?.trim() || 'Unknown merchant',
      category: r.category?.trim() || 'Other',
      city: r.city?.trim() || 'Unknown',
      device: DEVICES.includes(r.device as Device) ? (r.device as Device) : 'Web',
      failureReason: r.status === 'Failed' ? r.failureReason || 'Not specified' : undefined,
      source: r.source || 'Manual entry',
    });
  }

  // organize: newest first
  valid.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const bySource = new Map<string, number>();
  valid.forEach((t) => bySource.set(t.source, (bySource.get(t.source) ?? 0) + 1));

  return {
    transactions: valid,
    report: {
      rawCount: raw.length,
      validCount: valid.length,
      rejectedCount: raw.length - valid.length,
      rejected: [...rejected.entries()].map(([reason, count]) => ({ reason, count })),
      bySource: [...bySource.entries()].map(([source, count]) => ({ source, count })),
      processedAt: new Date().toISOString(),
    },
  };
}
