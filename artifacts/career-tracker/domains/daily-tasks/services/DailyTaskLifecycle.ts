/**
 * DailyTaskLifecycle — the public API of the daily task list, matching
 * the interface in `specs/daily-task-list.md`.
 *
 * Completing a daily task also records day-level activity in the Progress
 * domain (so the app-wide streak, day records, and achievements see it),
 * which is why components call these wrappers instead of the slice
 * actions directly — same pattern as time-focus/SessionLifecycle.
 */
import { useAppStore } from '@/shared/store/root';
import { runAchievementEvaluation } from '@/domains/progress/services/AchievementEngine';
import type {
  CompleteTaskResult,
  CreateDailyTasksInput,
  DailyTasksResult,
} from '../types';

/**
 * Generates today's tasks from the routine template if none exist; keeps
 * existing tasks if already generated. Always returns the current streak.
 */
export function createDailyTasks(
  input: CreateDailyTasksInput = {}
): DailyTasksResult {
  return useAppStore.getState().createDailyTasks(input);
}

/**
 * One-tap completion. Throws `TaskNotFoundError` /
 * `TaskAlreadyCompletedError` per the spec's error conditions.
 */
export function completeTask(taskId: string): CompleteTaskResult {
  const state = useAppStore.getState();
  const result = state.completeDailyTask(taskId);

  // Day-level activity with no timed minutes — feeds dayRecords so the
  // dashboard streak and achievements count daily-task days too.
  state.recordTaskCompletion(taskId, 0);
  runAchievementEvaluation();

  return result;
}
