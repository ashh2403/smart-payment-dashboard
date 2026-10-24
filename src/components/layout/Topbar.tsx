import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu, Plus } from 'lucide-react';
import { useAppData } from '../../context/AppDataContext';
import { NAV_ITEMS } from './navItems';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { alerts } = useAppData();
  const { pathname } = useLocation();
  const openAlerts = alerts.filter((a) => a.status === 'Open').length;
  const current = NAV_ITEMS.find((n) => pathname.startsWith(n.to));

  return (
    <header className="no-print sticky top-0 z-20 border-b border-slate-200/60 bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-200/60 lg:hidden" onClick={onMenu} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <p className="text-sm font-semibold text-slate-700">
          <span className="text-slate-400">Workspace /</span> {current?.label ?? 'Dashboard'}
        </p>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/monitoring" className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-700 shadow-sm hover:text-cyan-700"
            aria-label={`Alerts: ${openAlerts} open`} title="Open alerts">
            <Bell className="h-[18px] w-[18px]" />
            {openAlerts > 0 && <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
          </Link>
          <Link to="/reports" className="btn-ink h-10 rounded-xl">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New report</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
