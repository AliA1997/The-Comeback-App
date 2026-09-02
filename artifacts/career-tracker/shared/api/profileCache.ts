/**
 * Reading the profile from outside a component.
 *
 * The nudge scheduler and the idle-ad timer both run off a React tick and both
 * need a preference toggle. They read React Query's cache rather than keeping
 * a parallel copy that could disagree with the profile screen.
 *
 * Lives in `shared/` because Notifications, Time & Focus and User Profile all
 * need it (§ 8.2).
 */
import type { Profile, UserPreferences } from '@workspace/api-client-react';
import { queryClient } from './client';
import { queryKeys } from './queryKeys';

/**
 * Defaults mirror the column defaults in `comebackapp.user_profiles`. Before
 * the profile query resolves, every toggle reads as ON — the same thing a new
 * account gets, so nothing is silently disabled by a slow network.
 */
const DEFAULTS: UserPreferences = {
  notificationsEnabled: true,
  nudgesEnabled: true,
  adsEnabled: true,
};

export function readCachedProfile(): { profile: Profile | null; preferences: UserPreferences } {
  const profile = queryClient.getQueryData<Profile>(queryKeys.profile()) ?? null;
  return {
    profile,
    preferences: { ...DEFAULTS, ...(profile?.preferences ?? {}) },
  };
}
