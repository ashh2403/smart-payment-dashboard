import { useState } from 'react';
import type { FormEvent } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { ChevronDown, Home, LogOut, MoreVertical, Search, Sparkles, X } from 'lucide-react';
import Logo from './Logo';
import { NAV_ITEMS } from './navItems';
import { useAppData } from '../../context/AppDataContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { alerts, profile, transactions } = useAppData();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const openAlerts = alerts.filter((a) => a.status === 'Open').length;
  const initials = profile.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/transactions?q=${encodeURIComponent(term)}` : '/transactions');
    setQ('');
    onClose();
  };

  return (
    <>
      {/* mobile backdrop */}
      <div
        className={`no-print fixed inset-0 z-30 bg-navy-950/70 backdrop-blur-sm transition-opacity lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={`no-print fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-navy-950 transition-transform duration-300 lg:translate-x-0 lg:bg-transparent ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main navigation"
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/" onClick={onClose} aria-label="PayPulse home"><Logo /></Link>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 border-b border-white/5 px-4 pb-5 pt-2">
          {/* workspace selector (decorative) */}
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-500 text-white"><Sparkles className="h-4 w-4" /></span>
            <span className="flex-1 leading-tight">
              <span className="block text-[10px] text-slate-500">Team Workspace</span>
              <span className="block text-sm font-semibold text-white">Payments Ops</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </div>
          <form onSubmit={submit} role="search" className="relative">
            <label htmlFor="global-search" className="sr-only">Search transaction ID</label>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="global-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for…"
              className="h-10 w-full rounded-xl border border-white/10 bg-transparent pl-9 pr-12 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-slate-300">⏎</kbd>
          </form>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-4 py-4">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Navigation</p>
          {NAV_ITEMS.map(({ to, label, icon: Icon, description }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              title={description}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${isActive ? 'bg-white text-navy-900' : 'bg-white/[0.06] text-slate-400 group-hover:text-cyan-300'}`}>
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="flex-1">{label}</span>
                  {to === '/monitoring' && openAlerts > 0 && (
                    <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[10px] font-bold text-cyan-300" aria-label={`${openAlerts} open alerts`}>
                      {openAlerts}
                    </span>
                  )}
                  {to === '/import' && transactions.length === 0 && (
                    <span className="rounded-md bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-cyan-300">Start</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
          <Link to="/" onClick={onClose} className="group flex items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06]"><Home className="h-4 w-4" aria-hidden /></span>
            Project home
          </Link>
        </nav>

        <div className="border-t border-white/5 px-4 py-4">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">User account</p>
          <Link to="/settings" onClick={onClose} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.04]" title="Profile & settings">
            <span className="relative grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-xs font-bold text-white">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400 ring-2 ring-navy-950" />
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-white">{profile.name}</span>
              <span className="block truncate text-[11px] text-slate-500">{profile.role}</span>
            </span>
            <MoreVertical className="h-4 w-4 text-slate-500" />
          </Link>
          <button onClick={() => { onClose(); signOut(); }}
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-sm font-medium text-slate-400 hover:bg-white/[0.04] hover:text-white">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06]"><LogOut className="h-4 w-4" aria-hidden /></span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
