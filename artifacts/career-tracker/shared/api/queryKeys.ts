/**
 * Query keys, in one place (spec § 7.4).
 *
 * These delegate to the generated key builders rather than re-spelling the
 * paths, so a change to `openapi.yaml` cannot leave invalidation pointing at
 * a key nothing writes to. Domains invalidate through here so a mutation in
 * one domain never has to know how another spells its cache key.
 */
import {
  getGetProfileQueryKey,
  getGetTaskQueryKey,
  getListListsQueryKey,
  getListTaskTypesQueryKey,
  getListTasksQueryKey,
  type ListTasksParams,
} from '@workspace/api-client-react';

export const queryKeys = {
  /** Never invalidated — static seed data. */
  taskTypes: getListTaskTypesQueryKey,
  profile: getGetProfileQueryKey,
  lists: getListListsQueryKey,
  tasks: (params?: ListTasksParams) => getListTasksQueryKey(params),
  task: getGetTaskQueryKey,
} as const;

/**
 * Prefix matching every `['/api/tasks', …]` key regardless of filters, so one
 * mutation can refresh every filtered view of the task feed at once.
 */
export const TASKS_KEY_PREFIX = getListTasksQueryKey();

/** Prefix matching every `['/api/lists', …]` key. */
export const LISTS_KEY_PREFIX = getListListsQueryKey();
