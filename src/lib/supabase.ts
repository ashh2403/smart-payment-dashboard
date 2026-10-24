import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False until `.env.local` has the Supabase URL and anon key. */
export const supabaseConfigured = Boolean(url && anonKey);

// A placeholder client keeps imports safe when env vars are missing;
// the app shows a setup screen instead of calling it.
export const supabase = createClient(url || 'http://localhost', anonKey || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
});
