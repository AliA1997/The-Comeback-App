/**
 * DailyTaskEngine — pure logic for the daily task list. No store access;
 * everything here is deterministic and unit-testable.
 */
import { localDateStr } from '@/shared/lib/dateUtils';
import {
  DAILY_TASK_CATEGORIES,
  InvalidCategoryError,
  MAX_DAILY_TASKS,
  MAX_DAILY_TASK_TITLE_LENGTH,
  TitleTooLongError,
} from '../types';
import type { DailyTask, DailyTaskCategory, RoutineTemplate } from '../types';

function genId(): string {
  return `dt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function isDailyTaskCategory(value: string): value is DailyTaskCategory {
  return (DAILY_TASK_CATEGORIES as readonly string[]).includes(value);
}

/**
 * Enforces the spec's constraints on a template item. Templates are
 * statically typed, but persisted/user-authored templates can drift —
 * validate at the boundary and throw the matching spec error.
 */
export function validateTemplateItem(item: {
  title: string;
  category: string;
}): void {
  if (!isDailyTaskCategory(item.category)) {
    throw new InvalidCategoryError(item.category);
  }
  if (item.title.length > MAX_DAILY_TASK_TITLE_LENGTH) {
    throw new TitleTooLongError(item.title);
  }
}

/** Builds a day's tasks from a template — validated, capped at MAX_DAILY_TASKS. */
export function buildTasksFromTemplate(
  template: RoutineTemplate,
  date: string
): DailyTask[] {
  const items = template.items.slice(0, MAX_DAILY_TASKS);
  items.forEach(validateTemplateItem);
  return items.map((item) => ({
    id: genId(),
    title: item.title,
    category: item.category,
    completed: false,
    date,
  }));
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return localDateStr(d);
}

/**
 * Consecutive local calendar days with ≥1 completed daily task, ending
 * today. Today without a completion doesn't break the run — a day only
 * counts as missed once it's over (spec: Streak rules).
 */
export function computeDailyStreak(tasks: DailyTask[], today: string): number {
  const done = new Set<string>();
  for (const t of tasks) {
    if (t.completed) done.add(t.date);
  }

  let cursor = done.has(today) ? today : prevDay(today);
  let streak = 0;
  while (done.has(cursor)) {
    streak++;
    cursor = prevDay(cursor);
  }
  return streak;
}

/**
 * Encouraging re-entry copy after a streak reset — shown when the user
 * has prior progress but the streak is back at 0 (spec: Streak rules;
 * Principle III — supportive, never punitive).
 */
export function getRestartMessage(
  tasks: DailyTask[],
  today: string
): string | null {
  const hasPriorProgress = tasks.some((t) => t.completed);
  if (hasPriorProgress && computeDailyStreak(tasks, today) === 0) {
    return 'Welcome back! Today is day 1 of your comeback — your tasks are ready.';
  }
  return null;
}
