import { useAppStore } from '@/shared/store/root';

export const useProfile = () => useAppStore((s) => s.profile);
export const useProfileName = () => useAppStore((s) => s.profile.name);
export const useCareerTrack = () => useAppStore((s) => s.profile.careerTrack);
export const useSeniority = () => useAppStore((s) => s.profile.seniority);
export const useTargetRole = () => useAppStore((s) => s.profile.targetRole);
export const useUserGoals = () => useAppStore((s) => s.profile.goals);
export const useUserPreferences = () => useAppStore((s) => s.profile.preferences);
export const useOnboardingComplete = () => useAppStore((s) => s.onboardingComplete);
