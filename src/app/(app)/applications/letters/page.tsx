import Link from "next/link";
import { ArrowLeft, Star, Trash2 } from "lucide-react";
import { TemplateEditor } from "@/components/applications/template-editor";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteTemplate,
  getProfile,
  getTemplates,
  saveProfile,
  setDefaultTemplate,
} from "@/server/applications";

export const metadata = { title: "Cover letters" };
export const dynamic = "force-dynamic";

export default async function LettersPage() {
  const [templates, profile] = await Promise.all([
    getTemplates(),
    getProfile(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/applications"
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" /> Applications
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          Cover letters &amp; profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a letter you&apos;re happy with. Each application tailors a copy
          of it — your voice, retargeted.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your background</CardTitle>
          <p className="text-sm text-muted-foreground">
            The generator is instructed never to invent facts, so whatever it can
            legitimately draw on has to be here or in the letter itself.
          </p>
        </CardHeader>
        <CardContent>
          <form action={saveProfile} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  defaultValue={profile?.fullName ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  defaultValue={profile?.email ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  name="school"
                  defaultValue={profile?.school ?? ""}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gradYear">Graduation</Label>
                <Input
                  id="gradYear"
                  name="gradYear"
                  defaultValue={profile?.gradYear ?? ""}
                  placeholder="e.g. May 2028"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="links">Links</Label>
              <Input
                id="links"
                name="links"
                defaultValue={profile?.links ?? ""}
                placeholder="GitHub, portfolio, LinkedIn"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="highlights">Highlights</Label>
              <Textarea
                id="highlights"
                name="highlights"
                defaultValue={profile?.highlights ?? ""}
                placeholder="The three or four things you most want an employer to know — projects, impact, technologies."
                className="min-h-24"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resumeText">Resume text</Label>
              <Textarea
                id="resumeText"
                name="resumeText"
                defaultValue={profile?.resumeText ?? ""}
                placeholder="Paste your resume as plain text. Gives the generator real material to pull specifics from."
                className="min-h-40 font-mono text-xs"
              />
            </div>
            <Button type="submit" size="sm">
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            {templates.length > 0 ? "Add another letter" : "Base cover letter"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateEditor />
        </CardContent>
      </Card>

      {templates.map((t) => (
        <Card key={t.id}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                {t.name}
                {t.isDefault && <Badge variant="secondary">default</Badge>}
              </CardTitle>
              <div className="flex gap-2">
                {!t.isDefault && (
                  <form action={setDefaultTemplate.bind(null, t.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="sm"
                      className="gap-1"
                    >
                      <Star className="size-4" /> Make default
                    </Button>
                  </form>
                )}
                <form action={deleteTemplate.bind(null, t.id)}>
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </form>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <TemplateEditor
              template={{ id: t.id, name: t.name, body: t.body }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
