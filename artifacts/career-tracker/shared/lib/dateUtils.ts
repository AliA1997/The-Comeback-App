export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/** YYYY-MM-DD in the device's local calendar (not UTC like `todayStr`). */
export function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Today's local-calendar date. The daily-task-list spec defines day
 * rollover at midnight LOCAL time, so the daily-tasks domain uses this
 * instead of the UTC-based `todayStr`.
 */
export function localTodayStr(): string {
  return localDateStr(new Date());
}

export function getLastNDays(n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
