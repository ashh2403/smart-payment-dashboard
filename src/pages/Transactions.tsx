import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Eye, Search, X } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import GlobalFilterBar from '../components/filters/GlobalFilterBar';
import Card from '../components/ui/Card';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { MethodBadge, StatusBadge } from '../components/ui/Badges';
import TransactionModal from '../components/transactions/TransactionModal';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { TXN_STATUSES, METHOD_LABELS } from '../types';
import type { Transaction, TxnStatus } from '../types';
import { downloadCSV } from '../utils/csv';
import { formatDateTime, formatINR } from '../utils/format';
import { computeKpis } from '../utils/analytics';

type SortKey = 'id' | 'timestamp' | 'customerId' | 'method' | 'amount' | 'status';

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'timestamp', label: 'Date & time' },
  { key: 'customerId', label: 'Customer ID' },
  { key: 'method', label: 'Payment method' },
  { key: 'amount', label: 'Amount', align: 'right' },
  { key: 'status', label: 'Status' },
];

export default function Transactions() {
  const { filtered, preferences, filters, applyQuickRange } = useAppData();
  const notify = useToast();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [status, setStatus] = useState<TxnStatus | 'All'>('All');
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'timestamp', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(preferences.rowsPerPage);
  const [selected, setSelected] = useState<Transaction | null>(null);

  // keep in sync with the global top-bar search
  useEffect(() => {
    const q = params.get('q');
    if (q !== null) {
      setSearch(q);
      applyQuickRange(0); // a search from the top bar looks across the whole dataset
    }
  }, [params, applyQuickRange]);

  const rows = useMemo(() => {
    const term = search.trim().toUpperCase();
    const list = filtered.filter((t) => {
      if (status !== 'All' && t.status !== status) return false;
      if (term && !t.id.toUpperCase().includes(term)) return false;
      return true;
    });
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      if (typeof x === 'number' && typeof y === 'number') return (x - y) * dir;
      return String(x).localeCompare(String(y)) * dir;
    });
  }, [filtered, search, status, sort]);

  useEffect(() => setPage(1), [search, status, filters, pageSize]);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = rows.slice((page - 1) * pageSize, page * pageSize);
  const k = useMemo(() => computeKpis(rows), [rows]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'amount' || key === 'timestamp' ? 'desc' : 'asc' }));

  const clearSearch = () => {
    setSearch('');
    if (params.has('q')) {
      params.delete('q');
      setParams(params, { replace: true });
    }
  };

  const exportCsv = () => {
    const ok = downloadCSV(
      `transactions_${filters.from}_to_${filters.to}.csv`,
      rows.map((t) => ({
        'Transaction ID': t.id,
        'Date Time': formatDateTime(t.timestamp),
        'Customer ID': t.customerId,
        'Payment Method': METHOD_LABELS[t.method],
        'Amount (INR)': t.amount.toFixed(2),
        Status: t.status,
        Merchant: t.merchant,
        Category: t.category,
        City: t.city,
        Device: t.device,
        'Failure Reason': t.failureReason ?? '',
      })),
      ['# Exported from PayPulse - Smart Digital Payment Transaction Analytics Dashboard'],
    );
    notify(ok ? `Exported ${rows.length} transactions to CSV` : 'Nothing to export', ok ? 'success' : 'error');
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Search, filter, sort and inspect every processed transaction in the dataset."
        actions={<button className="btn-primary" onClick={exportCsv} disabled={rows.length === 0}><Download className="h-4 w-4" /> Export CSV</button>}
      />
      <GlobalFilterBar>
        <div className="col-span-2 sm:col-span-1 lg:w-40">
          <label htmlFor="t-status" className="label">Status</label>
          <select id="t-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as TxnStatus | 'All')}>
            <option value="All">All statuses</option>
            {TXN_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </GlobalFilterBar>

      <Card
        bodyClassName="p-0"
        title="Transaction records"
        subtitle={`${rows.length.toLocaleString('en-IN')} records · ${formatINR(k.totalValue)} total · ${k.successRate.toFixed(1)}% success`}
        actions={
          <div className="relative w-full sm:w-72">
            <label htmlFor="t-search" className="sr-only">Search by transaction ID</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="t-search" className="input pl-9 pr-9" placeholder="Search by transaction ID" value={search} onChange={(e) => setSearch(e.target.value)} />
            {search && (
              <button onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        }
      >
        {rows.length === 0 ? (
          <EmptyState message="Try a different transaction ID, status, payment method or date range."
            action={<button className="btn-secondary" onClick={() => { clearSearch(); setStatus('All'); }}>Clear search & status</button>} />
        ) : (
          <>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {COLUMNS.map((c) => {
                      const active = sort.key === c.key;
                      const Icon = !active ? ArrowUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;
                      return (
                        <th key={c.key} className={`table-th ${c.align === 'right' ? 'text-right' : ''}`}
                          aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                          <button onClick={() => toggleSort(c.key)}
                            className={`inline-flex items-center gap-1 uppercase hover:text-slate-800 ${active ? 'text-cyan-700' : ''}`}
                            title={`Sort by ${c.label}`}>
                            {c.label} <Icon className="h-3.5 w-3.5" />
                          </button>
                        </th>
                      );
                    })}
                    <th className="table-th text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {current.map((t) => (
                    <tr key={t.id} className="hover:bg-cyan-50/40">
                      <td className="table-td font-mono text-xs font-semibold text-slate-900">{t.id}</td>
                      <td className="table-td text-slate-500">{formatDateTime(t.timestamp)}</td>
                      <td className="table-td font-mono text-xs">{t.customerId}</td>
                      <td className="table-td"><MethodBadge method={t.method} /></td>
                      <td className="table-td text-right font-semibold text-slate-900">{formatINR(t.amount)}</td>
                      <td className="table-td"><StatusBadge status={t.status} /></td>
                      <td className="table-td text-right">
                        <button className="btn-secondary h-8 px-3 text-xs" onClick={() => setSelected(t)} aria-label={`View details of ${t.id}`}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageCount={pageCount} total={rows.length} pageSize={pageSize} onPage={setPage} onPageSize={setPageSize} />
          </>
        )}
      </Card>

      <TransactionModal txn={selected} onClose={() => setSelected(null)} />
    </>
  );
}
