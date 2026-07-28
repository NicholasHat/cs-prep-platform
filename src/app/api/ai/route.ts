import { z } from "zod";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";
import { missingKeyResponse, streamText } from "@/lib/ai/stream";

const requestSchema = z.object({
  action: z.enum(["summarize", "quiz", "clarify"]),
  noteContent: z.string().min(1).max(30_000),
  question: z.string().max(2_000).optional(),
});

export async function POST(req: Request) {
  const noKey = missingKeyResponse();
  if (noKey) return noKey;

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { action, noteContent, question } = parsed.data;

  const userContent =
    action === "clarify"
      ? `Note:\n\n${noteContent}\n\nQuestion: ${question ?? "Please explain this note."}`
      : noteContent;

  // Note assistance is short-form and latency-sensitive, so it stays on Haiku
  // rather than the Opus default used by the cover-letter and report routes.
  return streamText({
    system: SYSTEM_PROMPTS[action],
    user: userContent,
    model: "claude-haiku-4-5",
    maxTokens: 2_048,
  });
}
