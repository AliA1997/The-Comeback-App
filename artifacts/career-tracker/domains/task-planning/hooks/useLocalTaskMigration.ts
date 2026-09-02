/**
 * Fires the one-time local-task upload on the first authenticated launch
 * (spec § 9, phase 6).
 *
 * Renders nothing and blocks nothing: the migration runs in the background and
 * the task feed refreshes when it lands. If it fails the flag stays unset and
 * the next launch retries, so nobody's work is stranded on the device.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { useAuthUserId } from '@/domains/auth/selectors';
import { invalidateTasks } from '../api';
import { runLocalTaskMigration } from '../services/LocalTaskMigration';

export function useLocalTaskMigration(): void {
  const userId = useAuthUserId();
  const client = useQueryClient();
  const attemptedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!userId || attemptedFor.current === userId) return;
    attemptedFor.current = userId;

    void runLocalTaskMigration(userId)
      .then((result) => {
        if (result && result.migrated > 0) void invalidateTasks(client);
      })
      .catch(() => {
        // Leave the flag unset so the next launch retries.
        attemptedFor.current = null;
      });
  }, [userId, client]);
}
