import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BlockActions } from "@/components/schedule/block-actions";
import { HabitManager } from "@/components/schedule/habit-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toLocalDateString } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { createBlock, getDaySchedule } from "@/server/schedule";

export const metadata = { title: "Schedule" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  partial: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  skipped: "bg-muted text-muted-foreground",
};

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

function formatDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const today = toLocalDateString(new Date());
  const day = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date! : today;

  const blocks = await getDaySchedule(day);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatDay(day)}
          {day === today && (
            <span className="ml-2 text-base font-normal text-muted-foreground">
              today
            </span>
          )}
        </h1>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/schedule?date=${shiftDate(day, -1)}`}
              aria-label="Previous day"
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          {day !== today && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/schedule">Today</Link>
            </Button>
          )}
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/schedule?date=${shiftDate(day, 1)}`}
              aria-label="Next day"
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {blocks.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nothing scheduled. Add a block below or set up a recurring habit.
            </p>
          )}
          {blocks.map((b) => {
            const status = b.kind === "persisted" ? b.status : "planned";
            return (
              <div
                key={b.kind === "persisted" ? `b-${b.id}` : `v-${b.habitRuleId}`}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-md border px-3 py-2",
                  status === "skipped" && "opacity-60",
                )}
              >
                <span className="w-14 font-mono text-sm tabular-nums text-muted-foreground">
                  {b.startTime}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium">{b.title}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {b.kind === "persisted" && b.status === "partial"
                      ? `${b.actualMin ?? 0}/${b.durationMin}m`
                      : `${b.durationMin}m`}
                  </span>
                  {b.linkedProblemSlug && (
                    <Link
                      href={`/problems/${b.linkedProblemSlug}`}
                      className="ml-2 text-xs text-muted-foreground underline hover:text-foreground"
                    >
                      problem
                    </Link>
                  )}
                </div>
                {status !== "planned" && (
                  <Badge variant="secondary" className={STATUS_STYLES[status]}>
                    {status}
                  </Badge>
                )}
                <BlockActions
                  target={
                    b.kind === "persisted"
                      ? { kind: "persisted", id: b.id }
                      : { kind: "virtual", ruleId: b.habitRuleId, date: day }
                  }
                  status={status}
                />
              </div>
            );
          })}

          <form
            action={createBlock}
            className="flex flex-wrap items-end gap-3 border-t pt-4"
          >
            <input type="hidden" name="date" value={day} />
            <div className="min-w-40 flex-1 space-y-1">
              <Label htmlFor="block-title">Add a block</Label>
              <Input
                id="block-title"
                name="title"
                required
                placeholder="e.g. Mock interview"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="block-start">Start</Label>
              <Input
                id="block-start"
                name="startTime"
                type="time"
                required
                defaultValue="18:00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="block-duration">Minutes</Label>
              <Input
                id="block-duration"
                name="durationMin"
                type="number"
                min={5}
                max={600}
                required
                defaultValue={45}
                className="w-24"
              />
            </div>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <HabitManager />
    </div>
  );
}
