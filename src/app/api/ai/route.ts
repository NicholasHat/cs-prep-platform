import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { auth } from "@/auth";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";

// The Anthropic key exists only server-side (Vercel env var); this route is
// the sole place the SDK is instantiated.
const client = new Anthropic();

const requestSchema = z.object({
  action: z.enum(["summarize", "quiz", "clarify"]),
  noteContent: z.string().min(1).max(30_000),
  question: z.string().max(2_000).optional(),
});

export async function POST(req: Request) {
  // Defense in depth: the proxy already gates this route, but a misconfigured
  // matcher must never expose a paid endpoint.
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { action, noteContent, question } = parsed.data;

  const userContent =
    action === "clarify"
      ? `Note:\n\n${noteContent}\n\nQuestion: ${question ?? "Please explain this note."}`
      : noteContent;

  const stream = client.messages.stream({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: SYSTEM_PROMPTS[action],
    messages: [{ role: "user", content: userContent }],
  });

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("text", (text) => controller.enqueue(encoder.encode(text)));
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
