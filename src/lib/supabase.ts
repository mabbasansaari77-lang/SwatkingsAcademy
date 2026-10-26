import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Newer projects use a "publishable" key; older ones call it the "anon" key.
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

function looksConfigured(u?: string, k?: string): u is string {
  return Boolean(u && k && /^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(u) && !u.includes('your-project-ref') && !k.startsWith('your-'));
}

export const isSupabaseConfigured = looksConfigured(url, key);

/**
 * The browser Supabase client, or null when the .env values are missing.
 * Only the public (publishable/anon) key is ever used here. All access is
 * controlled by Row Level Security policies in supabase/migrations.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, key as string, {
      auth: {
        // During the build (pre-rendering) there is no browser storage and no signed-in user.
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
        detectSessionInUrl: false,
      },
    })
  : null;

export class NotConfiguredError extends Error {
  constructor() {
    super('The website database is not connected yet.');
    this.name = 'NotConfiguredError';
  }
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new NotConfiguredError();
  return supabase;
}

export const MEDIA_BUCKET = 'public-media';
