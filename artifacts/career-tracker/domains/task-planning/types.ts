/**
 * Task Planning Domain — types
 *
 * Owns: todos, checklists, deadlines, recurring rules, dependencies,
 * completion state, per-task reminders.
 */
import type { TaskCategory } from '@/shared/types/skills';

export type { TaskCategory };

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export type RecurringRule =
  | { kind: 'none' }
  | { kind: 'daily' }
  | { kind: 'weekly'; weekday: number /* 0=Sun..6=Sat */ };

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  estimatedDuration: number; // minutes
  status: TaskStatus;
  createdAt: number;
  completedAt?: number;
  actualDuration?: number;
  date: string; // YYYY-MM-DD
  savedRemainingSeconds?: number;

  // Domain extensions (all optional)
  /** ISO date the task is due by (YYYY-MM-DD) */
  deadline?: string;
  /** Optional sub-steps */
  checklist?: ChecklistItem[];
  /** If set, completing the task spawns the next instance per rule */
  recurring?: RecurringRule;
  /** Other task ids that must be done first */
  dependsOn?: string[];
  /** Absolute timestamp for an in-app reminder */
  reminderAt?: number;
}

export type NewTaskInput = Omit<
  Task,
  'id' | 'createdAt' | 'status' | 'date'
>;
