import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Drill, type DrillCard } from "@/components/handbook/drill";
import { CHAPTERS } from "@/content/handbook";
import { TRACKS } from "@/content/handbook/types";

export const metadata = { title: "Question drill" };

export default function DrillPage() {
  const cards: DrillCard[] = CHAPTERS.flatMap((c) =>
    c.questions.map((qa) => ({
      q: qa.q,
      a: qa.a,
      weak: qa.weak,
      chapterSlug: c.slug,
      chapterTitle: c.title,
      track: c.track,
    })),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link
          href="/handbook"
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Handbook
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Question drill
        </h1>
        <p className="text-sm text-muted-foreground">
          Every interview question in the handbook, shuffled. Say your answer out
          loud before revealing — silently thinking &ldquo;I know this&rdquo; is
          how people get caught out in the real thing.
        </p>
      </div>

      <Drill
        cards={cards}
        tracks={TRACKS.map((t) => ({ id: t.id, label: t.label }))}
      />
    </div>
  );
}
