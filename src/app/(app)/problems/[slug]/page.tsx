import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AttemptForm } from "@/components/problems/attempt-form";
import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { StatusSelect } from "@/components/problems/status-select";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getProblemDetail, saveWalkthrough } from "@/server/problems";

export const dynamic = "force-dynamic";

const OUTCOME_LABELS: Record<string, string> = {
  solved: "Solved",
  solved_with_help: "Solved with help",
  unsolved: "Couldn't solve",
};

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const problem = await getProblemDetail(slug);
  if (!problem) notFound();

  const w = problem.walkthrough;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/problems"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All problems
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {problem.title}
          </h1>
          <DifficultyBadge difficulty={problem.difficulty} />
          <span className="text-sm text-muted-foreground">
            {problem.category}
          </span>
          <a
            href={problem.leetcodeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            LeetCode <ExternalLink className="size-3.5" />
          </a>
          <div className="ml-auto">
            <StatusSelect
              slug={problem.slug}
              status={problem.status?.status ?? "not_started"}
            />
          </div>
        </div>
        {problem.reviewState && (
          <p className="mt-2 text-sm text-muted-foreground">
            Next review due {problem.reviewState.dueDate} ·{" "}
            {problem.reviewState.repetitions} successful review
            {problem.reviewState.repetitions === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <Tabs defaultValue="practice">
        <TabsList>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="walkthrough">Walkthrough</TabsTrigger>
        </TabsList>

        <TabsContent value="practice" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Log an attempt</CardTitle>
            </CardHeader>
            <CardContent>
              <AttemptForm slug={problem.slug} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                History ({problem.attempts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {problem.attempts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No attempts yet. Start the timer, solve it on LeetCode, then
                  log the result.
                </p>
              ) : (
                <ul className="space-y-3">
                  {problem.attempts.map((a) => (
                    <li key={a.id} className="border-b pb-3 text-sm last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">
                          {OUTCOME_LABELS[a.outcome]}
                        </span>
                        <span className="text-muted-foreground">
                          {a.date.toLocaleDateString()}
                        </span>
                        {a.durationMin != null && (
                          <span className="text-muted-foreground">
                            {a.durationMin}m
                          </span>
                        )}
                      </div>
                      {a.note && (
                        <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                          {a.note}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="walkthrough" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your walkthrough</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={saveWalkthrough.bind(null, problem.slug)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Pattern</Label>
                    <Input
                      id="pattern"
                      name="pattern"
                      placeholder="e.g. Sliding window over char counts"
                      defaultValue={w?.pattern ?? ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="complexity">Complexity</Label>
                    <Input
                      id="complexity"
                      name="complexity"
                      placeholder="e.g. O(n) time, O(k) space"
                      defaultValue={w?.complexity ?? ""}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="approach">Approach</Label>
                  <Textarea
                    id="approach"
                    name="approach"
                    rows={4}
                    placeholder="How do you recognize and solve it?"
                    defaultValue={w?.approach ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pitfalls">Pitfalls</Label>
                  <Textarea
                    id="pitfalls"
                    name="pitfalls"
                    rows={3}
                    placeholder="Edge cases and mistakes to avoid"
                    defaultValue={w?.pitfalls ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Full explanation (markdown)</Label>
                  <Textarea
                    id="body"
                    name="body"
                    rows={10}
                    defaultValue={w?.body ?? ""}
                  />
                </div>
                <Button type="submit">Save walkthrough</Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
