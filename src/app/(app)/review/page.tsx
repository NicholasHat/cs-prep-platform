import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDueProblems, rateProblem } from "@/server/review";

export const metadata = { title: "Review" };
export const dynamic = "force-dynamic";

const RATINGS = [
  { value: "again", label: "Again", hint: "Blanked" },
  { value: "hard", label: "Hard", hint: "Struggled" },
  { value: "good", label: "Good", hint: "Got it" },
  { value: "easy", label: "Easy", hint: "Instant" },
] as const;

export default async function ReviewPage() {
  const due = await getDueProblems();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Practice prep
        </h1>
        <p className="text-sm text-muted-foreground">
          {due.length === 0
            ? "Nothing due — you're caught up."
            : `${due.length} problem${due.length === 1 ? "" : "s"} due for review. Re-solve each from scratch, then rate your recall.`}
        </p>
      </div>

      {due.map((p) => (
        <Card key={p.slug}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">
              <Link href={`/problems/${p.slug}`} className="hover:underline">
                {p.title}
              </Link>
            </CardTitle>
            <div className="flex items-center gap-3">
              <DifficultyBadge difficulty={p.difficulty} />
              <a
                href={p.leetcodeUrl}
                target="_blank"
                rel="noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Open ${p.title} on LeetCode`}
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              {p.category} · due {p.dueDate}
              {p.repetitions > 0 &&
                ` · ${p.repetitions} successful review${p.repetitions === 1 ? "" : "s"}`}
            </p>
            <div className="flex flex-wrap gap-2">
              {RATINGS.map((r) => (
                <form
                  key={r.value}
                  action={async () => {
                    "use server";
                    await rateProblem(p.slug, r.value);
                  }}
                >
                  <Button type="submit" variant="outline" size="sm">
                    {r.label}
                    <span className="ml-1 text-xs text-muted-foreground">
                      {r.hint}
                    </span>
                  </Button>
                </form>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
