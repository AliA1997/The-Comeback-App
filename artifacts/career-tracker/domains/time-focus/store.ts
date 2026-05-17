/**
 * Time & Focus slice — countdown timer + completed focus sessions.
 *
 * This slice owns ONLY timer state and session history. Cross-domain
 * orchestration (e.g. marking the underlying task in-progress, recording
 * day stats, evaluating achievements) lives in
 * `services/SessionLifecycle.ts` so this slice stays a pure data mutator.
 */
import type { StateCreator } from 'zustand';
import type { ActiveTimer, FocusSession } from './types';

export interface TimeFocusSlice {
  activeTimer: ActiveTimer | null;
  focusSessions: FocusSession[];

  // Pure timer state mutations
  setActiveTimer: (timer: ActiveTimer | null) => void;
  patchActiveTimer: (patch: Partial<ActiveTimer>) => void;
  decrementTimer: () => void;
  appendSession: (session: FocusSession) => void;
}

export const createTimeFocusSlice: StateCreator<
  TimeFocusSlice,
  [],
  [],
  TimeFocusSlice
> = (set) => ({
  activeTimer: null,
  focusSessions: [],

  setActiveTimer: (activeTimer) => set({ activeTimer }),

  patchActiveTimer: (patch) =>
    set((s) => (s.activeTimer ? { activeTimer: { ...s.activeTimer, ...patch } } : s)),

  decrementTimer: () =>
    set((s) => {
      if (!s.activeTimer?.isRunning) return s;
      return {
        activeTimer: {
          ...s.activeTimer,
          remainingSeconds: Math.max(0, s.activeTimer.remainingSeconds - 1),
        },
      };
    }),

  appendSession: (session) =>
    set((s) => ({ focusSessions: [session, ...s.focusSessions].slice(0, 500) })),
});
