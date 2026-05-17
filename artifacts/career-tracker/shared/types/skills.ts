/**
 * Shared kernel — Skill areas / task categories used across multiple domains
 * (Task Planning, Learning, Progress, Suggestions).
 *
 * Lives in `shared/` so cross-domain references don't create import cycles.
 */

export type TaskCategory =
  | 'LeetCode'
  | 'Projects'
  | 'System Design'
  | 'Applications'
  | 'Learning'
  | 'Networking';

export const TASK_CATEGORIES: TaskCategory[] = [
  'LeetCode',
  'Projects',
  'System Design',
  'Applications',
  'Learning',
  'Networking',
];
