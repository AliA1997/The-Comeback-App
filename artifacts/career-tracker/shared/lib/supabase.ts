/**
 * Supabase client — identity only.
 *
 * Supabase issues and refreshes the session; every application read and write
 * goes through the Express API instead (spec § 7.1). Nothing in this file
 * touches `comebackapp.*` tables directly, and nothing should.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * False when the app was bundled without Supabase credentials. The sign-in
 * screen surfaces this as a configuration notice rather than an auth failure,
 * so a missing env var never reads as "your account is broken".
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase: SupabaseClient = createClient(
  SUPABASE_URL || 'http://localhost',
  SUPABASE_ANON_KEY || 'anon',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // React Native has no URL bar to read the OAuth fragment from; the
      // callback route hands the code to `exchangeCodeForSession` instead.
      detectSessionInUrl: false,
      flowType: 'pkce',
    },
  },
);

/**
 * The current access token, refreshing first when it is close to expiry.
 * Wired into the generated fetch layer so every API call carries a live
 * token without any screen having to think about it (spec § 12.5).
 */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
