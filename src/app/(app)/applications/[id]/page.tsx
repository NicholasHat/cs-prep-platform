import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Trash2 } from "lucide-react";
import { CompanyReportPanel } from "@/components/applications/company-report-panel";
import { CoverLetterPanel } from "@/components/applications/cover-letter-panel";
import { StatusPipeline } from "@/components/applications/status-pipeline";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TIER_LABELS, type ApplicationStatus } from "@/lib/internships/status";
import {
  addApplicationEvent,
  deleteApplication,
  getApplication,
  getCompanyReport,
  getProfile,
  getTemplates,
  updateApplication,
} from "@/server/applications";

export const metadata = { title: "Application" };
export const dynamic = "force-dynamic";

export default async function ApplicationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) notFound();

  const app = await getApplication(id);
  if (!app) notFound();

  const [templates, profile, report] = await Promise.all([
    getTemplates(),
    getProfile(),
    getCompanyReport(app.company),
  ]);

  const profileText = [
    profile?.fullName && `Name: ${profile.fullName}`,
    profile?.school && `School: ${profile.school}`,
    profile?.gradYear && `Graduating: ${profile.gradYear}`,
    profile?.links && `Links: ${profile.links}`,
    profile?.highlights && `Highlights:\n${profile.highlights}`,
    profile?.resumeText && `Resume:\n${profile.resumeText}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const updateWithId = updateApplication.bind(null, id);
  const addEventWithId = addApplicationEvent.bind(null, id);
  const deleteWithId = deleteApplication.bind(null, id);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/applications"
            className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" /> All applications
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {app.company}
          </h1>
          <p className="text-sm text-muted-foreground">{app.role}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TIER_LABELS[app.tier] ?? app.tier}</Badge>
          {app.jobUrl && (
            <a href={app.jobUrl} target="_blank" rel="noreferrer">
              <Button variant="outline" size="sm" className="gap-1">
                Posting <ExternalLink className="size-3.5" />
              </Button>
            </a>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <StatusPipeline
            applicationId={id}
            status={app.status as ApplicationStatus}
          />
        </CardContent>
      </Card>

      <CoverLetterPanel
        applicationId={id}
        company={app.company}
        role={app.role}
        location={app.location}
        jobUrl={app.jobUrl}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          body: t.body,
          isDefault: t.isDefault,
        }))}
        profileText={profileText}
        initialLetter={app.coverLetter ?? ""}
      />

      <CompanyReportPanel
        company={app.company}
        role={app.role}
        initialReport={report?.body ?? ""}
        generatedAt={report?.generatedAt ?? null}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateWithId} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company">Company</Label>
                <Input id="company" name="company" defaultValue={app.company} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Role</Label>
                <Input id="role" name="role" defaultValue={app.role} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={app.location ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tier">Tier</Label>
                <select
                  id="tier"
                  name="tier"
                  defaultValue={app.tier}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  <option value={1}>Reach</option>
                  <option value={2}>Target</option>
                  <option value={3}>Volume</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="jobUrl">Posting URL</Label>
                <Input
                  id="jobUrl"
                  name="jobUrl"
                  defaultValue={app.jobUrl ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="referral">Referral</Label>
                <Input
                  id="referral"
                  name="referral"
                  defaultValue={app.referral ?? ""}
                  placeholder="Who referred you?"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="appliedAt">Applied on</Label>
                <Input
                  id="appliedAt"
                  name="appliedAt"
                  type="date"
                  defaultValue={app.appliedAt ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  defaultValue={app.deadline ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextAction">Next action</Label>
                <Input
                  id="nextAction"
                  name="nextAction"
                  defaultValue={app.nextAction ?? ""}
                  placeholder="e.g. follow up with recruiter"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nextActionDate">Next action date</Label>
                <Input
                  id="nextActionDate"
                  name="nextActionDate"
                  type="date"
                  defaultValue={app.nextActionDate ?? ""}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={app.notes ?? ""}
                placeholder="Recruiter names, interview feedback, prep reminders…"
                className="min-h-28"
              />
            </div>
            <Button type="submit" size="sm">
              Save details
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action={addEventWithId} className="flex flex-wrap gap-2">
            <select
              name="kind"
              defaultValue="note"
              className="h-9 rounded-md border bg-transparent px-3 text-sm"
            >
              <option value="note">Note</option>
              <option value="interview">Interview</option>
              <option value="follow_up">Follow-up</option>
            </select>
            <Input
              name="detail"
              placeholder="What happened?"
              className="min-w-[200px] flex-1"
            />
            <Button type="submit" variant="outline" size="sm">
              Log
            </Button>
          </form>

          <div className="space-y-2">
            {app.events.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 border-l-2 border-border pl-3 text-sm"
              >
                <Badge variant="outline" className="shrink-0 text-xs">
                  {e.kind.replace(/_/g, " ")}
                </Badge>
                <span className="min-w-0 flex-1">{e.detail}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {e.at.toLocaleDateString()}
                </span>
              </div>
            ))}
            {app.events.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing logged yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <form action={deleteWithId}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" /> Delete this application
        </Button>
      </form>
    </div>
  );
}
