import type { DayRecord, Suggestion, Task, TaskCategory } from '@/types';

function getLast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

function getLast3Days(): string[] {
  return getLast7Days().slice(0, 3);
}

function getCompletedInDates(tasks: Task[], category: TaskCategory, dates: string[]): Task[] {
  return tasks.filter(
    (t) => t.category === category && t.status === 'completed' && dates.includes(t.date)
  );
}

export function generateSuggestions(
  tasks: Task[],
  dayRecords: Record<string, DayRecord>
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const last7 = getLast7Days();
  const last3 = getLast3Days();

  const completedThisWeek = tasks.filter(
    (t) => t.status === 'completed' && last7.includes(t.date)
  );

  // Rule 1 — No algorithm practice in 3 days
  const recentAlgo = getCompletedInDates(tasks, 'LeetCode', last3);
  if (recentAlgo.length === 0) {
    suggestions.push({
      id: 'r1',
      message: "No algorithm practice in 3 days",
      detail: "Consistent LeetCode practice is what keeps your problem-solving instincts sharp. Even 1 problem a day compounds into interview readiness.",
      type: 'warning',
      category: 'LeetCode',
    });
  }

  // Rule 2 — Too much learning, not enough building
  const learningCount = getCompletedInDates(tasks, 'Learning', last7).length;
  const projectCount = getCompletedInDates(tasks, 'Projects', last7).length;
  if (learningCount >= 3 && learningCount > projectCount * 2) {
    suggestions.push({
      id: 'r2',
      message: "Too many tutorials, not enough building",
      detail: "You've completed many learning tasks but few projects. Recruiters want to see what you build, not just what you've watched.",
      type: 'warning',
      category: 'Projects',
    });
  }

  // Rule 3 — No applications sent this week
  const appsThisWeek = getCompletedInDates(tasks, 'Applications', last7);
  if (appsThisWeek.length === 0) {
    suggestions.push({
      id: 'r3',
      message: "No applications sent this week",
      detail: "Consistent outreach is the multiplier. Even 2-3 applications per week significantly increases your chances of landing interviews.",
      type: 'recommendation',
      category: 'Applications',
    });
  }

  // Rule 4 — System design neglect
  const systemDesign = getCompletedInDates(tasks, 'System Design', last7);
  if (completedThisWeek.length >= 5 && systemDesign.length === 0) {
    suggestions.push({
      id: 'r4',
      message: "You've been active but skipping system design",
      detail: "Senior roles almost always include system design rounds. Allocate at least one session per week to architecture fundamentals.",
      type: 'insight',
      category: 'System Design',
    });
  }

  // Rule 5 — Networking gap
  const networking = getCompletedInDates(tasks, 'Networking', last7);
  if (networking.length === 0 && last7.length === 7) {
    suggestions.push({
      id: 'r5',
      message: "No networking activity this week",
      detail: "Up to 70% of jobs are filled through connections. A short LinkedIn outreach or coffee chat can unlock doors that applications cannot.",
      type: 'recommendation',
      category: 'Networking',
    });
  }

  // Rule 6 — Great streak, positive reinforcement
  const activeDays = last7.filter((d) => {
    const record = dayRecords[d];
    return record && record.completedTaskIds.length > 0;
  }).length;

  if (activeDays >= 5) {
    suggestions.push({
      id: 'r6',
      message: `${activeDays} active days this week — strong momentum`,
      detail: "Consistency is the hardest part of a job search. You're doing it. Keep showing up and the results will follow.",
      type: 'insight',
    });
  }

  return suggestions;
}

export function getNextBestTask(tasks: Task[], dayRecords: Record<string, DayRecord>): Task | null {
  const pending = tasks.filter((t) => t.status === 'pending');
  if (pending.length === 0) return null;

  const last3 = getLast3Days();

  // Priority scoring
  const scored = pending.map((task) => {
    let score = 0;

    // Boost neglected categories
    const recentInCategory = getCompletedInDates(tasks, task.category, last3);
    if (recentInCategory.length === 0) score += 30;

    // Boost shorter tasks (quick wins)
    if (task.estimatedDuration <= 30) score += 15;
    if (task.estimatedDuration <= 60) score += 5;

    // Boost high-impact categories
    if (task.category === 'Applications') score += 20;
    if (task.category === 'LeetCode') score += 15;
    if (task.category === 'Projects') score += 10;

    // Boost older tasks
    const ageHours = (Date.now() - task.createdAt) / (1000 * 60 * 60);
    score += Math.min(ageHours, 48);

    return { task, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.task ?? null;
}
