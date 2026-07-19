/**
 * Daily Task List Domain — types
 *
 * Implements `specs/daily-task-list.md`: each day the user gets a small,
 * pre-structured set of job-search tasks generated from a routine
 * template, with streak tracking. Max 5 tasks/day (Principle II), one-tap
 * completion (Principle V), encouraging restart on missed days
 * (Principle III).
 */

export const DAILY_TASK_CATEGORIES = [
  'applications',
  'practice',
  'networking',
  'learning',
] as const;

export type DailyTaskCategory = (typeof DAILY_TASK_CATEGORIES)[number];

/** Principle II — reduce overwhelm. */
export const MAX_DAILY_TASKS = 5;
export const MAX_DAILY_TASK_TITLE_LENGTH = 80;

export interface DailyTask {
  id: string;
  title: string; // ≤ MAX_DAILY_TASK_TITLE_LENGTH chars
  category: DailyTaskCategory;
  completed: boolean;
  date: string; // YYYY-MM-DD, local time
}

export interface RoutineTemplateItem {
  title: string;
  category: DailyTaskCategory;
}

export interface RoutineTemplate {
  id: string;
  name: string;
  /** Trimmed to MAX_DAILY_TASKS at generation time. */
  items: RoutineTemplateItem[];
}

export interface CreateDailyTasksInput {
  /** Defaults to today (local time). */
  date?: string;
  /** Defaults to the active template, else the built-in default. */
  routineTemplateId?: string;
}

export interface DailyTasksResult {
  tasks: DailyTask[];
  streak: number;
}

export interface CompleteTaskResult {
  task: DailyTask;
  streak: number;
}

// Error conditions (spec: Error Conditions). User-facing messages follow
// Principle III — factual and helpful, never blaming.

export class InvalidCategoryError extends Error {
  constructor(category: string) {
    super(
      `"${category}" isn't a daily task category. Use one of: ${DAILY_TASK_CATEGORIES.join(', ')}.`
    );
    this.name = 'InvalidCategoryError';
  }
}

export class TitleTooLongError extends Error {
  constructor(title: string) {
    super(
      `Task titles are limited to ${MAX_DAILY_TASK_TITLE_LENGTH} characters — please shorten "${title.slice(0, 40)}…".`
    );
    this.name = 'TitleTooLongError';
  }
}

export class TaskAlreadyCompletedError extends Error {
  constructor(taskId: string) {
    super(`This task is already done — nice work. (id: ${taskId})`);
    this.name = 'TaskAlreadyCompletedError';
  }
}

export class TaskNotFoundError extends Error {
  constructor(taskId: string) {
    super(`No daily task with id "${taskId}" is available today.`);
    this.name = 'TaskNotFoundError';
  }
}
