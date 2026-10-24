import type { LucideIcon } from 'lucide-react';
import { TrendingDown, TrendingUp } from 'lucide-react';

type Tone = 'cyan' | 'blue' | 'green' | 'red' | 'amber' | 'violet';

const TONES: Record<Tone, string> = {
  cyan: 'bg-cyan-50 text-cyan-600 ring-cyan-100',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
  violet: 'bg-violet-50 text-violet-600 ring-violet-100',
};

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  tone?: Tone;
  delta?: number | null;
  /** when true, a negative delta is good (e.g. failures going down) */
  invertDelta?: boolean;
  tooltip?: string;
}

export default function KpiCard({ label, value, sub, icon: Icon, tone = 'cyan', delta, invertDelta, tooltip }: KpiCardProps) {
  const hasDelta = delta !== undefined && delta !== null && Number.isFinite(delta);
  const good = hasDelta && (invertDelta ? delta! <= 0 : delta! >= 0);
  return (
    <div className="card group animate-fadeUp p-5 transition hover:-translate-y-0.5 hover:shadow-glow" title={tooltip}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ring-1 ${TONES[tone]}`}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>
      <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
        {hasDelta && (
          <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {delta! >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(delta!).toFixed(1)}%
          </span>
        )}
        {sub && <span className="text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}
