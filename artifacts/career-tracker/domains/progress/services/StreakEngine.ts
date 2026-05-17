import type { DayRecord } from '../types';

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
