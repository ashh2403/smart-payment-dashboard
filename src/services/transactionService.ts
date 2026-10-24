// ---------------------------------------------------------------
// DATA ACCESS LAYER
// The UI only talks to this file. Transactions live in Supabase
// (table `public.transactions`, see supabase/schema.sql) and are
// scoped to the signed-in user by Row Level Security.
//
// Never send or store real card numbers, CVVs, UPI PINs or passwords.
// ---------------------------------------------------------------
import { supabase } from '../lib/supabase';
import { processTransactions } from './dataProcessing';
import type { AlertStatus, ProcessingReport, RawTransaction, Transaction } from '../types';

export interface DatasetResult {
  transactions: Transaction[];
  report: ProcessingReport;
}

interface TransactionRow {
  id: string;
  occurred_at: string;
  customer_id: string;
  method: string;
  amount: number | string;
  status: string;
  merchant: string | null;
  category: string | null;
  city: string | null;
  device: string | null;
  failure_reason: string | null;
  source: string;
}

const PAGE = 1000; // Supabase returns at most 1000 rows per request
const COLUMNS = 'id, occurred_at, customer_id, method, amount, status, merchant, category, city, device, failure_reason, source';

function fromRow(r: TransactionRow): RawTransaction {
  return {
    id: r.id,
    timestamp: r.occurred_at,
    customerId: r.customer_id,
    method: r.method,
    amount: Number(r.amount),
    status: r.status,
    merchant: r.merchant ?? undefined,
    category: r.category ?? undefined,
    city: r.city ?? undefined,
    device: r.device ?? undefined,
    failureReason: r.failure_reason ?? undefined,
    source: r.source,
  };
}

function toRow(t: Transaction) {
  return {
    id: t.id,
    occurred_at: t.timestamp,
    customer_id: t.customerId,
    method: t.method,
    amount: t.amount,
    status: t.status,
    merchant: t.merchant,
    category: t.category,
    city: t.city,
    device: t.device,
    failure_reason: t.failureReason ?? null,
    source: t.source,
  };
}

/** Loads every transaction of the signed-in user, newest first. */
export async function fetchTransactions(): Promise<DatasetResult> {
  const rows: TransactionRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from('transactions')
      .select(COLUMNS)
      .order('occurred_at', { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    rows.push(...((data ?? []) as TransactionRow[]));
    if (!data || data.length < PAGE) break;
  }
  return processTransactions(rows.map(fromRow));
}

/**
 * Saves already-validated transactions. Rows whose ID already exists for
 * this user are skipped, so re-importing the same file is safe.
 */
export async function saveTransactions(txns: Transaction[]): Promise<number> {
  let saved = 0;
  for (let i = 0; i < txns.length; i += 500) {
    const chunk = txns.slice(i, i + 500).map(toRow);
    const { data, error } = await supabase
      .from('transactions')
      .upsert(chunk, { onConflict: 'user_id,id', ignoreDuplicates: true })
      .select('id');
    if (error) throw new Error(error.message);
    saved += data?.length ?? 0;
  }
  return saved;
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Removes every transaction of the signed-in user (RLS limits it to their rows). */
export async function deleteAllTransactions(): Promise<void> {
  const { error } = await supabase.from('transactions').delete().not('id', 'is', null);
  if (error) throw new Error(error.message);
}

// ---------- alert review statuses ----------

export async function fetchAlertReviews(): Promise<Record<string, AlertStatus>> {
  const { data, error } = await supabase.from('alert_reviews').select('alert_id, status');
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((r) => [r.alert_id as string, r.status as AlertStatus]));
}

export async function saveAlertReview(alertId: string, status: AlertStatus): Promise<void> {
  const { error } = await supabase
    .from('alert_reviews')
    .upsert({ alert_id: alertId, status, updated_at: new Date().toISOString() }, { onConflict: 'user_id,alert_id' });
  if (error) throw new Error(error.message);
}

export async function clearAlertReviews(): Promise<void> {
  const { error } = await supabase.from('alert_reviews').delete().not('alert_id', 'is', null);
  if (error) throw new Error(error.message);
}
