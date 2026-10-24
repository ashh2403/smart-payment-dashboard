// ---------------------------------------------------------------
// CSV IMPORT
// Turns a CSV export (bank statement, Razorpay / Paytm / PhonePe
// business export, or our own template) into RawTransaction records.
// Column names and values are matched loosely so most exports work
// without editing the file first.
// ---------------------------------------------------------------
import type { PaymentMethod, RawTransaction, TxnStatus } from '../types';

export type ImportField =
  | 'id' | 'timestamp' | 'amount' | 'method' | 'status' | 'customerId'
  | 'merchant' | 'category' | 'city' | 'device' | 'failureReason';

export type DateOrder = 'DMY' | 'MDY';

export type ColumnMapping = Partial<Record<ImportField, number>>;

export interface ImportOptions {
  mapping: ColumnMapping;
  dateOrder: DateOrder;
  defaultMethod: PaymentMethod;
  defaultStatus: TxnStatus;
  source: string;
}

export const IMPORT_FIELDS: { field: ImportField; label: string; required?: boolean; hint?: string }[] = [
  { field: 'timestamp', label: 'Date / time', required: true },
  { field: 'amount', label: 'Amount (₹)', required: true },
  { field: 'id', label: 'Transaction ID', hint: 'generated if missing' },
  { field: 'method', label: 'Payment method', hint: 'uses the default below if missing' },
  { field: 'status', label: 'Status', hint: 'uses the default below if missing' },
  { field: 'customerId', label: 'Customer', hint: 'ID, email, VPA or name' },
  { field: 'merchant', label: 'Merchant / description' },
  { field: 'category', label: 'Category' },
  { field: 'city', label: 'City' },
  { field: 'device', label: 'Device' },
  { field: 'failureReason', label: 'Failure reason' },
];

const SYNONYMS: Record<ImportField, string[]> = {
  id: ['transaction id', 'txn id', 'payment id', 'id', 'order id', 'utr', 'utr no', 'reference', 'ref no', 'reference no', 'transaction ref', 'rrn'],
  timestamp: ['date time', 'datetime', 'timestamp', 'created at', 'transaction date', 'payment date', 'value date', 'date', 'time'],
  amount: ['amount inr', 'amount', 'txn amount', 'transaction amount', 'value', 'debit', 'credit', 'withdrawal amt', 'deposit amt'],
  method: ['payment method', 'method', 'payment mode', 'mode', 'instrument', 'channel', 'type'],
  status: ['status', 'payment status', 'txn status', 'state'],
  customerId: ['customer id', 'customer', 'customer email', 'email', 'vpa', 'payer', 'contact', 'customer name', 'name'],
  merchant: ['merchant', 'payee', 'beneficiary', 'description', 'narration', 'remarks', 'particulars'],
  category: ['category'],
  city: ['city', 'location'],
  device: ['device'],
  failureReason: ['failure reason', 'error description', 'error reason', 'reason', 'error code'],
};

/** RFC-4180 style parser: handles quoted fields, escaped quotes and CRLF. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  // drop blank lines and comment lines such as "# exported on …"
  return rows.filter((r) => r.some((c) => c.trim()) && !r[0]?.trim().startsWith('#'));
}

const norm = (h: string) => h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Guesses which CSV column holds each field from the header names. */
export function guessMapping(headers: string[]): ColumnMapping {
  const cols = headers.map(norm);
  const used = new Set<number>();
  const mapping: ColumnMapping = {};
  const pick = (field: ImportField, match: (col: string, syn: string) => boolean) => {
    if (mapping[field] !== undefined) return;
    for (const syn of SYNONYMS[field]) {
      const idx = cols.findIndex((c, i) => !used.has(i) && match(c, syn));
      if (idx >= 0) { mapping[field] = idx; used.add(idx); return; }
    }
  };
  const fields = Object.keys(SYNONYMS) as ImportField[];
  fields.forEach((f) => pick(f, (c, syn) => c === syn)); // exact names first
  fields.forEach((f) => pick(f, (c, syn) => syn.length > 3 && c.includes(syn))); // then partial
  return mapping;
}

export function normalizeMethod(v: string): PaymentMethod | undefined {
  const s = v.toLowerCase();
  if (!s.trim()) return undefined;
  if (/upi|vpa|gpay|google pay|bhim/.test(s)) return 'UPI';
  if (/wallet|paytm|phonepe|amazon ?pay|mobikwik|freecharge/.test(s)) return 'Wallet';
  if (/net ?bank|netbanking|\bnb\b|neft|imps|rtgs|bank transfer|emandate/.test(s)) return 'NetBanking';
  if (/card|credit|debit|visa|master|rupay|amex|emi/.test(s)) return 'Card';
  return undefined;
}

export function normalizeStatus(v: string): TxnStatus | undefined {
  const s = v.toLowerCase().trim();
  if (!s) return undefined;
  if (/^(success|successful|succeeded|captured|paid|completed?|settled|processed|done|ok|credited|debited)$/.test(s)) return 'Success';
  if (/fail|declin|reject|error|cancel|expired|timeout|reversed/.test(s)) return 'Failed';
  if (/pending|created|authori[sz]ed|processing|initiated|in progress|hold/.test(s)) return 'Pending';
  return undefined;
}

export function parseAmount(v: string): number | undefined {
  const cleaned = v.replace(/₹|inr|rs\.?|,|\s/gi, '').replace(/^\((.*)\)$/, '-$1');
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? Math.abs(n) : undefined;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** Parses ISO dates, "03/05/2024 14:20", "03-May-2024" etc. Returns an ISO string. */
export function parseDate(v: string, order: DateOrder): string | undefined {
  const s = v.trim();
  if (!s) return undefined;
  if (/^\d{10}$/.test(s)) return new Date(Number(s) * 1000).toISOString(); // unix seconds (gateway APIs)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const t = Date.parse(s.length === 10 ? `${s}T00:00:00` : s.replace(' ', 'T'));
    return Number.isNaN(t) ? undefined : new Date(t).toISOString();
  }
  const time = s.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]m)?/i);
  let hh = time ? Number(time[1]) : 0;
  const mm = time ? Number(time[2]) : 0;
  const ss = time?.[3] ? Number(time[3]) : 0;
  if (time?.[4]) hh = (hh % 12) + (/pm/i.test(time[4]) ? 12 : 0);

  let y: number, m: number, d: number;
  const numeric = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  const named = s.match(/^(\d{1,2})[\s/-]([a-z]{3})[a-z]*[\s/,-]*(\d{2,4})/i);
  if (numeric) {
    const [a, b] = [Number(numeric[1]), Number(numeric[2])];
    [d, m] = order === 'DMY' ? [a, b] : [b, a];
    y = Number(numeric[3]);
  } else if (named && MONTHS.includes(named[2].toLowerCase())) {
    d = Number(named[1]);
    m = MONTHS.indexOf(named[2].toLowerCase()) + 1;
    y = Number(named[3]);
  } else {
    const t = Date.parse(s);
    return Number.isNaN(t) ? undefined : new Date(t).toISOString();
  }
  if (y < 100) y += 2000;
  const date = new Date(y, m - 1, d, hh, mm, ss);
  if (date.getMonth() !== m - 1 || date.getDate() !== d) return undefined; // e.g. 31/02
  return date.toISOString();
}

/** Short stable hash so rows without an ID get the same ID on every import (duplicates are then skipped). */
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).toUpperCase();
}

/** Converts parsed CSV body rows into raw transactions ready for `processTransactions`. */
export function rowsToRaw(rows: string[][], opts: ImportOptions): RawTransaction[] {
  const { mapping, dateOrder, defaultMethod, defaultStatus, source } = opts;
  const get = (row: string[], f: ImportField) => (mapping[f] !== undefined ? (row[mapping[f]!] ?? '').trim() : '');
  const seenKeys = new Map<string, number>();

  return rows.map((row) => {
    const timestamp = parseDate(get(row, 'timestamp'), dateOrder);
    const amount = parseAmount(get(row, 'amount'));
    const methodCell = get(row, 'method');
    const statusCell = get(row, 'status');
    // bank statements have no method column, but the narration usually says "UPI/…", "NEFT …" etc.
    const method = methodCell ? normalizeMethod(methodCell) ?? methodCell : normalizeMethod(get(row, 'merchant')) ?? defaultMethod;
    const status = statusCell ? normalizeStatus(statusCell) ?? statusCell : defaultStatus;
    const customerId = get(row, 'customerId') || 'UNKNOWN';

    let id = get(row, 'id');
    if (!id) {
      const key = `${timestamp}|${amount}|${customerId}|${get(row, 'merchant')}`;
      const n = (seenKeys.get(key) ?? 0) + 1; // identical rows in one file are still separate payments
      seenKeys.set(key, n);
      id = `IMP-${hash(key)}-${n}`;
    }

    return {
      id,
      timestamp,
      amount,
      method,
      status,
      customerId,
      merchant: get(row, 'merchant') || undefined,
      category: get(row, 'category') || undefined,
      city: get(row, 'city') || undefined,
      device: get(row, 'device') || undefined,
      failureReason: get(row, 'failureReason') || undefined,
      source,
    };
  });
}

export const TEMPLATE_ROWS = [
  {
    'Transaction ID': 'TXN-0001', 'Date Time': '2026-10-01 10:15', 'Customer ID': 'CUST-101', 'Payment Method': 'UPI',
    'Amount (INR)': '499.00', Status: 'Success', Merchant: 'Campus Canteen', Category: 'Food', City: 'Chennai', Device: 'Mobile App', 'Failure Reason': '',
  },
  {
    'Transaction ID': 'TXN-0002', 'Date Time': '2026-10-01 18:40', 'Customer ID': 'CUST-102', 'Payment Method': 'Card',
    'Amount (INR)': '2350.50', Status: 'Failed', Merchant: 'BookMart', Category: 'Shopping', City: 'Chennai', Device: 'Web', 'Failure Reason': 'Insufficient funds',
  },
];
