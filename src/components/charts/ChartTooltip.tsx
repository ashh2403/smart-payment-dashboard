import type { ReactNode } from 'react';

interface Entry {
  name?: string | number;
  value?: number | string;
  color?: string;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

interface Props {
  active?: boolean;
  payload?: Entry[];
  label?: ReactNode;
  labelFormatter?: (label: ReactNode) => ReactNode;
  valueFormatter?: (value: number, name: string) => string;
}

/** Shared, styled tooltip for every Recharts chart. */
export default function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter }: Props) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      {label !== undefined && label !== '' && (
        <p className="mb-1 font-semibold text-slate-900">{labelFormatter ? labelFormatter(label) : label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center gap-2 text-slate-600">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color ?? (p.payload?.fill as string | undefined) }} />
            <span>{p.name}</span>
            <span className="ml-auto pl-3 font-semibold text-slate-900">
              {valueFormatter && typeof p.value === 'number' ? valueFormatter(p.value, String(p.name)) : p.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
