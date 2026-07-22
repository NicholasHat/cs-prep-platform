import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toLocalDateString } from "@/lib/srs";
import { cn } from "@/lib/utils";
import { getMonthData } from "@/server/schedule";

export const metadata = { title: "Calendar" };
export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function parseMonth(param: string | undefined): { year: number; month: number } {
  const m = /^(\d{4})-(\d{2})$/.exec(param ?? "");
  if (m) return { year: Number(m[1]), month: Number(m[2]) };
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

const pad = (n: number) => String(n).padStart(2, "0");

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const { year, month } = parseMonth(monthParam);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = `${year}-${pad(month)}-01`;
  const lastDay = `${year}-${pad(month)}-${pad(daysInMonth)}`;
  const startWeekday = new Date(year, month - 1, 1).getDay();
  const today = toLocalDateString(new Date());

  const data = await getMonthData(firstDay, lastDay);

  const prev = month === 1 ? `${year - 1}-12` : `${year}-${pad(month - 1)}`;
  const next = month === 12 ? `${year + 1}-01` : `${year}-${pad(month + 1)}`;
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString(
    undefined,
    { month: "long", year: "numeric" },
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{monthLabel}</h1>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/calendar?month=${prev}`} aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/calendar">This month</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/calendar?month=${next}`} aria-label="Next month">
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dateStr = `${year}-${pad(month)}-${pad(i + 1)}`;
              const d = data[dateStr];
              const isToday = dateStr === today;
              const isPast = dateStr < today;
              const missed = isPast && d ? d.planned : 0;
              return (
                <Link
                  key={dateStr}
                  href={`/schedule?date=${dateStr}`}
                  className={cn(
                    "flex min-h-20 flex-col rounded-md border p-1.5 text-sm transition-colors hover:bg-muted/60",
                    isToday && "border-primary",
                    dateStr > today && "opacity-60",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      isToday
                        ? "font-semibold text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {i + 1}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] leading-tight">
                    {d?.attempts ? (
                      <span className="text-sky-700 dark:text-sky-400">
                        {d.attempts} solve{d.attempts === 1 ? "" : "s"}
                      </span>
                    ) : null}
                    {d?.done ? (
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {d.done} done
                      </span>
                    ) : null}
                    {d?.partial ? (
                      <span className="text-amber-700 dark:text-amber-400">
                        {d.partial} partial
                      </span>
                    ) : null}
                    {d?.skipped ? (
                      <span className="text-muted-foreground">
                        {d.skipped} skipped
                      </span>
                    ) : null}
                    {missed ? (
                      <span className="text-rose-700 dark:text-rose-400">
                        {missed} missed
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Solves are logged attempts; done / partial / skipped are schedule
            blocks. &ldquo;Missed&rdquo; are past blocks still marked planned.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
