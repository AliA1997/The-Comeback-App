import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ActiveTimer, DayRecord, Task, TaskStatus } from '@/types';
import { todayStr } from '@/lib/dateUtils';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface AppState {
  // Hydration flag — true once AsyncStorage has been read on startup
  _hasHydrated: boolean;
  setHasHydrated: (v: boolean) => void;

  // Onboarding
  hasSeenLanding: boolean;
  setHasSeenLanding: () => void;

  tasks: Task[];
  dayRecords: Record<string, DayRecord>;
  activeTimer: ActiveTimer | null;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status' | 'date'>) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;

  // Timer actions
  startTimer: (taskId: string, durationMinutes: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  tickTimer: () => void;
  completeTimer: () => void;

  // History
  recordTaskCompletion: (taskId: string, actualMinutes: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),

      hasSeenLanding: false,
      setHasSeenLanding: () => set({ hasSeenLanding: true }),

      tasks: [],
      dayRecords: {},
      activeTimer: null,

      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...task,
              id: generateId(),
              status: 'pending',
              createdAt: Date.now(),
              date: todayStr(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          activeTimer: state.activeTimer?.taskId === id ? null : state.activeTimer,
        })),

      setTaskStatus: (id, status) =>
        set((state) => {
          const today = todayStr();
          const existing = state.dayRecords[today] ?? {
            date: today,
            totalMinutes: 0,
            completedTaskIds: [],
            skippedTaskIds: [],
          };
          const newDayRecords =
            status === 'skipped'
              ? {
                  ...state.dayRecords,
                  [today]: {
                    ...existing,
                    skippedTaskIds: existing.skippedTaskIds.includes(id)
                      ? existing.skippedTaskIds
                      : [...existing.skippedTaskIds, id],
                  },
                }
              : state.dayRecords;
          return {
            tasks: state.tasks.map((t) =>
              t.id === id
                ? { ...t, status, completedAt: status === 'completed' ? Date.now() : t.completedAt }
                : t
            ),
            dayRecords: newDayRecords,
          };
        }),

      startTimer: (taskId, durationMinutes) => {
        const totalSeconds = durationMinutes * 60;
        // Resume from saved progress if available
        const savedRemaining = get().tasks.find((t) => t.id === taskId)?.savedRemainingSeconds;
        const remainingSeconds =
          savedRemaining !== undefined && savedRemaining > 0 ? savedRemaining : totalSeconds;
        set({
          activeTimer: {
            taskId,
            remainingSeconds,
            totalSeconds,
            isRunning: true,
            isPaused: false,
            startedAt: Date.now(),
            pausedAt: null,
            totalPausedMs: 0,
          },
        });
        get().setTaskStatus(taskId, 'in_progress');
      },

      pauseTimer: () =>
        set((state) => {
          if (!state.activeTimer?.isRunning) return state;
          return {
            activeTimer: {
              ...state.activeTimer,
              isRunning: false,
              isPaused: true,
              pausedAt: Date.now(),
            },
          };
        }),

      resumeTimer: () =>
        set((state) => {
          if (!state.activeTimer?.isPaused) return state;
          const pausedDuration = state.activeTimer.pausedAt
            ? Date.now() - state.activeTimer.pausedAt
            : 0;
          return {
            activeTimer: {
              ...state.activeTimer,
              isRunning: true,
              isPaused: false,
              pausedAt: null,
              totalPausedMs: state.activeTimer.totalPausedMs + pausedDuration,
            },
          };
        }),

      stopTimer: () => {
        const { activeTimer, setTaskStatus } = get();
        if (activeTimer) {
          // Persist remaining seconds on the task so it can resume later
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === activeTimer.taskId
                ? { ...t, savedRemainingSeconds: activeTimer.remainingSeconds }
                : t
            ),
          }));
          setTaskStatus(activeTimer.taskId, 'pending');
        }
        set({ activeTimer: null });
      },

      tickTimer: () =>
        set((state) => {
          if (!state.activeTimer?.isRunning) return state;
          return {
            activeTimer: {
              ...state.activeTimer,
              remainingSeconds: Math.max(0, state.activeTimer.remainingSeconds - 1),
            },
          };
        }),

      completeTimer: () => {
        const { activeTimer, setTaskStatus, recordTaskCompletion } = get();
        if (!activeTimer) return;
        const elapsed = activeTimer.totalSeconds - activeTimer.remainingSeconds;
        const actualMinutes = Math.max(1, Math.round(elapsed / 60));
        // Clear saved progress — task is done
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === activeTimer.taskId
              ? { ...t, savedRemainingSeconds: undefined }
              : t
          ),
        }));
        setTaskStatus(activeTimer.taskId, 'completed');
        recordTaskCompletion(activeTimer.taskId, actualMinutes);
        set({ activeTimer: null });
      },

      recordTaskCompletion: (taskId, actualMinutes) => {
        const today = todayStr();
        set((state) => {
          const existing = state.dayRecords[today] ?? {
            date: today,
            totalMinutes: 0,
            completedTaskIds: [],
            skippedTaskIds: [],
          };
          return {
            dayRecords: {
              ...state.dayRecords,
              [today]: {
                ...existing,
                totalMinutes: existing.totalMinutes + actualMinutes,
                completedTaskIds: existing.completedTaskIds.includes(taskId)
                  ? existing.completedTaskIds
                  : [...existing.completedTaskIds, taskId],
              },
            },
            tasks: state.tasks.map((t) =>
              t.id === taskId ? { ...t, actualDuration: actualMinutes } : t
            ),
          };
        });
      },

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
