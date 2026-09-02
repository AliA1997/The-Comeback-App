/**
 * The task state machine and its timestamp arithmetic (spec § 6).
 *
 * Lifecycle transitions are dedicated endpoints rather than `PATCH status`
 * precisely because the server owns this file: a client that could set
 * `status` directly could also skip `totalPausedMs`, and the focused-duration
 * guarantee would quietly rot.
 *
 * Pure functions only — no database access — so the machine is unit-testable.
 */
import type { TaskStatus } from "@workspace/api-zod";
import { invalidTaskTransition } from "../lib/errors";

export type TaskTransition =
  | "start"
  | "pause"
  | "resume"
  | "stop"
  | "complete"
  | "delete"
  | "restore";

/**
 * Legal source states for each transition (spec § 6.1). `delete` is legal from
 * any state, which is why it lists all of them rather than being special-cased.
 */
const ALLOWED_FROM: Readonly<Record<TaskTransition, ReadonlyArray<TaskStatus>>> = {
  start: ["pending"],
  pause: ["in_progress"],
  resume: ["paused"],
  stop: ["in_progress", "paused"],
  complete: ["in_progress", "paused"],
  delete: ["pending", "in_progress", "paused", "completed", "deleted"],
  restore: ["deleted"],
};

/** Human-readable reason used in the 409 detail, never shown raw to the user. */
const TRANSITION_REQUIREMENT: Readonly<Record<TaskTransition, string>> = {
  start: "a task must be pending to start",
  pause: "a task must be running to pause",
  resume: "a task must be paused to resume",
  stop: "a task must be running or paused to stop",
  complete: "a task must be running or paused to complete",
  delete: "a task must exist to delete",
  restore: "a task must be deleted to restore",
};

export function canTransition(from: TaskStatus, transition: TaskTransition): boolean {
  return ALLOWED_FROM[transition].includes(from);
}

export function nextStatus(transition: TaskTransition): TaskStatus {
  switch (transition) {
    case "start":
    case "resume":
      return "in_progress";
    case "pause":
      return "paused";
    case "stop":
    case "restore":
      return "pending";
    case "complete":
      return "completed";
    case "delete":
      return "deleted";
  }
}

/**
 * Throws `409 InvalidTaskTransition` and leaves state untouched when the
 * transition is not legal from the current status.
 */
export function assertTransition(from: TaskStatus, transition: TaskTransition): void {
  if (!canTransition(from, transition)) {
    throw invalidTaskTransition(
      `Cannot ${transition} a task with status "${from}" — ${TRANSITION_REQUIREMENT[transition]}.`,
    );
  }
}

/**
 * Focused duration (spec § 6.2):
 *
 *   round((completedAt − startedAt − totalPausedMs) / 60000), floored at 1
 *
 * This is the AC-6 / AC-8 guarantee that break time is never counted as study
 * time. A task completed without ever being started counts as one minute
 * rather than zero — the work happened, we just have no clock for it.
 */
export function focusedDurationMinutes(input: {
  startedAt: Date | null;
  completedAt: Date;
  totalPausedMs: number;
}): number {
  const { startedAt, completedAt, totalPausedMs } = input;
  if (!startedAt) return 1;

  const focusedMs = completedAt.getTime() - startedAt.getTime() - totalPausedMs;
  return Math.max(1, Math.round(focusedMs / 60_000));
}

/**
 * Pause time accumulated by a resume or a completion that follows a pause
 * (spec § 6.1, the `resume` row). Never negative, so a device clock that
 * jumps backwards cannot inflate focused time.
 */
export function accumulatedPauseMs(pausedAt: Date | null, now: Date): number {
  if (!pausedAt) return 0;
  return Math.max(0, now.getTime() - pausedAt.getTime());
}

/**
 * The countdown's starting point when a task is started (spec § 6.1, `start`):
 * the saved resume point when there is one, otherwise the full estimate.
 */
export function startingRemainingSeconds(task: {
  savedRemainingSeconds: number | null;
  estimatedDurationMinutes: number;
}): number {
  const saved = task.savedRemainingSeconds;
  if (saved !== null && saved > 0) return saved;
  return task.estimatedDurationMinutes * 60;
}
