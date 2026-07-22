import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { SYSTEM_PROMPTS } from "@/lib/ai/prompts";

const requestSchema = z.object({
  action: z.enum(["summarize", "quiz", "clarify"]),
  noteContent: z.string().min(1).max(30_000),
  question: z.string().max(2_000).optional(),
});

export async function POST(req: Request) {
  // The Anthropic key exists only server-side; this route is the sole place
  // the SDK is instantiated. The app runs on localhost, so no auth gate.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set — add it to .env" },
      { status: 503 },
    );
  }
  const client = new Anthropic();

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
