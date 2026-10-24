import { CalendarRange, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';
import { useAppData } from '../../context/AppDataContext';
import { METHOD_LABELS, PAYMENT_METHODS } from '../../types';
import type { PaymentMethod } from '../../types';

const QUICK = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: 'All', days: 0 },
];

function daysBetween(from: string, to: string) {
  const [a, b, c] = from.split('-').map(Number);
  const [x, y, z] = to.split('-').map(Number);
  return Math.round((new Date(x, y - 1, z).getTime() - new Date(a, b - 1, c).getTime()) / 86_400_000) + 1;
}

/**
 * Date-range + payment-method filter shared by Dashboard, Transactions,
 * Analytics and Reports. Changing it updates every KPI, chart and table.
 */
export default function GlobalFilterBar({ showMethod = true, children }: { showMethod?: boolean; children?: ReactNode }) {
  const { filters, setFilters, applyQuickRange, resetFilters, bounds, filtered } = useAppData();
  const span = filters.from && filters.to ? daysBetween(filters.from, filters.to) : 0;
  const allSpan = bounds.min && bounds.max ? daysBetween(bounds.min, bounds.max) : -1;
  const activeQuick = filters.to === bounds.max ? (span === allSpan ? 0 : span) : -1;

  return (
    <div className="no-print card mb-6 flex flex-col gap-4 p-4 lg:flex-row lg:items-end">
      <div className="flex items-center gap-2 lg:hidden">
        <CalendarRange className="h-4 w-4 text-cyan-600" />
        <span className="text-sm font-semibold text-slate-700">Filters</span>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-end">
        <div className="lg:w-40">
          <label htmlFor="f-from" className="label">From</label>
          <input id="f-from" type="date" className="input" min={bounds.min} max={bounds.max} value={filters.from}
            onChange={(e) => setFilters({ from: e.target.value })} />
        </div>
        <div className="lg:w-40">
          <label htmlFor="f-to" className="label">To</label>
          <input id="f-to" type="date" className="input" min={bounds.min} max={bounds.max} value={filters.to}
            onChange={(e) => setFilters({ to: e.target.value })} />
        </div>
        {showMethod && (
          <div className="col-span-2 sm:col-span-1 lg:w-48">
            <label htmlFor="f-method" className="label">Payment method</label>
            <select id="f-method" className="input" value={filters.method}
              onChange={(e) => setFilters({ method: e.target.value as PaymentMethod | 'All' })}>
              <option value="All">All methods</option>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{METHOD_LABELS[m]}</option>)}
            </select>
          </div>
        )}
        <div className="col-span-2 sm:col-span-1">
          <span className="label">Quick range</span>
          <div className="flex h-10 items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Quick date range">
            {QUICK.map((q) => (
              <button key={q.label} onClick={() => applyQuickRange(q.days)}
                className={`chip flex-1 ${activeQuick === q.days ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title={q.days ? `Last ${q.days} days` : 'Entire dataset'}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
        {children}
      </div>
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="text-xs text-slate-500"><b className="text-slate-800">{filtered.length.toLocaleString('en-IN')}</b> transactions</span>
        <button className="btn-secondary h-9" onClick={resetFilters} title="Reset to default filters">
          <RotateCcw className="h-4 w-4" /> Reset
        </button>
      </div>
    </div>
  );
}
