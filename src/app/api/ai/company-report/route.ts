import { z } from "zod";
import { COMPANY_REPORT_SYSTEM } from "@/lib/ai/prompts";
import { missingKeyResponse, streamText } from "@/lib/ai/stream";

const requestSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().max(300).optional(),
});

export async function POST(req: Request) {
  const noKey = missingKeyResponse();
  if (noKey) return noKey;

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const { company, role } = parsed.data;

  const user = [
    `Company: ${company}`,
    role ? `Role the candidate is applying to: ${role}` : null,
    "",
    "Write the interview process report for a software engineering intern candidate.",
  ]
    .filter((l) => l !== null)
    .join("\n");

  return streamText({
    system: COMPANY_REPORT_SYSTEM,
    user,
    maxTokens: 8_000,
  });
}
