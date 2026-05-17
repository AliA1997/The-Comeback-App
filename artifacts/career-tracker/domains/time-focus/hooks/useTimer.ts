/**
 * useTimer — Read-only view of the active timer.
 *
 * The actual interval is owned by <TimerProvider>. This hook only reads.
 * Prefer the granular selectors in `domains/time-focus/selectors.ts` when
 * you don't need the whole timer object — they avoid per-second re-renders.
 */
import { useActiveTimer } from '@/domains/time-focus/selectors';
import { useActiveTask } from '@/domains/task-planning/selectors';

export function useTimer() {
  const activeTimer = useActiveTimer();
  const task = useActiveTask();
  return { activeTimer, task };
}
