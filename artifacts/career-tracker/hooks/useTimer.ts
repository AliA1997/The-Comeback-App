/**
 * useTimer — Read-only view into the active timer state.
 *
 * The actual interval is owned by <TimerProvider> at the root.
 * This hook only reads from the store and does NOT create intervals.
 *
 * Note: prefer the granular selectors in `store/selectors` (e.g. just the
 * `useActiveTaskId` boolean check) when you don't actually need the full
 * timer object — that avoids per-second re-renders.
 */
import { useActiveTask, useActiveTimer } from '@/store/selectors';

export function useTimer() {
  const activeTimer = useActiveTimer();
  const task = useActiveTask();
  return { activeTimer, task };
}
