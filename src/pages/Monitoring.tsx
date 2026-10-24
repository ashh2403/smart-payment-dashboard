import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertOctagon, CheckCheck, Download, Eye, FlaskConical, RotateCcw, Search, ShieldAlert, SearchCheck, XCircle } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import ChartTooltip from '../components/charts/ChartTooltip';
import { AlertStatusBadge, MethodBadge, SeverityBadge, StatusBadge } from '../components/ui/Badges';
import TransactionModal from '../components/transactions/TransactionModal';
import GlobalFilterBar from '../components/filters/GlobalFilterBar';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { ALERT_RULES } from '../utils/alertEngine';
import { ALERT_STATUSES, SEVERITIES, SEVERITY_ORDER } from '../utils/constants';
import { failureReasons } from '../utils/analytics';
import { downloadCSV } from '../utils/csv';
import { formatDateTime, formatINR, formatNumber } from '../utils/format';
import type { Alert, AlertRule, AlertStatus, Severity, Transaction } from '../types';

const AXIS = { fontSize: 11, fill: '#94a3b8' };

export default function Monitoring() {
  const { alerts, transactions, filtered, setAlertStatus, resetAlertStatuses, preferences } = useAppData();
  const notify = useToast();
  const [sev, setSev] = useState<Severity | 'All'>('All');
  const [status, setStatus] = useState<AlertStatus | 'All'>('All');
  const [rule, setRule] = useState<AlertRule | 'All'>('All');
  const [q, setQ] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'severity'>('time');
  const [investigating, setInvestigating] = useState<Alert | null>(null);
  const [txn, setTxn] = useState<Transaction | null>(null);
  const [failPage, setFailPage] = useState(1);

  const byId = useMemo(() => new Map(transactions.map((t) => [t.id, t])), [transactions]);

  const visible = useMemo(() => {
    const term = q.trim().toUpperCase();
    const list = alerts.filter((a) =>
      (sev === 'All' || a.severity === sev) &&
      (status === 'All' || a.status === status) &&
      (rule === 'All' || a.rule === rule) &&
      (!term || a.id.includes(term) || a.customerId.includes(term) || a.transactionIds.some((id) => id.includes(term))),
    );
    return sortBy === 'severity'
      ? [...list].sort((a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] || b.timestamp.localeCompare(a.timestamp))
      : list;
  }, [alerts, sev, status, rule, q, sortBy]);

  const failed = useMemo(() => filtered.filter((t) => t.status === 'Failed'), [filtered]);
  const reasons = useMemo(() => failureReasons(filtered), [filtered]);
  const FAIL_SIZE = 8;
  const failPages = Math.max(1, Math.ceil(failed.length / FAIL_SIZE));
  const failSlice = failed.slice((failPage - 1) * FAIL_SIZE, failPage * FAIL_SIZE);

  const counts = {
    open: alerts.filter((a) => a.status === 'Open').length,
    high: alerts.filter((a) => a.severity === 'High' && a.status !== 'Resolved').length,
    review: alerts.filter((a) => a.status === 'Under Review').length,
    resolved: alerts.filter((a) => a.status === 'Resolved').length,
  };

  const changeStatus = (a: Alert, s: AlertStatus) => {
    setAlertStatus(a.id, s);
    setInvestigating({ ...a, status: s });
    notify(`${a.id} marked as ${s}`);
  };

  const exportAlerts = () => {
    const ok = downloadCSV('monitoring_alerts.csv', visible.map((a) => ({
      'Alert ID': a.id, Rule: a.title, Severity: a.severity, Status: a.status, Timestamp: formatDateTime(a.timestamp),
      'Customer ID': a.customerId, 'Transactions': a.transactionIds.join(' '), 'Amount (INR)': a.amount.toFixed(2), Description: a.description,
    })), ['# Alerts raised by rule-based monitoring - prompts for review, not a fraud verdict']);
    notify(ok ? `Exported ${visible.length} alerts` : 'No alerts to export', ok ? 'success' : 'error');
  };

  const clearFilters = () => { setSev('All'); setStatus('All'); setRule('All'); setQ(''); };

  return (
    <>
      <PageHeader
        title="Monitoring & Alerts"
        description="Review failed transactions and patterns flagged by predefined monitoring rules."
        actions={
          <>
            <button className="btn-ink" onClick={() => { resetAlertStatuses(); notify('Alert statuses reset to defaults', 'info'); }}>
              <RotateCcw className="h-4 w-4" /> Reset statuses
            </button>
            <button className="btn-primary" onClick={exportAlerts}><Download className="h-4 w-4" /> Export alerts</button>
          </>
        }
      />

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-900">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
        <p>
          <b>Rule-based monitoring.</b> Alerts are raised by rule checks on your transactions
          (high value, rapid repeats, repeated failures, unusual hours). They are prompts for review — confirm with the customer
          or your payment provider before acting on them.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Open alerts" value={formatNumber(counts.open)} icon={ShieldAlert} tone="red" sub="awaiting review" />
        <KpiCard label="High severity (active)" value={formatNumber(counts.high)} icon={AlertOctagon} tone="amber" sub="open or under review" />
        <KpiCard label="Under review" value={formatNumber(counts.review)} icon={SearchCheck} tone="blue" sub="being investigated" />
        <KpiCard label="Resolved" value={formatNumber(counts.resolved)} icon={CheckCheck} tone="green" sub={`of ${alerts.length} total alerts`} />
      </div>

      <Card className="mt-6" bodyClassName="p-0"
        title="Flagged patterns"
        subtitle={`${visible.length} of ${alerts.length} alerts`}>
        <div className="grid grid-cols-2 gap-3 border-b border-slate-100 p-4 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <label htmlFor="a-q" className="label">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="a-q" className="input pl-9" placeholder="Alert / customer / txn ID" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="a-sev" className="label">Severity</label>
            <select id="a-sev" className="input" value={sev} onChange={(e) => setSev(e.target.value as Severity | 'All')}>
              <option value="All">All</option>
              {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="a-status" className="label">Alert status</label>
            <select id="a-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as AlertStatus | 'All')}>
              <option value="All">All</option>
              {ALERT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="a-rule" className="label">Rule</label>
            <select id="a-rule" className="input" value={rule} onChange={(e) => setRule(e.target.value as AlertRule | 'All')}>
              <option value="All">All rules</option>
              {(Object.keys(ALERT_RULES) as AlertRule[]).map((r) => <option key={r} value={r}>{ALERT_RULES[r].label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="a-sort" className="label">Sort by</label>
            <select id="a-sort" className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value as 'time' | 'severity')}>
              <option value="time">Newest first</option>
              <option value="severity">Severity</option>
            </select>
          </div>
        </div>

        {visible.length === 0 ? (
          <EmptyState title="No alerts match" message="Change the severity, status or rule filters."
            action={<button className="btn-secondary" onClick={clearFilters}>Clear alert filters</button>} />
        ) : (
          <div className="scrollbar-thin max-h-[520px] overflow-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-[1] bg-slate-50">
                <tr>
                  <th className="table-th">Severity</th>
                  <th className="table-th">Alert</th>
                  <th className="table-th">Timestamp</th>
                  <th className="table-th">Customer</th>
                  <th className="table-th text-right">Amount</th>
                  <th className="table-th">Status</th>
                  <th className="table-th text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((a) => (
                  <tr key={a.id} className={`hover:bg-slate-50 ${a.status === 'Resolved' ? 'opacity-60' : ''}`}>
                    <td className="table-td"><SeverityBadge severity={a.severity} /></td>
                    <td className="table-td">
                      <p className="font-semibold text-slate-900">{a.title}</p>
                      <p className="font-mono text-[11px] text-slate-400">{a.id} · {a.transactionIds.length} txn{a.transactionIds.length > 1 ? 's' : ''}</p>
                    </td>
                    <td className="table-td text-slate-500">{formatDateTime(a.timestamp)}</td>
                    <td className="table-td font-mono text-xs">{a.customerId}</td>
                    <td className="table-td text-right font-semibold">{formatINR(a.amount)}</td>
                    <td className="table-td"><AlertStatusBadge status={a.status} /></td>
                    <td className="table-td text-right">
                      <button className="btn-secondary h-8 px-3 text-xs" onClick={() => setInvestigating(a)}>
                        <Eye className="h-3.5 w-3.5" /> Investigate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-bold text-slate-900">Failed transactions</h2>
      <GlobalFilterBar />
      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2" bodyClassName="p-0" title="Failed transaction log" subtitle={`${failed.length} failed in selected range`}>
          {failed.length === 0 ? (
            <EmptyState title="No failed transactions" message="Great — nothing failed in this range." />
          ) : (
            <>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-th">Transaction</th>
                      <th className="table-th">Method</th>
                      <th className="table-th">Reason</th>
                      <th className="table-th text-right">Amount</th>
                      <th className="table-th text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {failSlice.map((t) => (
                      <tr key={t.id} className="hover:bg-red-50/40">
                        <td className="table-td">
                          <p className="font-mono text-xs font-semibold text-slate-900">{t.id}</p>
                          <p className="text-xs text-slate-400">{formatDateTime(t.timestamp)} · {t.customerId}</p>
                        </td>
                        <td className="table-td"><MethodBadge method={t.method} /></td>
                        <td className="table-td"><span className="inline-flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" />{t.failureReason}</span></td>
                        <td className="table-td text-right font-semibold">{formatINR(t.amount)}</td>
                        <td className="table-td text-right">
                          <button className="btn-ghost h-8 px-2 text-xs text-cyan-700" onClick={() => setTxn(t)}>Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={Math.min(failPage, failPages)} pageCount={failPages} total={failed.length} pageSize={FAIL_SIZE} onPage={setFailPage} />
            </>
          )}
        </Card>
        <Card title="Failure reasons" subtitle="Why transactions failed">
          {reasons.length === 0 ? <EmptyState title="No failures" /> : (
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={reasons} layout="vertical" margin={{ left: 0, right: 10 }}>
                  <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="reason" tick={AXIS} tickLine={false} axisLine={false} width={130} />
                  <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Failures" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} isAnimationActive={preferences.chartAnimations} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* Investigation view */}
      <Modal
        open={!!investigating}
        onClose={() => setInvestigating(null)}
        size="xl"
        title={investigating ? `Investigate: ${investigating.title}` : ''}
        subtitle={investigating ? `${investigating.id} · Rule-based alert` : ''}
        footer={investigating && (
          <>
            {investigating.status !== 'Under Review' && (
              <button className="btn-secondary" onClick={() => changeStatus(investigating, 'Under Review')}>Mark under review</button>
            )}
            {investigating.status !== 'Resolved' ? (
              <button className="btn-primary" onClick={() => changeStatus(investigating, 'Resolved')}><CheckCheck className="h-4 w-4" /> Resolve</button>
            ) : (
              <button className="btn-secondary" onClick={() => changeStatus(investigating, 'Open')}>Reopen</button>
            )}
          </>
        )}
      >
        {investigating && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3"><p className="label">Severity</p><SeverityBadge severity={investigating.severity} /></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="label">Status</p><AlertStatusBadge status={investigating.status} /></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="label">Customer</p><p className="font-mono text-sm font-semibold">{investigating.customerId}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="label">Total amount</p><p className="text-sm font-bold">{formatINR(investigating.amount)}</p></div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="font-semibold text-amber-900">Why this was flagged</p>
              <p className="mt-1 text-amber-800">{investigating.description}</p>
              <p className="mt-2 text-xs text-amber-700">Rule: {ALERT_RULES[investigating.rule].explanation}</p>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-800">Related transactions</p>
              <div className="scrollbar-thin overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-th">ID</th><th className="table-th">Time</th><th className="table-th">Method</th>
                      <th className="table-th">Merchant</th><th className="table-th text-right">Amount</th><th className="table-th">Status</th><th className="table-th" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {investigating.transactionIds.map((id) => byId.get(id)).filter((t): t is Transaction => !!t).map((t) => (
                      <tr key={t.id}>
                        <td className="table-td font-mono text-xs">{t.id}</td>
                        <td className="table-td text-xs text-slate-500">{formatDateTime(t.timestamp)}</td>
                        <td className="table-td"><MethodBadge method={t.method} /></td>
                        <td className="table-td text-xs">{t.merchant}</td>
                        <td className="table-td text-right font-semibold">{formatINR(t.amount)}</td>
                        <td className="table-td"><StatusBadge status={t.status} /></td>
                        <td className="table-td"><button className="text-xs font-semibold text-cyan-700 hover:underline" onClick={() => setTxn(t)}>Open</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="text-xs text-slate-400">Suggested review steps: confirm the customer’s recent activity, compare with their usual payment pattern, and record the outcome by updating the alert status.</p>
          </div>
        )}
      </Modal>

      <TransactionModal txn={txn} onClose={() => setTxn(null)} />
    </>
  );
}
