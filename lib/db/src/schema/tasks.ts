/**
 * `comebackapp.tasks` — the scored, list-scoped unit of work (spec § 5.5).
 *
 * `score` is a server-computed snapshot (§ 5.6) and `status` is driven by
 * the lifecycle endpoints (§ 6), never by a raw column write from a client.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  date,
  index,
  integer,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers, comebackapp, priorityLevel, taskStatus } from "./_shared";
import { listsTable } from "./lists";
import { taskTypesTable } from "./task-types";

export const tasksTable = comebackapp.table(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    listId: uuid("list_id")
      .notNull()
      .references(() => listsTable.id, { onDelete: "cascade" }),
    taskTypeId: uuid("task_type_id")
      .notNull()
      .references(() => taskTypesTable.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    priority: priorityLevel("priority").notNull().default("medium"),
    /** Snapshot of `task_type.score × priority multiplier` at write time. */
    score: integer("score").notNull(),
    status: taskStatus("status").notNull().default("pending"),
    estimatedDurationMinutes: integer("estimated_duration_minutes").notNull().default(25),
    actualDurationMinutes: integer("actual_duration_minutes"),
    savedRemainingSeconds: integer("saved_remaining_seconds"),
    totalPausedMs: bigint("total_paused_ms", { mode: "number" }).notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    pausedAt: timestamp("paused_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    dueDate: date("due_date"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_user_id_status_idx").on(table.userId, table.status),
    index("tasks_list_id_position_idx").on(table.listId, table.position),
    // Partial index for the default task feed, which always excludes deletes.
    index("tasks_user_id_active_idx")
      .on(table.userId)
      .where(sql`${table.status} <> 'deleted'`),
  ],
);

export type TaskRow = typeof tasksTable.$inferSelect;
