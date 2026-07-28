import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { Separator } from "@/components/ui/separator";
import { getChapter, neighbors } from "@/content/handbook";
import { TRACKS } from "@/content/handbook/types";
import { getProblemsBySlugs } from "@/server/problems";

// Chapter prose is static, but the "practice these problems" cross-links read
// solve status from Postgres, so the page renders per request like the rest of
// the app rather than baking a DB snapshot at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  return { title: chapter ? chapter.title : "Handbook" };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const chapter = getChapter(slug);
  if (!chapter) notFound();

  const track = TRACKS.find((t) => t.id === chapter.track);
  const { prev, next } = neighbors(chapter.slug);
  const related = chapter.relatedProblems?.length
    ? await getProblemsBySlugs(chapter.relatedProblems)
    : [];

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/handbook"
        className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" /> Handbook
      </Link>

      <div className="lg:flex lg:gap-8">
        {/* Table of contents */}
        <aside className="hidden shrink-0 lg:block lg:w-56">
          <div className="sticky top-6 space-y-1">
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              On this page
            </p>
            {chapter.sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {s.heading}
              </a>
            ))}
            {chapter.questions.length > 0 && (
              <a
                href="#questions"
                className="block rounded px-2 py-1 text-sm font-medium hover:bg-muted"
              >
                Interview questions ({chapter.questions.length})
              </a>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <header className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {track && <Badge variant="secondary">{track.label}</Badge>}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" /> {chapter.estMinutes} min
              </span>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {chapter.title}
            </h1>
            <p className="text-muted-foreground">{chapter.summary}</p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {chapter.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </header>

          <Separator />

          {chapter.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <h2 className="mb-2 text-xl font-semibold tracking-tight">
                {section.heading}
              </h2>
              <Markdown>{section.markdown}</Markdown>
            </section>
          ))}

          {related.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Practice these problems
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {related.map((p) => (
                  <Link key={p.slug} href={`/problems/${p.slug}`}>
                    <Badge
                      variant="outline"
                      className="gap-1 hover:bg-muted"
                    >
                      {p.title}
                      <ExternalLink className="size-3" />
                    </Badge>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          {chapter.questions.length > 0 && (
            <section id="questions" className="scroll-mt-6 space-y-3">
              <h2 className="text-xl font-semibold tracking-tight">
                Interview questions
              </h2>
              <p className="text-sm text-muted-foreground">
                Answer each out loud before expanding it.
              </p>
              {chapter.questions.map((qa, i) => (
                <details
                  key={i}
                  className="group rounded-md border px-4 py-3 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="cursor-pointer list-none text-sm font-medium">
                    <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                    {qa.q}
                  </summary>
                  <div className="mt-3 border-t pt-3">
                    <Markdown>{qa.a}</Markdown>
                    {qa.weak && (
                      <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/5 p-3">
                        <p className="mb-1 text-xs font-semibold tracking-wide text-red-600 uppercase dark:text-red-400">
                          A weak answer sounds like
                        </p>
                        <Markdown className="text-muted-foreground">
                          {qa.weak}
                        </Markdown>
                      </div>
                    )}
                  </div>
                </details>
              ))}
            </section>
          )}

          <Separator />

          <nav className="flex flex-wrap justify-between gap-3 pb-6">
            {prev ? (
              <Link href={`/handbook/${prev.slug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <ArrowLeft className="size-4" /> {prev.title}
                </Button>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/handbook/${next.slug}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  {next.title} <ArrowRight className="size-4" />
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </div>
    </div>
  );
}
