import type { ArrayFrame, ArrayHighlights, Frame } from "../types";

const frame = (
  array: number[],
  highlights: ArrayHighlights,
  note: string,
): ArrayFrame => ({ kind: "array", array: [...array], highlights, note });

// ---------------------------------------------------------------------------
// Binary search
// ---------------------------------------------------------------------------

export interface BinarySearchInput {
  array: number[]; // sorted
  target: number;
}

export function* binarySearch(input: BinarySearchInput): Generator<Frame> {
  const a = input.array;
  const target = input.target;
  let lo = 0;
  let hi = a.length - 1;
  yield frame(
    a,
    { pointers: { lo, hi } },
    `Search for ${target} in the sorted array.`,
  );

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    yield frame(
      a,
      { pointers: { lo, mid, hi }, compare: [mid], window: [lo, hi] },
      `mid = ${mid}: is ${a[mid]} equal to ${target}?`,
    );
    if (a[mid] === target) {
      yield frame(
        a,
        { found: [mid], pointers: { mid } },
        `Found ${target} at index ${mid}.`,
      );
      return;
    }
    if (a[mid] < target) {
      lo = mid + 1;
      yield frame(
        a,
        { pointers: { lo, hi }, window: lo <= hi ? [lo, hi] : undefined },
        `${a[mid]} < ${target} — discard the left half.`,
      );
    } else {
      hi = mid - 1;
      yield frame(
        a,
        { pointers: { lo, hi }, window: lo <= hi ? [lo, hi] : undefined },
        `${a[mid]} > ${target} — discard the right half.`,
      );
    }
  }
  yield frame(a, {}, `${target} is not in the array.`);
}

// ---------------------------------------------------------------------------
// Two pointers: Two Sum II (sorted array)
// ---------------------------------------------------------------------------

export interface TwoSumInput {
  array: number[]; // sorted
  target: number;
}

export function* twoSumSorted(input: TwoSumInput): Generator<Frame> {
  const a = input.array;
  const target = input.target;
  let l = 0;
  let r = a.length - 1;
  yield frame(
    a,
    { pointers: { L: l, R: r } },
    `Find two values summing to ${target}: pointers at both ends.`,
  );

  while (l < r) {
    const sum = a[l] + a[r];
    yield frame(
      a,
      { pointers: { L: l, R: r }, compare: [l, r] },
      `${a[l]} + ${a[r]} = ${sum} vs target ${target}.`,
    );
    if (sum === target) {
      yield frame(
        a,
        { found: [l, r] },
        `Found it: ${a[l]} + ${a[r]} = ${target}.`,
      );
      return;
    }
    if (sum < target) {
      l++;
      yield frame(
        a,
        { pointers: { L: l, R: r } },
        "Sum too small — move the left pointer right.",
      );
    } else {
      r--;
      yield frame(
        a,
        { pointers: { L: l, R: r } },
        "Sum too large — move the right pointer left.",
      );
    }
  }
  yield frame(a, {}, "No pair sums to the target.");
}

// ---------------------------------------------------------------------------
// Sliding window: max sum of a window of size k
// ---------------------------------------------------------------------------

export interface SlidingWindowInput {
  array: number[];
  k: number;
}

export function* slidingWindowMaxSum(
  input: SlidingWindowInput,
): Generator<Frame> {
  const a = input.array;
  const k = input.k;
  let sum = 0;
  for (let i = 0; i < k; i++) sum += a[i];
  let best = sum;
  let bestStart = 0;

  yield frame(
    a,
    { window: [0, k - 1] },
    `Window of size ${k}: initial sum ${sum}.`,
  );

  for (let i = k; i < a.length; i++) {
    yield frame(
      a,
      { window: [i - k + 1, i], compare: [i - k, i] },
      `Slide: drop ${a[i - k]}, add ${a[i]}.`,
    );
    sum += a[i] - a[i - k];
    const isBest = sum > best;
    if (isBest) {
      best = sum;
      bestStart = i - k + 1;
    }
    yield frame(
      a,
      { window: [i - k + 1, i] },
      `Sum ${sum}${isBest ? " — new best!" : ` (best ${best})`}.`,
    );
  }
  yield frame(
    a,
    { window: [bestStart, bestStart + k - 1], found: [bestStart] },
    `Best window sum: ${best}, starting at index ${bestStart}.`,
  );
}
