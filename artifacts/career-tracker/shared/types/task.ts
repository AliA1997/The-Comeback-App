/**
 * Shared kernel — the server's task vocabulary.
 *
 * Task Planning, Time & Focus, Progress and Lists all speak about tasks, so
 * per the guide (§ 8.11) the shape lives in `shared/` rather than in any one
 * domain. The types themselves are re-exported from the generated schemas and
 * never hand-copied.
 */
import type { Task, TaskType } from '@workspace/api-client-react';
import type { TaskCategory } from './skills';

export type {
  PriorityLevel,
  Task,
  TaskStatus,
  TaskType,
} from '@workspace/api-client-react';

/** Sort weight — highest priority first. Not a scoring multiplier. */
export const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * A task type's `label` is seeded to match `TaskCategory` verbatim, so the
 * two vocabularies join without a lookup table. A user-defined type (post-MVP,
 * `isSystem: false`) falls back to Learning rather than crashing a badge.
 */
export function taskCategory(task: Pick<Task, 'taskType'>): TaskCategory {
  return task.taskType.label as TaskCategory;
}

export function taskTypeCategory(taskType: TaskType): TaskCategory {
  return taskType.label as TaskCategory;
}

/**
 * The day a task belongs to, for day-scoped views. UTC-based to match
 * `todayStr()` and the day records the Progress domain writes — a task and the
 * day record that counts it must agree on where the boundary is.
 */
export function taskDate(task: Pick<Task, 'createdAt'>): string {
  return task.createdAt.slice(0, 10);
}

/** True for statuses that still represent outstanding work. */
export function isOpen(task: Pick<Task, 'status'>): boolean {
  return (
    task.status === 'pending' || task.status === 'in_progress' || task.status === 'paused'
  );
}
