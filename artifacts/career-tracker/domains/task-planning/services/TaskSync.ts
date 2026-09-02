/**
 * TaskSync — imperative lifecycle writes for callers outside React.
 *
 * `SessionLifecycle` updates the local timer synchronously and then fires the
 * matching server mutation (spec § 6.4.2). It is a plain module, not a
 * component, so it cannot hold a React Query hook — these functions are the
 * non-hook equivalent, sharing the same optimistic-cache helpers as
 * `hooks/useTaskMutations.ts` so the two paths cannot drift.
 *
 * Every call is fire-and-forget (spec § 6.3): a failed sync rolls the cache
 * back and raises a toast, but never blocks navigation or the timer. Local
 * state remains the source of truth for the resume point until a sync lands.
 */
import {
  completeTask,
  pauseTask,
  resumeTask,
  startTask,
  stopTask,
  type Task,
} from '@workspace/api-client-react';
import { queryClient } from '@/shared/api/client';
import { notify } from '@/shared/ui/ToastProvider';
import { invalidateTasks, patchCachedTask, restoreTasksSnapshot } from '../api';

/** Principle III: states what happened, offers the next step, blames no one. */
const SYNC_FAILED = "That didn't save. We'll retry when you're back online.";

async function sync(
  taskId: string,
  optimistic: Partial<Task>,
  request: () => Promise<Task>,
): Promise<void> {
  const snapshot = patchCachedTask(queryClient, taskId, optimistic);

  try {
    await request();
  } catch {
    restoreTasksSnapshot(queryClient, snapshot);
    notify(SYNC_FAILED);
    return;
  }

  await invalidateTasks(queryClient);
}

export function syncStart(taskId: string): void {
  void sync(
    taskId,
    { status: 'in_progress', startedAt: new Date().toISOString(), pausedAt: null },
    () => startTask(taskId),
  );
}

export function syncPause(taskId: string, savedRemainingSeconds: number): void {
  void sync(
    taskId,
    { status: 'paused', pausedAt: new Date().toISOString(), savedRemainingSeconds },
    () => pauseTask(taskId, { savedRemainingSeconds }),
  );
}

export function syncResume(taskId: string): void {
  void sync(taskId, { status: 'in_progress', pausedAt: null }, () => resumeTask(taskId));
}

export function syncStop(taskId: string, savedRemainingSeconds: number): void {
  void sync(
    taskId,
    { status: 'pending', pausedAt: null, savedRemainingSeconds },
    () => stopTask(taskId, { savedRemainingSeconds }),
  );
}

/**
 * `totalPausedMs` is the pause time accumulated on this device since the last
 * sync. The server adds it to the stored total before computing the focused
 * duration, so a break taken while offline is still excluded (AC-8).
 */
export function syncComplete(taskId: string, totalPausedMs: number): void {
  void sync(
    taskId,
    {
      status: 'completed',
      completedAt: new Date().toISOString(),
      pausedAt: null,
      savedRemainingSeconds: null,
    },
    () => completeTask(taskId, { totalPausedMs }),
  );
}
