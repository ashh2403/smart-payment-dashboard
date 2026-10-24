export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading data">
      <div className="h-16 rounded-2xl bg-white/5" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card space-y-3 p-5">
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-7 w-32" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2"><div className="skeleton h-72 w-full" /></div>
        <div className="card p-5"><div className="skeleton h-72 w-full" /></div>
      </div>
      <p className="text-center text-sm text-slate-400">Collecting and processing sample transactions…</p>
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number }) {
  return <div className="skeleton w-full" style={{ height }} />;
}
