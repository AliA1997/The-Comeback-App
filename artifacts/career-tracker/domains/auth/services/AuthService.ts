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
      options: {
        redirectTo: REDIRECT_URL,
        skipBrowserRedirect: true,
        // Android runs this in a Chrome Custom Tab, which shares cookies with
        // Chrome. Without an explicit prompt the provider sees a live session,
        // silently re-issues a token for the account already signed in, and a
        // second account can never get in at all — every sign-in lands on the
        // same user. Forcing the chooser is the fix (spec AC-3).
        queryParams: { prompt: 'select_account' },
      },
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
 *
 * The cache is cleared before the session is nulled so no query can refetch
 * against the outgoing user and repopulate on the way out — the next account
 * must start from an empty cache, not the previous one's lists (spec AC-4).
 *
 * On the browser side `coolDownAsync` releases the warmed Custom Tabs service
 * so the next sign-in opens a fresh tab. It does NOT clear the provider's
 * cookies: expo-web-browser exposes no such API, and the only way to drop a
 * Google session from here would be to navigate the user through Google's own
 * logout, signing them out of every other Google product on the device. That
 * trade is not worth it, which is why the account chooser in
 * `signInWithProvider` — not cookie clearing — is what guarantees the right
 * account is used.
 */
export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  queryClient.clear();

  try {
    await WebBrowser.coolDownAsync();
  } catch {
    // Not supported on every platform, and never worth failing a sign-out for.
  }

  useAppStore.getState().setAuthSession(null);
}
