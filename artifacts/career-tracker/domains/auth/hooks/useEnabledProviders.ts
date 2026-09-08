/**
 * Which OAuth providers this Supabase project actually has turned on.
 *
 * Spec § 15.1 left the provider list as an open question ("Google and GitHub
 * assumed. Confirm before configuring Supabase."). Rather than hard-code an
 * answer that can drift from the project's dashboard, the screen asks the
 * project — a button that cannot work is worse than one that is absent,
 * especially on the first screen someone ever sees (Principle III).
 *
 * On any failure it falls back to showing every provider, so a flaky network
 * never leaves the user with no way in — which is also why the request is
 * bounded: `isLoading` feeds `busy` on the sign-in screen, and React Native's
 * fetch never times out, so a socket that opens and stalls would disable every
 * provider button for as long as the screen is open.
 */
import { useEffect, useState } from 'react';
import { isSupabaseConfigured } from '@/shared/lib/supabase';
import { SUPPORTED_PROVIDERS, type OAuthProvider } from '../types';

interface SettingsResponse {
  external?: Record<string, boolean>;
}

/** Long enough for a cold Supabase edge, short enough to not strand a sign-in. */
const PROBE_TIMEOUT_MS = 8_000;

export function useEnabledProviders(): {
  providers: ReadonlyArray<OAuthProvider>;
  isLoading: boolean;
} {
  const [providers, setProviders] = useState<ReadonlyArray<OAuthProvider>>(
    SUPPORTED_PROVIDERS,
  );
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
    let cancelled = false;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    fetch(`${url.replace(/\/+$/, '')}/auth/v1/settings`, {
      headers: { apikey: anonKey },
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((settings: SettingsResponse | null) => {
        if (cancelled || !settings?.external) return;
        const enabled = SUPPORTED_PROVIDERS.filter(
          (provider) => settings.external?.[provider] === true,
        );
        // An empty list means the project has no OAuth configured at all;
        // showing the full list at least surfaces a real error on tap rather
        // than an empty screen with nothing to press.
        if (enabled.length > 0) setProviders(enabled);
      })
      .catch(() => {
        // Keep the default list — see the docblock.
      })
      .finally(() => {
        clearTimeout(timeoutId);
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return { providers, isLoading };
}
