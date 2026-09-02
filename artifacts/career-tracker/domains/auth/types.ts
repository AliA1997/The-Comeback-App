/**
 * Auth Domain — types.
 *
 * Owns: the Supabase session, the OAuth handshake, and the route guard's view
 * of "are we signed in yet".
 */

export type OAuthProvider = 'google' | 'github';

/**
 * Providers the app knows how to render. Which of these a given Supabase
 * project actually accepts is read at runtime — see `useEnabledProviders`.
 */
export const SUPPORTED_PROVIDERS: ReadonlyArray<OAuthProvider> = ['github', 'google'];

export interface AuthUser {
  id: string;
  email: string | null;
  /** From the OAuth profile — used only to greet the user before the API answers. */
  displayName: string | null;
}

/**
 * `loading` covers both the first session read at launch and an in-flight
 * OAuth round trip, so the guard has a single state to wait on.
 */
export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';
