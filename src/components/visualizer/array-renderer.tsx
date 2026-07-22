"use client";

import { motion } from "motion/react";
import type { ArrayFrame } from "@/lib/visualizer/types";
import { cn } from "@/lib/utils";

function barClass(index: number, h: ArrayFrame["highlights"]): string {
  if (h.found?.includes(index))
    return "bg-emerald-500 dark:bg-emerald-400";
  if (h.swap?.includes(index)) return "bg-rose-500 dark:bg-rose-400";
  if (h.compare?.includes(index)) return "bg-amber-500 dark:bg-amber-400";
  if (h.pivot === index) return "bg-violet-500 dark:bg-violet-400";
  if (h.set === index) return "bg-sky-500 dark:bg-sky-400";
  if (h.sorted?.includes(index))
    return "bg-emerald-300 dark:bg-emerald-700";
  return "bg-primary/70";
}

export function ArrayRenderer({ frame }: { frame: ArrayFrame }) {
  const { array, highlights: h } = frame;
  const max = Math.max(...array, 1);
  const inWindow = (i: number) =>
    h.window ? i >= h.window[0] && i <= h.window[1] : false;
  const inRange = (i: number) =>
    h.range ? i >= h.range[0] && i <= h.range[1] : false;

  const pointerLabels = new Map<number, string[]>();
  for (const [name, idx] of Object.entries(h.pointers ?? {})) {
    if (idx < 0 || idx >= array.length) continue;
    pointerLabels.set(idx, [...(pointerLabels.get(idx) ?? []), name]);
  }

  return (
    <div className="w-full">
      <div className="flex h-56 items-end gap-1 sm:gap-1.5">
        {array.map((value, i) => (
          <div
            key={i}
            className={cn(
              "flex h-full flex-1 flex-col items-center justify-end rounded-sm",
              inWindow(i) && "bg-sky-100 dark:bg-sky-950",
              !inWindow(i) && inRange(i) && "bg-muted",
            )}
          >
            <motion.div
              layout
              animate={{ height: `${(value / max) * 88}%` }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={cn("w-full rounded-t-sm", barClass(i, h))}
            />
            <span className="mt-1 text-[10px] tabular-nums text-muted-foreground sm:text-xs">
              {value}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 sm:gap-1.5">
        {array.map((_, i) => (
          <div key={i} className="flex-1 text-center">
            {pointerLabels.get(i) && (
              <span className="inline-block rounded bg-foreground px-1 text-[10px] font-semibold text-background">
                {pointerLabels.get(i)!.join("·")}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
