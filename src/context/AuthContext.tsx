import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';

interface AuthState {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile;
  signIn: (email: string, password: string) => Promise<void>;
  /** Resolves true when the account is active right away, false when email confirmation is required. */
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (p: Pick<Profile, 'name' | 'role'>) => Promise<void>;
  changePassword: (password: string) => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

function profileOf(user: User | null): Profile {
  const meta = (user?.user_metadata ?? {}) as { name?: string; role?: string };
  return {
    name: meta.name || user?.email?.split('@')[0] || 'User',
    email: user?.email ?? '',
    role: meta.role || 'Transaction Analyst',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(supabaseConfigured);

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw new Error(error.message);
    return Boolean(data.session);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/settings` });
    if (error) throw new Error(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateProfile = useCallback(async (p: Pick<Profile, 'name' | 'role'>) => {
    const { data, error } = await supabase.auth.updateUser({ data: { name: p.name, role: p.role } });
    if (error) throw new Error(error.message);
    setSession((s) => (s && data.user ? { ...s, user: data.user } : s));
  }, []);

  const changePassword = useCallback(async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  }, []);

  const user = session?.user ?? null;
  const profile = useMemo(() => profileOf(user), [user]);

  const value: AuthState = {
    configured: supabaseConfigured, loading, session, user, profile, signIn, signUp, resetPassword, signOut, updateProfile, changePassword,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
