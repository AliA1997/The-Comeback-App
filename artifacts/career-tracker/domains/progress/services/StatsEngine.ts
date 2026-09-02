import { todayStr } from '@/shared/lib/dateUtils';
import { taskDate, type Task } from '@/shared/types/task';
import type { DayRecord } from '../types';

export interface TodayStats {
  completedCount: number;
  totalMinutes: number;
  pendingCount: number;
  /** Points banked today — Principle IV, momentum you can read in a glance. */
  earnedScore: number;
}

export interface WeeklyDataPoint {
  date: string;
  minutes: number;
  count: number;
}

export function computeTodayStats(
  tasks: Task[],
  dayRecords: Record<string, DayRecord>
): TodayStats {
  const today = todayStr();
  const record = dayRecords[today];

  const completedIds = new Set(record?.completedTaskIds ?? []);

  return {
    completedCount: completedIds.size,
    totalMinutes: record?.totalMinutes ?? 0,
    pendingCount: tasks.filter((t) => taskDate(t) === today && t.status === 'pending').length,
    earnedScore: tasks.reduce(
      (total, task) => (completedIds.has(task.id) ? total + task.score : total),
      0
    ),
  };
}

export function computeWeeklyData(
  dayRecords: Record<string, DayRecord>
): WeeklyDataPoint[] {
  const data: WeeklyDataPoint[] = [];
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
}

export function computeTotalHours(dayRecords: Record<string, DayRecord>): number {
  return Object.values(dayRecords).reduce((acc, r) => acc + r.totalMinutes, 0) / 60;
}
