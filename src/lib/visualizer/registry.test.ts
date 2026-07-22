import { describe, expect, it } from "vitest";
import { buildTrace } from "./engine";
import { ALGORITHMS, getAlgorithm } from "./registry";
import type { ArrayFrame, Frame, GridFrame, StackFrame } from "./types";

const lastFrame = (frames: Frame[]) => frames[frames.length - 1];

describe("every registered algorithm", () => {
  for (const algo of ALGORITHMS) {
    it(`${algo.id}: produces a bounded, well-formed trace`, () => {
      const input = algo.createInput();
      const frames = buildTrace(algo.run(input as never));
      expect(frames.length).toBeGreaterThan(1);
      expect(frames.length).toBeLessThan(5000);
      for (const f of frames) {
        expect(f.kind).toBe(algo.renderer);
        expect(f.note.length).toBeGreaterThan(0);
      }
    });
  }
});

describe("sorting correctness", () => {
  for (const id of ["bubble-sort", "insertion-sort", "merge-sort", "quick-sort"]) {
    it(`${id}: final frame is the sorted input`, () => {
      const algo = getAlgorithm(id)!;
      const input = algo.createInput() as number[];
      const frames = buildTrace(algo.run(input as never));
      const final = lastFrame(frames) as ArrayFrame;
      expect(final.array).toEqual([...input].sort((a, b) => a - b));
      // Input must not be mutated by the generator.
      expect(algo.createInput()).not.toBe(input);
    });
  }
});

describe("binary search", () => {
  it("finds the target index", () => {
    const algo = getAlgorithm("binary-search")!;
    const input = algo.createInput() as { array: number[]; target: number };
    const frames = buildTrace(algo.run(input as never));
    const final = lastFrame(frames) as ArrayFrame;
    expect(final.highlights.found).toBeDefined();
    const [idx] = final.highlights.found!;
    expect(input.array[idx]).toBe(input.target);
  });
});

describe("two pointers", () => {
  it("finds a pair summing to the target", () => {
    const algo = getAlgorithm("two-pointers")!;
    const input = algo.createInput() as { array: number[]; target: number };
    const frames = buildTrace(algo.run(input as never));
    const final = lastFrame(frames) as ArrayFrame;
    expect(final.highlights.found).toBeDefined();
    const [l, r] = final.highlights.found!;
    expect(input.array[l] + input.array[r]).toBe(input.target);
  });
});

describe("bfs", () => {
  it("reaches the target and marks a path", () => {
    const algo = getAlgorithm("bfs")!;
    const frames = buildTrace(algo.run(algo.createInput() as never));
    const final = lastFrame(frames) as GridFrame;
    const rows = final.states.length;
    const cols = final.states[0].length;
    expect(final.states[rows - 1][cols - 1]).toBe("path");
    expect(final.states[0][0]).toBe("path");
  });
});

describe("unique paths", () => {
  it("computes C(rows+cols-2, rows-1)", () => {
    const algo = getAlgorithm("unique-paths")!;
    const frames = buildTrace(algo.run({ rows: 3, cols: 4 } as never));
    const final = lastFrame(frames) as GridFrame;
    expect(final.values[2][3]).toBe("10"); // C(5, 2)
  });
});

describe("subsets", () => {
  it("enumerates all 2^n subsets", () => {
    const algo = getAlgorithm("subsets")!;
    const frames = buildTrace(algo.run({ nums: [1, 2, 3] } as never));
    const final = lastFrame(frames) as StackFrame;
    expect(final.results).toHaveLength(8);
    expect(new Set(final.results).size).toBe(8);
  });
});
