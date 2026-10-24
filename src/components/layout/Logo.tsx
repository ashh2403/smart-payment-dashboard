export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
          <path d="M4 18h5l3-8 5 14 3-6h8" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-[17px] font-extrabold tracking-tight text-white">PayPulse</span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.16em] text-cyan-300/80">Payment Analytics</span>
        </span>
      )}
    </span>
  );
}
