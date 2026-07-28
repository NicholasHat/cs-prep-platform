"use client";

import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveTemplate } from "@/server/applications";

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".text"];

/**
 * Upload reads the file in the browser and drops its text into the textarea, so
 * the letter is reviewable before it is saved. Only plain-text formats are read
 * directly — .docx and .pdf are archives, not text, and would land as mojibake.
 */
export function TemplateEditor({
  template,
}: {
  template?: { id: number; name: string; body: string };
}) {
  const [name, setName] = useState(template?.name ?? "Base cover letter");
  const [body, setBody] = useState(template?.body ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file: File) => {
    const lower = file.name.toLowerCase();
    if (!TEXT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      toast.error(
        "Only .txt and .md files can be read directly — open your .docx or .pdf and paste the text below.",
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    const text = await file.text();
    setBody(text);
    if (!template) {
      setName(file.name.replace(/\.[^.]+$/, ""));
    }
    toast.success("Loaded — review it, then save.");
  };

  return (
    <form action={saveTemplate} className="space-y-3">
      {template && <input type="hidden" name="id" value={template.id} />}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${template?.id ?? "new"}`}>Name</Label>
          <Input
            id={`name-${template?.id ?? "new"}`}
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`file-${template?.id ?? "new"}`}>Upload</Label>
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              id={`file-${template?.id ?? "new"}`}
              type="file"
              accept=".txt,.md,.markdown,.text,text/plain,text/markdown"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-1"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="size-4" /> Choose .txt / .md
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`body-${template?.id ?? "new"}`}>Letter</Label>
        <Textarea
          id={`body-${template?.id ?? "new"}`}
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          placeholder="Paste your cover letter here. Write it the way you'd actually send it — the generator preserves your voice and only retargets the specifics."
          className="min-h-64 leading-relaxed"
        />
      </div>

      <Button type="submit" size="sm">
        {template ? "Save changes" : "Save cover letter"}
      </Button>
    </form>
  );
}
