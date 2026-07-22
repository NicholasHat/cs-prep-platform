import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DifficultyBadge } from "@/components/problems/difficulty-badge";
import { StatusSelect } from "@/components/problems/status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProblemList, type ProblemListRow } from "@/server/problems";

export const metadata = { title: "Problems" };
export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const rows = await getProblemList();

  const byCategory = new Map<string, ProblemListRow[]>();
  for (const row of rows) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  const solvedTotal = rows.filter(
    (r) => r.status === "solved" || r.status === "needs_review",
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            NeetCode 150
          </h1>
          <p className="text-sm text-muted-foreground">
            {solvedTotal} of {rows.length} solved
          </p>
        </div>
        <div className="w-48">
          <Progress value={(solvedTotal / rows.length) * 100} />
        </div>
      </div>

      {[...byCategory.entries()].map(([category, problems]) => {
        const solved = problems.filter(
          (p) => p.status === "solved" || p.status === "needs_review",
        ).length;
        return (
          <Card key={category}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {category}{" "}
                <span className="ml-1 font-normal text-muted-foreground">
                  {solved}/{problems.length}
                </span>
              </CardTitle>
              <div className="w-32">
                <Progress value={(solved / problems.length) * 100} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Problem</TableHead>
                    <TableHead className="w-24">Difficulty</TableHead>
                    <TableHead className="w-20 text-right">Attempts</TableHead>
                    <TableHead className="w-20 text-right">Time</TableHead>
                    <TableHead className="w-40">Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((p) => (
                    <TableRow key={p.slug}>
                      <TableCell>
                        <Link
                          href={`/problems/${p.slug}`}
                          className="font-medium hover:underline"
                        >
                          {p.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <DifficultyBadge difficulty={p.difficulty} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.attemptCount || "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p.timeSpentMin ? `${p.timeSpentMin}m` : "—"}
                      </TableCell>
                      <TableCell>
                        <StatusSelect slug={p.slug} status={p.status} />
                      </TableCell>
                      <TableCell>
                        <a
                          href={p.leetcodeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label={`Open ${p.title} on LeetCode`}
                        >
                          <ExternalLink className="size-4" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
