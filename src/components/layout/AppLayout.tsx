import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle, FileSpreadsheet, PlusCircle, RefreshCw, UploadCloud } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { PageSkeleton } from '../ui/Loading';
import { useAppData } from '../../context/AppDataContext';

// pages that work without any transactions saved
const NO_DATA_ROUTES = ['/import', '/settings', '/about'];

function GetStarted({ name }: { name: string }) {
  return (
    <div className="card mx-auto max-w-2xl p-8 text-center sm:p-10">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-50 text-cyan-700"><UploadCloud className="h-7 w-7" /></span>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Welcome, {name.split(' ')[0]}! Let's add your data</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        Your account has no transactions yet. Import a CSV export from your bank or payment gateway, or add payments manually —
        the dashboard, analytics, alerts and reports fill in automatically.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/import" className="btn-ink"><FileSpreadsheet className="h-4 w-4" /> Import CSV</Link>
        <Link to="/import" className="btn-secondary"><PlusCircle className="h-4 w-4" /> Add manually</Link>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { loading, error, reload, transactions, profile } = useAppData();
  const { pathname } = useLocation();
  const needsData = !NO_DATA_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <div className="app-backdrop min-h-screen">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="print-main lg:py-3 lg:pl-72 lg:pr-3">
        {/* light content panel floating on the dark shell */}
        <div className="print-main min-h-screen overflow-clip bg-canvas lg:min-h-[calc(100vh-1.5rem)] lg:rounded-[28px]">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <main className="print-main mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
            {error ? (
              <div className="card mx-auto max-w-md p-8 text-center">
                <AlertTriangle className="mx-auto h-10 w-10 text-red-500" />
                <p className="mt-3 font-semibold text-slate-900">Could not load transactions</p>
                <p className="mt-1 text-sm text-slate-500">{error}</p>
                <p className="mt-2 text-xs text-slate-400">If this is a new Supabase project, make sure you ran <code>supabase/schema.sql</code>.</p>
                <button className="btn-primary mt-5" onClick={reload}><RefreshCw className="h-4 w-4" /> Try again</button>
              </div>
            ) : loading ? (
              <PageSkeleton />
            ) : needsData && transactions.length === 0 ? (
              <GetStarted name={profile.name} />
            ) : (
              <Outlet />
            )}
          </main>
          <footer className="no-print border-t border-slate-200/70 px-4 py-5 text-center text-xs text-slate-500 sm:px-8">
            Smart Digital Payment Transaction Analytics and Monitoring Dashboard · Dept. of CSE, Sathyabama Institute of Science and Technology
          </footer>
        </div>
      </div>
    </div>
  );
}
