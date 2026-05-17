/**
 * User Profile slice — local-only profile state.
 *
 * Composed into the root store via `shared/store/root.ts`.
 */
import type { StateCreator } from 'zustand';
import {
  DEFAULT_PROFILE,
  type CareerTrack,
  type Seniority,
  type UserGoals,
  type UserPreferences,
  type UserProfile,
} from './types';

export interface UserProfileSlice {
  profile: UserProfile;
  /** True once the user has finished onboarding (replaces old `hasSeenLanding`) */
  onboardingComplete: boolean;

  setProfileName: (name: string) => void;
  setCareerTrack: (track: CareerTrack | null) => void;
  setSeniority: (level: Seniority | null) => void;
  setTargetRole: (role: string) => void;
  updateGoals: (goals: Partial<UserGoals>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  completeOnboarding: (initial?: Partial<UserProfile>) => void;
  /** Reset profile (used in dev / sign-out) */
  resetProfile: () => void;
}

export const createUserProfileSlice: StateCreator<
  UserProfileSlice,
  [],
  [],
  UserProfileSlice
> = (set) => ({
  profile: DEFAULT_PROFILE,
  onboardingComplete: false,

  setProfileName: (name) =>
    set((s) => ({ profile: { ...s.profile, name } })),

  setCareerTrack: (careerTrack) =>
    set((s) => ({ profile: { ...s.profile, careerTrack } })),

  setSeniority: (seniority) =>
    set((s) => ({ profile: { ...s.profile, seniority } })),

  setTargetRole: (targetRole) =>
    set((s) => ({ profile: { ...s.profile, targetRole } })),

  updateGoals: (goals) =>
    set((s) => ({ profile: { ...s.profile, goals: { ...s.profile.goals, ...goals } } })),

  updatePreferences: (prefs) =>
    set((s) => ({
      profile: { ...s.profile, preferences: { ...s.profile.preferences, ...prefs } },
    })),

  completeOnboarding: (initial) =>
    set((s) => ({
      onboardingComplete: true,
      profile: {
        ...s.profile,
        ...(initial ?? {}),
        createdAt: s.profile.createdAt || Date.now(),
      },
    })),

  resetProfile: () =>
    set({ profile: { ...DEFAULT_PROFILE }, onboardingComplete: false }),
});
