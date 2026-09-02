import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { DayRecord } from '../types';
import { computeStreak } from './StreakEngine';

/** A day record `offset` days before today, with `count` tasks completed. */
function dayAgo(offset: number, count: number): [string, DayRecord] {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  const date = d.toISOString().split('T')[0]!;
  return [
    date,
    {
      date,
      totalMinutes: count * 25,
      completedTaskIds: Array.from({ length: count }, (_, i) => `t${offset}-${i}`),
      skippedTaskIds: [],
    },
  ];
}

function records(...days: Array<[number, number]>): Record<string, DayRecord> {
  return Object.fromEntries(days.map(([offset, count]) => dayAgo(offset, count)));
}

describe('computeStreak', () => {
  it('is zero with no history', () => {
    assert.equal(computeStreak({}), 0);
  });

  it('counts today when work was done today', () => {
    assert.equal(computeStreak(records([0, 1])), 1);
  });

  it('counts consecutive days ending today', () => {
    assert.equal(computeStreak(records([0, 2], [1, 1], [2, 3])), 3);
  });

  /**
   * Principle III: a day that is merely still in progress must not read as a
   * broken streak. Yesterday's run keeps counting until today actually lapses.
   */
  it('keeps yesterday-anchored streaks alive before today is logged', () => {
    assert.equal(computeStreak(records([1, 1], [2, 1])), 2);
  });

  it('stops at the first gap', () => {
    assert.equal(computeStreak(records([0, 1], [1, 1], [3, 1], [4, 1])), 2);
  });

  it('ignores days that were recorded but had nothing completed', () => {
    assert.equal(computeStreak(records([0, 1], [1, 0], [2, 1])), 1);
  });

  it('is zero when the most recent activity is older than yesterday', () => {
    assert.equal(computeStreak(records([2, 1], [3, 1])), 0);
  });
});
