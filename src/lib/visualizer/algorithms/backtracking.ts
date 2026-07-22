import type { Frame, StackFrame } from "../types";

export interface SubsetsInput {
  nums: number[];
}

export function createSubsetsInput(): SubsetsInput {
  // 4 distinct small numbers → 16 subsets, a readable trace.
  const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const nums: number[] = [];
  while (nums.length < 4) {
    const n = pool[Math.floor(Math.random() * pool.length)];
    if (!nums.includes(n)) nums.push(n);
  }
  return { nums };
}

const show = (xs: number[]) => `[${xs.join(", ")}]`;

function makeFrame(
  stack: string[],
  current: number[],
  results: number[][],
  note: string,
): StackFrame {
  return {
    kind: "stack",
    stack: [...stack],
    current: show(current),
    results: results.map(show),
    note,
  };
}

/**
 * Subsets via include/exclude backtracking — the call stack is the star of
 * the show: every level decides one element's fate.
 */
export function* subsets(input: SubsetsInput): Generator<Frame> {
  const nums = input.nums;
  const stack: string[] = [];
  const current: number[] = [];
  const results: number[][] = [];

  yield makeFrame(
    stack,
    current,
    results,
    `Enumerate all subsets of ${show(nums)}: at each depth, include or exclude one element.`,
  );

  function* backtrack(i: number): Generator<Frame> {
    if (i === nums.length) {
      results.push([...current]);
      yield makeFrame(
        stack,
        current,
        results,
        `All elements decided — record ${show(current)}.`,
      );
      return;
    }

    // Include nums[i]
    current.push(nums[i]);
    stack.push(`include ${nums[i]}`);
    yield makeFrame(stack, current, results, `Include ${nums[i]} and recurse.`);
    yield* backtrack(i + 1);
    current.pop();
    stack.pop();
    yield makeFrame(
      stack,
      current,
      results,
      `Backtrack: un-choose ${nums[i]}.`,
    );

    // Exclude nums[i]
    stack.push(`exclude ${nums[i]}`);
    yield makeFrame(stack, current, results, `Exclude ${nums[i]} and recurse.`);
    yield* backtrack(i + 1);
    stack.pop();
  }

  yield* backtrack(0);
  yield makeFrame(
    stack,
    current,
    results,
    `Done: ${results.length} subsets (2^${nums.length}).`,
  );
}
