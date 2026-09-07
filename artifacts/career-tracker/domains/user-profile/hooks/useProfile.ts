/**
 * User Profile Domain — data hooks.
 *
 * The profile is server state (spec § 5.2), so React Query owns it. Only
 * `onboardingComplete` stays in Zustand: it records whether THIS device has
 * shown the wizard, which is a client-only fact.
 *
 * Profile edits are optimistic. They are single-toggle interactions — a switch
 * that snaps back while a round trip completes reads as broken, not as honest.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStatus } from '@/domains/auth/selectors';
import { queryKeys } from '@/shared/api/queryKeys';
import { useToast } from '@/shared/ui/ToastProvider';
import {
  invalidateProfile,
  useGetProfile,
  useUpdateProfile as useUpdateProfileMutation,
  type Profile,
} from '../api';


export function useProfile(): {
  profile: Profile | null;
  isLoading: boolean;
  isError: boolean;
} {
  const query = useGetProfile();
  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Loads the profile the moment a session exists.
 *
 * `GET /api/me/profile` creates the row if it is missing and stamps it with
 * the email from the access token, so this is what turns "signed in" into
 * "has a profile". Mounted once at the root: the query lands in the React
 * Query cache, which is where the profile lives app-wide (§ 8.3 — if the
 * server can send it, React Query owns it), so every screen and
 * `readCachedProfile()` see it without a second request.
 *
 * Disabled while signed out so it never fires a request that can only 401.
 */
export function useEnsureProfile(): void {
  const status = useAuthStatus();
  useGetProfile({
    query: { queryKey: queryKeys.profile(), enabled: status === 'signedIn' },
  });
}

/** The display name, or an empty string before the profile lands. */
export function useProfileName(): string {
  const { profile } = useProfile();
  return profile?.displayName ?? '';
}

export function useCareerTrack(): string | null {
  const { profile } = useProfile();
  return profile?.careerTrack ?? null;
}

export function useUpdateProfile() {
  const client = useQueryClient();
  const { show } = useToast();

  return useUpdateProfileMutation({
    mutation: {
      onMutate: ({ data }) => {
        const previous = client.getQueryData<Profile>(queryKeys.profile());
        if (previous) {
          client.setQueryData<Profile>(queryKeys.profile(), {
            ...previous,
            ...data,
            preferences: { ...previous.preferences, ...(data.preferences ?? {}) },
          });
        }
        return { previous };
      },
      onError: (_error, _variables, context) => {
        const previous = (context as { previous?: Profile } | undefined)?.previous;
        if (previous) client.setQueryData(queryKeys.profile(), previous);
        show("That didn't save. Tap to try again.");
      },
      onSettled: () => invalidateProfile(client),
    },
  });
}
