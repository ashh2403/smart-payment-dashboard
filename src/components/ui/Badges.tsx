import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import type { AlertStatus, PaymentMethod, Severity, TxnStatus } from '../../types';
import { METHOD_LABELS } from '../../types';
import { METHOD_COLORS } from '../../utils/constants';

const STATUS_STYLE: Record<TxnStatus, string> = {
  Success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Failed: 'bg-red-50 text-red-700 ring-red-200',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function StatusBadge({ status }: { status: TxnStatus }) {
  const Icon = status === 'Success' ? CheckCircle2 : status === 'Failed' ? XCircle : Clock3;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STATUS_STYLE[status]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {status}
    </span>
  );
}

const SEV_STYLE: Record<Severity, string> = {
  High: 'bg-red-600 text-white',
  Medium: 'bg-amber-400 text-amber-950',
  Low: 'bg-sky-100 text-sky-800',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-bold ${SEV_STYLE[severity]}`}>{severity}</span>;
}

const ALERT_STYLE: Record<AlertStatus, string> = {
  Open: 'bg-red-50 text-red-700 ring-red-200',
  'Under Review': 'bg-blue-50 text-blue-700 ring-blue-200',
  Resolved: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function AlertStatusBadge({ status }: { status: AlertStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${ALERT_STYLE[status]}`}>{status}</span>;
}

export function MethodBadge({ method }: { method: PaymentMethod }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
      <span className="h-2 w-2 rounded-full" style={{ background: METHOD_COLORS[method] }} aria-hidden />
      {METHOD_LABELS[method]}
    </span>
  );
}
