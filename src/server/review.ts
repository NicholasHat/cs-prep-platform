"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { problems, reviewState } from "@/db/schema";
import { review, toLocalDateString } from "@/lib/srs";

/** Problems due for spaced review today (or overdue), most overdue first. */
export async function getDueProblems() {
  const today = toLocalDateString(new Date());
  return db
    .select({
      slug: problems.slug,
      title: problems.title,
      category: problems.category,
      difficulty: problems.difficulty,
      leetcodeUrl: problems.leetcodeUrl,
      dueDate: reviewState.dueDate,
      repetitions: reviewState.repetitions,
      intervalDays: reviewState.intervalDays,
    })
    .from(reviewState)
    .innerJoin(problems, eq(problems.slug, reviewState.problemSlug))
    .where(lte(reviewState.dueDate, today))
    .orderBy(asc(reviewState.dueDate));
}

const ratingSchema = z.enum(["again", "hard", "good", "easy"]);

export async function rateProblem(slug: string, ratingInput: string) {
  const rating = ratingSchema.parse(ratingInput);

  const current = await db.query.reviewState.findFirst({
    where: eq(reviewState.problemSlug, slug),
  });
  if (!current) throw new Error(`No review state for problem "${slug}"`);

  const next = review(
    {
      intervalDays: current.intervalDays,
      easeFactor: current.easeFactor,
      repetitions: current.repetitions,
    },
    rating,
  );

  await db
    .update(reviewState)
    .set({
      intervalDays: next.intervalDays,
      easeFactor: next.easeFactor,
      repetitions: next.repetitions,
      dueDate: next.dueDate,
      lastReviewedAt: new Date(),
    })
    .where(eq(reviewState.problemSlug, slug));

  revalidatePath("/review");
  revalidatePath("/");
}
