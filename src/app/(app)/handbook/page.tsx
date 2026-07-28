import Link from "next/link";
import { BookOpen, Clock, Search, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CHAPTERS, chaptersByTrack, searchChapters } from "@/content/handbook";
import { TRACKS } from "@/content/handbook/types";

export const metadata = { title: "Interview Handbook" };

export default async function HandbookPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const matches = q ? searchChapters(q) : null;
  const grouped = chaptersByTrack();

  const totalQuestions = CHAPTERS.reduce(
    (sum, c) => sum + c.questions.length,
    0,
  );
  const totalMinutes = CHAPTERS.reduce((sum, c) => sum + c.estMinutes, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Interview Handbook
          </h1>
          <p className="text-sm text-muted-foreground">
            {CHAPTERS.length} chapters · {totalQuestions} interview questions ·
            about {Math.round(totalMinutes / 60)} hours of reading
          </p>
        </div>
        <Link href="/handbook/drill">
          <Button size="sm" className="gap-1">
            <Zap className="size-4" /> Drill questions
          </Button>
        </Link>
      </div>

      <form className="flex gap-2" action="/handbook">
        <div className="relative flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search the handbook — idempotency, dijkstra, STAR…"
            className="pl-8"
          />
        </div>
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {matches ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {matches.length} chapter{matches.length === 1 ? "" : "s"} mention
            &ldquo;{q}&rdquo;
          </p>
          {matches.map((c) => (
            <Link key={c.slug} href={`/handbook/${c.slug}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{c.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{c.summary}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
          {matches.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nothing matched. Try a broader term.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {TRACKS.map((track) => {
            const chapters = grouped[track.id] ?? [];
            if (chapters.length === 0) return null;
            return (
              <section key={track.id} className="space-y-3">
                <div>
                  <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                    <BookOpen className="size-4" /> {track.label}
                  </h2>
                  <p className="text-sm text-muted-foreground">{track.blurb}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {chapters.map((c) => (
                    <Link key={c.slug} href={`/handbook/${c.slug}`}>
                      <Card className="h-full transition-colors hover:bg-muted/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{c.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {c.summary}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {c.tags.slice(0, 4).map((t) => (
                              <Badge
                                key={t}
                                variant="outline"
                                className="text-xs"
                              >
                                {t}
                              </Badge>
                            ))}
                            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="size-3" /> {c.estMinutes}m
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
