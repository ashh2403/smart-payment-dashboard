import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  onPageSize?: (n: number) => void;
}

export default function Pagination({ page, pageCount, total, pageSize, onPage, onPageSize }: Props) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(total, page * pageSize);

  const pages: (number | '…')[] = [];
  for (let p = 1; p <= pageCount; p++) {
    if (p === 1 || p === pageCount || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== '…') pages.push('…');
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <span>
          Showing <b className="text-slate-800">{start}</b>–<b className="text-slate-800">{end}</b> of <b className="text-slate-800">{total}</b>
        </span>
        {onPageSize && (
          <label className="flex items-center gap-1.5">
            <span className="sr-only sm:not-sr-only">Rows</span>
            <select className="input h-8 w-auto py-0" value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))} aria-label="Rows per page">
              {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        )}
      </div>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button className="btn-ghost h-8 px-2" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e${i}`} className="px-1 text-slate-400">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`h-8 min-w-8 rounded-lg px-2 text-sm font-semibold ${p === page ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {p}
            </button>
          ),
        )}
        <button className="btn-ghost h-8 px-2" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
}
