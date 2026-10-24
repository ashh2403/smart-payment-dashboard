import { useMemo, useState } from 'react';
import { Download, FileSpreadsheet, Printer, RefreshCcw } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import GlobalFilterBar from '../components/filters/GlobalFilterBar';
import EmptyState from '../components/ui/EmptyState';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { computeKpis, dailySeries, methodBreakdown, monthlySeries, statusBreakdown } from '../utils/analytics';
import { downloadCSV } from '../utils/csv';
import { dayKey, formatDate, formatDateTime, formatINR, formatNumber, monthLabel } from '../utils/format';
import { METHOD_LABELS } from '../types';
import { PROJECT } from '../data/projectInfo';
import { STATUS_COLORS } from '../utils/constants';

export default function Reports() {
  const { filtered, filters, alerts, profile, resetFilters } = useAppData();
  const notify = useToast();
  const [generatedAt, setGeneratedAt] = useState(() => new Date().toISOString());

  const k = useMemo(() => computeKpis(filtered), [filtered]);
  const statuses = useMemo(() => statusBreakdown(filtered), [filtered]);
  const methods = useMemo(() => methodBreakdown(filtered), [filtered]);
  const months = useMemo(() => monthlySeries(filtered), [filtered]);
  const busiest = useMemo(() => [...dailySeries(filtered, filters.from, filters.to)].sort((a, b) => b.count - a.count)[0], [filtered, filters.from, filters.to]);
  const alertsInRange = useMemo(
    () => alerts.filter((a) => { const d = dayKey(a.timestamp); return d >= filters.from && d <= filters.to; }),
    [alerts, filters.from, filters.to],
  );

  const methodLabel = filters.method === 'All' ? 'All payment methods' : METHOD_LABELS[filters.method];
  const preface = [
    `# ${PROJECT.title} - Transaction Summary Report`,
    `# Period: ${filters.from} to ${filters.to} | ${methodLabel} | Generated ${formatDateTime(generatedAt)}`,
  ];

  const generate = () => {
    setGeneratedAt(new Date().toISOString());
    notify('Report regenerated for the selected filters');
  };

  const exportSummary = () => {
    const rows = [
      ...statuses.map((s) => ({ Section: 'By status', Group: s.status, Transactions: s.count, 'Value (INR)': s.value.toFixed(2), 'Share %': s.share })),
      { Section: 'By status', Group: 'TOTAL', Transactions: k.total, 'Value (INR)': k.totalValue.toFixed(2), 'Share %': 100 },
      ...methods.map((m) => ({ Section: 'By method', Group: METHOD_LABELS[m.method], Transactions: m.count, 'Value (INR)': m.value.toFixed(2), 'Share %': m.share })),
      ...months.map((m) => ({ Section: 'By month', Group: monthLabel(m.key), Transactions: m.count, 'Value (INR)': m.value.toFixed(2), 'Share %': k.total ? +((m.count / k.total) * 100).toFixed(1) : 0 })),
    ];
    const ok = downloadCSV(`summary_report_${filters.from}_to_${filters.to}.csv`, rows, preface);
    notify(ok ? 'Summary report exported' : 'Nothing to export', ok ? 'success' : 'error');
  };

  const exportDetailed = () => {
    const ok = downloadCSV(`detailed_report_${filters.from}_to_${filters.to}.csv`, filtered.map((t) => ({
      'Transaction ID': t.id, 'Date Time': formatDateTime(t.timestamp), 'Customer ID': t.customerId, 'Payment Method': METHOD_LABELS[t.method],
      'Amount (INR)': t.amount.toFixed(2), Status: t.status, Merchant: t.merchant, Category: t.category, 'Failure Reason': t.failureReason ?? '',
    })), preface);
    notify(ok ? `Exported ${filtered.length} records` : 'Nothing to export', ok ? 'success' : 'error');
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate a transaction summary for any date range, export it as CSV or print it."
        actions={
          <>
            <button className="btn-ink" onClick={generate}><RefreshCcw className="h-4 w-4" /> Generate</button>
            <button className="btn-ink" onClick={exportDetailed} disabled={!filtered.length}><FileSpreadsheet className="h-4 w-4" /> Detailed CSV</button>
            <button className="btn-ink" onClick={exportSummary} disabled={!filtered.length}><Download className="h-4 w-4" /> Summary CSV</button>
            <button className="btn-primary" onClick={() => window.print()} disabled={!filtered.length}><Printer className="h-4 w-4" /> Print</button>
          </>
        }
      />
      <GlobalFilterBar />

      {filtered.length === 0 ? (
        <div className="card"><EmptyState message="No transactions in this range to report on." action={<button className="btn-primary" onClick={resetFilters}>Reset filters</button>} /></div>
      ) : (
        <article className="print-area card mx-auto max-w-5xl p-6 sm:p-10">
          {/* report header */}
          <header className="flex flex-col justify-between gap-4 border-b-2 border-navy-900 pb-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600">Transaction Summary Report</p>
              <h2 className="mt-1 text-xl font-extrabold text-navy-900 sm:text-2xl">{PROJECT.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{PROJECT.department} · {PROJECT.institution}</p>
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:text-right">
              <dt className="text-slate-400">Period</dt><dd className="font-semibold">{formatDate(filters.from)} – {formatDate(filters.to)}</dd>
              <dt className="text-slate-400">Methods</dt><dd className="font-semibold">{methodLabel}</dd>
              <dt className="text-slate-400">Generated</dt><dd className="font-semibold">{formatDateTime(generatedAt)}</dd>
              <dt className="text-slate-400">Prepared by</dt><dd className="font-semibold">{profile.name}</dd>
            </dl>
          </header>

          {/* headline numbers */}
          <section className="print-break mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ['Total transactions', formatNumber(k.total)],
              ['Total value', formatINR(k.totalValue)],
              ['Success rate', `${k.successRate.toFixed(1)}%`],
              ['Average ticket', formatINR(k.avgTicket)],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl border border-slate-200 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{l}</p>
                <p className="mt-1 text-lg font-extrabold text-navy-900">{v}</p>
              </div>
            ))}
          </section>

          {/* by status */}
          <section className="print-break mt-8">
            <h3 className="mb-3 font-bold text-navy-900">1. Transactions by status</h3>
            <table className="w-full border border-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr><th className="table-th">Status</th><th className="table-th text-right">Count</th><th className="table-th text-right">Total value</th><th className="table-th text-right">Share</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {statuses.map((s) => (
                  <tr key={s.status}>
                    <td className="table-td"><span className="inline-flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />{s.status}</span></td>
                    <td className="table-td text-right">{formatNumber(s.count)}</td>
                    <td className="table-td text-right">{formatINR(s.value)}</td>
                    <td className="table-td text-right">{s.share}%</td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="table-td">Total</td>
                  <td className="table-td text-right">{formatNumber(k.total)}</td>
                  <td className="table-td text-right">{formatINR(k.totalValue)}</td>
                  <td className="table-td text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* by method */}
          <section className="print-break mt-8">
            <h3 className="mb-3 font-bold text-navy-900">2. Payment method summary</h3>
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full border border-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="table-th">Method</th><th className="table-th text-right">Txns</th><th className="table-th text-right">Success</th>
                    <th className="table-th text-right">Failed</th><th className="table-th text-right">Pending</th><th className="table-th text-right">Value</th><th className="table-th text-right">Success %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {methods.map((m) => (
                    <tr key={m.method}>
                      <td className="table-td font-semibold">{METHOD_LABELS[m.method]}</td>
                      <td className="table-td text-right">{m.count}</td>
                      <td className="table-td text-right">{m.success}</td>
                      <td className="table-td text-right">{m.failed}</td>
                      <td className="table-td text-right">{m.pending}</td>
                      <td className="table-td text-right">{formatINR(m.value)}</td>
                      <td className="table-td text-right">{m.count ? `${m.successRate}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* by month */}
          <section className="print-break mt-8">
            <h3 className="mb-3 font-bold text-navy-900">3. Monthly breakdown</h3>
            <table className="w-full border border-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr><th className="table-th">Month</th><th className="table-th text-right">Txns</th><th className="table-th text-right">Value</th><th className="table-th text-right">Success %</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {months.map((m) => (
                  <tr key={m.key}>
                    <td className="table-td">{monthLabel(m.key)}</td>
                    <td className="table-td text-right">{m.count}</td>
                    <td className="table-td text-right">{formatINR(m.value)}</td>
                    <td className="table-td text-right">{m.successRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* observations */}
          <section className="print-break mt-8">
            <h3 className="mb-3 font-bold text-navy-900">4. Key observations</h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-700">
              <li>{formatNumber(k.success)} of {formatNumber(k.total)} transactions completed successfully ({k.successRate.toFixed(1)}%), settling {formatINR(k.settledValue)}.</li>
              <li>{formatNumber(k.failed)} transactions failed ({k.failureRate.toFixed(1)}%) and {formatNumber(k.pending)} are pending settlement.</li>
              {(() => {
                const top = [...methods].sort((a, b) => b.count - a.count)[0];
                return top && top.count > 0 ? <li>{METHOD_LABELS[top.method]} was the most used method with {top.share}% of transactions.</li> : null;
              })()}
              {busiest && busiest.count > 0 && <li>The busiest day was {formatDate(busiest.key + 'T00:00:00')} with {busiest.count} transactions.</li>}
              <li>{alertsInRange.length} monitoring alerts were raised in this period ({alertsInRange.filter((a) => a.severity === 'High').length} high severity).</li>
            </ul>
          </section>

          <footer className="mt-10 flex justify-between border-t border-slate-200 pt-4 text-[11px] text-slate-400">
            <span>{PROJECT.course} · {PROJECT.institution}</span>
            <span>Guide: {PROJECT.guide.name}</span>
          </footer>
        </article>
      )}
    </>
  );
}
