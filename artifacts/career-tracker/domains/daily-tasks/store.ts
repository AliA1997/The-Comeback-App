/**
 * Daily Task List slice — today's pre-structured plan + routine templates.
 *
 * Implements the state side of `specs/daily-task-list.md`. Components
 * should call the wrappers in `services/DailyTaskLifecycle.ts` (which add
 * the cross-domain Progress recording) rather than these actions directly.
 */
import type { StateCreator } from 'zustand';
import { localTodayStr } from '@/shared/lib/dateUtils';
import { DEFAULT_ROUTINE_TEMPLATE } from './data/defaultTemplate';
import {
  buildTasksFromTemplate,
  computeDailyStreak,
} from './services/DailyTaskEngine';
import { TaskAlreadyCompletedError, TaskNotFoundError } from './types';
import type {
  CompleteTaskResult,
  CreateDailyTasksInput,
  DailyTask,
  DailyTasksResult,
  RoutineTemplate,
} from './types';

export interface DailyTasksSlice {
  dailyTasks: DailyTask[];
  routineTemplates: RoutineTemplate[];
  activeRoutineTemplateId: string | null;

  /**
   * Spec: `createDailyTasks` — generates the day's tasks from the routine
   * template if none exist; idempotent, so calling twice never duplicates
   * or regenerates.
   */
  createDailyTasks: (input?: CreateDailyTasksInput) => DailyTasksResult;
  /** Spec: `completeTask` — one tap, task id only, no extra input. */
  completeDailyTask: (taskId: string) => CompleteTaskResult;
}

export const createDailyTasksSlice: StateCreator<
  DailyTasksSlice,
  [],
  [],
  DailyTasksSlice
> = (set, get) => ({
  dailyTasks: [],
  routineTemplates: [],
  activeRoutineTemplateId: null,

  createDailyTasks: (input = {}) => {
    const date = input.date ?? localTodayStr();
    const s = get();

    const existing = s.dailyTasks.filter((t) => t.date === date);
    if (existing.length > 0) {
      return { tasks: existing, streak: computeDailyStreak(s.dailyTasks, date) };
    }

    const templateId = input.routineTemplateId ?? s.activeRoutineTemplateId;
    const template =
      s.routineTemplates.find((t) => t.id === templateId) ??
      DEFAULT_ROUTINE_TEMPLATE;

    const tasks = buildTasksFromTemplate(template, date);
    set((st) => ({ dailyTasks: [...st.dailyTasks, ...tasks] }));
    return { tasks, streak: computeDailyStreak(get().dailyTasks, date) };
  },

  completeDailyTask: (taskId) => {
    const s = get();
    const task = s.dailyTasks.find((t) => t.id === taskId);
    if (!task) throw new TaskNotFoundError(taskId);
    if (task.completed) throw new TaskAlreadyCompletedError(taskId);

    const today = localTodayStr();
    if (task.date !== today) {
      // Previous days are frozen at rollover (spec: Day rollover) — a
      // session spanning midnight must not complete yesterday's tasks.
      throw new TaskNotFoundError(taskId);
    }

    const updated: DailyTask = { ...task, completed: true };
    set((st) => ({
      dailyTasks: st.dailyTasks.map((t) => (t.id === taskId ? updated : t)),
    }));
    return { task: updated, streak: computeDailyStreak(get().dailyTasks, today) };
  },
});
