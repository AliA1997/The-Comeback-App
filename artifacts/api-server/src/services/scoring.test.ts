import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PRIORITY_MULTIPLIERS, computeScore } from "./scoring";

describe("computeScore", () => {
  it("returns the task type's base score for low, medium and high", () => {
    assert.equal(computeScore(15, "low"), 15);
    assert.equal(computeScore(15, "medium"), 15);
    assert.equal(computeScore(15, "high"), 15);
  });

  // AC-4: urgent doubles the score.
  it("doubles the base score when the priority is urgent", () => {
    assert.equal(computeScore(15, "urgent"), 30);
  });

  it("recomputes back down when urgent is downgraded to high", () => {
    const urgent = computeScore(15, "urgent");
    assert.equal(urgent, 30);
    assert.equal(computeScore(15, "high"), 15);
  });

  it("covers every seeded base score", () => {
    const seeds = [5, 5, 8, 10, 15, 20];
    for (const base of seeds) {
      assert.equal(computeScore(base, "medium"), base);
      assert.equal(computeScore(base, "urgent"), base * 2);
    }
  });

  it("defines a multiplier for every priority level", () => {
    assert.deepEqual(Object.keys(PRIORITY_MULTIPLIERS).sort(), [
      "high",
      "low",
      "medium",
      "urgent",
    ]);
  });
});
