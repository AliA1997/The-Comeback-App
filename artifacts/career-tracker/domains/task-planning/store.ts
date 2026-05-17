/**
 * Task Planning slice — todos, checklists, deadlines, recurring rules.
 */
import type { StateCreator } from 'zustand';
import { todayStr } from '@/shared/lib/dateUtils';
import type { NewTaskInput, Task, TaskStatus } from './types';

function genId(): string {
  return `t_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface TaskPlanningSlice {
  tasks: Task[];

  addTask: (input: NewTaskInput) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id'>>) => void;
  deleteTask: (id: string) => void;
  setTaskStatus: (id: string, status: TaskStatus) => void;
  setSavedRemainingSeconds: (id: string, seconds: number | undefined) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
}

export const createTaskPlanningSlice: StateCreator<
  TaskPlanningSlice,
  [],
  [],
  TaskPlanningSlice
> = (set) => ({
  tasks: [],

  addTask: (input) => {
    const task: Task = {
      ...input,
      id: genId(),
      status: 'pending',
      createdAt: Date.now(),
      date: todayStr(),
    };
    set((s) => ({ tasks: [...s.tasks, task] }));
    return task;
  },

  updateTask: (id, updates) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    })),

  deleteTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  setTaskStatus: (id, status) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status,
              completedAt: status === 'completed' ? Date.now() : t.completedAt,
            }
          : t
      ),
    })),

  setSavedRemainingSeconds: (id, seconds) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === id ? { ...t, savedRemainingSeconds: seconds } : t
      ),
    })),

  toggleChecklistItem: (taskId, itemId) =>
    set((s) => ({
      tasks: s.tasks.map((t) => {
        if (t.id !== taskId || !t.checklist) return t;
        return {
          ...t,
          checklist: t.checklist.map((c) =>
            c.id === itemId ? { ...c, done: !c.done } : c
          ),
        };
      }),
    })),
});
