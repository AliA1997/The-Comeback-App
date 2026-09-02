/**
 * Task Planning Domain — the seam over the generated API layer (§ 8.4).
 *
 * Also home to the optimistic-cache plumbing. Start / pause / resume /
 * complete / delete are the one-tap actions, and Principle V means the UI must
 * not wait on a round trip for any of them (spec § 7.4).
 */
import type { QueryClient } from '@tanstack/react-query';
import type { Task } from '@workspace/api-client-react';
import { LISTS_KEY_PREFIX, TASKS_KEY_PREFIX, queryKeys } from '@/shared/api/queryKeys';

export {
  useCompleteTask,
  useCreateTask,
  useDeleteTask,
  useGetTask,
  useListTaskTypes,
  useListTasks,
  usePauseTask,
  useRestoreTask,
  useResumeTask,
  useStartTask,
  useStopTask,
  useUpdateTask,
} from '@workspace/api-client-react';

export type {
  CreateTaskRequest,
  ListTasksParams,
  Task,
  TaskType,
  UpdateTaskRequest,
} from '@workspace/api-client-react';

/** Snapshot of every task cache entry, for rollback on error. */
export type TasksSnapshot = Array<[readonly unknown[], Task[] | undefined]>;

/**
 * Applies `patch` to one task across every cached filtered view, and returns
 * the previous state so a failed mutation can put it back exactly.
 */
export function patchCachedTask(
  client: QueryClient,
  taskId: string,
  patch: Partial<Task>,
): TasksSnapshot {
  const snapshot = client.getQueriesData<Task[]>({ queryKey: TASKS_KEY_PREFIX });

  client.setQueriesData<Task[]>({ queryKey: TASKS_KEY_PREFIX }, (tasks) =>
    tasks?.map((task) => (task.id === taskId ? { ...task, ...patch } : task)),
  );

  client.setQueryData<Task>(queryKeys.task(taskId), (task) =>
    task ? { ...task, ...patch } : task,
  );

  return snapshot as TasksSnapshot;
}

export function restoreTasksSnapshot(client: QueryClient, snapshot: TasksSnapshot): void {
  for (const [key, tasks] of snapshot) {
    client.setQueryData(key, tasks);
  }
}

/**
 * Refreshes the task feed after a mutation settles. List task counts move with
 * task status, so the list feed is refreshed too.
 */
export function invalidateTasks(client: QueryClient): Promise<unknown> {
  return Promise.all([
    client.invalidateQueries({ queryKey: TASKS_KEY_PREFIX }),
    client.invalidateQueries({ queryKey: LISTS_KEY_PREFIX }),
  ]);
}
