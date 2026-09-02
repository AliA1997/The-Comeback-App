/**
 * Task Planning Domain — types.
 *
 * Owns: creating, editing and filtering the user's tasks.
 *
 * The task shape itself is server-derived and lives in `shared/types/task.ts`,
 * re-exported here so screens in this domain have one import. Types are taken
 * from the generated schemas and never hand-copied (§ 8.11).
 */
import type { PriorityLevel, TaskStatus } from '@/shared/types/task';

export type {
  PriorityLevel,
  Task,
  TaskStatus,
  TaskType,
} from '@/shared/types/task';
export type { TaskCategory } from '@/shared/types/skills';

/** Client-only filter state for the tasks screen. `All` is not a server value. */
export type StatusFilter = TaskStatus | 'All';

export const STATUS_FILTERS: StatusFilter[] = [
  'All',
  'pending',
  'in_progress',
  'paused',
  'completed',
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  paused: 'Paused',
  completed: 'Completed',
  deleted: 'Deleted',
};

export const PRIORITY_OPTIONS: PriorityLevel[] = ['low', 'medium', 'high', 'urgent'];

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

/** The duration presets the form offers. Free entry is post-MVP. */
export const DURATION_OPTIONS = [15, 25, 30, 45, 60, 90, 120];
