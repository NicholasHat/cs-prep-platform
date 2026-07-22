"use client";

import { useState, useTransition } from "react";
import { Check, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/components/rewards/celebrate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { completeBlock, completeHabitInstance } from "@/server/schedule";

type Target =
  | { kind: "persisted"; id: number }
  | { kind: "virtual"; ruleId: number; date: string };

export function BlockActions({
  target,
  status,
}: {
  target: Target;
  status: "planned" | "done" | "skipped" | "partial";
}) {
  const [isPending, startTransition] = useTransition();
  const [partialOpen, setPartialOpen] = useState(false);
  const [minutes, setMinutes] = useState("");

  const apply = (nextStatus: string, actualMin?: number) =>
    startTransition(async () => {
      try {
        if (target.kind === "persisted") {
          await completeBlock(target.id, nextStatus, actualMin);
        } else {
          await completeHabitInstance(
            target.ruleId,
            target.date,
            nextStatus,
            actualMin,
          );
        }
        if (nextStatus === "done") celebrate();
        setPartialOpen(false);
        setMinutes("");
      } catch {
        toast.error("Failed to update block");
      }
    });

  if (status !== "planned") {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => apply("planned")}
        aria-label="Reset to planned"
      >
        <Undo2 className="size-4" />
      </Button>
    );
  }

  if (partialOpen) {
    return (
      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const n = parseInt(minutes, 10);
          if (!Number.isNaN(n)) apply("partial", n);
        }}
      >
        <Input
          type="number"
          min={1}
          max={600}
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          placeholder="min"
          className="h-8 w-20"
          autoFocus
        />
        <Button type="submit" size="sm" disabled={isPending}>
          Save
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setPartialOpen(false)}
        >
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => apply("done")}
        className="gap-1"
      >
        <Check className="size-4" /> Done
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => setPartialOpen(true)}
      >
        Partial
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={() => apply("skipped")}
        className="gap-1 text-muted-foreground"
      >
        <X className="size-4" /> Skip
      </Button>
    </div>
  );
}
