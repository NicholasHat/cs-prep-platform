import { ExternalLink, Trash2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  createCertificate,
  deleteCertificate,
  getCertificates,
  updateCertificateProgress,
} from "@/server/certs";

export const metadata = { title: "Certificates" };
export const dynamic = "force-dynamic";

export default async function CertsPage() {
  const certs = await getCertificates();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Certificates</h1>

      {certs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nothing in progress — add a certification below.
        </p>
      )}

      {certs.map((c) => (
        <Card key={c.id}>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base">
                {c.name}
                {c.status === "completed" && (
                  <Badge className="ml-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    completed
                  </Badge>
                )}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {[c.provider, c.targetDate && `target ${c.targetDate}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {c.url && (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-muted-foreground hover:text-foreground"
                  aria-label={`Open ${c.name}`}
                >
                  <ExternalLink className="size-4" />
                </a>
              )}
              <form action={deleteCertificate.bind(null, c.id)}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Progress value={c.percentComplete} className="flex-1" />
              <form
                action={updateCertificateProgress.bind(null, c.id)}
                className="flex items-center gap-1.5"
              >
                <Input
                  name="percentComplete"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={c.percentComplete}
                  className="h-8 w-20"
                  aria-label="Percent complete"
                />
                <Button type="submit" variant="outline" size="sm">
                  Update
                </Button>
              </form>
            </div>
            {c.notes && (
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {c.notes}
              </p>
            )}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a certification</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCertificate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cert-name">Name</Label>
                <Input
                  id="cert-name"
                  name="name"
                  required
                  placeholder="e.g. AWS Solutions Architect"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cert-provider">Provider</Label>
                <Input
                  id="cert-provider"
                  name="provider"
                  placeholder="e.g. AWS"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cert-url">Link</Label>
                <Input
                  id="cert-url"
                  name="url"
                  type="url"
                  placeholder="https://…"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cert-target">Target date</Label>
                <Input id="cert-target" name="targetDate" type="date" />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cert-notes">Notes</Label>
              <Textarea id="cert-notes" name="notes" rows={2} />
            </div>
            <Button type="submit" size="sm">
              Add
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
