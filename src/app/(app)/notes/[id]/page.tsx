import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { AiAssistant } from "@/components/notes/ai-assistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/db";
import { deleteNote, getNote, saveNote } from "@/server/notes";

export const dynamic = "force-dynamic";

export default async function NoteEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const [note, problems] = await Promise.all([
    getNote(id),
    db.query.problems.findMany({
      columns: { slug: true, title: true },
      orderBy: (p, { asc }) => [asc(p.sortOrder)],
    }),
  ]);
  if (!note) notFound();

  const tagString = note.noteTags.map((nt) => nt.tag.name).join(", ");

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All notes
        </Link>
        <form action={deleteNote.bind(null, note.id)}>
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form action={saveNote.bind(null, note.id)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                name="title"
                required
                defaultValue={note.title}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="note-body">Body (markdown)</Label>
              <Textarea
                id="note-body"
                name="body"
                rows={16}
                defaultValue={note.body}
                placeholder="Write your notes here…"
                className="font-mono text-sm"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="note-topic">Topic</Label>
                <Input
                  id="note-topic"
                  name="topic"
                  defaultValue={note.topic ?? ""}
                  placeholder="e.g. Sliding window"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="note-problem">Linked problem</Label>
                <Input
                  id="note-problem"
                  name="problemSlug"
                  list="problem-slugs"
                  defaultValue={note.problemSlug ?? ""}
                  placeholder="Start typing a slug…"
                />
                <datalist id="problem-slugs">
                  {problems.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.title}
                    </option>
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label htmlFor="note-tags">Tags</Label>
                <Input
                  id="note-tags"
                  name="tags"
                  defaultValue={tagString}
                  placeholder="comma, separated"
                />
              </div>
            </div>
            <Button type="submit">Save note</Button>
          </form>
        </CardContent>
      </Card>

      <AiAssistant noteBodyId="note-body" />
    </div>
  );
}
