"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  APPLICATION_STATUSES,
  STATUS_META,
  type ApplicationStatus,
} from "@/lib/internships/status";
import { cn } from "@/lib/utils";
import { setApplicationStatus } from "@/server/applications";

/**
 * The status row doubles as the progress indicator: stages up to the current
 * one read as completed, so the funnel position is visible at a glance.
 */
export function StatusPipeline({
  applicationId,
  status,
}: {
  applicationId: number;
  status: ApplicationStatus;
}) {
  const [pending, startTransition] = useTransition();

  const change = (next: ApplicationStatus) => {
    if (next === status) return;
    startTransition(async () => {
      await setApplicationStatus(applicationId, next);
      toast.success(`Moved to ${STATUS_META[next].label}.`);
    });
  };

  const order = APPLICATION_STATUSES.filter((s) => STATUS_META[s].inFunnel);
  const currentIndex = order.indexOf(status);

  return (
    <div className="flex flex-wrap gap-1.5">
      {APPLICATION_STATUSES.map((s) => {
        const meta = STATUS_META[s];
        const idx = order.indexOf(s);
        const reached =
          meta.inFunnel && currentIndex >= 0 && idx >= 0 && idx <= currentIndex;
        const isCurrent = s === status;

        return (
          <button
            key={s}
            type="button"
            disabled={pending}
            onClick={() => change(s)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50",
              isCurrent
                ? meta.className
                : reached
                  ? "bg-muted text-foreground"
                  : "bg-transparent text-muted-foreground hover:bg-muted",
              !isCurrent && "border",
            )}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
