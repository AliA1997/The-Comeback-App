/**
 * Lists Domain — data hooks.
 *
 * Server data, so React Query owns it (§ 8.3). Creates and updates are NOT
 * optimistic: the server assigns ids and enforces name uniqueness, and showing
 * a list that then vanishes is worse than a beat of latency (spec § 7.4).
 */
import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { List } from '@workspace/api-client-react';
import { writeErrorMessage } from '@/shared/api/errorMessage';
import { useToast } from '@/shared/ui/ToastProvider';
import {
  invalidateLists,
  useCreateList as useCreateListMutation,
  useDeleteList as useDeleteListMutation,
  useListLists,
  useRestoreList as useRestoreListMutation,
  useUpdateList as useUpdateListMutation,
} from '../api';

export function useLists(options: { includeArchived?: boolean } = {}) {
  const query = useListLists(
    options.includeArchived ? { includeArchived: true } : undefined,
  );

  return {
    lists: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/** One list by id, read from the already-fetched feed rather than a second call. */
export function useList(listId: string | undefined): List | null {
  const { lists } = useLists();
  return useMemo(
    () => (listId ? (lists.find((list) => list.id === listId) ?? null) : null),
    [lists, listId],
  );
}

export function useCreateList() {
  const client = useQueryClient();
  const { show } = useToast();

  return useCreateListMutation({
    mutation: {
      onSuccess: () => invalidateLists(client),
      // A duplicate name is a 409 whose body already says so; anything else
      // falls back to the neutral retry line. Either way the user hears
      // something, which is the whole point of AC-2.
      onError: (error) => show(writeErrorMessage(error)),
    },
  });
}

export function useUpdateList() {
  const client = useQueryClient();
  const { show } = useToast();

  return useUpdateListMutation({
    mutation: {
      onSuccess: () => invalidateLists(client),
      onError: (error) => show(writeErrorMessage(error)),
    },
  });
}

export function useDeleteList() {
  const client = useQueryClient();
  return useDeleteListMutation({
    mutation: { onSuccess: () => invalidateLists(client, { cascades: true }) },
  });
}

export function useRestoreList() {
  const client = useQueryClient();
  return useRestoreListMutation({
    mutation: { onSuccess: () => invalidateLists(client, { cascades: true }) },
  });
}
