import { useState } from 'react';
import type { FormEvent } from 'react';
import { Database, KeyRound, Loader2, RotateCcw, Save, SlidersHorizontal, UserRound } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import { DEFAULT_PREFERENCES, useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import type { Preferences } from '../types';
import { formatDateTime, formatNumber } from '../utils/format';

function Toggle({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-slate-800">{label}</label>
        <p className="text-xs text-slate-500">{hint}</p>
      </div>
      <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-cyan-500' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { preferences, updatePreferences, report, applyQuickRange, transactions } = useAppData();
  const { profile, updateProfile, changePassword } = useAuth();
  const notify = useToast();
  const [form, setForm] = useState({ name: profile.name, role: profile.role });
  const [nameError, setNameError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [pw, setPw] = useState({ next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return setNameError('Name is required');
    setNameError('');
    setSavingProfile(true);
    try {
      await updateProfile({ name: form.name.trim(), role: form.role.trim() || 'Analyst' });
      notify('Profile saved');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not save profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 6) return setPwError('Password must be at least 6 characters');
    if (pw.next !== pw.confirm) return setPwError('Passwords do not match');
    setPwError('');
    setSavingPw(true);
    try {
      await changePassword(pw.next);
      setPw({ next: '', confirm: '' });
      notify('Password updated');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Could not update password');
    } finally {
      setSavingPw(false);
    }
  };

  const setPref = <K extends keyof Preferences>(key: K, value: Preferences[K], msg = 'Preference updated') => {
    updatePreferences({ [key]: value } as Partial<Preferences>);
    notify(msg, 'info');
  };

  const resetPreferences = () => {
    updatePreferences(DEFAULT_PREFERENCES);
    applyQuickRange(DEFAULT_PREFERENCES.defaultRangeDays);
    notify('Preferences restored to defaults');
  };

  return (
    <>
      <PageHeader title="Settings" description="Manage your account and how the dashboard behaves."
        actions={<button className="btn-ink" onClick={resetPreferences}><RotateCcw className="h-4 w-4" /> Restore default preferences</button>} />

      <div className="grid gap-4 xl:grid-cols-2">
        <Card title={<span className="flex items-center gap-2"><UserRound className="h-4 w-4 text-cyan-600" /> Profile</span>} subtitle="Saved to your account · shown in the sidebar and on reports">
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <div>
              <label htmlFor="p-name" className="label">Full name</label>
              <input id="p-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-invalid={!!nameError} />
              {nameError && <p className="mt-1 text-xs text-red-600">{nameError}</p>}
            </div>
            <div>
              <label htmlFor="p-email" className="label">Email</label>
              <input id="p-email" type="email" className="input bg-slate-50 text-slate-500" value={profile.email} readOnly />
            </div>
            <div>
              <label htmlFor="p-role" className="label">Role</label>
              <select id="p-role" className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {['Transaction Analyst', 'Operations Manager', 'Risk Reviewer', 'Administrator', 'Student Developer'].map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save profile
            </button>
          </form>

          <form onSubmit={savePassword} className="mt-6 space-y-4 border-t border-slate-100 pt-5" noValidate>
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><KeyRound className="h-4 w-4 text-cyan-600" /> Change password</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="pw-new" className="label">New password</label>
                <input id="pw-new" type="password" className="input" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
              </div>
              <div>
                <label htmlFor="pw-confirm" className="label">Confirm password</label>
                <input id="pw-confirm" type="password" className="input" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
              </div>
            </div>
            {pwError && <p className="text-xs text-red-600" role="alert">{pwError}</p>}
            <button type="submit" className="btn-secondary" disabled={savingPw}>
              {savingPw ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} Update password
            </button>
          </form>
        </Card>

        <Card title={<span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-cyan-600" /> Dashboard preferences</span>} subtitle="Applied immediately">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pr-range" className="label">Default date range</label>
              <select id="pr-range" className="input" value={preferences.defaultRangeDays}
                onChange={(e) => {
                  const v = Number(e.target.value) as Preferences['defaultRangeDays'];
                  setPref('defaultRangeDays', v, 'Default range updated');
                  applyQuickRange(v);
                }}>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
                <option value={0}>All data</option>
              </select>
            </div>
            <div>
              <label htmlFor="pr-rows" className="label">Rows per page</label>
              <select id="pr-rows" className="input" value={preferences.rowsPerPage} onChange={(e) => setPref('rowsPerPage', Number(e.target.value))}>
                {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-2 divide-y divide-slate-100">
            <Toggle id="pr-compact" label="Compact currency" hint="Show large values as ₹12.5 L / ₹1.2 Cr" checked={preferences.compactNumbers} onChange={(v) => setPref('compactNumbers', v)} />
            <Toggle id="pr-anim" label="Chart animations" hint="Animate charts when data changes" checked={preferences.chartAnimations} onChange={(v) => setPref('chartAnimations', v)} />          </div>
        </Card>
      </div>

      <Card className="mt-4" title={<span className="flex items-center gap-2"><Database className="h-4 w-4 text-cyan-600" /> Data pipeline status</span>}
        subtitle={report ? `Last processed ${formatDateTime(report.processedAt)}` : ''}>
        {report && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">1 · Data collection</p>
              {report.bySource.map((s) => (
                <div key={s.source} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-slate-600">{s.source}</span><b>{formatNumber(s.count)}</b>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">2 · Data processing (validation)</p>
              <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>Raw records received</span><b>{formatNumber(report.rawCount)}</b></div>
              <div className="flex justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800"><span>Valid records</span><b>{formatNumber(report.validCount)}</b></div>
              <div className="flex justify-between rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"><span>Rejected records</span><b>{formatNumber(report.rejectedCount)}</b></div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">Rejection reasons</p>
              {report.rejected.map((r) => (
                <div key={r.reason} className="flex justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm">
                  <span className="text-slate-600">{r.reason}</span><b>{r.count}</b>
                </div>
              ))}
              <p className="pt-1 text-xs text-slate-400">{formatNumber(transactions.length)} transactions available for analytics.</p>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
