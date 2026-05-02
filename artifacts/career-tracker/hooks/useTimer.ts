import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { NotificationService } from '@/services/NotificationService';

export function useTimer() {
  const activeTimer = useAppStore((s) => s.activeTimer);
  const tickTimer = useAppStore((s) => s.tickTimer);
  const completeTimer = useAppStore((s) => s.completeTimer);
  const tasks = useAppStore((s) => s.tasks);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeTimer?.isRunning) {
      intervalRef.current = setInterval(() => {
        const { activeTimer: current, completeTimer: doComplete } = useAppStore.getState();
        if (!current || !current.isRunning) {
          clearInterval(intervalRef.current!);
          return;
        }
        if (current.remainingSeconds <= 1) {
          clearInterval(intervalRef.current!);
          const task = useAppStore.getState().tasks.find((t) => t.id === current.taskId);
          doComplete();
          if (task) {
            NotificationService.showTimerCompleteAlert(
              task.title,
              () => {},
              () => {}
            );
          }
        } else {
          tickTimer();
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer?.isRunning, activeTimer?.taskId]);

  const task = tasks.find((t) => t.id === activeTimer?.taskId) ?? null;

  return { activeTimer, task };
}
