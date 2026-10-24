import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Alert, AlertStatus, Filters, Preferences, ProcessingReport, Profile, Transaction } from '../types';
import {
  clearAlertReviews, deleteAllTransactions, deleteTransaction, fetchAlertReviews, fetchTransactions, saveAlertReview, saveTransactions,
} from '../services/transactionService';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { detectAlerts } from '../utils/alertEngine';
import { applyFilters } from '../utils/analytics';
import { dayKey, toInputDate } from '../utils/format';
import { loadJSON, saveJSON } from '../utils/storage';

const PREF_KEY = 'paypulse.preferences';

export const DEFAULT_PREFERENCES: Preferences = {
  defaultRangeDays: 30,
  rowsPerPage: 10,
  compactNumbers: true,
  chartAnimations: true,
};

interface AppData {
  loading: boolean;
  error: string | null;
  transactions: Transaction[];
  filtered: Transaction[];
  report: ProcessingReport | null;
  alerts: Alert[];
  setAlertStatus: (id: string, status: AlertStatus) => void;
  resetAlertStatuses: () => void;
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  applyQuickRange: (days: number) => void;
  resetFilters: () => void;
  bounds: { min: string; max: string };
  preferences: Preferences;
  updatePreferences: (patch: Partial<Preferences>) => void;
  profile: Profile;
  /** Saves validated transactions; returns how many were new (existing IDs are skipped). */
  addTransactions: (txns: Transaction[]) => Promise<number>;
  removeTransaction: (id: string) => Promise<void>;
  clearAllTransactions: () => Promise<void>;
  reload: () => void;
}

const Ctx = createContext<AppData | null>(null);

function rangeFor(days: number, bounds: { min: string; max: string }): Pick<Filters, 'from' | 'to'> {
  if (!bounds.max) return { from: '', to: '' };
  if (days <= 0) return { from: bounds.min, to: bounds.max };
  const [y, m, d] = bounds.max.split('-').map(Number);
  const start = new Date(y, m - 1, d);
  start.setDate(start.getDate() - (days - 1));
  const from = toInputDate(start);
  return { from: from < bounds.min ? bounds.min : from, to: bounds.max };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const notify = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [report, setReport] = useState<ProcessingReport | null>(null);
  const [preferences, setPreferences] = useState<Preferences>(() => ({ ...DEFAULT_PREFERENCES, ...loadJSON(PREF_KEY, DEFAULT_PREFERENCES) }));
  const [alertOverrides, setAlertOverrides] = useState<Record<string, AlertStatus>>({});
  const [filters, setFiltersState] = useState<Filters>({ from: '', to: '', method: 'All' });
  const [reloadToken, setReloadToken] = useState(0);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    // `loading` starts true for the first fetch only; later reloads refresh in place
    // so pages (e.g. the import form) are not unmounted mid-task.
    setError(null);
    Promise.all([fetchTransactions(), fetchAlertReviews()])
      .then(([res, reviews]) => {
        if (cancelled) return;
        setTransactions(res.transactions);
        setReport(res.report);
        setAlertOverrides(reviews);
      })
      .catch((e: unknown) => !cancelled && setError(e instanceof Error ? e.message : 'Failed to load data'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [userId, reloadToken]);

  const bounds = useMemo(() => {
    if (!transactions.length) return { min: '', max: '' };
    // transactions are sorted newest first
    return { min: dayKey(transactions[transactions.length - 1].timestamp), max: dayKey(transactions[0].timestamp) };
  }, [transactions]);

  // (re)initialise the date range whenever the data's date span changes, e.g. after an import
  useEffect(() => {
    setFiltersState((f) => ({ ...f, ...rangeFor(preferences.defaultRangeDays, bounds) }));
  }, [bounds.min, bounds.max]); // eslint-disable-line react-hooks/exhaustive-deps

  const setFilters = useCallback((patch: Partial<Filters>) => {
    setFiltersState((f) => {
      const next = { ...f, ...patch };
      if (next.from && next.to && next.from > next.to) {
        // keep the range valid: move the other end
        if (patch.from) next.to = next.from;
        else next.from = next.to;
      }
      return next;
    });
  }, []);

  const applyQuickRange = useCallback((days: number) => setFiltersState((f) => ({ ...f, ...rangeFor(days, bounds) })), [bounds]);

  const resetFilters = useCallback(
    () => setFiltersState({ method: 'All', ...rangeFor(preferences.defaultRangeDays, bounds) }),
    [bounds, preferences.defaultRangeDays],
  );

  const filtered = useMemo(() => applyFilters(transactions, filters), [transactions, filters]);

  const baseAlerts = useMemo(() => detectAlerts(transactions), [transactions]);
  const alerts = useMemo(
    () => baseAlerts.map((a) => (alertOverrides[a.id] ? { ...a, status: alertOverrides[a.id] } : a)),
    [baseAlerts, alertOverrides],
  );

  const setAlertStatus = useCallback((id: string, status: AlertStatus) => {
    setAlertOverrides((o) => ({ ...o, [id]: status }));
    saveAlertReview(id, status).catch((e: Error) => notify(`Could not save alert status: ${e.message}`, 'error'));
  }, [notify]);

  const resetAlertStatuses = useCallback(() => {
    setAlertOverrides({});
    clearAlertReviews().catch((e: Error) => notify(`Could not reset alert statuses: ${e.message}`, 'error'));
  }, [notify]);

  const updatePreferences = useCallback((patch: Partial<Preferences>) => {
    setPreferences((p) => {
      const next = { ...p, ...patch };
      saveJSON(PREF_KEY, next);
      return next;
    });
  }, []);

  const reload = useCallback(() => setReloadToken((t) => t + 1), []);

  const addTransactions = useCallback(async (txns: Transaction[]) => {
    const saved = await saveTransactions(txns);
    reload();
    return saved;
  }, [reload]);

  const removeTransaction = useCallback(async (id: string) => {
    await deleteTransaction(id);
    setTransactions((list) => list.filter((t) => t.id !== id));
  }, []);

  const clearAllTransactions = useCallback(async () => {
    await deleteAllTransactions();
    await clearAlertReviews();
    reload();
  }, [reload]);

  const value: AppData = {
    loading, error, transactions, filtered, report, alerts, setAlertStatus, resetAlertStatuses,
    filters, setFilters, applyQuickRange, resetFilters, bounds, preferences, updatePreferences,
    profile, addTransactions, removeTransaction, clearAllTransactions, reload,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>');
  return ctx;
}
