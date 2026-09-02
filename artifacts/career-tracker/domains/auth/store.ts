/**
 * Auth slice — the session as the rest of the app sees it.
 *
 * Client-only state that must survive unmount, so Zustand owns it (§ 8.3).
 * It is deliberately NOT persisted: Supabase's own AsyncStorage session store
 * is the source of truth, and a second persisted copy could disagree with it
 * after a token refresh. `AuthService.bootstrap()` repopulates this on launch.
 */
import type { StateCreator } from 'zustand';
import type { AuthStatus, AuthUser } from './types';

export interface AuthSlice {
  authStatus: AuthStatus;
  authUser: AuthUser | null;
  /** Set when a sign-in attempt fails, cleared when a new one starts. */
  authError: string | null;

  setAuthSession: (user: AuthUser | null) => void;
  setAuthError: (message: string | null) => void;
  setAuthLoading: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  authStatus: 'loading',
  authUser: null,
  authError: null,

  setAuthSession: (authUser) =>
    set({
      authUser,
      authStatus: authUser ? 'signedIn' : 'signedOut',
      authError: null,
    }),

  setAuthError: (authError) => set({ authError, authStatus: 'signedOut' }),

  setAuthLoading: () => set({ authStatus: 'loading', authError: null }),
});
