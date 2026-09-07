/**
 * `comebackapp.user_profiles` — one row per authenticated user (spec § 5.2).
 *
 * The row is created by an AFTER INSERT trigger on `auth.users`; the API
 * upserts on the first authenticated request so a missed trigger never
 * blocks sign-in.
 */
import { sql } from "drizzle-orm";
import { integer, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { authUsers, comebackapp } from "./_shared";

export interface UserPreferences {
  notificationsEnabled: boolean;
  nudgesEnabled: boolean;
  adsEnabled: boolean;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notificationsEnabled: true,
  nudgesEnabled: true,
  adsEnabled: true,
};

export const userProfilesTable = comebackapp.table("user_profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  /**
   * Mirrored from the `email` claim on the access token at first sign-in and
   * refreshed whenever it changes. `auth.users` is the source of truth; this
   * copy exists so the API can serve a profile without reaching into
   * Supabase auth schema on every read.
   */
  email: text("email"),
  displayName: text("display_name"),
  careerTrack: text("career_track"),
  seniority: text("seniority"),
  targetRole: text("target_role"),
  dailyMinutesTarget: integer("daily_minutes_target").notNull().default(90),
  weeklyTasksTarget: integer("weekly_tasks_target").notNull().default(12),
  preferences: jsonb("preferences")
    .$type<UserPreferences>()
    .notNull()
    .default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserProfileRow = typeof userProfilesTable.$inferSelect;
