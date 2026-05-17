import { useAppStore } from '@/shared/store/root';

// Active timer — granular projections so per-second ticks don't propagate
export const useActiveTimer = () => useAppStore((s) => s.activeTimer);
export const useActiveTaskId = () => useAppStore((s) => s.activeTimer?.taskId ?? null);
export const useIsAnyTimerRunning = () => useAppStore((s) => s.activeTimer !== null);
export const useIsTimerPaused = () => useAppStore((s) => s.activeTimer?.isPaused ?? false);
export const useTimerRemainingSeconds = () =>
  useAppStore((s) => s.activeTimer?.remainingSeconds ?? 0);
export const useTimerTotalSeconds = () =>
  useAppStore((s) => s.activeTimer?.totalSeconds ?? 0);

/**
 * True when no session is actively counting down. Returns a boolean so
 * subscribers only re-render on real idle transitions, not per-tick.
 */
export const useIsTimerIdle = () =>
  useAppStore((s) => {
    const t = s.activeTimer;
    return !t || (!t.isRunning && !t.isPaused);
  });

export const useFocusSessions = () => useAppStore((s) => s.focusSessions);
