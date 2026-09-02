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

let configured = false;

/**
 * Idempotent — the root layout calls this at module scope, and Fast Refresh
 * can re-run that module.
 */
export function configureApiClient(): void {
  if (configured) return;
  configured = true;

  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (baseUrl) setBaseUrl(baseUrl);

  setAuthTokenGetter(getAccessToken);
}
