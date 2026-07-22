import type { Frame } from "./types";

/** Hard cap so a buggy generator can never lock the UI. */
const MAX_FRAMES = 5000;

/** Run a generator to completion, capturing the full trace. */
export function buildTrace(gen: Generator<Frame>): Frame[] {
  const frames: Frame[] = [];
  for (const frame of gen) {
    frames.push(frame);
    if (frames.length >= MAX_FRAMES) {
      throw new Error(`Trace exceeded ${MAX_FRAMES} frames`);
    }
  }
  return frames;
}

// ---------------------------------------------------------------------------
// Shared input helpers
// ---------------------------------------------------------------------------

export function randomArray(length = 16, max = 40): number[] {
  return Array.from({ length }, () => 1 + Math.floor(Math.random() * max));
}

export function randomSortedArray(length = 14, max = 60): number[] {
  return randomArray(length, max).sort((a, b) => a - b);
}
