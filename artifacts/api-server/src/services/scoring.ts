/**
 * Task scoring (spec § 5.6).
 *
 *   task.score = task_type.score × multiplier(task.priority)
 *
 * The score is computed here and nowhere else: clients never send one, and a
 * `score` in a request body is ignored. It is also a SNAPSHOT — retuning a
 * task type's base score never rewrites existing tasks, because a completed
 * task's score is a historical fact.
 */
import type { PriorityLevel } from "@workspace/api-zod";

/**
 * Only `urgent` alters the score today. Keeping every level in one table
 * means a future reweighting is a one-line edit here rather than a migration.
 */
export const PRIORITY_MULTIPLIERS: Readonly<Record<PriorityLevel, number>> = {
  low: 1,
  medium: 1,
  high: 1,
  urgent: 2,
};

export const DEFAULT_PRIORITY: PriorityLevel = "medium";

export function computeScore(baseScore: number, priority: PriorityLevel): number {
  return Math.round(baseScore * PRIORITY_MULTIPLIERS[priority]);
}
