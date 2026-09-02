/**
 * Applies the non-table DDL (RLS policies, the auth.users trigger) and seeds
 * the system task types. Idempotent — run after every `drizzle-kit push`.
 *
 *   pnpm --filter @workspace/db run seed
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import { SYSTEM_TASK_TYPES, taskTypesTable } from "./schema";

const here = path.dirname(fileURLToPath(import.meta.url));

async function applyPolicies(): Promise<void> {
  const ddl = await readFile(path.join(here, "policies.sql"), "utf8");
  await db.execute(sql.raw(ddl));
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
  await applyPolicies();
  await seedTaskTypes();
  console.log(`Seeded ${SYSTEM_TASK_TYPES.length} task types and applied policies.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
