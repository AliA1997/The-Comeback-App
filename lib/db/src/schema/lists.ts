/**
 * `comebackapp.lists` — a first-class container for tasks (spec § 5.3).
 *
 * List names are unique per user among ACTIVE lists, enforced by a partial
 * unique index on `lower(name)`. Archiving frees the name for reuse.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { authUsers, comebackapp } from "./_shared";

export const listsTable = comebackapp.table(
  "lists",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => authUsers.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    isArchived: boolean("is_archived").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("lists_user_id_lower_name_active_idx")
      .on(table.userId, sql`lower(${table.name})`)
      .where(sql`${table.isArchived} = false`),
  ],
);

export type ListRow = typeof listsTable.$inferSelect;
