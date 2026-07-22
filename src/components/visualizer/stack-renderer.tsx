"use client";

import { AnimatePresence, motion } from "motion/react";
import type { StackFrame } from "@/lib/visualizer/types";

export function StackRenderer({ frame }: { frame: StackFrame }) {
  return (
    <div className="grid min-h-64 gap-6 sm:grid-cols-2">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Call stack
        </p>
        <div className="flex min-h-40 flex-col-reverse justify-start gap-1.5">
          <AnimatePresence initial={false}>
            {frame.stack.map((entry, i) => (
              <motion.div
                key={`${i}-${entry}`}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-md border bg-card px-3 py-1.5 font-mono text-xs"
              >
                <span className="mr-2 text-muted-foreground">{i}</span>
                {entry}
              </motion.div>
            ))}
          </AnimatePresence>
          {frame.stack.length === 0 && (
            <p className="text-sm text-muted-foreground">empty</p>
          )}
        </div>
        <p className="mb-1 mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Current
        </p>
        <p className="font-mono text-sm">{frame.current}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Results ({frame.results.length})
        </p>
        <div className="flex flex-wrap gap-1.5">
          {frame.results.map((r, i) => (
            <span
              key={i}
              className="rounded-md bg-emerald-100 px-2 py-0.5 font-mono text-xs text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
