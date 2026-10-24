import type { ReactNode } from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ title = 'No matching records', message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
        <SearchX className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 font-semibold text-slate-800">{title}</p>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-500">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
