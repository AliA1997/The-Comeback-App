/**
 * Granular Zustand selectors.
 *
 * Each hook subscribes a component to the SMALLEST piece of state it needs,
 * so a per-second timer tick (which only mutates `activeTimer.remainingSeconds`)
 * does not re-render the dashboard, every TaskCard, etc.
 *
 * Rule of thumb: never destructure from `useAppStore()` without a selector.
 * Always use one of these hooks, or pass an inline `(s) => s.field` selector.
 */
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';
import type { Task } from '@/types';

// ---------- Persisted state slices ----------
export const useTasks = () => useAppStore((s) => s.tasks);
export const useDayRecords = () => useAppStore((s) => s.dayRecords);

// ---------- Active timer slices ----------
// Each selector projects to a primitive so re-renders only fire on real changes.
export const useActiveTimer = () => useAppStore((s) => s.activeTimer);
export const useActiveTaskId = () => useAppStore((s) => s.activeTimer?.taskId ?? null);
export const useIsAnyTimerRunning = () => useAppStore((s) => s.activeTimer !== null);
export const useIsTimerPaused = () => useAppStore((s) => s.activeTimer?.isPaused ?? false);
export const useTimerRemainingSeconds = () =>
  useAppStore((s) => s.activeTimer?.remainingSeconds ?? 0);
export const useTimerTotalSeconds = () =>
  useAppStore((s) => s.activeTimer?.totalSeconds ?? 0);

/**
 * True when the timer is fully idle (no active session at all, or stopped/paused).
 * Returns a boolean so the consuming component only re-renders on real transitions,
 * not on every per-second tick of `remainingSeconds`.
 */
export const useIsTimerIdle = () =>
  useAppStore((s) => {
    const t = s.activeTimer;
    return !t || (!t.isRunning && !t.isPaused);
  });

// ---------- Active task lookup ----------
/**
 * Resolves the currently-active Task object. Because Zustand updates are
 * immutable, the same task reference is returned across re-renders unless
 * THAT specific task has changed — so this hook does NOT re-render on
 * timer ticks (which only mutate `activeTimer`, not `tasks`).
 */
export function useActiveTask(): Task | null {
  return useAppStore((s) => {
    const id = s.activeTimer?.taskId;
    if (!id) return null;
    return s.tasks.find((t) => t.id === id) ?? null;
  });
}

// ---------- Hydration / onboarding ----------
export const useHydrationState = () =>
  useAppStore(
    useShallow((s) => ({
      hasHydrated: s._hasHydrated,
      hasSeenLanding: s.hasSeenLanding,
    }))
  );
