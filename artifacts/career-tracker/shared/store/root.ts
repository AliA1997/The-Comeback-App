/**
 * Root application store — composes domain slices into a single Zustand
 * store with one persist middleware and one hydration event.
 *
 * Cross-domain side effects (e.g. "completing a timer also records day
 * stats and evaluates achievements") live in domain `services/` layers
 * that call `useAppStore.getState()`. Slices themselves are pure data
 * mutators — they never reach across domains.
 *
 * Subscription rules: see `replit.md` (Performance architecture).
 * tl;dr — never destructure `useAppStore()` without a selector; per-tick
 * subscriptions are isolated to `TimerSecondsText`.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import {
  createDailyTasksSlice,
  type DailyTasksSlice,
} from '@/domains/daily-tasks/store';
import {
  createLearningSlice,
  type LearningSlice,
} from '@/domains/learning/store';
import {
  createNotificationsSlice,
  type NotificationsSlice,
} from '@/domains/notifications/store';
import {
  createProgressSlice,
  type ProgressSlice,
} from '@/domains/progress/store';
import {
  createTaskPlanningSlice,
  type TaskPlanningSlice,
} from '@/domains/task-planning/store';
import {
  createTimeFocusSlice,
  type TimeFocusSlice,
} from '@/domains/time-focus/store';
import {
  createUserProfileSlice,
  type UserProfileSlice,
} from '@/domains/user-profile/store';

interface RootMeta {
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;
}

export type RootState = RootMeta &
  UserProfileSlice &
  TimeFocusSlice &
  NotificationsSlice &
  TaskPlanningSlice &
  DailyTasksSlice &
  LearningSlice &
  ProgressSlice;

export const useAppStore = create<RootState>()(
  persist(
    (set, get, api) => ({
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      // Slices are composed by spreading. The cast keeps Zustand happy when
      // mixing slice creators with the persist middleware — this is the
      // documented pattern for slice composition under middleware.
      ...createUserProfileSlice(
        set as Parameters<typeof createUserProfileSlice>[0],
        get as Parameters<typeof createUserProfileSlice>[1],
        api as Parameters<typeof createUserProfileSlice>[2]
      ),
      ...createTimeFocusSlice(
        set as Parameters<typeof createTimeFocusSlice>[0],
        get as Parameters<typeof createTimeFocusSlice>[1],
        api as Parameters<typeof createTimeFocusSlice>[2]
      ),
      ...createNotificationsSlice(
        set as Parameters<typeof createNotificationsSlice>[0],
        get as Parameters<typeof createNotificationsSlice>[1],
        api as Parameters<typeof createNotificationsSlice>[2]
      ),
      ...createTaskPlanningSlice(
        set as Parameters<typeof createTaskPlanningSlice>[0],
        get as Parameters<typeof createTaskPlanningSlice>[1],
        api as Parameters<typeof createTaskPlanningSlice>[2]
      ),
      ...createDailyTasksSlice(
        set as Parameters<typeof createDailyTasksSlice>[0],
        get as Parameters<typeof createDailyTasksSlice>[1],
        api as Parameters<typeof createDailyTasksSlice>[2]
      ),
      ...createLearningSlice(
        set as Parameters<typeof createLearningSlice>[0],
        get as Parameters<typeof createLearningSlice>[1],
        api as Parameters<typeof createLearningSlice>[2]
      ),
      ...createProgressSlice(
        set as Parameters<typeof createProgressSlice>[0],
        get as Parameters<typeof createProgressSlice>[1],
        api as Parameters<typeof createProgressSlice>[2]
      ),
    }),
    {
      name: 'career-tracker-store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Hydration + onboarding gate. Shallow comparison so the host component
 * only re-renders on real transitions.
 */
export const useHydrationState = () =>
  useAppStore(
    useShallow((s) => ({
      hasHydrated: s._hasHydrated,
      onboardingComplete: s.onboardingComplete,
    }))
  );
