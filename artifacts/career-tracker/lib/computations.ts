/**
 * Pure derivation functions over the persisted store data.
 *
 * These are intentionally NOT methods on the Zustand store — keeping them
 * outside lets components memoize the result with `useMemo` and ensures
 * derivations don't accidentally subscribe components to the entire store.
 */
import type { DayRecord, Task } from '@/types';
import { todayStr } from '@/lib/dateUtils';

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

export function computeStreak(dayRecords: Record<string, DayRecord>): number {
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
