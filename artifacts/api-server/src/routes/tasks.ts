/**
 * `/api/tasks` — task CRUD plus the lifecycle transitions (spec § 6, § 7.2).
 *
 * Two invariants this file exists to protect:
 *
 *   1. The score is computed here from the task type and priority. A `score`
 *      in a request body is ignored (spec § 5.6.1).
 *   2. Status changes go through the transition endpoints, never a raw
 *      `PATCH status`, so timestamp arithmetic and `totalPausedMs` cannot be
 *      skipped by a client.
 */
import { Router, type IRouter } from "express";
import { and, asc, desc, eq, ne } from "drizzle-orm";
import {
  CompleteTaskBody,
  CreateTaskBody,
  PauseTaskBody,
  StopTaskBody,
  UpdateTaskBody,
  type PriorityLevel,
  type Task,
  type TaskStatus,
} from "@workspace/api-zod";
import {
  db,
  listsTable,
  tasksTable,
  taskTypesTable,
  type TaskRow,
  type TaskTypeRow,
} from "@workspace/db";
import { userIdOf } from "../lib/auth";
import { notFound, taskAlreadyCompleted, unknownTaskType } from "../lib/errors";
import { toTask } from "../lib/serializers";
import { parseOrThrow } from "../lib/validate";
import { DEFAULT_PRIORITY, computeScore } from "../services/scoring";
import {
  accumulatedPauseMs,
  assertTransition,
  focusedDurationMinutes,
  nextStatus,
} from "../services/taskLifecycle";

const router: IRouter = Router();

const PRIORITIES: ReadonlyArray<PriorityLevel> = ["low", "medium", "high", "urgent"];
const STATUSES: ReadonlyArray<TaskStatus> = [
  "pending",
  "in_progress",
  "paused",
  "completed",
  "deleted",
];

// ---------------------------------------------------------------------------
// Lookups — every one scoped to the authenticated user (Principle VI)
// ---------------------------------------------------------------------------

async function ownedTask(
  userId: string,
  taskId: string,
): Promise<{ task: TaskRow; taskType: TaskTypeRow }> {
  const [row] = await db
    .select({ task: tasksTable, taskType: taskTypesTable })
    .from(tasksTable)
    .innerJoin(taskTypesTable, eq(tasksTable.taskTypeId, taskTypesTable.id))
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))
    .limit(1);

  if (!row) throw notFound(`No task ${taskId} for this user.`);
  return row;
}

async function assertOwnedList(userId: string, listId: string): Promise<void> {
  const [row] = await db
    .select({ id: listsTable.id })
    .from(listsTable)
    .where(and(eq(listsTable.id, listId), eq(listsTable.userId, userId)))
    .limit(1);

  if (!row) throw notFound(`No list ${listId} for this user.`);
}

async function taskTypeOrThrow(taskTypeId: string): Promise<TaskTypeRow> {
  const [row] = await db
    .select()
    .from(taskTypesTable)
    .where(eq(taskTypesTable.id, taskTypeId))
    .limit(1);

  if (!row) throw unknownTaskType();
  return row;
}

/** Applies a partial update and returns the row joined to its task type. */
async function persist(
  userId: string,
  taskId: string,
  patch: Partial<typeof tasksTable.$inferInsert>,
): Promise<Task> {
  const [row] = await db
    .update(tasksTable)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(tasksTable.id, taskId), eq(tasksTable.userId, userId)))
    .returning();

  const taskType = await taskTypeOrThrow(row!.taskTypeId);
  return toTask(row!, taskType);
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------

router.get("/tasks", async (req, res) => {
  const userId = userIdOf(req);

  const listId = typeof req.query["listId"] === "string" ? req.query["listId"] : undefined;
  const rawStatus = req.query["status"];
  const rawPriority = req.query["priority"];

  const status = STATUSES.find((s) => s === rawStatus);
  const priority = PRIORITIES.find((p) => p === rawPriority);

  const filters = [eq(tasksTable.userId, userId)];
  if (listId) filters.push(eq(tasksTable.listId, listId));
  if (priority) filters.push(eq(tasksTable.priority, priority));

  // Soft-deleted tasks disappear from every default query (AC-9); asking for
  // them explicitly is the only way to see them.
  filters.push(status ? eq(tasksTable.status, status) : ne(tasksTable.status, "deleted"));

  const rows = await db
    .select({ task: tasksTable, taskType: taskTypesTable })
    .from(tasksTable)
    .innerJoin(taskTypesTable, eq(tasksTable.taskTypeId, taskTypesTable.id))
    .where(and(...filters))
    .orderBy(asc(tasksTable.position), desc(tasksTable.createdAt));

  res.json(rows.map((row) => toTask(row.task, row.taskType)));
});

router.get("/tasks/:taskId", async (req, res) => {
  const userId = userIdOf(req);
  const { task, taskType } = await ownedTask(userId, req.params["taskId"]!);
  res.json(toTask(task, taskType));
});

router.post("/tasks", async (req, res) => {
  const userId = userIdOf(req);
  const body = parseOrThrow(CreateTaskBody, req.body);

  await assertOwnedList(userId, body.listId);
  const taskType = await taskTypeOrThrow(body.taskTypeId);

  const priority = body.priority ?? DEFAULT_PRIORITY;

  const [row] = await db
    .insert(tasksTable)
    .values({
      userId,
      listId: body.listId,
      taskTypeId: taskType.id,
      title: body.title.trim(),
      description: body.description?.trim() ?? "",
      priority,
      score: computeScore(taskType.score, priority),
      ...(body.estimatedDurationMinutes === undefined
        ? {}
        : { estimatedDurationMinutes: body.estimatedDurationMinutes }),
      ...(body.dueDate === undefined ? {} : { dueDate: body.dueDate }),
      ...(body.position === undefined ? {} : { position: body.position }),
    })
    .returning();

  res.status(201).json(toTask(row!, taskType));
});

router.patch("/tasks/:taskId", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;
  const body = parseOrThrow(UpdateTaskBody, req.body);

  const { task } = await ownedTask(userId, taskId);

  const changesScoring =
    (body.priority !== undefined && body.priority !== task.priority) ||
    (body.taskTypeId !== undefined && body.taskTypeId !== task.taskTypeId);

  // A completed task's score is frozen at completion (spec § 12.3), so the
  // edit is rejected rather than silently ignored — the user should know the
  // change did not take.
  if (changesScoring && task.status === "completed") {
    throw taskAlreadyCompleted();
  }

  if (body.listId !== undefined) await assertOwnedList(userId, body.listId);

  const taskType =
    body.taskTypeId === undefined
      ? await taskTypeOrThrow(task.taskTypeId)
      : await taskTypeOrThrow(body.taskTypeId);

  const priority = body.priority ?? task.priority;

  res.json(
    await persist(userId, taskId, {
      ...(body.listId === undefined ? {} : { listId: body.listId }),
      ...(body.title === undefined ? {} : { title: body.title.trim() }),
      ...(body.description === undefined ? {} : { description: body.description.trim() }),
      ...(body.estimatedDurationMinutes === undefined
        ? {}
        : { estimatedDurationMinutes: body.estimatedDurationMinutes }),
      ...(body.dueDate === undefined ? {} : { dueDate: body.dueDate }),
      ...(body.position === undefined ? {} : { position: body.position }),
      taskTypeId: taskType.id,
      priority,
      ...(changesScoring ? { score: computeScore(taskType.score, priority) } : {}),
    }),
  );
});

// ---------------------------------------------------------------------------
// Lifecycle transitions (spec § 6.1)
// ---------------------------------------------------------------------------

router.post("/tasks/:taskId/start", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;

  const { task } = await ownedTask(userId, taskId);
  assertTransition(task.status, "start");

  res.json(
    await persist(userId, taskId, {
      status: nextStatus("start"),
      startedAt: new Date(),
      pausedAt: null,
    }),
  );
});

router.post("/tasks/:taskId/pause", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;
  const body = parseOrThrow(PauseTaskBody, req.body ?? {});

  const { task } = await ownedTask(userId, taskId);
  assertTransition(task.status, "pause");

  res.json(
    await persist(userId, taskId, {
      status: nextStatus("pause"),
      pausedAt: new Date(),
      ...(body.savedRemainingSeconds === undefined
        ? {}
        : { savedRemainingSeconds: body.savedRemainingSeconds }),
    }),
  );
});

router.post("/tasks/:taskId/resume", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;

  const { task } = await ownedTask(userId, taskId);
  assertTransition(task.status, "resume");

  res.json(
    await persist(userId, taskId, {
      status: nextStatus("resume"),
      totalPausedMs: task.totalPausedMs + accumulatedPauseMs(task.pausedAt, new Date()),
      pausedAt: null,
    }),
  );
});

router.post("/tasks/:taskId/stop", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;
  const body = parseOrThrow(StopTaskBody, req.body ?? {});

  const { task } = await ownedTask(userId, taskId);
  assertTransition(task.status, "stop");

  // Stopping from a pause still banks the pause, so a later start does not
  // count the break as focus time.
  res.json(
    await persist(userId, taskId, {
      status: nextStatus("stop"),
      totalPausedMs: task.totalPausedMs + accumulatedPauseMs(task.pausedAt, new Date()),
      pausedAt: null,
      ...(body.savedRemainingSeconds === undefined
        ? {}
        : { savedRemainingSeconds: body.savedRemainingSeconds }),
    }),
  );
});

router.post("/tasks/:taskId/complete", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;
  const body = parseOrThrow(CompleteTaskBody, req.body ?? {});

  const { task } = await ownedTask(userId, taskId);
  assertTransition(task.status, "complete");

  const completedAt = new Date();
  const totalPausedMs =
    task.totalPausedMs +
    accumulatedPauseMs(task.pausedAt, completedAt) +
    (body.totalPausedMs ?? 0);

  res.json(
    await persist(userId, taskId, {
      status: nextStatus("complete"),
      completedAt,
      pausedAt: null,
      totalPausedMs,
      actualDurationMinutes: focusedDurationMinutes({
        startedAt: task.startedAt,
        completedAt,
        totalPausedMs,
      }),
      // The resume point is meaningless once the task is done.
      savedRemainingSeconds: null,
    }),
  );
});

router.delete("/tasks/:taskId", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;

  const { task } = await ownedTask(userId, taskId);
  assertTransition(task.status, "delete");

  res.json(
    await persist(userId, taskId, {
      status: nextStatus("delete"),
      deletedAt: new Date(),
    }),
  );
});

router.post("/tasks/:taskId/restore", async (req, res) => {
  const userId = userIdOf(req);
  const taskId = req.params["taskId"]!;

  const { task, taskType } = await ownedTask(userId, taskId);
  assertTransition(task.status, "restore");

  // The type's base score may have been retuned while the task sat deleted,
  // so the score is recomputed rather than restored (spec § 12.8).
  res.json(
    await persist(userId, taskId, {
      status: nextStatus("restore"),
      deletedAt: null,
      completedAt: null,
      score: computeScore(taskType.score, task.priority),
    }),
  );
});

export default router;
