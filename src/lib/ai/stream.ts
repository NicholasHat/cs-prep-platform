import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared plumbing for the streaming AI routes. The key lives server-side only,
 * so every model call funnels through /api/ai/*; this keeps each route to a
 * schema, a prompt, and a call.
 */
export interface StreamOptions {
  system: string;
  user: string;
  model?: string;
  maxTokens?: number;
}

export function missingKeyResponse(): Response | null {
  if (process.env.ANTHROPIC_API_KEY) return null;
  return Response.json(
    { error: "ANTHROPIC_API_KEY is not set — add it to .env" },
    { status: 503 },
  );
}

/** Streams plain text back to the browser, aborting the model call on cancel. */
export function streamText({
  system,
  user,
  model = "claude-opus-5",
  // Opus 5 thinks by default and thinking counts against max_tokens, so the
  // budget leaves headroom beyond the visible response.
  maxTokens = 16_000,
}: StreamOptions): Response {
  const client = new Anthropic();

  const stream = client.messages.stream({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
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
