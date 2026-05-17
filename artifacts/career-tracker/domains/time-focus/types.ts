/**
 * Time & Focus Domain — types
 *
 * Owns: countdown timer state, completed focus sessions, session history.
 * Streaks are computed in the Progress domain from day records.
 */
import type { TaskCategory } from '@/shared/types/skills';

export interface ActiveTimer {
  taskId: string;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number;
  pausedAt: number | null;
  totalPausedMs: number;
}

/**
 * An immutable record of a completed (or stopped early) focus session.
 * Created when a timer completes or is stopped.
 */
export interface FocusSession {
  id: string;
  taskId: string;
  taskTitle: string;
  category: TaskCategory;
  startedAt: number;
  endedAt: number;
  durationSeconds: number;
  /** True if the session ran to completion (timer hit 0), false if stopped early. */
  completed: boolean;
}
