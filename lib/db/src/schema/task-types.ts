/**
 * `comebackapp.task_types` — the scoring catalogue (spec § 5.4).
 *
 * Base scores are SEED DATA, not constants in code, so they can be retuned
 * without a deploy. `tasks.score` snapshots the value at write time, so
 * retuning never rewrites history (spec § 5.6.2).
 */
import { sql } from "drizzle-orm";
import { boolean, check, integer, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { comebackapp } from "./_shared";

export const taskTypesTable = comebackapp.table(
  "task_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stable slug, e.g. `system_design`. */
    type: text("type").notNull().unique(),
    label: text("label").notNull(),
    score: integer("score").notNull(),
    isSystem: boolean("is_system").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("task_types_score_positive", sql`${table.score} > 0`)],
);

export type TaskTypeRow = typeof taskTypesTable.$inferSelect;

/**
 * The six system task types, seeded from the categories the app already
 * ships (spec § 5.4). Scores are weighted by typical effort.
 *
 * `label` matches the client-side `TaskCategory` union verbatim so the two
 * vocabularies join without a lookup table.
 */
export const SYSTEM_TASK_TYPES: ReadonlyArray<{
  type: string;
  label: string;
  score: number;
}> = [
  { type: "applications", label: "Applications", score: 5 },
  { type: "networking", label: "Networking", score: 5 },
  { type: "learning", label: "Learning", score: 8 },
  { type: "leetcode", label: "LeetCode", score: 10 },
  { type: "system_design", label: "System Design", score: 15 },
  { type: "projects", label: "Projects", score: 20 },
];
