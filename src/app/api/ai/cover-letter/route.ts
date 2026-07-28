import { z } from "zod";
import { COVER_LETTER_SYSTEM } from "@/lib/ai/prompts";
import { missingKeyResponse, streamText } from "@/lib/ai/stream";

const requestSchema = z.object({
  template: z.string().min(1).max(40_000),
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(300),
  location: z.string().max(200).optional(),
  jobUrl: z.string().max(2_000).optional(),
  /** Free-text notes about the posting — pasted JD, team, tech stack. */
  jobDetails: z.string().max(20_000).optional(),
  /** The candidate's background, so tailoring stays grounded in real facts. */
  profile: z.string().max(40_000).optional(),
  /** Anything the user wants emphasized in this particular letter. */
  emphasis: z.string().max(2_000).optional(),
});

export async function POST(req: Request) {
  const noKey = missingKeyResponse();
  if (noKey) return noKey;

  const parsed = requestSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  const d = parsed.data;

  const sections = [
    `## The candidate's base cover letter\n\n${d.template}`,
    d.profile ? `## The candidate's background\n\n${d.profile}` : null,
    [
      "## The target role",
      `Company: ${d.company}`,
      `Role: ${d.role}`,
      d.location ? `Location: ${d.location}` : null,
      d.jobUrl ? `Posting: ${d.jobUrl}` : null,
    ]
      .filter(Boolean)
      .join("\n"),
    d.jobDetails ? `## Job posting details\n\n${d.jobDetails}` : null,
    d.emphasis ? `## The candidate wants to emphasize\n\n${d.emphasis}` : null,
    `Tailor the base letter to this role.`,
  ].filter(Boolean);

  return streamText({
    system: COVER_LETTER_SYSTEM,
    user: sections.join("\n\n"),
    maxTokens: 4_000,
  });
}
