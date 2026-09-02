/**
 * Task Planning Domain — write hooks (spec § 7.4).
 *
 * Create and update wait for the server, because the server computes the score
 * and the client has no business guessing it. Delete is optimistic — it is a
 * one-tap action, and Principle V means the card should leave the list on the
 * tap, not on the response.
 *
 * The timer's own transitions (start / pause / resume / stop / complete) are
 * fired imperatively by `services/TaskSync.ts`, because `SessionLifecycle` is
 * a plain module and cannot hold a hook.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/ui/ToastProvider';
import {
  invalidateTasks,
  patchCachedTask,
  restoreTasksSnapshot,
  useCreateTask as useCreateTaskMutation,
  useDeleteTask as useDeleteTaskMutation,
  useRestoreTask as useRestoreTaskMutation,
  useUpdateTask as useUpdateTaskMutation,
  type TasksSnapshot,
} from '../api';

/** Principle III: states what happened, offers the next step, blames no one. */
const RETRY_MESSAGE = "That didn't save. Tap to try again.";

export function useCreateTask() {
  const client = useQueryClient();
  return useCreateTaskMutation({
    mutation: { onSuccess: () => invalidateTasks(client) },
  });
}

export function useUpdateTask() {
  const client = useQueryClient();
  return useUpdateTaskMutation({
    mutation: { onSuccess: () => invalidateTasks(client) },
  });
}

export function useDeleteTask() {
  const client = useQueryClient();
  const { show } = useToast();

  return useDeleteTaskMutation({
    mutation: {
      onMutate: ({ taskId }) => ({
        snapshot: patchCachedTask(client, taskId, {
          status: 'deleted',
          deletedAt: new Date().toISOString(),
        }),
      }),
      onError: (_error, _variables, context) => {
        if (context) restoreTasksSnapshot(client, (context as { snapshot: TasksSnapshot }).snapshot);
        show(RETRY_MESSAGE);
      },
      onSettled: () => invalidateTasks(client),
    },
  });
}

export function useRestoreTask() {
  const client = useQueryClient();
  return useRestoreTaskMutation({
    mutation: { onSuccess: () => invalidateTasks(client) },
  });
}
