import { useAppStore } from '@/shared/store/root';

export const useDailyTasks = () => useAppStore((s) => s.dailyTasks);
export const useRoutineTemplates = () => useAppStore((s) => s.routineTemplates);
