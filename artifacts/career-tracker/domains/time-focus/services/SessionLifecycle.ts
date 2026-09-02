/**
 * SessionLifecycle — the cross-domain orchestrator for focus sessions.
 *
 * Starting/stopping a focus timer touches multiple domains:
 *   • Time & Focus     — owns the active timer + session log
 *   • Task Planning    — the underlying task's server status (via TaskSync)
 *   • Progress         — records day-level stats on completion
 *   • Notifications    — fires the "timer complete" notification
 *
 * Keeping that orchestration here means slices stay pure data mutators and
 * domain boundaries are explicit. Components call these functions instead of
 * calling slice actions directly when an action has cross-domain effects.
 *
 * TIMER CONSTRAINT (spec § 6.4): the tick model, the interval singleton and
 * the `savedRemainingSeconds` persistence are frozen. Exactly two changes are
 * permitted here, and both are present:
 *
 *   1. `pauseSession()` / `stopSession()` write the server's `paused` status
 *      where a pause previously left the task `pending`. Mechanics unchanged.
 *   2. Each function fires the matching server mutation AFTER its local state
 *      update. The local update stays synchronous and first, so the timer's
 *      perceived behaviour is identical.
 */
import { useAppStore } from '@/shared/store/root';
import { runAchievementEvaluation } from '@/domains/progress/services/AchievementEngine';
import {
  syncComplete,
  syncPause,
  syncResume,
  syncStart,
  syncStop,
} from '@/domains/task-planning/services/TaskSync';
import { taskCategory, type Task } from '@/shared/types/task';
import type { FocusSession } from '../types';

function genSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function startSession(task: Task): void {
  const state = useAppStore.getState();

  const totalSeconds = task.estimatedDurationMinutes * 60;
  const savedRemaining = task.savedRemainingSeconds;
  const remainingSeconds =
    savedRemaining !== undefined && savedRemaining !== null && savedRemaining > 0
      ? savedRemaining
      : totalSeconds;

  state.setActiveTimer({
    taskId: task.id,
    remainingSeconds,
    totalSeconds,
    isRunning: true,
    isPaused: false,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
  });

  syncStart(task.id);
}

export function pauseSession(): void {
  const { activeTimer, patchActiveTimer } = useAppStore.getState();
  if (!activeTimer?.isRunning) return;

  patchActiveTimer({ isRunning: false, isPaused: true, pausedAt: Date.now() });

  syncPause(activeTimer.taskId, activeTimer.remainingSeconds);
}

export function resumeSession(): void {
  const { activeTimer, patchActiveTimer } = useAppStore.getState();
  if (!activeTimer?.isPaused) return;

  const pausedDuration = activeTimer.pausedAt ? Date.now() - activeTimer.pausedAt : 0;
  patchActiveTimer({
    isRunning: true,
    isPaused: false,
    pausedAt: null,
    totalPausedMs: activeTimer.totalPausedMs + pausedDuration,
  });

  syncResume(activeTimer.taskId);
}

/**
 * Stop the session WITHOUT marking the task complete. Persists the remaining
 * seconds so the user can resume the task later.
 */
export function stopSession(): void {
  const state = useAppStore.getState();
  const { activeTimer } = state;
  if (!activeTimer) return;

  state.setActiveTimer(null);

  syncStop(activeTimer.taskId, activeTimer.remainingSeconds);
}

/**
 * Flushes a live session on unmount (spec § 6.3). Running at unmount is
 * treated as a pause: the user's intent was to step away, so returning should
 * resume rather than restart. An already-paused session just re-flushes its
 * resume point, leaving status unchanged.
 */
export function flushSessionOnUnmount(): void {
  const { activeTimer } = useAppStore.getState();
  if (!activeTimer) return;

  if (activeTimer.isRunning) {
    pauseSession();
    return;
  }

  if (activeTimer.isPaused) {
    // Re-send the resume point without changing status; the pause itself was
    // already synced when the user tapped pause.
    syncPause(activeTimer.taskId, activeTimer.remainingSeconds);
  }
}

/**
 * Complete the session — runs when the timer reaches 0, or when the user
 * manually marks it done. Triggers progress recording, achievement
 * evaluation, and a "timer complete" inbox entry.
 *
 * `task` is passed in rather than read from a store because tasks are server
 * state now; the caller already holds the record it is completing.
 */
export function completeSession(task: Task | null): FocusSession | null {
  const state = useAppStore.getState();
  const { activeTimer } = state;
  if (!activeTimer) return null;

  if (!task) {
    state.setActiveTimer(null);
    return null;
  }

  const elapsedSeconds = activeTimer.totalSeconds - activeTimer.remainingSeconds;
  const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  // A pause still open at completion counts as paused time, not focus time.
  const pendingPauseMs = activeTimer.pausedAt ? Date.now() - activeTimer.pausedAt : 0;
  const totalPausedMs = activeTimer.totalPausedMs + pendingPauseMs;

  const session: FocusSession = {
    id: genSessionId(),
    taskId: task.id,
    taskTitle: task.title,
    category: taskCategory(task),
    startedAt: activeTimer.startedAt,
    endedAt: Date.now(),
    durationSeconds: elapsedSeconds,
    completed: activeTimer.remainingSeconds <= 1,
  };

  state.appendSession(session);
  state.recordTaskCompletion(task.id, actualMinutes);
  state.setActiveTimer(null);

  state.pushNotification({
    kind: 'timer',
    title: 'Focus session complete',
    body: `Great work on "${task.title}". ${actualMinutes}m logged.`,
  });

  syncComplete(task.id, totalPausedMs);

  runAchievementEvaluation();
  return session;
}
