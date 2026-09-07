/**
 * Applies the non-table DDL (RLS policies, the auth.users trigger) and seeds
 * the system task types. Idempotent — run after every `drizzle-kit push`.
 *
 *   pnpm --filter @workspace/db run seed
 *
 * `DATABASE_URL` must point at the Supabase project's own Postgres: the schema
 * foreign-keys to `auth.users`, which exists nowhere else.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import { SYSTEM_TASK_TYPES, taskTypesTable } from "./schema";

const here = path.dirname(fileURLToPath(import.meta.url));

async function execFile(name: string): Promise<void> {
  const ddl = await readFile(path.join(here, name), "utf8");
  await db.execute(sql.raw(ddl));
}

/**
 * The trigger is applied on its own and is allowed to fail.
 *
 * It touches Supabase's `auth` schema, which the project's Postgres role may
 * not own. A batch failure here would otherwise take the RLS policies down
 * with it — and the trigger is the one piece that is genuinely optional,
 * because the API upserts the profile on the first authenticated request
 * (spec § 5.2).
 */
async function applyAuthTrigger(): Promise<boolean> {
  try {
    await execFile("auth-trigger.sql");
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `! Could not install the auth.users trigger: ${message}\n` +
        "  This is not fatal — the API creates the profile row on the first\n" +
        "  authenticated request instead. Sign-in is unaffected.",
    );
    return false;
  }
}

async function seedTaskTypes(): Promise<void> {
  await db
    .insert(taskTypesTable)
    .values(SYSTEM_TASK_TYPES.map((t) => ({ ...t, isSystem: true })))
    .onConflictDoUpdate({
      target: taskTypesTable.type,
      // Scores are tunable seed data — re-running picks up new weights.
      // Existing tasks keep their snapshotted score (spec § 5.6.2).
      set: {
        label: sql`excluded.label`,
        score: sql`excluded.score`,
      },
    });
}

async function main(): Promise<void> {
  await execFile("policies.sql");
  console.log("✓ Row Level Security policies applied");

  const triggerInstalled = await applyAuthTrigger();
  if (triggerInstalled) console.log("✓ auth.users → user_profiles trigger installed");

  await seedTaskTypes();
  console.log(`✓ ${SYSTEM_TASK_TYPES.length} task types seeded`);

  console.log("\nDone. The app can now create lists and tasks.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
