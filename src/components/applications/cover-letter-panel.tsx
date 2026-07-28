"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy, Save, Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
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
import { saveCoverLetter } from "@/server/applications";

export interface TemplateOption {
  id: number;
  name: string;
  body: string;
  isDefault: boolean;
}

interface Props {
  applicationId: number;
  company: string;
  role: string;
  location: string | null;
  jobUrl: string | null;
  templates: TemplateOption[];
  profileText: string;
  initialLetter: string;
}

/**
 * Streams a tailored letter from /api/ai/cover-letter into an editable
 * textarea. The draft stays local until explicitly saved, so a regeneration
 * never silently overwrites a version the user already edited and kept.
 */
export function CoverLetterPanel({
  applicationId,
  company,
  role,
  location,
  jobUrl,
  templates,
  profileText,
  initialLetter,
}: Props) {
  const [letter, setLetter] = useState(initialLetter);
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.isDefault)?.id ?? templates[0]?.id,
  );
  const [jobDetails, setJobDetails] = useState("");
  const [emphasis, setEmphasis] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const template = templates.find((t) => t.id === templateId);

  const generate = async () => {
    if (!template) {
      toast.error("Upload a base cover letter first.");
      return;
    }
    if (
      letter.trim() &&
      !confirm("Replace the current draft with a new generation?")
    ) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setLetter("");
    setSaved(false);

    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template: template.body,
          company,
          role,
          location: location ?? undefined,
          jobUrl: jobUrl ?? undefined,
          jobDetails: jobDetails.trim() || undefined,
          profile: profileText.trim() || undefined,
          emphasis: emphasis.trim() || undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const msg = await res.json().catch(() => null);
        toast.error(msg?.error ?? `Request failed (${res.status}).`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setLetter((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        toast.error("Something went wrong generating the letter.");
      }
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    await saveCoverLetter(applicationId, letter);
    setSaved(true);
    toast.success("Cover letter saved.");
  };

  const copy = async () => {
    await navigator.clipboard.writeText(letter);
    toast.success("Copied to clipboard.");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" /> Cover letter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {templates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Upload a base cover letter on the{" "}
            <Link
              href="/applications/letters"
              className="font-medium underline underline-offset-4"
            >
              cover letters page
            </Link>{" "}
            and it will be tailored to this role.
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="template">Base letter</Label>
                <select
                  id="template"
                  value={templateId}
                  onChange={(e) => setTemplateId(Number(e.target.value))}
                  className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                      {t.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emphasis">Emphasize (optional)</Label>
                <Input
                  id="emphasis"
                  value={emphasis}
                  onChange={(e) => setEmphasis(e.target.value)}
                  placeholder="e.g. the distributed systems project"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="jobDetails">
                Job description (paste it for much better tailoring)
              </Label>
              <Textarea
                id="jobDetails"
                value={jobDetails}
                onChange={(e) => setJobDetails(e.target.value)}
                placeholder="Paste the responsibilities and qualifications from the posting…"
                className="min-h-24 font-mono text-xs"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={generate}
                disabled={busy}
                size="sm"
                className="gap-1"
              >
                <Sparkles className="size-4" />
                {busy
                  ? "Writing…"
                  : letter
                    ? "Regenerate"
                    : "Generate tailored letter"}
              </Button>
              {busy && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => {
                    abortRef.current?.abort();
                    setBusy(false);
                  }}
                >
                  <Square className="size-3" /> Stop
                </Button>
              )}
              {letter && !busy && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={save}
                    className="gap-1"
                  >
                    {saved ? (
                      <Check className="size-4" />
                    ) : (
                      <Save className="size-4" />
                    )}
                    {saved ? "Saved" : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copy}
                    className="gap-1"
                  >
                    <Copy className="size-4" /> Copy
                  </Button>
                </>
              )}
            </div>

            {letter && (
              <Textarea
                value={letter}
                onChange={(e) => {
                  setLetter(e.target.value);
                  setSaved(false);
                }}
                className="min-h-96 leading-relaxed"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
