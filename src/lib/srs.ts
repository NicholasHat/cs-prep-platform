/**
 * Simplified SM-2 spaced repetition.
 *
 * Pure and deterministic: given the current state, a recall rating, and "now",
 * produce the next state. Kept deliberately small — this is a 150-problem
 * queue, not Anki.
 */

export type RecallRating = "again" | "hard" | "good" | "easy";

export interface SrsState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export interface SrsResult extends SrsState {
  /** YYYY-MM-DD (local time of `now`) */
  dueDate: string;
}

export const INITIAL_SRS_STATE: SrsState = {
  intervalDays: 0,
  easeFactor: 2.5,
  repetitions: 0,
};

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;

const clampEase = (e: number) => Math.min(MAX_EASE, Math.max(MIN_EASE, e));

export function review(
  state: SrsState,
  rating: RecallRating,
  now: Date = new Date(),
): SrsResult {
  let { intervalDays, easeFactor, repetitions } = state;

  switch (rating) {
    case "again":
      easeFactor = clampEase(easeFactor - 0.2);
      repetitions = 0;
      intervalDays = 1;
      break;
    case "hard":
      easeFactor = clampEase(easeFactor - 0.15);
      repetitions += 1;
      intervalDays = Math.max(1, intervalDays * 1.2);
      break;
    case "good":
      repetitions += 1;
      if (repetitions === 1) intervalDays = 1;
      else if (repetitions === 2) intervalDays = 3;
      else intervalDays = intervalDays * easeFactor;
      break;
    case "easy":
      easeFactor = clampEase(easeFactor + 0.15);
      repetitions += 1;
      if (repetitions === 1) intervalDays = 3;
      else intervalDays = Math.max(4, intervalDays * easeFactor * 1.3);
      break;
  }

  intervalDays = Math.round(intervalDays * 100) / 100;

  return {
    intervalDays,
    easeFactor: Math.round(easeFactor * 100) / 100,
    repetitions,
    dueDate: addDays(now, Math.max(1, Math.round(intervalDays))),
  };
}

/** Local-date string N days after `from`. */
export function addDays(from: Date, days: number): string {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return toLocalDateString(d);
}

export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isDue(dueDate: string, now: Date = new Date()): boolean {
  return dueDate <= toLocalDateString(now);
}
