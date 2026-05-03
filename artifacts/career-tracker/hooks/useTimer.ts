/**
 * useTimer — Read-only view into the active timer state.
 *
 * The actual interval is owned by <TimerProvider> at the root.
 * This hook only reads from the store — it does NOT create intervals.
 */
import { useAppStore } from '@/store/useAppStore';

export function useTimer() {
  const activeTimer = useAppStore((s) => s.activeTimer);
  const tasks = useAppStore((s) => s.tasks);
  const task = tasks.find((t) => t.id === activeTimer?.taskId) ?? null;
  return { activeTimer, task };
}
