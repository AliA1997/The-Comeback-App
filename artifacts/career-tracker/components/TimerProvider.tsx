/**
 * TimerProvider — Global timer singleton
 *
 * Mounts once at the root layout. Owns the single setInterval that drives
 * the countdown. This prevents the double-tick bug that occurs when multiple
 * screens independently call useTimer() and each create their own interval.
 */
import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { NotificationService } from '@/services/NotificationService';

interface Props {
  children: React.ReactNode;
}

export function TimerProvider({ children }: Props) {
  const isRunning = useAppStore((s) => s.activeTimer?.isRunning ?? false);
  const taskId = useAppStore((s) => s.activeTimer?.taskId ?? null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Always clear any existing interval first
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const state = useAppStore.getState();
      const timer = state.activeTimer;

      if (!timer || !timer.isRunning) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        return;
      }

      if (timer.remainingSeconds <= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;

        const task = state.tasks.find((t) => t.id === timer.taskId);
        state.completeTimer();

        if (task) {
          NotificationService.showTimerCompleteAlert(task.title, () => {}, () => {});
        }
      } else {
        state.tickTimer();
      }
    }, 1000);

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, taskId]);

  return <>{children}</>;
}
