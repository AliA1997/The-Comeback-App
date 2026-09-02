/**
 * AuthService — the OAuth handshake and session bookkeeping (spec § 7.3).
 *
 * Cross-domain by nature: signing out has to clear the React Query cache as
 * well as the session, so the orchestration lives in a service rather than in
 * the slice, which stays a pure data mutator.
 */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { queryClient } from '@/shared/api/client';
import { supabase } from '@/shared/lib/supabase';
import { useAppStore } from '@/shared/store/root';
import type { AuthUser, OAuthProvider } from '../types';

/** Deep link the OAuth provider returns to. Matches `scheme` in app.json. */
const REDIRECT_URL = Linking.createURL('/callback');

function toAuthUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  const meta = session.user.user_metadata ?? {};
  return {
    id: session.user.id,
    email: session.user.email ?? null,
    displayName:
      (typeof meta['full_name'] === 'string' ? meta['full_name'] : null) ??
      (typeof meta['name'] === 'string' ? meta['name'] : null),
  };
}

/**
 * Reads the stored session at launch and subscribes to Supabase's own auth
 * events, so a background token refresh or an expiry keeps the guard honest
 * without any screen polling.
 *
 * Returns an unsubscribe function for the root layout's cleanup.
 */
export function bootstrap(): () => void {
  const { setAuthSession } = useAppStore.getState();

  void supabase.auth
    .getSession()
    .then(({ data }) => setAuthSession(toAuthUser(data.session)))
    .catch(() => setAuthSession(null));

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    useAppStore.getState().setAuthSession(toAuthUser(session));
  });

  return () => data.subscription.unsubscribe();
}

/**
 * Opens the provider's consent screen and exchanges the returned code for a
 * session. A cancelled browser sheet is not an error — the user simply
 * changed their mind, so the screen returns to its resting state.
 */
export async function signInWithProvider(provider: OAuthProvider): Promise<void> {
  const store = useAppStore.getState();
  store.setAuthLoading();

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: REDIRECT_URL, skipBrowserRedirect: true },
    });

    if (error) throw error;
    if (!data.url) throw new Error('The sign-in provider did not return a URL.');

    const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);

    if (result.type !== 'success') {
      store.setAuthSession(null);
      return;
    }

    await completeSignIn(result.url);
  } catch (err) {
    store.setAuthError(
      err instanceof Error ? err.message : 'Sign-in did not finish. Please try again.',
    );
  }
}

/**
 * Finishes a PKCE handshake from the callback URL. Split out so the
 * `/callback` route can also handle a cold start where the deep link arrives
 * before the browser sheet resolves.
 */
export async function completeSignIn(callbackUrl: string): Promise<void> {
  const store = useAppStore.getState();
  const code = new URL(callbackUrl).searchParams.get('code');

  if (!code) {
    store.setAuthError('Sign-in did not finish. Please try again.');
    return;
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    store.setAuthError(error.message);
    return;
  }

  store.setAuthSession(toAuthUser(data.session));
}

/**
 * Signs out and drops every cached server response. Local Zustand state (the
 * daily plan, learning progress, achievements) is left intact — it belongs to
 * the device, and wiping it would punish someone for signing out.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  queryClient.clear();
  useAppStore.getState().setAuthSession(null);
}
