import { useMemo, useState } from 'react';
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { Activity, Gauge, IndianRupee, ReceiptText } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import GlobalFilterBar from '../components/filters/GlobalFilterBar';
import Card from '../components/ui/Card';
import KpiCard from '../components/ui/KpiCard';
import ChartTooltip from '../components/charts/ChartTooltip';
import EmptyState from '../components/ui/EmptyState';
import { useAppData } from '../context/AppDataContext';
import {
  applyFilters, categoryBreakdown, computeKpis, dailySeries, hourlyDistribution, methodBreakdown, percentChange,
  previousPeriod, weekdayDistribution, weeklySeries, withMovingAverage,
} from '../utils/analytics';
import { formatAxisINR, formatDate, formatINR, formatNumber, shortDayLabel } from '../utils/format';
import { METHOD_COLORS, STATUS_COLORS } from '../utils/constants';
import { METHOD_LABELS, PAYMENT_METHODS } from '../types';

const AXIS = { fontSize: 11, fill: '#94a3b8' };

export default function Analytics() {
  const { transactions, filtered, filters, preferences, resetFilters } = useAppData();
  const [grain, setGrain] = useState<'daily' | 'weekly'>('daily');
  const anim = preferences.chartAnimations;

  const prevFilters = useMemo(() => previousPeriod(filters), [filters]);
  const prevList = useMemo(() => (prevFilters ? applyFilters(transactions, prevFilters) : []), [transactions, prevFilters]);
  const cur = useMemo(() => computeKpis(filtered), [filtered]);
  const prev = useMemo(() => computeKpis(prevList), [prevList]);

  const daily = useMemo(() => dailySeries(filtered, filters.from, filters.to), [filtered, filters.from, filters.to]);
  const series = useMemo(() => withMovingAverage(grain === 'daily' ? daily : weeklySeries(daily), grain === 'daily' ? 7 : 4), [daily, grain]);
  const methods = useMemo(() => methodBreakdown(filtered), [filtered]);
  const hourly = useMemo(() => hourlyDistribution(filtered), [filtered]);
  const weekday = useMemo(() => weekdayDistribution(filtered), [filtered]);
  const categories = useMemo(() => categoryBreakdown(filtered).slice(0, 8), [filtered]);

  // align current vs previous period by day index for the comparison chart
  const comparison = useMemo(() => {
    if (!prevFilters) return [];
    const prevDaily = dailySeries(prevList, prevFilters.from, prevFilters.to);
    return daily.map((d, i) => ({ day: `Day ${i + 1}`, key: d.key, Current: d.count, Previous: prevDaily[i]?.count ?? 0 }));
  }, [daily, prevList, prevFilters]);

  const tickFmt = (k: string) => shortDayLabel(k);
  const periodLabel = prevFilters ? `${formatDate(prevFilters.from)} – ${formatDate(prevFilters.to)}` : '';

  return (
    <>
      <PageHeader title="Transaction Analytics" description="Deep-dive into volumes, values, payment-method performance and success / failure behaviour." />
      <GlobalFilterBar />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Volume" value={formatNumber(cur.total)} icon={ReceiptText} tone="cyan" delta={percentChange(cur.total, prev.total)} sub={`prev ${formatNumber(prev.total)}`} />
        <KpiCard label="Value" value={formatINR(cur.totalValue, preferences.compactNumbers)} icon={IndianRupee} tone="blue"
          delta={percentChange(cur.totalValue, prev.totalValue)} sub={`prev ${formatINR(prev.totalValue, true)}`} />
        <KpiCard label="Success rate" value={`${cur.successRate.toFixed(1)}%`} icon={Gauge} tone="green"
          delta={prev.total ? cur.successRate - prev.successRate : null} sub={`prev ${prev.successRate.toFixed(1)}%`} />
        <KpiCard label="Avg. ticket size" value={formatINR(cur.avgTicket, true)} icon={Activity} tone="violet"
          delta={percentChange(cur.avgTicket, prev.avgTicket)} sub={`prev ${formatINR(prev.avgTicket, true)}`} />
      </div>
      {prevFilters && <p className="mt-2 text-xs text-slate-400">Changes compared with the previous equal-length period: {periodLabel}</p>}

      {filtered.length === 0 ? (
        <div className="card mt-6"><EmptyState message="No data for this selection." action={<button className="btn-primary" onClick={resetFilters}>Reset filters</button>} /></div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            <Card title="Transaction volume analysis" subtitle="Transactions per period, stacked by payment method"
              actions={
                <div className="flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Granularity">
                  {(['daily', 'weekly'] as const).map((g) => (
                    <button key={g} onClick={() => setGrain(g)} className={`chip capitalize ${grain === g ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-500'}`}>{g}</button>
                  ))}
                </div>
              }>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={series}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="key" tickFormatter={tickFmt} tick={AXIS} tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip labelFormatter={(l) => (grain === 'weekly' ? 'Week of ' : '') + shortDayLabel(String(l))} />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    {PAYMENT_METHODS.map((m, i) => (
                      <Bar key={m} dataKey={m} name={METHOD_LABELS[m]} stackId="m" fill={METHOD_COLORS[m]} isAnimationActive={anim}
                        radius={i === PAYMENT_METHODS.length - 1 ? [4, 4, 0, 0] : 0} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Transaction value trend" subtitle={`Value per ${grain === 'daily' ? 'day' : 'week'} with ${grain === 'daily' ? '7-day' : '4-week'} moving average`}>
              <div className="h-72">
                <ResponsiveContainer>
                  <ComposedChart data={series}>
                    <defs>
                      <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="key" tickFormatter={tickFmt} tick={AXIS} tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={formatAxisINR} />
                    <Tooltip content={<ChartTooltip labelFormatter={(l) => shortDayLabel(String(l))} valueFormatter={(v) => formatINR(v)} />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Area dataKey="value" name="Value" stroke="#2563eb" fill="url(#gVal)" strokeWidth={2} isAnimationActive={anim} />
                    <Line dataKey="movingAvg" name="Moving average" stroke="#06b6d4" strokeWidth={2.5} dot={false} strokeDasharray="5 4" isAnimationActive={anim} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="mt-4" title="Payment method performance" subtitle="Volume, value, average amount and success / failure rates per method" bodyClassName="p-0">
            <div className="grid gap-0 lg:grid-cols-5">
              <div className="h-72 p-5 lg:col-span-2">
                <ResponsiveContainer>
                  <BarChart data={methods.map((m) => ({ ...m, name: METHOD_LABELS[m.method] }))} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={AXIS} tickLine={false} axisLine={false} unit="%" />
                    <YAxis type="category" dataKey="name" tick={AXIS} tickLine={false} axisLine={false} width={96} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip valueFormatter={(v) => `${v}%`} />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="successRate" name="Success rate" fill={STATUS_COLORS.Success} radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={anim} />
                    <Bar dataKey="failureRate" name="Failure rate" fill={STATUS_COLORS.Failed} radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={anim} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="scrollbar-thin overflow-x-auto border-t border-slate-100 lg:col-span-3 lg:border-l lg:border-t-0">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="table-th">Method</th>
                      <th className="table-th text-right">Txns</th>
                      <th className="table-th text-right">Share</th>
                      <th className="table-th text-right">Value</th>
                      <th className="table-th text-right">Avg</th>
                      <th className="table-th text-right">Success</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {methods.map((m) => (
                      <tr key={m.method}>
                        <td className="table-td">
                          <span className="inline-flex items-center gap-2 font-semibold text-slate-800">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_COLORS[m.method] }} />{METHOD_LABELS[m.method]}
                          </span>
                        </td>
                        <td className="table-td text-right">{formatNumber(m.count)}</td>
                        <td className="table-td text-right">{m.share}%</td>
                        <td className="table-td text-right font-semibold">{formatINR(m.value, true)}</td>
                        <td className="table-td text-right">{formatINR(m.avgAmount, true)}</td>
                        <td className="table-td text-right">
                          <span className={`font-semibold ${m.successRate >= 90 ? 'text-emerald-600' : m.successRate >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                            {m.count ? `${m.successRate}%` : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <Card title="Success & failure rate analysis" subtitle={`${grain === 'daily' ? 'Daily' : 'Weekly'} success and failure percentage`}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={series}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="key" tickFormatter={tickFmt} tick={AXIS} tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={40} unit="%" domain={[0, 100]} />
                    <Tooltip content={<ChartTooltip labelFormatter={(l) => shortDayLabel(String(l))} valueFormatter={(v) => `${v}%`} />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line dataKey="successRate" name="Success rate" stroke={STATUS_COLORS.Success} strokeWidth={2.5} dot={false} isAnimationActive={anim} />
                    <Line dataKey="failureRate" name="Failure rate" stroke={STATUS_COLORS.Failed} strokeWidth={2} dot={false} isAnimationActive={anim} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card title="Date-based comparison" subtitle={prevFilters ? `Daily volume: selected period vs previous (${periodLabel})` : 'Select a date range to compare'}>
              <div className="h-72">
                <ResponsiveContainer>
                  <LineChart data={comparison}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} minTickGap={20} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Line dataKey="Current" name="Selected period" stroke="#06b6d4" strokeWidth={2.5} dot={false} isAnimationActive={anim} />
                    <Line dataKey="Previous" name="Previous period" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} isAnimationActive={anim} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Card title="Hourly activity" subtitle="When customers pay (hour of day)">
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={hourly}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="hour" tick={AXIS} tickLine={false} axisLine={false} interval={3} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                    <Bar dataKey="count" name="Transactions" fill="#06b6d4" radius={[4, 4, 0, 0]} isAnimationActive={anim} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Weekday comparison" subtitle="Volume and failures by day of week">
              <div className="h-64">
                <ResponsiveContainer>
                  <BarChart data={weekday}>
                    <CartesianGrid stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} />
                    <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" name="Transactions" fill="#2563eb" radius={[4, 4, 0, 0]} isAnimationActive={anim} />
                    <Bar dataKey="failed" name="Failed" fill={STATUS_COLORS.Failed} radius={[4, 4, 0, 0]} isAnimationActive={anim} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card title="Top merchant categories" subtitle="By transaction value">
              <ul className="space-y-3">
                {categories.map((c) => {
                  const pct = categories[0].value ? (c.value / categories[0].value) * 100 : 0;
                  return (
                    <li key={c.category}>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">{c.category}</span>
                        <span className="font-semibold text-slate-900">{formatINR(c.value, true)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-600" style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
