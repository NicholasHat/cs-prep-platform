"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { celebrate, celebrateBig } from "@/components/rewards/celebrate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setProblemStatus } from "@/server/problems";

export const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  attempted: "Attempted",
  solved: "Solved",
  needs_review: "Needs review",
};

export function StatusSelect({
  slug,
  status,
}: {
  slug: string;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Select
      value={status}
      disabled={isPending}
      onValueChange={(value) =>
        startTransition(async () => {
          try {
            const { categoryCompleted } = await setProblemStatus(slug, value);
            if (categoryCompleted) {
              celebrateBig();
              toast.success("Category complete! 🎉");
            } else if (value === "solved") {
              celebrate();
            }
          } catch {
            toast.error("Failed to update status");
          }
        })
      }
    >
      <SelectTrigger size="sm" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
