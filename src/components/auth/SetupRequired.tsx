import { Database } from 'lucide-react';
import Logo from '../layout/Logo';

/** Shown when `.env.local` is missing the Supabase settings. */
export default function SetupRequired() {
  return (
    <div className="app-backdrop grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <Logo />
        <div className="card mt-6 p-6 sm:p-8">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-50 text-cyan-700"><Database className="h-5 w-5" /></span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Connect your Supabase project</h1>
          <p className="mt-1 text-sm text-slate-500">The dashboard stores your transactions in Supabase. It needs two settings before it can start.</p>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm text-slate-700">
            <li>Create a free project at <b>supabase.com</b>.</li>
            <li>Open <b>SQL Editor</b>, paste the contents of <code className="rounded bg-slate-100 px-1">supabase/schema.sql</code> and click <b>Run</b>.</li>
            <li>Copy <code className="rounded bg-slate-100 px-1">.env.example</code> to <code className="rounded bg-slate-100 px-1">.env.local</code> and fill in the <b>Project URL</b> and <b>anon public</b> key from <b>Project Settings → API</b>.</li>
            <li>Restart <code className="rounded bg-slate-100 px-1">npm run dev</code>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
