"use client";

import type { CellState, GridFrame } from "@/lib/visualizer/types";
import { cn } from "@/lib/utils";

const CELL_STYLES: Record<CellState, string> = {
  empty: "bg-muted/60 text-muted-foreground",
  wall: "bg-foreground/85",
  frontier: "bg-sky-200 text-sky-900 dark:bg-sky-900 dark:text-sky-100",
  visited: "bg-sky-100 text-sky-800/70 dark:bg-sky-950 dark:text-sky-200/70",
  current: "bg-amber-400 text-amber-950 ring-2 ring-amber-500",
  path: "bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950",
  start: "bg-violet-500 text-white",
  target: "bg-rose-500 text-white",
};

export function GridRenderer({ frame }: { frame: GridFrame }) {
  const cols = frame.states[0]?.length ?? 0;

  return (
    <div
      className="grid w-full gap-1"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {frame.states.map((row, r) =>
        row.map((state, c) => (
          <div
            key={`${r}-${c}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-sm text-[10px] font-medium tabular-nums transition-colors duration-200 sm:text-xs",
              CELL_STYLES[state],
            )}
          >
            {frame.values[r][c]}
          </div>
        )),
      )}
    </div>
  );
}
