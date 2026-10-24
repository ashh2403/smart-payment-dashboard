import type { ReactNode } from 'react';
import { ShieldCheck } from 'lucide-react';
import type { Transaction } from '../../types';
import { formatDateTime, formatINR } from '../../utils/format';
import { MethodBadge, StatusBadge } from '../ui/Badges';

export default function TransactionDetails({ txn }: { txn: Transaction }) {
  const rows: [string, ReactNode][] = [
    ['Transaction ID', <span className="font-mono">{txn.id}</span>],
    ['Date & time', formatDateTime(txn.timestamp)],
    ['Customer ID', <span className="font-mono">{txn.customerId}</span>],
    ['Payment method', <MethodBadge method={txn.method} />],
    ['Merchant', txn.merchant],
    ['Category', txn.category],
    ['City', txn.city],
    ['Channel / device', txn.device],
    ['Data source', txn.source],
  ];
  if (txn.failureReason) rows.push(['Failure reason', <span className="font-semibold text-red-600">{txn.failureReason}</span>]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-navy-900 to-navy-700 p-5 text-white">
        <div>
          <p className="text-xs uppercase tracking-wider text-cyan-200/80">Amount</p>
          <p className="text-3xl font-extrabold">{formatINR(txn.amount)}</p>
        </div>
        <StatusBadge status={txn.status} />
      </div>
      <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="border-b border-slate-100 pb-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{k}</dt>
            <dd className="mt-0.5 text-sm text-slate-800">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
        <ShieldCheck className="h-4 w-4 text-emerald-500" />
        No card numbers, PINs or account credentials are stored with this record.
      </p>
    </div>
  );
}
