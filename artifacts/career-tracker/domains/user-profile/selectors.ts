import { useAppStore } from '@/shared/store/root';

export const useOnboardingComplete = () => useAppStore((s) => s.onboardingComplete);
