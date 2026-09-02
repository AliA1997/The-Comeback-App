/**
 * AchievementEngine — pure unlock rules. Evaluated after any event that
 * could plausibly trigger a new unlock (task completion, lesson completion).
 *
 * Idempotent: `unlockAchievement` no-ops if already unlocked.
 */
import { useAppStore } from '@/shared/store/root';
import { readCachedTasks } from '@/shared/api/taskCache';
import { TASK_CATEGORIES } from '@/shared/types/skills';
import { taskCategory } from '@/shared/types/task';
import { computeStreak } from './StreakEngine';
import { computeTotalHours } from './StatsEngine';
import { findAchievement } from '../data/achievements';

export interface UnlockResult {
  newlyUnlocked: string[];
}

export function runAchievementEvaluation(): UnlockResult {
  const state = useAppStore.getState();
  const { dayRecords, lessonProgress, unlockAchievement, pushNotification } = state;

  // Tasks are server state, so React Query's cache is the source of truth.
  const completed = readCachedTasks().filter((t) => t.status === 'completed');
  const totalHours = computeTotalHours(dayRecords);
  const streak = computeStreak(dayRecords);
  const completedLessons = Object.values(lessonProgress).filter((p) => p.status === 'completed');
  const categoriesHit = new Set(completed.map(taskCategory));

  const checks: Array<[boolean, string]> = [
    [completed.length >= 1, 'first-task'],
    [streak >= 3, 'streak-3'],
    [streak >= 7, 'streak-7'],
    [streak >= 30, 'streak-30'],
    [totalHours >= 5, 'hours-5'],
    [totalHours >= 25, 'hours-25'],
    [totalHours >= 100, 'hours-100'],
    [TASK_CATEGORIES.every((c) => categoriesHit.has(c)), 'all-categories'],
    [completedLessons.length >= 1, 'first-lesson'],
    [completedLessons.length >= 5, 'lessons-5'],
  ];

  const newlyUnlocked: string[] = [];
  for (const [condition, id] of checks) {
    if (condition && unlockAchievement(id)) {
      newlyUnlocked.push(id);
      const ach = findAchievement(id);
      if (ach) {
        pushNotification({
          kind: 'achievement',
          title: `Achievement unlocked — ${ach.title}`,
          body: ach.description,
          route: '/achievements',
        });
      }
    }
  }

  return { newlyUnlocked };
}
