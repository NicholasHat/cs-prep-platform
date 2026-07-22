"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { desc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notes, noteTags, tags } from "@/db/schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getNotes(query?: string, tag?: string) {
  const rows = await db.query.notes.findMany({
    where: query
      ? or(ilike(notes.title, `%${query}%`), ilike(notes.body, `%${query}%`))
      : undefined,
    with: { noteTags: { with: { tag: true } }, problem: true },
    orderBy: [desc(notes.updatedAt)],
  });
  if (!tag) return rows;
  return rows.filter((n) => n.noteTags.some((nt) => nt.tag.name === tag));
}

export async function getNote(id: number) {
  const note = await db.query.notes.findFirst({
    where: eq(notes.id, id),
    with: { noteTags: { with: { tag: true } }, problem: true },
  });
  return note ?? null;
}

export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createNote() {
  const [row] = await db
    .insert(notes)
    .values({ title: "Untitled note", body: "" })
    .returning({ id: notes.id });
  revalidatePath("/notes");
  redirect(`/notes/${row.id}`);
}

const noteSchema = z.object({
  title: z.string().min(1).max(300),
  body: z.string().max(100_000),
  topic: z.string().max(200).optional(),
  problemSlug: z.string().max(128).optional(),
  tags: z.string().max(500).optional(),
});

export async function saveNote(id: number, formData: FormData) {
  const parsed = noteSchema.parse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    topic: formData.get("topic") || undefined,
    problemSlug: formData.get("problemSlug") || undefined,
    tags: formData.get("tags") || undefined,
  });

  // Validate the problem link if provided; drop silently if unknown.
  let problemSlug: string | null = null;
  if (parsed.problemSlug) {
    const problem = await db.query.problems.findFirst({
      where: (p, { eq }) => eq(p.slug, parsed.problemSlug!),
    });
    problemSlug = problem?.slug ?? null;
  }

  await db
    .update(notes)
    .set({
      title: parsed.title,
      body: parsed.body,
      topic: parsed.topic ?? null,
      problemSlug,
      updatedAt: new Date(),
    })
    .where(eq(notes.id, id));

  // Sync tags: parse "a, b, c", upsert each, replace the join rows.
  const names = [
    ...new Set(
      (parsed.tags ?? "")
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  await db.delete(noteTags).where(eq(noteTags.noteId, id));
  for (const name of names) {
    const [tag] = await db
      .insert(tags)
      .values({ name })
      .onConflictDoUpdate({ target: tags.name, set: { name } })
      .returning({ id: tags.id });
    await db.insert(noteTags).values({ noteId: id, tagId: tag.id });
  }

  revalidatePath("/notes");
  revalidatePath(`/notes/${id}`);
}

export async function deleteNote(id: number) {
  await db.delete(notes).where(eq(notes.id, id));
  revalidatePath("/notes");
  redirect("/notes");
}
