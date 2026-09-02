/**
 * User Profile slice — client-only profile state.
 *
 * The profile itself lives on the server and is read through React Query
 * (§ 8.3). What remains here is `onboardingComplete`: a record of whether THIS
 * device has shown the wizard, which is a device fact, not account data.
 */
import type { StateCreator } from 'zustand';

export interface UserProfileSlice {
  /** True once the user has finished onboarding on this device. */
  onboardingComplete: boolean;

  completeOnboarding: () => void;
  /** Re-runs onboarding. Does not touch server-side profile data. */
  resetOnboarding: () => void;
}

export const createUserProfileSlice: StateCreator<
  UserProfileSlice,
  [],
  [],
  UserProfileSlice
> = (set) => ({
  onboardingComplete: false,

  completeOnboarding: () => set({ onboardingComplete: true }),

  resetOnboarding: () => set({ onboardingComplete: false }),
});
