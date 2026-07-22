"use client";

import { useRef, useState } from "react";
import { Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Action = "summarize" | "quiz" | "clarify";

/**
 * Streams responses from /api/ai. The note content is read from the editor
 * textarea at click time so the assistant always sees the latest draft.
 */
export function AiAssistant({ noteBodyId }: { noteBodyId: string }) {
  const [output, setOutput] = useState("");
  const [busy, setBusy] = useState<Action | null>(null);
  const [question, setQuestion] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const run = async (action: Action) => {
    const textarea = document.getElementById(
      noteBodyId,
    ) as HTMLTextAreaElement | null;
    const noteContent = textarea?.value.trim();
    if (!noteContent) {
      setOutput("Write something in the note first.");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(action);
    setOutput("");

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          noteContent,
          question: action === "clarify" ? question || undefined : undefined,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        setOutput(`Request failed (${res.status}).`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        setOutput((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setOutput("Something went wrong talking to the assistant.");
      }
    } finally {
      setBusy(null);
    }
  };

  const stop = () => {
    abortRef.current?.abort();
    setBusy(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4" /> Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => run("summarize")}
          >
            {busy === "summarize" ? "Summarizing…" : "Summarize"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy !== null}
            onClick={() => run("quiz")}
          >
            {busy === "quiz" ? "Writing quiz…" : "Quiz me"}
          </Button>
          {busy && (
            <Button variant="ghost" size="sm" onClick={stop} className="gap-1">
              <Square className="size-3" /> Stop
            </Button>
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run("clarify");
          }}
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question about this note…"
            disabled={busy !== null}
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={busy !== null}
          >
            Ask
          </Button>
        </form>

        {output && (
          <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
            {output}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
