import { useAppStore } from '@/shared/store/root';
import type { Task } from './types';

export const useTasks = () => useAppStore((s) => s.tasks);

/**
 * Resolves the currently-active task by joining `activeTimer.taskId` (Time
 * & Focus domain) with the task list (Task Planning domain). Zustand's
 * immutable updates ensure the returned reference is stable across renders
 * unless that specific task or the active id changes — so this does NOT
 * re-render on per-second timer ticks.
 */
export function useActiveTask(): Task | null {
  return useAppStore((s) => {
    const id = s.activeTimer?.taskId;
    if (!id) return null;
    return s.tasks.find((t) => t.id === id) ?? null;
  });
}
