/**
 * Reading the task feed from outside a component.
 *
 * Services that run off a React tick — achievement evaluation, the local-task
 * migration — still need the current tasks. React Query is the source of truth
 * for them, so they read its cache rather than keeping a parallel copy that
 * could disagree with the screen.
 *
 * Lives in `shared/` because Task Planning and Progress both need it (§ 8.2).
 */
import type { Task } from '@workspace/api-client-react';
import { queryClient } from './client';
import { TASKS_KEY_PREFIX } from './queryKeys';

/**
 * Every task currently cached, across all filtered views, de-duplicated by id.
 * Returns an empty array before the first fetch resolves — callers treat that
 * as "nothing to evaluate yet" rather than "the user has no tasks".
 */
export function readCachedTasks(): Task[] {
  const byId = new Map<string, Task>();

  for (const [, tasks] of queryClient.getQueriesData<Task[]>({
    queryKey: TASKS_KEY_PREFIX,
  })) {
    for (const task of tasks ?? []) {
      byId.set(task.id, task);
    }
  }

  return [...byId.values()];
}
