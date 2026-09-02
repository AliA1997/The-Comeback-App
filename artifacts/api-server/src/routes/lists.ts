/**
 * `/api/lists` — CRUD for the container that holds tasks (spec § 7.2).
 *
 * Every query is scoped to `req.userId`; there is no cross-user read path
 * (Principle VI). A list belonging to another user is a 404, not a 403 — we
 * do not confirm that someone else's list exists.
 */
import { Router, type IRouter } from "express";
import { and, asc, count, eq, ne } from "drizzle-orm";
import { CreateListBody, UpdateListBody } from "@workspace/api-zod";
import { db, listsTable, tasksTable } from "@workspace/db";
import { userIdOf } from "../lib/auth";
import { duplicateListName, isUniqueViolation, notFound } from "../lib/errors";
import { toList } from "../lib/serializers";
import { parseOrThrow } from "../lib/validate";

const router: IRouter = Router();

/** Non-deleted task counts, keyed by list id, for one user. */
async function taskCountsFor(userId: string): Promise<Map<string, number>> {
  const rows = await db
    .select({ listId: tasksTable.listId, taskCount: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.userId, userId), ne(tasksTable.status, "deleted")))
    .groupBy(tasksTable.listId);

  return new Map(rows.map((row) => [row.listId, row.taskCount]));
}

async function ownedList(userId: string, listId: string) {
  const [row] = await db
    .select()
    .from(listsTable)
    .where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
    .limit(1);

  if (!row) throw notFound(`No list ${listId} for this user.`);
  return row;
}

async function countTasksIn(listId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tasksTable)
    .where(and(eq(tasksTable.listId, listId), ne(tasksTable.status, "deleted")));

  return row?.value ?? 0;
}

router.get("/lists", async (req, res) => {
  const userId = userIdOf(req);
  const includeArchived = req.query["includeArchived"] === "true";

  const rows = await db
    .select()
    .from(listsTable)
    .where(
      includeArchived
        ? eq(listsTable.userId, userId)
        : and(eq(listsTable.userId, userId), eq(listsTable.isArchived, false)),
    )
    .orderBy(asc(listsTable.position), asc(listsTable.createdAt));

  const counts = await taskCountsFor(userId);
  res.json(rows.map((row) => toList(row, counts.get(row.id) ?? 0)));
});

router.post("/lists", async (req, res) => {
  const userId = userIdOf(req);
  const body = parseOrThrow(CreateListBody, req.body);

  try {
    const [row] = await db
      .insert(listsTable)
      .values({
        userId,
        name: body.name.trim(),
        ...(body.position === undefined ? {} : { position: body.position }),
      })
      .returning();

    res.status(201).json(toList(row!, 0));
  } catch (err) {
    // The partial unique index on lower(name) is the authority on duplicates,
    // so we let Postgres decide rather than racing a pre-flight SELECT.
    if (isUniqueViolation(err)) throw duplicateListName();
    throw err;
  }
});

router.patch("/lists/:listId", async (req, res) => {
  const userId = userIdOf(req);
  const listId = req.params["listId"]!;
  const body = parseOrThrow(UpdateListBody, req.body);

  await ownedList(userId, listId);

  try {
    const [row] = await db
      .update(listsTable)
      .set({
        ...(body.name === undefined ? {} : { name: body.name.trim() }),
        ...(body.position === undefined ? {} : { position: body.position }),
        ...(body.isArchived === undefined ? {} : { isArchived: body.isArchived }),
        updatedAt: new Date(),
      })
      .where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
      .returning();

    res.json(toList(row!, await countTasksIn(listId)));
  } catch (err) {
    if (isUniqueViolation(err)) throw duplicateListName();
    throw err;
  }
});

/**
 * Deleting a list archives it and cascades its tasks to `deleted` (spec
 * § 12.1). Both writes share one `deletedAt` timestamp, which is what lets
 * `restore` put back exactly the tasks this cascade removed — and no others.
 */
router.delete("/lists/:listId", async (req, res) => {
  const userId = userIdOf(req);
  const listId = req.params["listId"]!;

  await ownedList(userId, listId);

  const deletedAt = new Date();

  const result = await db.transaction(async (tx) => {
    const cascaded = await tx
      .update(tasksTable)
      .set({ status: "deleted", deletedAt, updatedAt: deletedAt })
      .where(
        and(
          eq(tasksTable.listId, listId),
          eq(tasksTable.userId, userId),
          ne(tasksTable.status, "deleted"),
        ),
      )
      .returning({ id: tasksTable.id });

    const [list] = await tx
      .update(listsTable)
      .set({ isArchived: true, updatedAt: deletedAt })
      .where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
      .returning();

    return { list: list!, deletedTaskCount: cascaded.length };
  });

  res.json({
    list: toList(result.list, 0),
    deletedTaskCount: result.deletedTaskCount,
  });
});

router.post("/lists/:listId/restore", async (req, res) => {
  const userId = userIdOf(req);
  const listId = req.params["listId"]!;

  const existing = await ownedList(userId, listId);

  // The cascade stamped every task it removed with the list's `updatedAt`.
  // Restoring on that timestamp puts back exactly those tasks, leaving tasks
  // the user deleted individually beforehand deleted.
  const cascadeStamp = existing.updatedAt;

  const restored = await db.transaction(async (tx) => {
    const [list] = await tx
      .update(listsTable)
      .set({ isArchived: false, updatedAt: new Date() })
      .where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
      .returning();

    await tx
      .update(tasksTable)
      .set({ status: "pending", deletedAt: null, updatedAt: new Date() })
      .where(
        and(
          eq(tasksTable.listId, listId),
          eq(tasksTable.userId, userId),
          eq(tasksTable.status, "deleted"),
          eq(tasksTable.deletedAt, cascadeStamp),
        ),
      );

    return list!;
  });

  res.json(toList(restored, await countTasksIn(listId)));
});

export default router;
