/**
 * Task Planning Domain — read hooks.
 *
 * If the server can send it, React Query owns it (§ 8.3). These are the only
 * task readers in the app; nothing subscribes to a Zustand task list any more.
 */
import { useMemo } from 'react';
import type { ListTasksParams, Task } from '@workspace/api-client-react';
import { STATIC_STALE_TIME } from '@/shared/api/client';
import { queryKeys } from '@/shared/api/queryKeys';
import { useActiveTaskId } from '@/domains/time-focus/selectors';
import { useListTaskTypes, useListTasks } from '../api';

export interface TasksResult {
  tasks: Task[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useTasks(params?: ListTasksParams): TasksResult {
  const query = useListTasks(params);

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Resolves the running task by joining the timer's `taskId` (Time & Focus,
 * client-only state) with the task feed (server state). Returns null while the
 * feed is still loading rather than guessing.
 */
export function useActiveTask(): Task | null {
  const activeTaskId = useActiveTaskId();
  const { tasks } = useTasks();

  return useMemo(
    () => (activeTaskId ? (tasks.find((task) => task.id === activeTaskId) ?? null) : null),
    [tasks, activeTaskId],
  );
}

export function useTask(taskId: string | undefined): Task | null {
  const { tasks } = useTasks();
  return useMemo(
    () => (taskId ? (tasks.find((task) => task.id === taskId) ?? null) : null),
    [tasks, taskId],
  );
}

/** The scoring catalogue. Seed data, so it never goes stale (spec § 7.4). */
export function useTaskTypes() {
  const query = useListTaskTypes({
    query: { queryKey: queryKeys.taskTypes(), staleTime: STATIC_STALE_TIME },
  });

  return {
    taskTypes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

/**
 * Earned score (spec § 5.6.4) — completed tasks only. Every other status,
 * `deleted` included, contributes nothing.
 */
export function useEarnedScore(): number {
  const { tasks } = useTasks();
  return useMemo(
    () =>
      tasks.reduce(
        (total, task) => (task.status === 'completed' ? total + task.score : total),
        0,
      ),
    [tasks],
  );
}
