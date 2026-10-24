import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ReferenceLine,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock3, CreditCard, Landmark, RefreshCw, Smartphone, Wallet, XCircle,
} from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import GlobalFilterBar from '../components/filters/GlobalFilterBar';
import Card from '../components/ui/Card';
import ChartTooltip from '../components/charts/ChartTooltip';
import EmptyState from '../components/ui/EmptyState';
import { MethodBadge, StatusBadge } from '../components/ui/Badges';
import TransactionModal from '../components/transactions/TransactionModal';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import {
  applyFilters, computeKpis, dailySeries, methodBreakdown, percentChange, previousPeriod, weeklySeries,
} from '../utils/analytics';
import type { DayPoint } from '../utils/analytics';
import { formatAxisINR, formatDateTime, formatINR, formatNumber, shortDayLabel } from '../utils/format';
import { METHOD_COLORS } from '../utils/constants';
import { METHOD_LABELS } from '../types';
import type { PaymentMethod, Transaction } from '../types';

const AXIS = { fontSize: 11, fill: '#94a3b8' };
const INK = '#0b1a10';
const GREEN = '#2fb33c';
const MUTED_BAR = '#dfe6df';

const METHOD_ICONS: Record<PaymentMethod, LucideIcon> = {
  UPI: Smartphone,
  Card: CreditCard,
  Wallet,
  NetBanking: Landmark,
};

/** Tiny bar sparkline used inside the KPI tiles: green when the value rose, muted/red when it fell. */
function MiniBars({ values, dark = false }: { values: number[]; dark?: boolean }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-12 items-end gap-1" aria-hidden>
      {values.map((v, i) => {
        const up = i === 0 || v >= values[i - 1];
        const color = up ? 'bg-cyan-400' : dark ? 'bg-white/25' : 'bg-red-400/80';
        return <span key={i} className={`w-1.5 rounded-sm ${color}`} style={{ height: `${Math.max(10, (v / max) * 100)}%` }} />;
      })}
    </div>
  );
}

function StatTile({ label, value, suffix, delta, invert, bars, dark = false }: {
  label: string; value: string; suffix?: string; delta: number | null; invert?: boolean; bars: number[]; dark?: boolean;
}) {
  const has = delta !== null && Number.isFinite(delta);
  const good = has && (invert ? delta! <= 0 : delta! >= 0);
  return (
    <div className={`${dark ? 'card-dark' : 'card'} animate-fadeUp flex items-end justify-between gap-4 p-5`}>
      <div className="min-w-0">
        <p className={`text-xs font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
        <p className={`mt-2 truncate text-[28px] font-semibold leading-none tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          {value}{suffix && <span className={`text-lg font-normal ${dark ? 'text-slate-400' : 'text-slate-400'}`}>{suffix}</span>}
        </p>
        <p className="mt-3 flex items-center gap-1 text-[11px]">
          {has ? (
            <>
              <span className={`inline-flex items-center font-semibold ${good ? 'text-cyan-500' : 'text-red-500'}`}>
                {delta! >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(delta!).toFixed(1)}%
              </span>
              <span className={dark ? 'text-slate-400' : 'text-slate-500'}>than last period</span>
            </>
          ) : (
            <span className={dark ? 'text-slate-500' : 'text-slate-400'}>No previous period to compare</span>
          )}
        </p>
      </div>
      <MiniBars values={bars} dark={dark} />
    </div>
  );
}

/** Small trend line for the method table — green if the second half beats the first half. */
function Sparkline({ data, dataKey, id, anim }: { data: DayPoint[]; dataKey: PaymentMethod; id: string; anim: boolean }) {
  const half = Math.floor(data.length / 2);
  const sum = (arr: DayPoint[]) => arr.reduce((s, p) => s + p[dataKey], 0);
  const rising = sum(data.slice(half)) >= sum(data.slice(0, half));
  const color = rising ? GREEN : '#e05353';
  return (
    <div className="h-9 w-28">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.75} fill={`url(#${id})`} isAnimationActive={anim} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { transactions, filtered, filters, preferences, reload, resetFilters } = useAppData();
  const notify = useToast();
  const [metric, setMetric] = useState<'count' | 'value'>('count');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const anim = preferences.chartAnimations;
  const money = (v: number) => formatINR(v, preferences.compactNumbers);

  const kpis = useMemo(() => computeKpis(filtered), [filtered]);
  const prevKpis = useMemo(() => {
    const p = previousPeriod(filters);
    return p ? computeKpis(applyFilters(transactions, p)) : null;
  }, [transactions, filters]);

  const daily = useMemo(() => dailySeries(filtered, filters.from, filters.to), [filtered, filters.from, filters.to]);
  const series = useMemo(() => (daily.length > 45 ? weeklySeries(daily) : daily), [daily]);
  const spark = series.slice(-14);
  const tileBars = (key: 'count' | 'value' | 'successRate') => series.slice(-8).map((p) => p[key]);
  const methods = useMemo(() => methodBreakdown(filtered), [filtered]);
  const topMethod = methods.reduce((a, b) => (b.count > a.count ? b : a), methods[0]);
  const recent = filtered.slice(0, 8);
  const delta = (cur: number, prev?: number) => (prevKpis ? percentChange(cur, prev ?? 0) : null);

  const values = series.map((p) => p[metric]);
  const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  const peakIdx = values.indexOf(Math.max(...values));
  const fmtMetric = (v: number) => (metric === 'value' ? formatINR(v, true) : formatNumber(v));

  const empty = filtered.length === 0;

  const statusRows = [
    { label: 'Successful', count: kpis.success, icon: CheckCircle2, tone: 'text-cyan-700' },
    { label: 'Failed', count: kpis.failed, icon: XCircle, tone: 'text-red-600' },
    { label: 'Pending', count: kpis.pending, icon: Clock3, tone: 'text-amber-600' },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of digital payment activity across UPI, cards, digital wallets and online banking."
        actions={
          <>
            <button className="btn-secondary" onClick={() => { reload(); notify('Data reloaded from the data layer', 'info'); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link to="/transactions" className="btn-ink">All transactions <ArrowRight className="h-4 w-4" /></Link>
          </>
        }
      />
      <GlobalFilterBar />

      {empty ? (
        <div className="card mt-6">
          <EmptyState message="No transactions match the selected date range and payment method."
            action={<button className="btn-primary" onClick={resetFilters}>Reset filters</button>} />
        </div>
      ) : (
        <>
          {/* Row 1 — KPI tiles */}
          <div className="grid gap-4 md:grid-cols-3">
            <StatTile dark label="Total transaction value" value={money(kpis.totalValue)}
              delta={delta(kpis.totalValue, prevKpis?.totalValue)} bars={tileBars('value')} />
            <StatTile label="Total transactions" value={formatNumber(kpis.total)}
              delta={delta(kpis.total, prevKpis?.total)} bars={tileBars('count')} />
            <StatTile label="Success rate" value={kpis.successRate.toFixed(1)} suffix="/100%"
              delta={prevKpis ? kpis.successRate - prevKpis.successRate : null} bars={tileBars('successRate')} />
          </div>

          {/* Row 2 — trend chart + settled hero */}
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card
              className="xl:col-span-2"
              title={<span className="text-lg font-semibold">Transaction Trend Index</span>}
              subtitle={`${metric === 'count' ? 'Transactions' : 'Value (₹)'} per ${series === daily ? 'day' : 'week'} · darkest bar is the peak`}
              actions={
                <div className="flex rounded-full bg-slate-100 p-1" role="group" aria-label="Trend metric">
                  {(['count', 'value'] as const).map((m) => (
                    <button key={m} onClick={() => setMetric(m)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${metric === m ? 'bg-navy-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}>
                      {m === 'count' ? 'Volume' : 'Value'}
                    </button>
                  ))}
                </div>
              }
            >
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={series} margin={{ top: 24, right: 8, left: 0, bottom: 0 }} barCategoryGap="22%">
                    <CartesianGrid stroke="#eef2ee" vertical={false} />
                    <XAxis dataKey="key" tickFormatter={shortDayLabel} tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={metric === 'value' ? 64 : 36}
                      tickFormatter={metric === 'value' ? formatAxisINR : undefined} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f4f7f4' }} content={<ChartTooltip labelFormatter={(l) => shortDayLabel(String(l))}
                      valueFormatter={(v) => (metric === 'value' ? formatINR(v) : formatNumber(v))} />} />
                    <ReferenceLine y={avg} stroke={INK} strokeDasharray="4 4" strokeOpacity={0.5} />
                    <Bar dataKey={metric} name={metric === 'count' ? 'Transactions' : 'Value'} radius={[3, 3, 0, 0]} isAnimationActive={anim}
                      label={({ x, y, width, index }: { x: number; y: number; width: number; index: number }) =>
                        index === peakIdx ? (
                          <g>
                            <rect x={x + width / 2 - 30} y={y - 24} width={60} height={18} rx={5} fill={INK} />
                            <text x={x + width / 2} y={y - 11.5} textAnchor="middle" fontSize={10} fontWeight={600} fill="#fff">
                              {fmtMetric(values[index])}
                            </text>
                          </g>
                        ) : <g />}
                    >
                      {series.map((p, i) => (
                        <Cell key={p.key} fill={i === peakIdx ? INK : p[metric] >= avg ? GREEN : MUTED_BAR} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <section className="card-mint animate-fadeUp flex flex-col p-6">
              <p className="text-[44px] font-semibold leading-none tracking-tight text-slate-900">
                {formatINR(kpis.settledValue, true)}
                <span className="ml-2 align-middle text-base font-medium uppercase text-slate-500">settled</span>
              </p>
              <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
                <ArrowUpRight className="h-4 w-4 text-cyan-600" />
                <b className="font-semibold text-cyan-700">{kpis.successRate.toFixed(1)}%</b> of payments completed
              </p>
              <ul className="mt-6 space-y-4">
                {statusRows.map(({ label, count, icon: Icon, tone }) => (
                  <li key={label} className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full border border-cyan-700/15 bg-white/50">
                      <Icon className={`h-5 w-5 ${tone}`} aria-hidden />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[15px] font-semibold text-slate-900">{label}</span>
                      <span className="block text-xs uppercase text-slate-500">
                        {formatNumber(count)} txns · {kpis.total ? ((count / kpis.total) * 100).toFixed(1) : 0}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-6 text-xs text-slate-600">
                Average ticket size <b className="text-slate-900">{formatINR(kpis.avgTicket)}</b>
              </p>
            </section>
          </div>

          {/* Row 3 — method table + dark distribution card */}
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2" title={<span className="text-lg font-semibold">Payments by Method</span>}
              subtitle="Volume, reliability and recent dynamic per payment method" bodyClassName="p-0"
              actions={<Link to="/analytics" className="rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700">Analytics</Link>}>
              <div className="scrollbar-thin overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-th font-medium normal-case tracking-normal text-slate-400">Method</th>
                      <th className="table-th font-medium normal-case tracking-normal text-slate-400">Transactions</th>
                      <th className="table-th font-medium normal-case tracking-normal text-slate-400">Success</th>
                      <th className="table-th font-medium normal-case tracking-normal text-slate-400">Dynamic</th>
                      <th className="table-th font-medium normal-case tracking-normal text-slate-400">Avg ticket</th>
                      <th className="table-th text-right font-medium normal-case tracking-normal text-slate-400">Total value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {methods.map((m) => {
                      const Icon = METHOD_ICONS[m.method];
                      return (
                        <tr key={m.method} className="border-t border-slate-100">
                          <td className="table-td">
                            <div className="flex items-center gap-3">
                              <span className="grid h-8 w-8 place-items-center rounded-full" style={{ background: `${METHOD_COLORS[m.method]}33` }}>
                                <Icon className="h-4 w-4 text-slate-800" aria-hidden />
                              </span>
                              <span className="leading-tight">
                                <span className="block font-semibold text-slate-900">{METHOD_LABELS[m.method]}</span>
                                <span className="block text-xs text-slate-400">{m.share}% share</span>
                              </span>
                            </div>
                          </td>
                          <td className="table-td">{formatNumber(m.count)}</td>
                          <td className="table-td">{m.successRate}%</td>
                          <td className="table-td"><Sparkline data={spark} dataKey={m.method} id={`sp-${m.method}`} anim={anim} /></td>
                          <td className="table-td">
                            <span className="rounded-md bg-amber-100/70 px-2.5 py-1 text-xs font-semibold text-amber-900">{formatINR(m.avgAmount)}</span>
                          </td>
                          <td className="table-td text-right font-semibold text-slate-900">{money(m.value)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <section className="card-dark animate-fadeUp relative flex flex-col overflow-hidden p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Method distribution</h3>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy-900">
                  {filters.method === 'All' ? 'All methods' : METHOD_LABELS[filters.method]}
                </span>
              </div>
              <div className="relative mt-2 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={methods} dataKey="count" nameKey="method" innerRadius={62} outerRadius={92} paddingAngle={3} isAnimationActive={anim}>
                      {methods.map((m) => <Cell key={m.method} fill={METHOD_COLORS[m.method]} stroke="none" />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={(v) => `${formatNumber(v)} txns`} />} />
                  </PieChart>
                </ResponsiveContainer>
                {topMethod && (
                  <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                    <div>
                      <p className="text-[11px] text-slate-400">Top method</p>
                      <p className="text-base font-semibold">{METHOD_LABELS[topMethod.method]}</p>
                      <p className="mt-0.5 inline-flex items-center gap-0.5 rounded-full bg-cyan-500/20 px-2 py-0.5 text-xs font-semibold text-cyan-300">
                        {topMethod.share}% <ArrowUpRight className="h-3 w-3" />
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-2">
                {methods.map((m) => (
                  <li key={m.method} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-2.5 py-2 text-xs">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_COLORS[m.method] }} />
                    <span className="flex-1 truncate text-slate-300">{METHOD_LABELS[m.method]}</span>
                    <span className="font-semibold">{m.share}%</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Row 4 — recent activity */}
          <Card className="mt-4" title={<span className="text-lg font-semibold">Recent transaction activity</span>}
            subtitle="Latest 8 transactions in the selected range"
            actions={<Link to="/transactions" className="btn-ghost h-8 text-cyan-700">View all <ArrowRight className="h-4 w-4" /></Link>}
            bodyClassName="p-0">
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-th font-medium normal-case tracking-normal text-slate-400">Transaction</th>
                    <th className="table-th font-medium normal-case tracking-normal text-slate-400">Method</th>
                    <th className="table-th text-right font-medium normal-case tracking-normal text-slate-400">Amount</th>
                    <th className="table-th font-medium normal-case tracking-normal text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((t) => (
                    <tr key={t.id} className="cursor-pointer border-t border-slate-100 hover:bg-cyan-50/50" onClick={() => setSelected(t)} tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelected(t)} aria-label={`View ${t.id}`}>
                      <td className="table-td">
                        <p className="font-mono text-xs font-semibold text-slate-900">{t.id}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(t.timestamp)}</p>
                      </td>
                      <td className="table-td"><MethodBadge method={t.method} /></td>
                      <td className="table-td text-right font-semibold text-slate-900">{formatINR(t.amount)}</td>
                      <td className="table-td"><StatusBadge status={t.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <TransactionModal txn={selected} onClose={() => setSelected(null)} />
    </>
  );
}
