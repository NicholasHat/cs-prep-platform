import Link from "next/link";
import { Briefcase, Flame, ListChecks, RefreshCw } from "lucide-react";
import { ActivityHeatmap } from "@/components/dashboard/activity-heatmap";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getApplications, getDueSoon } from "@/server/applications";
import { getDueProblems } from "@/server/review";
import { getActivity, getCategoryProgress } from "@/server/stats";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [categories, activity, due, apps, dueSoon] = await Promise.all([
    getCategoryProgress(),
    getActivity(),
    getDueProblems(),
    getApplications(),
    getDueSoon(),
  ]);

  const liveApps = apps.filter(
    (a) => !["rejected", "withdrawn", "ghosted"].includes(a.status),
  );

  const total = categories.reduce((s, c) => s + c.total, 0);
  const solved = categories.reduce((s, c) => s + c.solved, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <ListChecks className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {solved}
              <span className="text-base font-normal text-muted-foreground">
                /{total}
              </span>
            </div>
            <Progress className="mt-2" value={total ? (solved / total) * 100 : 0} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Streak</CardTitle>
            <Flame className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {activity.streak}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                day{activity.streak === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Any logged attempt or completed block keeps it alive.
            </p>
          </CardContent>
        </Card>

        <Link href="/review">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Due for review</CardTitle>
              <RefreshCw className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{due.length}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                {due.length === 0
                  ? "All caught up."
                  : "Head to Review to knock these out."}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/applications">
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications
              </CardTitle>
              <Briefcase className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{liveApps.length}</div>
              <p className="mt-2 text-xs text-muted-foreground">
                {apps.length === 0
                  ? "Sync the listing feeds to get started."
                  : dueSoon.length > 0
                    ? `${dueSoon.length} need${dueSoon.length === 1 ? "s" : ""} attention`
                    : "Nothing overdue."}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap byDay={activity.byDay} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Progress by category</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {categories.map((c) => (
            <div key={c.category} className="flex items-center gap-4">
              <span className="w-56 shrink-0 truncate text-sm">
                {c.category}
              </span>
              <Progress
                className="flex-1"
                value={c.total ? (c.solved / c.total) * 100 : 0}
              />
              <span className="w-12 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {c.solved}/{c.total}
              </span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No problems found — run <code>npm run db:seed</code> to load the
              NeetCode 150.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
