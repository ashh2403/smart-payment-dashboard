// ---------------------------------------------------------------
// TRANSACTION ANALYTICS MODULE
// Pure functions: every page derives its numbers from the same
// filtered list, so KPIs, charts and tables always agree.
// ---------------------------------------------------------------
import { PAYMENT_METHODS } from '../types';
import type { Filters, PaymentMethod, Transaction, TxnStatus } from '../types';
import { dayKey, toInputDate } from './format';

/** Inclusive local-date range filter + payment method filter. */
export function applyFilters(txns: Transaction[], f: Filters): Transaction[] {
  return txns.filter((t) => {
    const k = dayKey(t.timestamp);
    if (f.from && k < f.from) return false;
    if (f.to && k > f.to) return false;
    if (f.method !== 'All' && t.method !== f.method) return false;
    return true;
  });
}

export interface Kpis {
  total: number;
  totalValue: number;
  settledValue: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
  failureRate: number;
  avgTicket: number;
}

export function computeKpis(txns: Transaction[]): Kpis {
  let totalValue = 0, settledValue = 0, success = 0, failed = 0, pending = 0;
  for (const t of txns) {
    totalValue += t.amount;
    if (t.status === 'Success') { success++; settledValue += t.amount; }
    else if (t.status === 'Failed') failed++;
    else pending++;
  }
  const total = txns.length;
  return {
    total,
    totalValue,
    settledValue,
    success,
    failed,
    pending,
    successRate: total ? (success / total) * 100 : 0,
    failureRate: total ? (failed / total) * 100 : 0,
    avgTicket: total ? totalValue / total : 0,
  };
}

export interface DayPoint {
  key: string;
  count: number;
  value: number;
  Success: number;
  Failed: number;
  Pending: number;
  successRate: number;
  failureRate: number;
  UPI: number;
  Card: number;
  Wallet: number;
  NetBanking: number;
}

function emptyPoint(key: string): DayPoint {
  return { key, count: 0, value: 0, Success: 0, Failed: 0, Pending: 0, successRate: 0, failureRate: 0, UPI: 0, Card: 0, Wallet: 0, NetBanking: 0 };
}

function finalize(p: DayPoint) {
  p.value = Math.round(p.value);
  p.successRate = p.count ? +((p.Success / p.count) * 100).toFixed(1) : 0;
  p.failureRate = p.count ? +((p.Failed / p.count) * 100).toFixed(1) : 0;
  return p;
}

/** One point per calendar day between from and to (fills empty days with zeros). */
export function dailySeries(txns: Transaction[], from: string, to: string): DayPoint[] {
  const map = new Map<string, DayPoint>();
  if (from && to) {
    const [fy, fm, fd] = from.split('-').map(Number);
    const cur = new Date(fy, fm - 1, fd);
    let guard = 0;
    while (toInputDate(cur) <= to && guard++ < 1000) {
      const k = toInputDate(cur);
      map.set(k, emptyPoint(k));
      cur.setDate(cur.getDate() + 1);
    }
  }
  for (const t of txns) {
    const k = dayKey(t.timestamp);
    const p = map.get(k) ?? emptyPoint(k);
    p.count++;
    p.value += t.amount;
    p[t.status]++;
    p[t.method]++;
    map.set(k, p);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map(finalize);
}

export function monthlySeries(txns: Transaction[]): DayPoint[] {
  const map = new Map<string, DayPoint>();
  for (const t of txns) {
    const k = dayKey(t.timestamp).slice(0, 7);
    const p = map.get(k) ?? emptyPoint(k);
    p.count++;
    p.value += t.amount;
    p[t.status]++;
    p[t.method]++;
    map.set(k, p);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map(finalize);
}

/** Groups daily points into ISO-ish weeks (starting Monday). */
export function weeklySeries(daily: DayPoint[]): DayPoint[] {
  const map = new Map<string, DayPoint>();
  for (const d of daily) {
    const [y, m, day] = d.key.split('-').map(Number);
    const date = new Date(y, m - 1, day);
    const offset = (date.getDay() + 6) % 7;
    date.setDate(date.getDate() - offset);
    const k = toInputDate(date);
    const p = map.get(k) ?? emptyPoint(k);
    p.count += d.count;
    p.value += d.value;
    p.Success += d.Success; p.Failed += d.Failed; p.Pending += d.Pending;
    p.UPI += d.UPI; p.Card += d.Card; p.Wallet += d.Wallet; p.NetBanking += d.NetBanking;
    map.set(k, p);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key)).map(finalize);
}

export function withMovingAverage<T extends { value: number }>(series: T[], window = 7): (T & { movingAvg: number })[] {
  return series.map((p, i) => {
    const slice = series.slice(Math.max(0, i - window + 1), i + 1);
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length;
    return { ...p, movingAvg: Math.round(avg) };
  });
}

export interface MethodStat {
  method: PaymentMethod;
  count: number;
  value: number;
  success: number;
  failed: number;
  pending: number;
  successRate: number;
  failureRate: number;
  avgAmount: number;
  share: number;
}

export function methodBreakdown(txns: Transaction[]): MethodStat[] {
  const total = txns.length;
  return PAYMENT_METHODS.map((method) => {
    const list = txns.filter((t) => t.method === method);
    const k = computeKpis(list);
    return {
      method,
      count: k.total,
      value: Math.round(k.totalValue),
      success: k.success,
      failed: k.failed,
      pending: k.pending,
      successRate: +k.successRate.toFixed(1),
      failureRate: +k.failureRate.toFixed(1),
      avgAmount: Math.round(k.avgTicket),
      share: total ? +((k.total / total) * 100).toFixed(1) : 0,
    };
  });
}

export function statusBreakdown(txns: Transaction[]): { status: TxnStatus; count: number; value: number; share: number }[] {
  const total = txns.length;
  return (['Success', 'Failed', 'Pending'] as TxnStatus[]).map((status) => {
    const list = txns.filter((t) => t.status === status);
    const value = list.reduce((s, t) => s + t.amount, 0);
    return { status, count: list.length, value: Math.round(value * 100) / 100, share: total ? +((list.length / total) * 100).toFixed(1) : 0 };
  });
}

export function hourlyDistribution(txns: Transaction[]) {
  const rows = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, '0')}:00`, count: 0, value: 0 }));
  txns.forEach((t) => {
    const h = new Date(t.timestamp).getHours();
    rows[h].count++;
    rows[h].value += t.amount;
  });
  return rows.map((r) => ({ ...r, value: Math.round(r.value) }));
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function weekdayDistribution(txns: Transaction[]) {
  const rows = WEEKDAYS.map((day) => ({ day, count: 0, value: 0, failed: 0 }));
  txns.forEach((t) => {
    const idx = (new Date(t.timestamp).getDay() + 6) % 7;
    rows[idx].count++;
    rows[idx].value += t.amount;
    if (t.status === 'Failed') rows[idx].failed++;
  });
  return rows.map((r) => ({ ...r, value: Math.round(r.value) }));
}

export function failureReasons(txns: Transaction[]) {
  const map = new Map<string, number>();
  txns.filter((t) => t.status === 'Failed').forEach((t) => {
    const r = t.failureReason ?? 'Not specified';
    map.set(r, (map.get(r) ?? 0) + 1);
  });
  return [...map.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

export function categoryBreakdown(txns: Transaction[]) {
  const map = new Map<string, { count: number; value: number }>();
  txns.forEach((t) => {
    const e = map.get(t.category) ?? { count: 0, value: 0 };
    e.count++;
    e.value += t.amount;
    map.set(t.category, e);
  });
  return [...map.entries()]
    .map(([category, e]) => ({ category, count: e.count, value: Math.round(e.value) }))
    .sort((a, b) => b.value - a.value);
}

/** The equally long period immediately before the selected one. */
export function previousPeriod(f: Filters): Filters | null {
  if (!f.from || !f.to) return null;
  const [fy, fm, fd] = f.from.split('-').map(Number);
  const [ty, tm, td] = f.to.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to = new Date(ty, tm - 1, td);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  const prevTo = new Date(from);
  prevTo.setDate(prevTo.getDate() - 1);
  const prevFrom = new Date(prevTo);
  prevFrom.setDate(prevFrom.getDate() - (days - 1));
  return { ...f, from: toInputDate(prevFrom), to: toInputDate(prevTo) };
}

export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}
