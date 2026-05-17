/**
 * Progress slice — day records (rolled-up task completion) + unlocked
 * achievements. Streaks/stats are derived (services/), not stored.
 */
import type { StateCreator } from 'zustand';
import { todayStr } from '@/shared/lib/dateUtils';
import type { DayRecord, UnlockedAchievement } from './types';

export interface ProgressSlice {
  dayRecords: Record<string, DayRecord>;
  unlockedAchievements: UnlockedAchievement[];

  recordTaskCompletion: (taskId: string, actualMinutes: number) => void;
  markTaskSkipped: (taskId: string) => void;
  unlockAchievement: (achievementId: string) => boolean;
}

function defaultDay(date: string): DayRecord {
  return { date, totalMinutes: 0, completedTaskIds: [], skippedTaskIds: [] };
}

export const createProgressSlice: StateCreator<
  ProgressSlice,
  [],
  [],
  ProgressSlice
> = (set, get) => ({
  dayRecords: {},
  unlockedAchievements: [],

  recordTaskCompletion: (taskId, actualMinutes) => {
    const today = todayStr();
    set((s) => {
      const existing = s.dayRecords[today] ?? defaultDay(today);
      return {
        dayRecords: {
          ...s.dayRecords,
          [today]: {
            ...existing,
            totalMinutes: existing.totalMinutes + actualMinutes,
            completedTaskIds: existing.completedTaskIds.includes(taskId)
              ? existing.completedTaskIds
              : [...existing.completedTaskIds, taskId],
          },
        },
      };
    });
  },

  markTaskSkipped: (taskId) => {
    const today = todayStr();
    set((s) => {
      const existing = s.dayRecords[today] ?? defaultDay(today);
      if (existing.skippedTaskIds.includes(taskId)) return s;
      return {
        dayRecords: {
          ...s.dayRecords,
          [today]: {
            ...existing,
            skippedTaskIds: [...existing.skippedTaskIds, taskId],
          },
        },
      };
    });
  },

  unlockAchievement: (achievementId) => {
    if (get().unlockedAchievements.some((u) => u.achievementId === achievementId)) {
      return false;
    }
    set((s) => ({
      unlockedAchievements: [
        ...s.unlockedAchievements,
        { achievementId, unlockedAt: Date.now() },
      ],
    }));
    return true;
  },
});
