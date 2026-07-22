import { describe, expect, it } from "vitest";
import {
  mergeDayBlocks,
  weekdayOf,
  type BlockLike,
  type HabitRuleLike,
} from "./schedule";

const rule = (overrides: Partial<HabitRuleLike> = {}): HabitRuleLike => ({
  id: 1,
  title: "Morning DSA",
  daysOfWeek: [1, 3, 5], // Mon/Wed/Fri
  startTime: "07:00",
  durationMin: 60,
  linkedProblemSlug: null,
  active: true,
  ...overrides,
});

const block = (overrides: Partial<BlockLike> = {}): BlockLike => ({
  id: 10,
  date: "2026-07-20", // a Monday
  startTime: "09:00",
  durationMin: 30,
  title: "One-off review",
  habitRuleId: null,
  linkedProblemSlug: null,
  status: "planned",
  actualMin: null,
  ...overrides,
});

describe("weekdayOf", () => {
  it("interprets YYYY-MM-DD as a local date", () => {
    expect(weekdayOf("2026-07-20")).toBe(1); // Monday
    expect(weekdayOf("2026-07-26")).toBe(0); // Sunday
  });
});

describe("mergeDayBlocks", () => {
  it("creates a virtual instance for a matching weekday", () => {
    const result = mergeDayBlocks([rule()], [], "2026-07-20"); // Monday
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ kind: "virtual", habitRuleId: 1 });
  });

  it("skips rules that don't match the weekday", () => {
    const result = mergeDayBlocks([rule()], [], "2026-07-21"); // Tuesday
    expect(result).toHaveLength(0);
  });

  it("skips inactive rules", () => {
    const result = mergeDayBlocks([rule({ active: false })], [], "2026-07-20");
    expect(result).toHaveLength(0);
  });

  it("does not duplicate a rule already materialized for the day", () => {
    const persisted = block({ habitRuleId: 1, startTime: "07:00" });
    const result = mergeDayBlocks([rule()], [persisted], "2026-07-20");
    expect(result).toHaveLength(1);
    expect(result[0].kind).toBe("persisted");
  });

  it("merges one-off blocks with virtual instances, sorted by start time", () => {
    const oneOff = block({ startTime: "06:00" });
    const result = mergeDayBlocks([rule()], [oneOff], "2026-07-20");
    expect(result.map((b) => b.startTime)).toEqual(["06:00", "07:00"]);
    expect(result.map((b) => b.kind)).toEqual(["persisted", "virtual"]);
  });

  it("handles multiple rules on the same day", () => {
    const evening = rule({ id: 2, title: "Evening review", startTime: "20:00" });
    const result = mergeDayBlocks([rule(), evening], [], "2026-07-20");
    expect(result.map((b) => b.title)).toEqual(["Morning DSA", "Evening review"]);
  });
});
