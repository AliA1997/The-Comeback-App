/**
 * Static lesson catalog. Lives in source (not the store) so the bundle
 * always ships with content and we never need to invalidate / sync from
 * a backend. User-specific progress is persisted in the slice.
 */
import type { Lesson, LearningModule } from '../types';

export const LESSONS: Lesson[] = [
  {
    id: 'algo-bigo',
    title: 'Big-O in 10 minutes',
    summary: 'The complexity classes recruiters expect you to know cold.',
    estimatedMinutes: 10,
    category: 'LeetCode',
    body: `Time complexity describes how an algorithm's runtime scales with input size.

The classes you must know:
• O(1) — constant. Hash lookup, array index.
• O(log n) — binary search, balanced tree ops.
• O(n) — single pass.
• O(n log n) — efficient sorts.
• O(n^2) — nested loops over the same input.
• O(2^n) — naive recursion (Fibonacci, subsets).

Practice spotting these by walking through nested loops and recursive calls.`,
    quiz: {
      id: 'q-algo-bigo',
      questions: [
        {
          id: 'q1',
          prompt: 'Binary search over a sorted array is:',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
          correctIndex: 1,
          explanation: 'Each step halves the search space.',
        },
        {
          id: 'q2',
          prompt: 'Iterating a hash map is:',
          options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
          correctIndex: 2,
          explanation: 'You touch every key once.',
        },
      ],
    },
  },
  {
    id: 'algo-twosum',
    title: 'Two Sum — the right way',
    summary: 'The interview answer interviewers actually want.',
    estimatedMinutes: 15,
    category: 'LeetCode',
    body: `Brute force is O(n^2) — nested loop. Don't ship that.

Use a hash map for O(n):
1. For each element x at index i, check if target - x is already in the map.
2. If yes, return [map[target - x], i].
3. Otherwise, store x -> i.

This is THE archetype for "complement" problems — Two Sum, 3Sum (with a pointer twist), pair-with-difference, etc.`,
  },
  {
    id: 'sd-load-balancer',
    title: 'Load balancers, explained',
    summary: 'L4 vs L7, round-robin vs least-connections, sticky sessions.',
    estimatedMinutes: 12,
    category: 'System Design',
    body: `A load balancer sits between clients and servers, distributing requests.

Key concepts:
• L4 (transport): forwards TCP/UDP — fast, dumb. ELB Classic, HAProxy in TCP mode.
• L7 (application): inspects HTTP headers — can route by path/host. ALB, Nginx, Envoy.
• Round-robin: simple, ignores load.
• Least-connections: better under uneven request weights.
• Sticky sessions: pin a user to a backend (cookie-based) — needed when state is in memory; avoid if possible.

In interviews always mention health checks and zone failover.`,
    quiz: {
      id: 'q-sd-lb',
      questions: [
        {
          id: 'q1',
          prompt: 'Which layer can route by URL path?',
          options: ['L4', 'L7', 'Both', 'Neither'],
          correctIndex: 1,
          explanation: 'L7 inspects HTTP. L4 only sees TCP/UDP.',
        },
      ],
    },
  },
  {
    id: 'sd-caching',
    title: 'Caching strategies that actually scale',
    summary: 'Cache-aside, write-through, write-behind, TTL pitfalls.',
    estimatedMinutes: 14,
    category: 'System Design',
    body: `The four patterns:
• Cache-aside (lazy): app checks cache, falls back to DB, populates cache. Most common.
• Read-through: cache wraps the DB.
• Write-through: writes go to cache AND DB synchronously.
• Write-behind: writes go to cache; DB is updated async — fast but risk of loss.

Always pair caching with a TTL and a stampede mitigation (request coalescing, jitter).`,
  },
  {
    id: 'proj-portfolio',
    title: 'Portfolio projects that get callbacks',
    summary: 'What recruiters skim for in 8 seconds.',
    estimatedMinutes: 8,
    category: 'Projects',
    body: `Recruiters skim. Optimize for the 8-second scan.

What works:
• A live URL above the fold. README-only projects get ignored.
• One paragraph explaining what problem it solves.
• Tech stack listed in plain English.
• A 30-second screen-recorded GIF.

What doesn't:
• Tutorial-copy projects (todo apps, weather apps) with no twist.
• Half-finished "in progress" READMEs.
• Generator/scaffolding output with no real changes.

Two strong projects beat ten weak ones.`,
  },
  {
    id: 'app-cover-letter',
    title: 'The 4-line cover letter',
    summary: 'No, you do not need three paragraphs.',
    estimatedMinutes: 6,
    category: 'Applications',
    body: `Hiring managers spend ~20 seconds. Give them four lines:

1. One sentence: who you are + relevant experience.
2. One sentence: why THIS company (specific — a product, a value, a recent post).
3. One sentence: the closest match between their JD and your work.
4. One sentence: clear ask + thanks.

Skip the formal openers. Skip the "I'm passionate about". Show, don't claim.`,
  },
  {
    id: 'net-cold-reach',
    title: 'Cold outreach that gets replies',
    summary: 'A template, why it works, and the trap to avoid.',
    estimatedMinutes: 9,
    category: 'Networking',
    body: `Cold outreach works when you:
• Reference something specific to them (a talk, an article, a launch).
• Make ONE small ask (15 min chat, one question, a referral).
• Make it easy to say no.

Bad: "Can you tell me everything about your team and the hiring process?"
Good: "I've been studying your migration to event-sourcing — would you have 15 min next week to compare notes? Happy to send my questions ahead."

Reply rates double when the subject line includes something only that person would recognize.`,
  },
  {
    id: 'learn-spaced',
    title: 'Spaced repetition for engineers',
    summary: 'Why your LeetCode practice keeps "leaking".',
    estimatedMinutes: 11,
    category: 'Learning',
    body: `You forget what you don't revisit. The forgetting curve is exponential.

The fix: spaced repetition. Revisit at intervals of 1 day, 3 days, 1 week, 2 weeks, 1 month.

Apply it to:
• LeetCode patterns (not problems — patterns).
• System design tradeoffs.
• Language gotchas.

A small index of 30 patterns reviewed on a schedule beats a "completed" list of 300 problems you can't remember.`,
  },
];

export const MODULES: LearningModule[] = [
  {
    id: 'm-algo',
    title: 'Algorithm Foundations',
    description: 'The complexity vocabulary and patterns that show up every interview.',
    category: 'LeetCode',
    lessonIds: ['algo-bigo', 'algo-twosum'],
  },
  {
    id: 'm-sd',
    title: 'System Design Essentials',
    description: 'The building blocks of distributed systems interviews.',
    category: 'System Design',
    lessonIds: ['sd-load-balancer', 'sd-caching'],
  },
  {
    id: 'm-job',
    title: 'Job Search Mechanics',
    description: 'Portfolio, applications, and outreach that actually convert.',
    category: 'Applications',
    lessonIds: ['proj-portfolio', 'app-cover-letter', 'net-cold-reach'],
  },
  {
    id: 'm-meta',
    title: 'Learning to Learn',
    description: 'Get more retention from every hour you study.',
    category: 'Learning',
    lessonIds: ['learn-spaced'],
  },
];

export function findLesson(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

export function findModuleForLesson(lessonId: string): LearningModule | undefined {
  return MODULES.find((m) => m.lessonIds.includes(lessonId));
}
