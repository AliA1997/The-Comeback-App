import { todayStr } from '@/shared/lib/dateUtils';
import type { Task } from '@/domains/task-planning/types';
import type { DayRecord } from '../types';

export interface TodayStats {
  completedCount: number;
  totalMinutes: number;
  pendingCount: number;
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
  return {
    completedCount: record?.completedTaskIds.length ?? 0,
    totalMinutes: record?.totalMinutes ?? 0,
    pendingCount: tasks.filter((t) => t.date === today && t.status === 'pending').length,
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
