/**
 * Lazy materialization of the day schedule.
 *
 * Habit rules define recurrence; a `schedule_blocks` row exists only once a
 * block is edited or completed. The day view merges persisted blocks with
 * virtual instances of active rules for that weekday.
 */

export interface HabitRuleLike {
  id: number;
  title: string;
  daysOfWeek: number[]; // 0 = Sunday … 6 = Saturday
  startTime: string; // "HH:MM"
  durationMin: number;
  linkedProblemSlug: string | null;
  active: boolean;
}

export interface BlockLike {
  id: number;
  date: string; // YYYY-MM-DD
  startTime: string;
  durationMin: number;
  title: string;
  habitRuleId: number | null;
  linkedProblemSlug: string | null;
  status: "planned" | "done" | "skipped" | "partial";
  actualMin: number | null;
}

export type DayBlock =
  | ({ kind: "persisted" } & BlockLike)
  | {
      kind: "virtual";
      habitRuleId: number;
      title: string;
      startTime: string;
      durationMin: number;
      linkedProblemSlug: string | null;
    };

/** Weekday (0-6) of a YYYY-MM-DD string, interpreted as a local date. */
export function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function mergeDayBlocks(
  rules: HabitRuleLike[],
  persisted: BlockLike[],
  dateStr: string,
): DayBlock[] {
  const weekday = weekdayOf(dateStr);
  const materializedRuleIds = new Set(
    persisted.map((b) => b.habitRuleId).filter((id) => id !== null),
  );

  const virtual: DayBlock[] = rules
    .filter(
      (r) =>
        r.active &&
        r.daysOfWeek.includes(weekday) &&
        !materializedRuleIds.has(r.id),
    )
    .map((r) => ({
      kind: "virtual",
      habitRuleId: r.id,
      title: r.title,
      startTime: r.startTime,
      durationMin: r.durationMin,
      linkedProblemSlug: r.linkedProblemSlug,
    }));

  const persistedBlocks: DayBlock[] = persisted.map((b) => ({
    kind: "persisted",
    ...b,
  }));

  return [...persistedBlocks, ...virtual].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
}
