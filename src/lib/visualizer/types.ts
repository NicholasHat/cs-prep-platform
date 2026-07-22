/**
 * Visualizer core types.
 *
 * An algorithm is a pure generator that yields immutable Frames. Each frame
 * carries the complete (small) state needed to render that step, so playback
 * is just index arithmetic — no reverse execution, no incremental state.
 */

// ---------------------------------------------------------------------------
// Frames
// ---------------------------------------------------------------------------

/** Highlights for array-family renderers. All indices refer to `array`. */
export interface ArrayHighlights {
  /** Indices being compared this step. */
  compare?: number[];
  /** Indices being swapped this step. */
  swap?: number[];
  /** Index whose value was just written. */
  set?: number;
  /** Indices known to be in final sorted position. */
  sorted?: number[];
  /** Pivot index (quick sort). */
  pivot?: number;
  /** Named pointers rendered as labeled markers, e.g. { L: 0, R: 7 }. */
  pointers?: Record<string, number>;
  /** Inclusive [start, end] shaded window. */
  window?: [number, number];
  /** Index of a successful hit (search target, answer pair, …). */
  found?: number[];
  /** Range currently being operated on, e.g. merge-sort subarray. */
  range?: [number, number];
}

export interface ArrayFrame {
  kind: "array";
  array: number[];
  highlights: ArrayHighlights;
  note: string;
}

export type CellState =
  | "empty"
  | "wall"
  | "frontier"
  | "visited"
  | "current"
  | "path"
  | "start"
  | "target";

export interface GridFrame {
  kind: "grid";
  /** Cell labels ("" for none) — distances, DP values, weights. */
  values: string[][];
  states: CellState[][];
  note: string;
}

export interface StackFrame {
  kind: "stack";
  /** Call stack, bottom first. */
  stack: string[];
  /** Current partial candidate, e.g. the subset being built. */
  current: string;
  /** Collected results so far. */
  results: string[];
  note: string;
}

export type Frame = ArrayFrame | GridFrame | StackFrame;

export type RendererKind = Frame["kind"];

// ---------------------------------------------------------------------------
// Algorithm definitions
// ---------------------------------------------------------------------------

export interface AlgorithmDef<TInput = unknown> {
  id: string;
  name: string;
  category: string;
  description: string;
  /** Big-O summary shown alongside the visualization. */
  complexity: string;
  renderer: RendererKind;
  /** Produce a fresh randomized input. */
  createInput: () => TInput;
  /** Pure generator over the input — must not mutate the input object. */
  run: (input: TInput) => Generator<Frame>;
  /** Related NeetCode problem slugs, if any. */
  relatedProblems?: string[];
}

/** Erases the input type so heterogeneous defs can share the registry. */
export type AnyAlgorithmDef = AlgorithmDef<never> & {
  createInput: () => unknown;
  run: (input: never) => Generator<Frame>;
};
