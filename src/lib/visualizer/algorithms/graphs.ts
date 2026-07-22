import type { CellState, Frame, GridFrame } from "../types";

export interface GridInput {
  /** true = wall */
  walls: boolean[][];
}

export interface WeightedGridInput {
  weights: number[][];
}

const ROWS = 8;
const COLS = 12;

function emptyStates(walls: boolean[][]): CellState[][] {
  return walls.map((row) => row.map((w) => (w ? "wall" : "empty")));
}

function makeFrame(
  values: string[][],
  states: CellState[][],
  note: string,
): GridFrame {
  return {
    kind: "grid",
    values: values.map((r) => [...r]),
    states: states.map((r) => [...r]),
    note,
  };
}

function blankValues(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(""));
}

const DIRS = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
] as const;

function pathExists(walls: boolean[][]): boolean {
  const rows = walls.length;
  const cols = walls[0].length;
  const seen = new Set<string>(["0,0"]);
  const queue: [number, number][] = [[0, 0]];
  while (queue.length) {
    const [r, c] = queue.shift()!;
    if (r === rows - 1 && c === cols - 1) return true;
    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !walls[nr][nc] &&
        !seen.has(key)
      ) {
        seen.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return false;
}

/** Random wall layout with a guaranteed path from top-left to bottom-right. */
export function createMaze(): GridInput {
  for (let tries = 0; tries < 50; tries++) {
    const walls = Array.from({ length: ROWS }, () =>
      Array.from({ length: COLS }, () => Math.random() < 0.28),
    );
    walls[0][0] = false;
    walls[ROWS - 1][COLS - 1] = false;
    if (pathExists(walls)) return { walls };
  }
  // Fallback: open grid
  return {
    walls: Array.from({ length: ROWS }, () => Array(COLS).fill(false)),
  };
}

export function createWeightedGrid(): WeightedGridInput {
  return {
    weights: Array.from({ length: 7 }, () =>
      Array.from({ length: 10 }, () => 1 + Math.floor(Math.random() * 9)),
    ),
  };
}

function markEndpoints(states: CellState[][]) {
  if (states[0][0] === "empty") states[0][0] = "start";
  const r = states.length - 1;
  const c = states[0].length - 1;
  if (states[r][c] === "empty") states[r][c] = "target";
}

function* tracePath(
  parent: Map<string, string>,
  states: CellState[][],
  values: string[][],
  rows: number,
  cols: number,
): Generator<Frame> {
  const path: [number, number][] = [];
  let cursor = `${rows - 1},${cols - 1}`;
  while (cursor) {
    const [r, c] = cursor.split(",").map(Number);
    path.push([r, c]);
    cursor = parent.get(cursor) ?? "";
  }
  for (const [r, c] of path.reverse()) {
    states[r][c] = "path";
    yield makeFrame(values, states, "Reconstruct the path via parent links.");
  }
  yield makeFrame(
    values,
    states,
    `Shortest path found: ${path.length} cells.`,
  );
}

// ---------------------------------------------------------------------------
// BFS — shortest path in an unweighted grid
// ---------------------------------------------------------------------------

export function* bfsGrid(input: GridInput): Generator<Frame> {
  const walls = input.walls;
  const rows = walls.length;
  const cols = walls[0].length;
  const states = emptyStates(walls);
  const values = blankValues(rows, cols);
  markEndpoints(states);

  yield makeFrame(
    values,
    states,
    "BFS explores level by level — first arrival is the shortest path.",
  );

  const parent = new Map<string, string>();
  const queue: [number, number, number][] = [[0, 0, 0]];
  const seen = new Set(["0,0"]);
  states[0][0] = "frontier";
  values[0][0] = "0";

  while (queue.length) {
    const [r, c, dist] = queue.shift()!;
    states[r][c] = "current";
    yield makeFrame(values, states, `Dequeue (${r}, ${c}) at distance ${dist}.`);

    if (r === rows - 1 && c === cols - 1) {
      yield* tracePath(parent, states, values, rows, cols);
      return;
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !walls[nr][nc] &&
        !seen.has(key)
      ) {
        seen.add(key);
        parent.set(key, `${r},${c}`);
        queue.push([nr, nc, dist + 1]);
        states[nr][nc] = "frontier";
        values[nr][nc] = String(dist + 1);
      }
    }
    states[r][c] = "visited";
    yield makeFrame(values, states, "Neighbors joined the frontier.");
  }
  yield makeFrame(values, states, "Queue empty — target unreachable.");
}

// ---------------------------------------------------------------------------
// DFS — depth-first exploration
// ---------------------------------------------------------------------------

export function* dfsGrid(input: GridInput): Generator<Frame> {
  const walls = input.walls;
  const rows = walls.length;
  const cols = walls[0].length;
  const states = emptyStates(walls);
  const values = blankValues(rows, cols);
  markEndpoints(states);

  yield makeFrame(
    values,
    states,
    "DFS dives as deep as possible before backtracking.",
  );

  const parent = new Map<string, string>();
  const seen = new Set(["0,0"]);
  const stack: [number, number][] = [[0, 0]];

  while (stack.length) {
    const [r, c] = stack.pop()!;
    states[r][c] = "current";
    yield makeFrame(values, states, `Visit (${r}, ${c}).`);

    if (r === rows - 1 && c === cols - 1) {
      yield* tracePath(parent, states, values, rows, cols);
      return;
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !walls[nr][nc] &&
        !seen.has(key)
      ) {
        seen.add(key);
        parent.set(key, `${r},${c}`);
        stack.push([nr, nc]);
        if (states[nr][nc] === "empty") states[nr][nc] = "frontier";
      }
    }
    states[r][c] = "visited";
    yield makeFrame(values, states, "Push unvisited neighbors, go deeper.");
  }
  yield makeFrame(values, states, "Stack empty — target unreachable.");
}

// ---------------------------------------------------------------------------
// Dijkstra — weighted shortest path
// ---------------------------------------------------------------------------

export function* dijkstraGrid(input: WeightedGridInput): Generator<Frame> {
  const weights = input.weights;
  const rows = weights.length;
  const cols = weights[0].length;
  const states: CellState[][] = weights.map((row) => row.map(() => "empty"));
  const values = weights.map((row) => row.map((w) => String(w)));
  markEndpoints(states);

  yield makeFrame(
    values,
    states,
    "Dijkstra: always settle the cheapest unsettled cell. Cell labels are entry costs.",
  );

  const dist = new Map<string, number>([["0,0", weights[0][0]]]);
  const parent = new Map<string, string>();
  const settled = new Set<string>();
  // Tiny priority queue via array scan — fine at this scale.
  const pq: [number, number, number][] = [[weights[0][0], 0, 0]];

  while (pq.length) {
    pq.sort((a, b) => a[0] - b[0]);
    const [d, r, c] = pq.shift()!;
    const key = `${r},${c}`;
    if (settled.has(key)) continue;
    settled.add(key);
    states[r][c] = "current";
    values[r][c] = String(d);
    yield makeFrame(values, states, `Settle (${r}, ${c}) at cost ${d}.`);

    if (r === rows - 1 && c === cols - 1) {
      yield* tracePath(parent, states, values, rows, cols);
      return;
    }

    for (const [dr, dc] of DIRS) {
      const nr = r + dr;
      const nc = c + dc;
      const nkey = `${nr},${nc}`;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || settled.has(nkey))
        continue;
      const nd = d + weights[nr][nc];
      if (nd < (dist.get(nkey) ?? Infinity)) {
        dist.set(nkey, nd);
        parent.set(nkey, key);
        pq.push([nd, nr, nc]);
        if (states[nr][nc] === "empty" || states[nr][nc] === "frontier") {
          states[nr][nc] = "frontier";
          values[nr][nc] = String(nd);
        }
      }
    }
    states[r][c] = "visited";
    yield makeFrame(values, states, "Relax neighbors with cheaper costs.");
  }
}
