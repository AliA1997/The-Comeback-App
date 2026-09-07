/**
 * Boot-time database checks.
 *
 * `user_profiles.id`, `lists.user_id` and `tasks.user_id` all foreign-key to
 * `auth.users(id)`, which exists only inside a Supabase project's own
 * Postgres. Point `DATABASE_URL` at any other database — a platform-
 * provisioned one attached by default, say — and the API starts perfectly,
 * answers reads with empty arrays, and rejects every single write. Nothing in
 * the logs says why.
 *
 * This turns that into one loud line at startup, named for the variable that
 * actually needs changing.
 *
 * Spec: backend-write-failures-and-ui-placement.md § 3 C1, § 7.
 */
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

export interface PreflightResult {
  ok: boolean;
  /** Populated when a check fails, for `/api/healthz` to report. */
  problem?: string;
}

/**
 * Verifies the connected database is the Supabase project's own.
 *
 * Deliberately does NOT exit the process. The platform health check needs
 * `/api/healthz` to answer, and a crash-looping container is harder to
 * diagnose than a running one that says exactly what is wrong. Every user
 * route will still fail — this makes the reason discoverable.
 */
export async function checkDatabaseTarget(): Promise<PreflightResult> {
  try {
    const result = await db.execute(
      sql`SELECT to_regclass('auth.users') AS auth_users`,
    );

    const row = (result.rows ?? result)[0] as
      | { auth_users?: string | null }
      | undefined;

    if (!row?.auth_users) {
      const problem =
        "DATABASE_URL does not point at the Supabase project's Postgres: " +
        "auth.users does not exist. Every write to lists, tasks and " +
        "user_profiles will fail its foreign key until this is repointed, " +
        "after which `push` and `seed` must both be re-run.";

      logger.error({ check: "auth.users" }, problem);
      return { ok: false, problem };
    }

    logger.info({ check: "auth.users" }, "Database target verified");
    return { ok: true };
  } catch (err) {
    const problem =
      "Could not verify the database target. The API cannot reach " +
      "DATABASE_URL, or the connecting role cannot see the auth schema.";

    logger.error({ err, check: "auth.users" }, problem);
    return { ok: false, problem };
  }
}
