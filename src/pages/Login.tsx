import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from 'lucide-react';
import Logo from '../components/layout/Logo';
import SetupRequired from '../components/auth/SetupRequired';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';

export default function Login() {
  const { configured, session, signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/dashboard';
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  if (!configured) return <SetupRequired />;
  if (session) return <Navigate to={from} replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.');
    if (mode !== 'reset' && password.length < 6) return setError('Password must be at least 6 characters.');
    if (mode === 'signup' && !name.trim()) return setError('Enter your name.');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
        navigate(from, { replace: true });
      } else if (mode === 'signup') {
        const active = await signUp(email.trim(), password, name.trim());
        if (active) navigate('/import', { replace: true });
        else { setInfo('Account created. Check your inbox and click the confirmation link, then sign in.'); setMode('signin'); }
      } else {
        await resetPassword(email.trim());
        setInfo('If that email has an account, a reset link is on its way.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'signin' ? 'Welcome back' : mode === 'signup' ? 'Create your account' : 'Reset your password';

  return (
    <div className="app-backdrop grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" aria-label="PayPulse home"><Logo /></Link>
        <div className="card mt-6 p-6 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {mode === 'signin' ? 'Sign in to see your payment analytics.' : mode === 'signup' ? 'Your transactions are private to your account.' : 'We will email you a reset link.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
            {mode === 'signup' && (
              <div>
                <label htmlFor="l-name" className="label">Full name</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="l-name" className="input pl-9" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                </div>
              </div>
            )}
            <div>
              <label htmlFor="l-email" className="label">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="l-email" type="email" className="input pl-9" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              </div>
            </div>
            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="l-pass" className="label">Password</label>
                  {mode === 'signin' && (
                    <button type="button" className="mb-1 text-xs font-semibold text-cyan-700 hover:underline" onClick={() => { setMode('reset'); setError(''); }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="l-pass" type="password" className="input pl-9" value={password} onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
                </div>
              </div>
            )}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
            {info && <p className="rounded-lg bg-cyan-50 px-3 py-2 text-sm text-cyan-800" role="status">{info}</p>}

            <button type="submit" className="btn-ink w-full" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'signin' ? (
              <>New here? <button className="font-semibold text-cyan-700 hover:underline" onClick={() => { setMode('signup'); setError(''); setInfo(''); }}>Create an account</button></>
            ) : (
              <>Already have an account? <button className="font-semibold text-cyan-700 hover:underline" onClick={() => { setMode('signin'); setError(''); }}>Sign in</button></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
