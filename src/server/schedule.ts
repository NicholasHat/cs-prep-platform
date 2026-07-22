"use server";

import { revalidatePath } from "next/cache";
import { and, asc, between, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { attempts, habitRules, scheduleBlocks } from "@/db/schema";
import { mergeDayBlocks, type DayBlock } from "@/lib/schedule";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getHabitRules() {
  return db.select().from(habitRules).orderBy(asc(habitRules.startTime));
}

export async function getDaySchedule(dateStr: string): Promise<DayBlock[]> {
  const [rules, persisted] = await Promise.all([
    getHabitRules(),
    db
      .select()
      .from(scheduleBlocks)
      .where(eq(scheduleBlocks.date, dateStr))
      .orderBy(asc(scheduleBlocks.startTime)),
  ]);
  return mergeDayBlocks(rules, persisted, dateStr);
}

export interface CalendarDay {
  done: number;
  partial: number;
  skipped: number;
  planned: number;
  attempts: number;
}

/** Per-day rollup of block outcomes and attempts for a month. */
export async function getMonthData(
  firstDay: string, // YYYY-MM-01
  lastDay: string,
): Promise<Record<string, CalendarDay>> {
  const [blocks, attemptRows] = await Promise.all([
    db
      .select({
        date: scheduleBlocks.date,
        status: scheduleBlocks.status,
        n: sql<number>`count(*)::int`,
      })
      .from(scheduleBlocks)
      .where(between(scheduleBlocks.date, firstDay, lastDay))
      .groupBy(scheduleBlocks.date, scheduleBlocks.status),
    db
      .select({
        date: sql<string>`date(${attempts.date})::text`,
        n: sql<number>`count(*)::int`,
      })
      .from(attempts)
      .where(
        sql`date(${attempts.date}) between ${firstDay}::date and ${lastDay}::date`,
      )
      .groupBy(sql`date(${attempts.date})`),
  ]);

  const days: Record<string, CalendarDay> = {};
  const day = (d: string) =>
    (days[d] ??= { done: 0, partial: 0, skipped: 0, planned: 0, attempts: 0 });

  for (const b of blocks) day(b.date)[b.status] += b.n;
  for (const a of attemptRows) day(a.date).attempts += a.n;
  return days;
}

// ---------------------------------------------------------------------------
// Habit rule mutations
// ---------------------------------------------------------------------------

const habitSchema = z.object({
  title: z.string().min(1).max(200),
  daysOfWeek: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.coerce.number().int().min(5).max(600),
});

export async function createHabitRule(formData: FormData) {
  const parsed = habitSchema.parse({
    title: formData.get("title"),
    daysOfWeek: formData.getAll("daysOfWeek"),
    startTime: formData.get("startTime"),
    durationMin: formData.get("durationMin"),
  });
  await db.insert(habitRules).values(parsed);
  revalidateSchedule();
}

export async function toggleHabitRule(id: number, active: boolean) {
  await db.update(habitRules).set({ active }).where(eq(habitRules.id, id));
  revalidateSchedule();
}

export async function deleteHabitRule(id: number) {
  await db.delete(habitRules).where(eq(habitRules.id, id));
  revalidateSchedule();
}

// ---------------------------------------------------------------------------
// Block mutations
// ---------------------------------------------------------------------------

const blockSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().min(1).max(200),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.coerce.number().int().min(5).max(600),
});

export async function createBlock(formData: FormData) {
  const parsed = blockSchema.parse({
    date: formData.get("date"),
    title: formData.get("title"),
    startTime: formData.get("startTime"),
    durationMin: formData.get("durationMin"),
  });
  await db.insert(scheduleBlocks).values(parsed);
  revalidateSchedule();
}

const completionSchema = z.object({
  status: z.enum(["done", "skipped", "partial", "planned"]),
  actualMin: z.coerce.number().int().min(0).max(600).optional(),
});

export async function completeBlock(
  id: number,
  statusInput: string,
  actualMin?: number,
) {
  const { status, actualMin: actual } = completionSchema.parse({
    status: statusInput,
    actualMin,
  });
  const [block] = await db
    .select()
    .from(scheduleBlocks)
    .where(eq(scheduleBlocks.id, id));
  if (!block) throw new Error("Block not found");

  await db
    .update(scheduleBlocks)
    .set({
      status,
      actualMin:
        status === "done"
          ? (actual ?? block.durationMin)
          : status === "partial"
            ? (actual ?? null)
            : null,
      completedAt: status === "planned" ? null : new Date(),
    })
    .where(eq(scheduleBlocks.id, id));
  revalidateSchedule();
}

/** Materialize a habit instance for a day and set its completion in one step. */
export async function completeHabitInstance(
  ruleId: number,
  dateStr: string,
  statusInput: string,
  actualMin?: number,
) {
  const { status, actualMin: actual } = completionSchema.parse({
    status: statusInput,
    actualMin,
  });

  const [rule] = await db
    .select()
    .from(habitRules)
    .where(eq(habitRules.id, ruleId));
  if (!rule) throw new Error("Habit rule not found");

  // Guard against double-materialization (e.g. double-click).
  const existing = await db
    .select({ id: scheduleBlocks.id })
    .from(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.habitRuleId, ruleId),
        eq(scheduleBlocks.date, dateStr),
      ),
    );
  if (existing.length > 0) {
    await completeBlock(existing[0].id, status, actual);
    return;
  }

  await db.insert(scheduleBlocks).values({
    date: dateStr,
    startTime: rule.startTime,
    durationMin: rule.durationMin,
    title: rule.title,
    habitRuleId: rule.id,
    linkedProblemSlug: rule.linkedProblemSlug,
    status,
    actualMin:
      status === "done"
        ? (actual ?? rule.durationMin)
        : status === "partial"
          ? (actual ?? null)
          : null,
    completedAt: status === "planned" ? null : new Date(),
  });
  revalidateSchedule();
}

function revalidateSchedule() {
  revalidatePath("/schedule");
  revalidatePath("/calendar");
  revalidatePath("/");
}
