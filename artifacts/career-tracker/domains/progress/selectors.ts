import { useAppStore } from '@/shared/store/root';

export const useDayRecords = () => useAppStore((s) => s.dayRecords);
export const useUnlockedAchievements = () => useAppStore((s) => s.unlockedAchievements);
