/**
 * The app's single React Query client, plus the one-time wiring that points
 * the generated fetch layer at the API server and gives it a token getter
 * (spec § 7.3).
 *
 * `custom-fetch` already supports both hooks — nothing in `lib/api-client-react`
 * needed to change for auth.
 */
import { QueryClient } from '@tanstack/react-query';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { getAccessToken } from '@/shared/lib/supabase';

/** Static seed data; there is nothing to revalidate (spec § 7.4). */
export const STATIC_STALE_TIME = Number.POSITIVE_INFINITY;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Writes require a connection, so a stale read is never the thing
      // standing between the user and their work — a short window keeps the
      // dashboard responsive without hammering the API on every focus.
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      // Mutations surface their own retry affordance (spec § 8.5) rather than
      // silently retrying and leaving the user unsure whether it saved.
      retry: 0,
    },
  },
});

/**
 * False when the app was bundled without `EXPO_PUBLIC_API_URL`. Mirrors
 * `isSupabaseConfigured`: a missing build-time variable is a configuration
 * fault, and it should read as one rather than as every screen failing for its
 * own mysterious reason.
 */
export const isApiConfigured = Boolean(process.env.EXPO_PUBLIC_API_URL);

let configured = false;

/**
 * Idempotent — the root layout calls this at module scope, and Fast Refresh
 * can re-run that module.
 */
export function configureApiClient(): void {
  if (configured) return;
  configured = true;

  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (baseUrl) {
    setBaseUrl(baseUrl);
  } else {
    // Without a base URL every generated call requests a relative path, which
    // has no host to resolve against in a release bundle. Silence here turns
    // one missing EAS variable into "the whole app is broken and nothing says
    // why", so say why.
    console.error(
      '[api] EXPO_PUBLIC_API_URL is not set. Every API request will fail until ' +
        'the build supplies it (eas.json env, or an EAS-hosted variable).',
    );
  }

  setAuthTokenGetter(getAccessToken);
}
