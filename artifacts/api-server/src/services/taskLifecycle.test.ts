import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TaskStatus } from "@workspace/api-zod";
import { ApiProblem } from "../lib/errors";
import {
  accumulatedPauseMs,
  assertTransition,
  canTransition,
  focusedDurationMinutes,
  nextStatus,
  startingRemainingSeconds,
  type TaskTransition,
} from "./taskLifecycle";

const ALL_STATUSES: TaskStatus[] = [
  "pending",
  "in_progress",
  "paused",
  "completed",
  "deleted",
];

describe("the task state machine", () => {
  const legal: Array<[TaskStatus, TaskTransition, TaskStatus]> = [
    ["pending", "start", "in_progress"],
    ["in_progress", "pause", "paused"],
    ["paused", "resume", "in_progress"],
    ["in_progress", "stop", "pending"],
    ["paused", "stop", "pending"],
    ["in_progress", "complete", "completed"],
    ["paused", "complete", "completed"],
    ["deleted", "restore", "pending"],
  ];

  for (const [from, transition, to] of legal) {
    it(`allows ${transition} from ${from}, landing on ${to}`, () => {
      assert.equal(canTransition(from, transition), true);
      assert.equal(nextStatus(transition), to);
      assert.doesNotThrow(() => assertTransition(from, transition));
    });
  }

  it("allows delete from every state", () => {
    for (const status of ALL_STATUSES) {
      assert.equal(canTransition(status, "delete"), true);
    }
    assert.equal(nextStatus("delete"), "deleted");
  });

  const illegal: Array<[TaskStatus, TaskTransition]> = [
    ["pending", "pause"],
    ["pending", "resume"],
    ["pending", "complete"],
    ["pending", "stop"],
    ["in_progress", "start"],
    ["in_progress", "resume"],
    ["paused", "start"],
    ["paused", "pause"],
    ["completed", "start"],
    ["completed", "pause"],
    ["completed", "complete"],
    ["deleted", "start"],
    ["deleted", "complete"],
    ["pending", "restore"],
    ["completed", "restore"],
  ];

  for (const [from, transition] of illegal) {
    it(`rejects ${transition} from ${from} with 409 InvalidTaskTransition`, () => {
      assert.equal(canTransition(from, transition), false);
      assert.throws(
        () => assertTransition(from, transition),
        (err: unknown) => {
          assert.ok(err instanceof ApiProblem);
          assert.equal(err.status, 409);
          assert.equal(err.code, "InvalidTaskTransition");
          return true;
        },
      );
    });
  }
});

describe("focusedDurationMinutes", () => {
  const at = (iso: string) => new Date(iso);

  // The worked example from spec § 14: started 14:00, completed 15:10,
  // 10 minutes paused -> 60 minutes of focus.
  it("excludes paused time from the recorded duration", () => {
    assert.equal(
      focusedDurationMinutes({
        startedAt: at("2026-08-30T14:00:00Z"),
        completedAt: at("2026-08-30T15:10:00Z"),
        totalPausedMs: 600_000,
      }),
      60,
    );
  });

  it("counts the whole elapsed span when nothing was paused", () => {
    assert.equal(
      focusedDurationMinutes({
        startedAt: at("2026-08-30T14:00:00Z"),
        completedAt: at("2026-08-30T14:25:00Z"),
        totalPausedMs: 0,
      }),
      25,
    );
  });

  it("floors at one minute rather than reporting zero work", () => {
    assert.equal(
      focusedDurationMinutes({
        startedAt: at("2026-08-30T14:00:00Z"),
        completedAt: at("2026-08-30T14:00:05Z"),
        totalPausedMs: 0,
      }),
      1,
    );
  });

  it("floors at one minute when the pause exceeds the elapsed span", () => {
    assert.equal(
      focusedDurationMinutes({
        startedAt: at("2026-08-30T14:00:00Z"),
        completedAt: at("2026-08-30T14:10:00Z"),
        totalPausedMs: 10_000_000,
      }),
      1,
    );
  });

  it("reports one minute for a task completed without ever starting", () => {
    assert.equal(
      focusedDurationMinutes({
        startedAt: null,
        completedAt: at("2026-08-30T14:10:00Z"),
        totalPausedMs: 0,
      }),
      1,
    );
  });
});

describe("accumulatedPauseMs", () => {
  it("measures the gap since the pause began", () => {
    assert.equal(
      accumulatedPauseMs(new Date("2026-08-30T14:20:00Z"), new Date("2026-08-30T14:30:00Z")),
      600_000,
    );
  });

  it("is zero when the task was never paused", () => {
    assert.equal(accumulatedPauseMs(null, new Date()), 0);
  });

  it("never goes negative when the clock jumps backwards", () => {
    assert.equal(
      accumulatedPauseMs(new Date("2026-08-30T14:30:00Z"), new Date("2026-08-30T14:20:00Z")),
      0,
    );
  });
});

describe("startingRemainingSeconds", () => {
  it("resumes from the saved point when there is one", () => {
    assert.equal(
      startingRemainingSeconds({ savedRemainingSeconds: 2400, estimatedDurationMinutes: 60 }),
      2400,
    );
  });

  it("uses the full estimate when nothing was saved", () => {
    assert.equal(
      startingRemainingSeconds({ savedRemainingSeconds: null, estimatedDurationMinutes: 25 }),
      1500,
    );
  });

  it("uses the full estimate when the saved point is exhausted", () => {
    assert.equal(
      startingRemainingSeconds({ savedRemainingSeconds: 0, estimatedDurationMinutes: 25 }),
      1500,
    );
  });
});
