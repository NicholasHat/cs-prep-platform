import type { CellState, Frame, GridFrame } from "../types";

export interface UniquePathsInput {
  rows: number;
  cols: number;
}

export function createUniquePathsInput(): UniquePathsInput {
  return { rows: 5, cols: 7 };
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

/**
 * Unique Paths: dp[r][c] = dp[r-1][c] + dp[r][c-1].
 * "frontier" marks the two dependency cells feeding the current cell.
 */
export function* uniquePaths(input: UniquePathsInput): Generator<Frame> {
  const { rows, cols } = input;
  const dp: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );
  const values: string[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(""),
  );
  const states: CellState[][] = Array.from({ length: rows }, () =>
    Array(cols).fill("empty"),
  );

  yield makeFrame(
    values,
    states,
    `How many paths from top-left to bottom-right, moving only right or down? Fill the DP grid cell by cell.`,
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const fresh = states.map((row) =>
        row.map((s) => (s === "current" || s === "frontier" ? "visited" : s)),
      ) as CellState[][];
      states.forEach((row, i) => row.forEach((_, j) => (states[i][j] = fresh[i][j])));

      states[r][c] = "current";
      let note: string;
      if (r === 0 || c === 0) {
        dp[r][c] = 1;
        note = `Edge cell (${r}, ${c}): only one way to get here.`;
      } else {
        states[r - 1][c] = "frontier";
        states[r][c - 1] = "frontier";
        dp[r][c] = dp[r - 1][c] + dp[r][c - 1];
        note = `dp(${r}, ${c}) = ${dp[r - 1][c]} (above) + ${dp[r][c - 1]} (left) = ${dp[r][c]}.`;
      }
      values[r][c] = String(dp[r][c]);
      yield makeFrame(values, states, note);
    }
  }

  const final = states.map((row) => row.map(() => "visited")) as CellState[][];
  final[rows - 1][cols - 1] = "path";
  yield makeFrame(
    values,
    final,
    `${dp[rows - 1][cols - 1]} unique paths to the bottom-right corner.`,
  );
}
