"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Pause, Play, TimerReset } from "lucide-react";
import { toast } from "sonner";
import { celebrate } from "@/components/rewards/celebrate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { logAttempt } from "@/server/problems";

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function AttemptForm({ slug }: { slug: string }) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [outcome, setOutcome] = useState("solved");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const submit = (formData: FormData) => {
    formData.set("outcome", outcome);
    if (seconds > 0) {
      formData.set("durationMin", String(Math.max(1, Math.round(seconds / 60))));
    }
    startTransition(async () => {
      try {
        await logAttempt(slug, formData);
        if (outcome !== "unsolved") celebrate();
        toast.success("Attempt logged");
        formRef.current?.reset();
        setSeconds(0);
        setRunning(false);
      } catch {
        toast.error("Failed to log attempt");
      }
    });
  };

  return (
    <form ref={formRef} action={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-2xl tabular-nums">
          {formatElapsed(seconds)}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setRunning((r) => !r)}
          aria-label={running ? "Pause timer" : "Start timer"}
        >
          {running ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            setRunning(false);
            setSeconds(0);
          }}
          aria-label="Reset timer"
        >
          <TimerReset className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Outcome</Label>
        <Select value={outcome} onValueChange={setOutcome}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="solved_with_help">Solved with help</SelectItem>
            <SelectItem value="unsolved">Couldn&apos;t solve</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="attempt-note">Notes (optional)</Label>
        <Textarea
          id="attempt-note"
          name="note"
          placeholder="What tripped you up? What clicked?"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Logging…" : "Log attempt"}
      </Button>
    </form>
  );
}
