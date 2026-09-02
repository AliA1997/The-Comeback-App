/**
 * Lists Domain — the seam over the generated API layer (§ 8.4).
 *
 * Screens import from `../hooks`, never from `@workspace/api-client-react`.
 * That indirection is what keeps the generated layer replaceable.
 */
import type { QueryClient } from '@tanstack/react-query';
import { LISTS_KEY_PREFIX, TASKS_KEY_PREFIX } from '@/shared/api/queryKeys';

export {
  useCreateList,
  useDeleteList,
  useListLists,
  useRestoreList,
  useUpdateList,
} from '@workspace/api-client-react';

export type {
  CreateListRequest,
  DeleteListResult,
  List,
  UpdateListRequest,
} from '@workspace/api-client-react';

/**
 * Every list mutation refreshes the list feed. Delete and restore also cascade
 * to tasks (spec § 12.1), so the task feed is invalidated alongside — a stale
 * task list after deleting its list is the kind of ghost that erodes trust in
 * the numbers.
 */
export function invalidateLists(client: QueryClient, options: { cascades?: boolean } = {}) {
  const invalidations = [client.invalidateQueries({ queryKey: LISTS_KEY_PREFIX })];
  if (options.cascades) {
    invalidations.push(client.invalidateQueries({ queryKey: TASKS_KEY_PREFIX }));
  }
  return Promise.all(invalidations);
}
