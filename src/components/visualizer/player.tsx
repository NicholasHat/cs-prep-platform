"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  Pause,
  Play,
  RotateCcw,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildTrace } from "@/lib/visualizer/engine";
import { usePlayback } from "@/lib/visualizer/store";
import type { AlgorithmDef } from "@/lib/visualizer/types";
import { ArrayRenderer } from "./array-renderer";
import { GridRenderer } from "./grid-renderer";
import { StackRenderer } from "./stack-renderer";

const SPEEDS = [
  { label: "0.5×", fps: 1 },
  { label: "1×", fps: 2 },
  { label: "2×", fps: 4 },
  { label: "4×", fps: 8 },
  { label: "8×", fps: 16 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function Player({ algorithm }: { algorithm: AlgorithmDef<any> }) {
  const [inputSeed, setInputSeed] = useState(0);
  const input = useMemo(
    () => algorithm.createInput(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [algorithm.id, inputSeed],
  );
  const frames = useMemo(
    () => buildTrace(algorithm.run(input as never)),
    [algorithm, input],
  );

  const {
    cursor,
    playing,
    speed,
    load,
    toggle,
    stepForward,
    stepBack,
    seek,
    reset,
    setSpeed,
    tick,
  } = usePlayback();

  useEffect(() => {
    load(frames);
  }, [frames, load]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(tick, 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed, tick]);

  // Keyboard: space toggles, arrows step.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, select, textarea, [role=combobox]"))
        return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") stepForward();
      else if (e.key === "ArrowLeft") stepBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, stepForward, stepBack]);

  const frame = frames[Math.min(cursor, frames.length - 1)];
  if (!frame) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card p-4 sm:p-6">
        {frame.kind === "array" && <ArrayRenderer frame={frame} />}
        {frame.kind === "grid" && <GridRenderer frame={frame} />}
        {frame.kind === "stack" && <StackRenderer frame={frame} />}
      </div>

      <p
        className="min-h-10 text-sm text-muted-foreground"
        aria-live="polite"
      >
        <span className="mr-2 font-mono text-xs tabular-nums">
          {cursor + 1}/{frames.length}
        </span>
        {frame.note}
      </p>

      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={cursor}
        onChange={(e) => seek(Number(e.target.value))}
        className="w-full accent-primary"
        aria-label="Scrub through steps"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" onClick={stepBack} aria-label="Step back">
          <ChevronsLeft className="size-4" />
        </Button>
        <Button onClick={toggle} className="w-24 gap-1">
          {playing ? (
            <>
              <Pause className="size-4" /> Pause
            </>
          ) : (
            <>
              <Play className="size-4" /> Play
            </>
          )}
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={stepForward}
          aria-label="Step forward"
        >
          <ChevronsRight className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={reset} aria-label="Reset">
          <RotateCcw className="size-4" />
        </Button>

        <Select
          value={String(speed)}
          onValueChange={(v) => setSpeed(Number(v))}
        >
          <SelectTrigger size="sm" className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s) => (
              <SelectItem key={s.fps} value={String(s.fps)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="ml-auto gap-1"
          onClick={() => setInputSeed((s) => s + 1)}
        >
          <Shuffle className="size-4" /> Randomize
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Space to play/pause · ←/→ to step
      </p>
    </div>
  );
}
