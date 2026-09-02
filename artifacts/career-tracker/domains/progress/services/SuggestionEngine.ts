import { getLastNDays } from '@/shared/lib/dateUtils';
import type { TaskCategory } from '@/shared/types/skills';
import { taskCategory, taskDate, type Task } from '@/shared/types/task';
import type { DayRecord, Suggestion } from '../types';

function getCompletedInDates(tasks: Task[], category: TaskCategory, dates: string[]): Task[] {
  return tasks.filter(
    (t) =>
      taskCategory(t) === category &&
      t.status === 'completed' &&
      dates.includes(taskDate(t))
  );
}

export function generateSuggestions(
  tasks: Task[],
  dayRecords: Record<string, DayRecord>
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const last7 = getLastNDays(7);
  const last3 = getLastNDays(3);

  const completedThisWeek = tasks.filter(
    (t) => t.status === 'completed' && last7.includes(taskDate(t))
  );

  const recentAlgo = getCompletedInDates(tasks, 'LeetCode', last3);
  if (recentAlgo.length === 0) {
    suggestions.push({
      id: 'r1',
      message: 'No algorithm practice in 3 days',
      detail:
        'Consistent LeetCode practice is what keeps your problem-solving instincts sharp. Even 1 problem a day compounds into interview readiness.',
      type: 'warning',
      category: 'LeetCode',
    });
  }

  const learningCount = getCompletedInDates(tasks, 'Learning', last7).length;
  const projectCount = getCompletedInDates(tasks, 'Projects', last7).length;
  if (learningCount >= 3 && learningCount > projectCount * 2) {
    suggestions.push({
      id: 'r2',
      message: 'Too many tutorials, not enough building',
      detail:
        "You've completed many learning tasks but few projects. Recruiters want to see what you build, not just what you've watched.",
      type: 'warning',
      category: 'Projects',
    });
  }

  const appsThisWeek = getCompletedInDates(tasks, 'Applications', last7);
  if (appsThisWeek.length === 0) {
    suggestions.push({
      id: 'r3',
      message: 'No applications sent this week',
      detail:
        'Consistent outreach is the multiplier. Even 2-3 applications per week significantly increases your chances of landing interviews.',
      type: 'recommendation',
      category: 'Applications',
    });
  }

  const systemDesign = getCompletedInDates(tasks, 'System Design', last7);
  if (completedThisWeek.length >= 5 && systemDesign.length === 0) {
    suggestions.push({
      id: 'r4',
      message: "You've been active but skipping system design",
      detail:
        'Senior roles almost always include system design rounds. Allocate at least one session per week to architecture fundamentals.',
      type: 'insight',
      category: 'System Design',
    });
  }

  const networking = getCompletedInDates(tasks, 'Networking', last7);
  if (networking.length === 0 && last7.length === 7) {
    suggestions.push({
      id: 'r5',
      message: 'No networking activity this week',
      detail:
        'Up to 70% of jobs are filled through connections. A short LinkedIn outreach or coffee chat can unlock doors that applications cannot.',
      type: 'recommendation',
      category: 'Networking',
    });
  }

  const activeDays = last7.filter((d) => {
    const record = dayRecords[d];
    return record && record.completedTaskIds.length > 0;
  }).length;

  if (activeDays >= 5) {
    suggestions.push({
      id: 'r6',
      message: `${activeDays} active days this week — strong momentum`,
      detail:
        "Consistency is the hardest part of a job search. You're doing it. Keep showing up and the results will follow.",
      type: 'insight',
    });
  }

  return suggestions;
}

export function getNextBestTask(
  tasks: Task[],
  _dayRecords: Record<string, DayRecord>
): Task | null {
  const pending = tasks.filter((t) => t.status === 'pending');
  if (pending.length === 0) return null;

  const last3 = getLastNDays(3);

  const scored = pending.map((task) => {
    const category = taskCategory(task);
    let score = 0;
    const recentInCategory = getCompletedInDates(tasks, category, last3);
    if (recentInCategory.length === 0) score += 30;
    if (task.estimatedDurationMinutes <= 30) score += 15;
    if (task.estimatedDurationMinutes <= 60) score += 5;
    if (category === 'Applications') score += 20;
    if (category === 'LeetCode') score += 15;
    if (category === 'Projects') score += 10;
    // Urgent work should not sit behind a stale low-priority task.
    if (task.priority === 'urgent') score += 25;
    if (task.priority === 'high') score += 10;
    const ageHours = (Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60);
    score += Math.min(ageHours, 48);
    return { task, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.task ?? null;
}
