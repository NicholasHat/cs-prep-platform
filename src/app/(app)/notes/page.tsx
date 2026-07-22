import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createNote, getAllTags, getNotes } from "@/server/notes";

export const metadata = { title: "Notes" };
export const dynamic = "force-dynamic";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const { q, tag } = await searchParams;
  const [allNotes, allTags] = await Promise.all([
    getNotes(q, tag),
    getAllTags(),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Notes</h1>
        <form action={createNote}>
          <Button type="submit" size="sm" className="gap-1">
            <Plus className="size-4" /> New note
          </Button>
        </form>
      </div>

      <form className="flex gap-2" action="/notes">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search notes…"
            className="pl-8"
          />
        </div>
        {tag && <input type="hidden" name="tag" value={tag} />}
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link href={q ? `/notes?q=${encodeURIComponent(q)}` : "/notes"}>
            <Badge variant={tag ? "outline" : "default"}>all</Badge>
          </Link>
          {allTags.map((t) => (
            <Link
              key={t.id}
              href={`/notes?tag=${encodeURIComponent(t.name)}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            >
              <Badge variant={tag === t.name ? "default" : "outline"}>
                {t.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {allNotes.map((n) => (
          <Link key={n.id} href={`/notes/${n.id}`}>
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="pb-2">
                <CardTitle className="line-clamp-1 text-base">
                  {n.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p
                  className={cn(
                    "line-clamp-3 text-sm text-muted-foreground",
                    !n.body && "italic",
                  )}
                >
                  {n.body || "Empty note"}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {n.problem && (
                    <Badge variant="secondary">{n.problem.title}</Badge>
                  )}
                  {n.topic && <Badge variant="secondary">{n.topic}</Badge>}
                  {n.noteTags.map((nt) => (
                    <Badge key={nt.tagId} variant="outline">
                      {nt.tag.name}
                    </Badge>
                  ))}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {n.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        {allNotes.length === 0 && (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            {q || tag
              ? "No notes match your filters."
              : "No notes yet — create your first one."}
          </p>
        )}
      </div>
    </div>
  );
}
