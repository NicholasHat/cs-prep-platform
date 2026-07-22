import { toLocalDateString } from "@/lib/srs";
import { cn } from "@/lib/utils";

/** GitHub-style activity heatmap: `weeks` columns × 7 rows, ending today. */
export function ActivityHeatmap({
  byDay,
  weeks = 20,
}: {
  byDay: Record<string, number>;
  weeks?: number;
}) {
  const today = new Date();
  // Start on the Sunday `weeks` weeks back so columns align to weekdays.
  const start = new Date(today);
  start.setDate(start.getDate() - (weeks * 7 - 1) - start.getDay());

  const columns: { date: string; count: number; future: boolean }[][] = [];
  const cursor = new Date(start);
  while (cursor <= today || cursor.getDay() !== 0) {
    const week = Math.floor(
      (cursor.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000),
    );
    if (!columns[week]) columns[week] = [];
    const key = toLocalDateString(cursor);
    columns[week].push({
      date: key,
      count: byDay[key] ?? 0,
      future: cursor > today,
    });
    cursor.setDate(cursor.getDate() + 1);
    if (columns.length > weeks + 1) break;
  }

  const level = (count: number) =>
    count === 0 ? 0 : count <= 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;

  const levelClasses = [
    "bg-muted",
    "bg-emerald-200 dark:bg-emerald-900",
    "bg-emerald-400 dark:bg-emerald-700",
    "bg-emerald-500 dark:bg-emerald-600",
    "bg-emerald-700 dark:bg-emerald-400",
  ];

  return (
    <div className="flex gap-[3px] overflow-x-auto">
      {columns.map((week, i) => (
        <div key={i} className="flex flex-col gap-[3px]">
          {week.map((day) => (
            <div
              key={day.date}
              title={`${day.date}: ${day.count} ${day.count === 1 ? "activity" : "activities"}`}
              className={cn(
                "size-3 rounded-[2px]",
                day.future ? "opacity-0" : levelClasses[level(day.count)],
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
