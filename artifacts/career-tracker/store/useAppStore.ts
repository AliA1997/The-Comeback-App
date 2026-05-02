import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ActiveTimer, DayRecord, Task, TaskCategory, TaskStatus } from '@/types';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface AppState {
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

  // Computed helpers
  getStreak: () => number;
  getTodayStats: () => { completedCount: number; totalMinutes: number; pendingCount: number };
  getWeeklyData: () => { date: string; minutes: number; count: number }[];
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
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
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  status,
                  completedAt: status === 'completed' ? Date.now() : t.completedAt,
                }
              : t
          ),
        })),

      startTimer: (taskId, durationMinutes) => {
        const totalSeconds = durationMinutes * 60;
        set({
          activeTimer: {
            taskId,
            remainingSeconds: totalSeconds,
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

      getStreak: () => {
        const { dayRecords } = get();
        let streak = 0;
        for (let i = 0; i < 365; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const record = dayRecords[dateStr];
          if (record && record.completedTaskIds.length > 0) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }
        return streak;
      },

      getTodayStats: () => {
        const { tasks, dayRecords } = get();
        const today = todayStr();
        const record = dayRecords[today];
        return {
          completedCount: record?.completedTaskIds.length ?? 0,
          totalMinutes: record?.totalMinutes ?? 0,
          pendingCount: tasks.filter((t) => t.date === today && t.status === 'pending').length,
        };
      },

      getWeeklyData: () => {
        const { dayRecords } = get();
        const data: { date: string; minutes: number; count: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const record = dayRecords[dateStr];
          data.push({
            date: dateStr,
            minutes: record?.totalMinutes ?? 0,
            count: record?.completedTaskIds.length ?? 0,
          });
        }
        return data;
      },
    }),
    {
      name: 'career-tracker-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
