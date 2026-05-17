/**
 * TimerProvider — Global countdown singleton.
 *
 * Mounts once at the root layout. Owns the single `setInterval` that drives
 * the timer. This is the only setInterval in the app; never spin one up
 * elsewhere or you'll get double-ticks. Completion is delegated to
 * `SessionLifecycle.completeSession()` so all cross-domain side effects
 * (achievements, day stats, inbox push) fire in one place.
 */
import React, { useEffect, useRef } from 'react';
import { useAppStore } from '@/shared/store/root';
import { completeSession } from '@/domains/time-focus/services/SessionLifecycle';
import { NotificationService } from '@/domains/notifications/services/NotificationService';

interface Props {
  children: React.ReactNode;
}

export function TimerProvider({ children }: Props) {
  const isRunning = useAppStore((s) => s.activeTimer?.isRunning ?? false);
  const taskId = useAppStore((s) => s.activeTimer?.taskId ?? null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      const state = useAppStore.getState();
      const timer = state.activeTimer;

      if (!timer || !timer.isRunning) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      if (timer.remainingSeconds <= 1) {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        const task = state.tasks.find((t) => t.id === timer.taskId);
        completeSession();
        if (task) {
          NotificationService.showTimerCompleteAlert(
            task.title,
            () => {},
            () => {}
          );
        }
      } else {
        state.decrementTimer();
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
