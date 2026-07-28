"use client";

import { useRef, useState } from "react";
import { ClipboardList, RefreshCw, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { saveCompanyReport } from "@/server/applications";

interface Props {
  company: string;
  role: string;
  initialReport: string;
  generatedAt: Date | null;
}

const MODEL = "claude-opus-4-8";

/**
 * Generates and caches a rundown of the company's interview loop. The report is
 * cached per company rather than per application, so a second application to
 * the same company reuses it.
 */
export function CompanyReportPanel({
  company,
  role,
  initialReport,
  generatedAt,
}: Props) {
  const [report, setReport] = useState(initialReport);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const generate = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setReport("");

    let accumulated = "";
    try {
      const res = await fetch("/api/ai/company-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, role }),
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
        accumulated += decoder.decode(value, { stream: true });
        setReport(accumulated);
      }
      if (accumulated.trim()) {
        await saveCompanyReport(company, accumulated, MODEL);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        toast.error("Something went wrong generating the report.");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="size-4" /> {company} interview process
          </CardTitle>
          <div className="flex gap-2">
            {busy ? (
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
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={generate}
              >
                <RefreshCw className="size-4" />
                {report ? "Regenerate" : "Generate rundown"}
              </Button>
            )}
          </div>
        </div>
        {generatedAt && !busy && report === initialReport && (
          <p className="text-xs text-muted-foreground">
            Cached {generatedAt.toLocaleDateString()} — regenerate if the cycle
            has moved on.
          </p>
        )}
      </CardHeader>
      <CardContent>
        {report ? (
          <Markdown>{report}</Markdown>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate a briefing on how {company} generally runs its intern loop —
            the stages, what they weight, and how to prepare for each round.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
