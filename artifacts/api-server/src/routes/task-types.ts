/**
 * `/api/task-types` — the scoring catalogue (spec § 5.4).
 *
 * Read-only over HTTP: scores are seed data managed by `pnpm --filter
 * @workspace/db run seed`, and system types cannot be deleted at all
 * (spec § 12.2).
 */
import { Router, type IRouter } from "express";
import { asc } from "drizzle-orm";
import { db, taskTypesTable } from "@workspace/db";
import { toTaskType } from "../lib/serializers";

const router: IRouter = Router();

router.get("/task-types", async (_req, res) => {
  const rows = await db
    .select()
    .from(taskTypesTable)
    .orderBy(asc(taskTypesTable.score), asc(taskTypesTable.label));

  res.json(rows.map(toTaskType));
});

export default router;
