/**
 * User Profile Domain — the seam over the generated API layer (§ 8.4).
 */
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/api/queryKeys';

export { useGetProfile, useUpdateProfile } from '@workspace/api-client-react';
export type { Profile, UpdateProfileRequest, UserPreferences } from '@workspace/api-client-react';

export function invalidateProfile(client: QueryClient): Promise<void> {
  return client.invalidateQueries({ queryKey: queryKeys.profile() });
}
