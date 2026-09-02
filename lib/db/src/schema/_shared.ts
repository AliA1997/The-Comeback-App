/**
 * Shared schema primitives for the `comebackapp` namespace.
 *
 * Application tables live in a dedicated Postgres schema, separate from
 * Supabase's `auth` schema (spec: refactor-comeback-app.md § 5).
 */
import { pgSchema, uuid } from "drizzle-orm/pg-core";

/** Every application table lives here. */
export const comebackapp = pgSchema("comebackapp");

/**
 * Minimal projection of Supabase's `auth.users` so foreign keys are
 * expressible in Drizzle. Supabase owns this table — we never write to it,
 * and `drizzle-kit push` must not try to create or alter it, so only the
 * referenced column is declared.
 */
const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const priorityLevel = comebackapp.enum("priority_level", [
  "low",
  "medium",
  "high",
  "urgent",
]);

/**
 * Server-side task states. The client-only `skipped` state used by the
 * daily-routine generator is deliberately absent — it is a routine concept,
 * not a task state (spec § 5.1).
 */
export const taskStatus = comebackapp.enum("task_status", [
  "pending",
  "in_progress",
  "paused",
  "completed",
  "deleted",
]);

