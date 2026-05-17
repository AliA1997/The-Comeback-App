/**
 * SessionLifecycle — the cross-domain orchestrator for focus sessions.
 *
 * Starting/stopping a focus timer touches multiple domains:
 *   • Time & Focus     — owns the active timer + session log
 *   • Task Planning    — updates the underlying task status
 *   • Progress         — records day-level stats on completion
 *   • Notifications    — fires the "timer complete" notification
 *
 * Keeping that orchestration here means slices stay pure data mutators and
 * domain boundaries are explicit. Components call these functions instead
 * of calling slice actions directly when an action has cross-domain effects.
 */
import { useAppStore } from '@/shared/store/root';
import { runAchievementEvaluation } from '@/domains/progress/services/AchievementEngine';
import type { FocusSession } from '../types';

function genSessionId(): string {
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function startSession(taskId: string, durationMinutes: number): void {
  const state = useAppStore.getState();
  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return;

  const totalSeconds = durationMinutes * 60;
  const savedRemaining = task.savedRemainingSeconds;
  const remainingSeconds =
    savedRemaining !== undefined && savedRemaining > 0 ? savedRemaining : totalSeconds;

  state.setActiveTimer({
    taskId,
    remainingSeconds,
    totalSeconds,
    isRunning: true,
    isPaused: false,
    startedAt: Date.now(),
    pausedAt: null,
    totalPausedMs: 0,
  });
  state.setTaskStatus(taskId, 'in_progress');
}

export function pauseSession(): void {
  const { activeTimer, patchActiveTimer } = useAppStore.getState();
  if (!activeTimer?.isRunning) return;
  patchActiveTimer({ isRunning: false, isPaused: true, pausedAt: Date.now() });
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
}

/**
 * Stop the session WITHOUT marking the task complete. Persists the
 * remaining seconds so the user can resume the task later.
 */
export function stopSession(): void {
  const state = useAppStore.getState();
  const { activeTimer } = state;
  if (!activeTimer) return;

  state.setSavedRemainingSeconds(activeTimer.taskId, activeTimer.remainingSeconds);
  state.setTaskStatus(activeTimer.taskId, 'pending');
  state.setActiveTimer(null);
}

/**
 * Complete the session — runs when the timer reaches 0, or when the user
 * manually marks it done. Triggers progress recording, achievement
 * evaluation, and a "timer complete" inbox entry.
 */
export function completeSession(): FocusSession | null {
  const state = useAppStore.getState();
  const { activeTimer } = state;
  if (!activeTimer) return null;

  const task = state.tasks.find((t) => t.id === activeTimer.taskId);
  if (!task) {
    state.setActiveTimer(null);
    return null;
  }

  const elapsedSeconds = activeTimer.totalSeconds - activeTimer.remainingSeconds;
  const actualMinutes = Math.max(1, Math.round(elapsedSeconds / 60));

  const session: FocusSession = {
    id: genSessionId(),
    taskId: task.id,
    taskTitle: task.title,
    category: task.category,
    startedAt: activeTimer.startedAt,
    endedAt: Date.now(),
    durationSeconds: elapsedSeconds,
    completed: activeTimer.remainingSeconds <= 1,
  };

  state.appendSession(session);
  state.setSavedRemainingSeconds(task.id, undefined);
  state.setTaskStatus(task.id, 'completed');
  state.updateTask(task.id, { actualDuration: actualMinutes });
  state.recordTaskCompletion(task.id, actualMinutes);
  state.setActiveTimer(null);

  state.pushNotification({
    kind: 'timer',
    title: 'Focus session complete',
    body: `Great work on "${task.title}". ${actualMinutes}m logged.`,
  });

  runAchievementEvaluation();
  return session;
}
