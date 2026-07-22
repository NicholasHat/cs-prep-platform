import { describe, expect, it } from "vitest";
import {
  INITIAL_SRS_STATE,
  isDue,
  review,
  toLocalDateString,
} from "./srs";

const NOW = new Date("2026-07-21T12:00:00");

describe("review", () => {
  it("first Good review schedules 1 day out", () => {
    const r = review(INITIAL_SRS_STATE, "good", NOW);
    expect(r.repetitions).toBe(1);
    expect(r.intervalDays).toBe(1);
    expect(r.dueDate).toBe("2026-07-22");
  });

  it("second Good review schedules 3 days out", () => {
    const first = review(INITIAL_SRS_STATE, "good", NOW);
    const second = review(first, "good", NOW);
    expect(second.repetitions).toBe(2);
    expect(second.intervalDays).toBe(3);
    expect(second.dueDate).toBe("2026-07-24");
  });

  it("third Good review multiplies by ease factor", () => {
    let s = review(INITIAL_SRS_STATE, "good", NOW);
    s = review(s, "good", NOW);
    s = review(s, "good", NOW);
    expect(s.intervalDays).toBeCloseTo(7.5); // 3 * 2.5
    expect(s.dueDate).toBe(toLocalDateString(new Date("2026-07-29T12:00:00")));
  });

  it("Again resets repetitions and interval, reduces ease", () => {
    let s = review(INITIAL_SRS_STATE, "good", NOW);
    s = review(s, "good", NOW);
    const r = review(s, "again", NOW);
    expect(r.repetitions).toBe(0);
    expect(r.intervalDays).toBe(1);
    expect(r.easeFactor).toBeCloseTo(2.3);
    expect(r.dueDate).toBe("2026-07-22");
  });

  it("ease factor never drops below 1.3", () => {
    const s = { ...INITIAL_SRS_STATE, easeFactor: 1.35 };
    const r = review(s, "again", NOW);
    expect(r.easeFactor).toBe(1.3);
  });

  it("ease factor never exceeds 3.0", () => {
    const s = { ...INITIAL_SRS_STATE, easeFactor: 2.95 };
    const r = review(s, "easy", NOW);
    expect(r.easeFactor).toBe(3.0);
  });

  it("Hard grows the interval slowly", () => {
    const s = { intervalDays: 10, easeFactor: 2.5, repetitions: 3 };
    const r = review(s, "hard", NOW);
    expect(r.intervalDays).toBe(12); // 10 * 1.2
    expect(r.easeFactor).toBeCloseTo(2.35);
  });

  it("Easy on first review jumps to 3 days", () => {
    const r = review(INITIAL_SRS_STATE, "easy", NOW);
    expect(r.intervalDays).toBe(3);
    expect(r.dueDate).toBe("2026-07-24");
  });

  it("intervals are monotonically non-decreasing under Good", () => {
    let s: ReturnType<typeof review> | typeof INITIAL_SRS_STATE =
      INITIAL_SRS_STATE;
    let prev = 0;
    for (let i = 0; i < 8; i++) {
      s = review(s, "good", NOW);
      expect(s.intervalDays).toBeGreaterThanOrEqual(prev);
      prev = s.intervalDays;
    }
    // After 8 successful reviews the interval should be comfortably long
    expect(prev).toBeGreaterThan(100);
  });
});

describe("isDue", () => {
  it("due today counts as due", () => {
    expect(isDue("2026-07-21", NOW)).toBe(true);
  });
  it("overdue counts as due", () => {
    expect(isDue("2026-07-01", NOW)).toBe(true);
  });
  it("future date is not due", () => {
    expect(isDue("2026-07-22", NOW)).toBe(false);
  });
});
