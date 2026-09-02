import { useAppStore } from '@/shared/store/root';

export const useDailyTasks = () => useAppStore((s) => s.dailyTasks);
