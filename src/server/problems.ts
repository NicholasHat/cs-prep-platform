"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  attempts,
  problems,
  problemStatus,
  reviewState,
  walkthroughs,
} from "@/db/schema";
import { toLocalDateString } from "@/lib/srs";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getProblemList() {
  const rows = await db
    .select({
      slug: problems.slug,
      title: problems.title,
      category: problems.category,
      difficulty: problems.difficulty,
      sortOrder: problems.sortOrder,
      leetcodeUrl: problems.leetcodeUrl,
      status: problemStatus.status,
      attemptCount: sql<number>`(
        select count(*)::int from ${attempts} a where a.problem_slug = ${problems.slug}
      )`,
      timeSpentMin: sql<number>`(
        select coalesce(sum(a.duration_min), 0)::int from ${attempts} a where a.problem_slug = ${problems.slug}
      )`,
      dueDate: reviewState.dueDate,
    })
    .from(problems)
    .leftJoin(problemStatus, eq(problemStatus.problemSlug, problems.slug))
    .leftJoin(reviewState, eq(reviewState.problemSlug, problems.slug))
    .orderBy(asc(problems.sortOrder));

  return rows.map((r) => ({ ...r, status: r.status ?? ("not_started" as const) }));
}

export type ProblemListRow = Awaited<ReturnType<typeof getProblemList>>[number];

export async function getProblemDetail(slug: string) {
  const problem = await db.query.problems.findFirst({
    where: eq(problems.slug, slug),
    with: {
      status: true,
      walkthrough: true,
      reviewState: true,
      attempts: { orderBy: (a, { desc }) => [desc(a.date)] },
    },
  });
  return problem ?? null;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

const statusSchema = z.enum([
  "not_started",
  "attempted",
  "solved",
  "needs_review",
]);

export async function setProblemStatus(slug: string, statusInput: string) {
  const status = statusSchema.parse(statusInput);

  await db
    .insert(problemStatus)
    .values({ problemSlug: slug, status, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: problemStatus.problemSlug,
      set: { status, updatedAt: new Date() },
    });

  // Solved / needs-review problems join the spaced-review queue, due today,
  // so the first recall rating schedules them out.
  let categoryCompleted = false;
  if (status === "solved" || status === "needs_review") {
    await ensureReviewEnrollment(slug);
    categoryCompleted = await isCategoryComplete(slug);
  }

  revalidatePath("/problems");
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/review");
  revalidatePath("/");

  return { categoryCompleted };
}

/** True when every problem in this problem's category is solved. */
async function isCategoryComplete(slug: string): Promise<boolean> {
  const result = await db.execute(sql`
    select count(*)::int as remaining
    from problems p
    left join problem_status ps on ps.problem_slug = p.slug
    where p.category = (select category from problems where slug = ${slug})
      and (ps.status is null or ps.status not in ('solved', 'needs_review'))
  `);
  return (result.rows[0]?.remaining as number) === 0;
}

const attemptSchema = z.object({
  durationMin: z.coerce.number().int().min(0).max(600).optional(),
  outcome: z.enum(["solved", "solved_with_help", "unsolved"]),
  note: z.string().max(4000).optional(),
});

export async function logAttempt(slug: string, formData: FormData) {
  const parsed = attemptSchema.parse({
    durationMin: formData.get("durationMin") || undefined,
    outcome: formData.get("outcome"),
    note: formData.get("note") || undefined,
  });

  await db.insert(attempts).values({
    problemSlug: slug,
    durationMin: parsed.durationMin,
    outcome: parsed.outcome,
    note: parsed.note,
    date: new Date(),
  });

  // A solved attempt promotes the status (never demotes needs_review).
  if (parsed.outcome !== "unsolved") {
    const current = await db.query.problemStatus.findFirst({
      where: eq(problemStatus.problemSlug, slug),
    });
    if (current?.status !== "needs_review") {
      await db
        .insert(problemStatus)
        .values({ problemSlug: slug, status: "solved", updatedAt: new Date() })
        .onConflictDoUpdate({
          target: problemStatus.problemSlug,
          set: { status: "solved", updatedAt: new Date() },
        });
    }
    await ensureReviewEnrollment(slug);
  } else {
    await db
      .insert(problemStatus)
      .values({ problemSlug: slug, status: "attempted", updatedAt: new Date() })
      .onConflictDoNothing();
  }

  revalidatePath("/problems");
  revalidatePath(`/problems/${slug}`);
  revalidatePath("/review");
  revalidatePath("/");
}

const walkthroughSchema = z.object({
  pattern: z.string().max(2000).optional(),
  approach: z.string().max(8000).optional(),
  complexity: z.string().max(2000).optional(),
  pitfalls: z.string().max(8000).optional(),
  body: z.string().max(50000).optional(),
});

export async function saveWalkthrough(slug: string, formData: FormData) {
  const parsed = walkthroughSchema.parse({
    pattern: formData.get("pattern") || undefined,
    approach: formData.get("approach") || undefined,
    complexity: formData.get("complexity") || undefined,
    pitfalls: formData.get("pitfalls") || undefined,
    body: formData.get("body") || undefined,
  });

  await db
    .insert(walkthroughs)
    .values({ problemSlug: slug, ...parsed, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: walkthroughs.problemSlug,
      set: { ...parsed, updatedAt: new Date() },
    });

  revalidatePath(`/problems/${slug}`);
}

async function ensureReviewEnrollment(slug: string) {
  await db
    .insert(reviewState)
    .values({
      problemSlug: slug,
      dueDate: toLocalDateString(new Date()),
    })
    .onConflictDoNothing();
}
