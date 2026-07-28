import Link from "next/link";
import { AlertCircle, FileText, Plus, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FUNNEL_STAGES,
  STATUS_META,
  TIER_LABELS,
  type ApplicationStatus,
} from "@/lib/internships/status";
import { cn } from "@/lib/utils";
import {
  createApplication,
  getApplications,
  getDueSoon,
  getFreshListingCount,
  getFunnelCounts,
} from "@/server/applications";

export const metadata = { title: "Applications" };
export const dynamic = "force-dynamic";

export default async function ApplicationsPage() {
  const [apps, funnel, dueSoon, fresh] = await Promise.all([
    getApplications(),
    getFunnelCounts(),
    getDueSoon(),
    getFreshListingCount(),
  ]);

  const active = apps.filter(
    (a) => !["rejected", "withdrawn", "ghosted"].includes(a.status),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="text-sm text-muted-foreground">
            {apps.length} tracked · {active.length} still live
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/applications/letters">
            <Button variant="outline" size="sm" className="gap-1">
              <FileText className="size-4" /> Cover letters
            </Button>
          </Link>
          <Link href="/applications/listings">
            <Button size="sm" className="gap-1">
              <Search className="size-4" /> Browse listings
              {fresh > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {fresh} new
                </Badge>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Funnel strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {FUNNEL_STAGES.map((stage) => (
          <Card key={stage}>
            <CardContent className="px-4 py-3">
              <div className="text-2xl font-semibold tabular-nums">
                {funnel[stage] ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">
                {STATUS_META[stage].label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dueSoon.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="size-4 text-amber-500" /> Needs attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {dueSoon.map((a) => (
              <Link
                key={a.id}
                href={`/applications/${a.id}`}
                className="flex flex-wrap items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
              >
                <span className="font-medium">{a.company}</span>
                <span className="text-muted-foreground">{a.role}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {a.nextAction ??
                    (a.deadline ? `Deadline ${a.deadline}` : "Follow up")}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Add one by hand</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action={createApplication}
            className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <Input name="company" placeholder="Company" required />
            <Input name="role" placeholder="Role" required />
            <Input name="jobUrl" placeholder="Posting URL (optional)" />
            <Button type="submit" className="gap-1">
              <Plus className="size-4" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {apps.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Sparkles className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nothing tracked yet. Sync the listing feeds and save the roles you
              want to go after.
            </p>
            <Link href="/applications/listings">
              <Button size="sm">Browse listings</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Next action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => {
                  const meta = STATUS_META[a.status as ApplicationStatus];
                  return (
                    <TableRow key={a.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Link
                          href={`/applications/${a.id}`}
                          className="hover:underline"
                        >
                          {a.company}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <Link href={`/applications/${a.id}`}>{a.role}</Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIER_LABELS[a.tier] ?? a.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                            meta?.className,
                          )}
                        >
                          {meta?.label ?? a.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.appliedAt ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.nextAction ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
