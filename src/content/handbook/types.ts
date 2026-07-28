/**
 * The interview handbook is static, version-controlled content — not seeded
 * into Postgres. Chapters are plain TypeScript modules holding markdown, so
 * they stay diffable, type-checked, and searchable without a DB round-trip.
 */

export type Track =
  | "coding"
  | "backend"
  | "systems"
  | "fundamentals"
  | "behavioral"
  | "process";

export interface TrackMeta {
  id: Track;
  label: string;
  blurb: string;
}

export const TRACKS: TrackMeta[] = [
  {
    id: "coding",
    label: "Coding Interviews",
    blurb: "Patterns, complexity, and how to actually run the 45 minutes.",
  },
  {
    id: "backend",
    label: "Backend & APIs",
    blurb: "Building REST services, data modeling, and the questions about them.",
  },
  {
    id: "systems",
    label: "Systems & Design",
    blurb: "System design at intern scale, plus OS and networking fundamentals.",
  },
  {
    id: "fundamentals",
    label: "Engineering Fundamentals",
    blurb: "Git, testing, CI/CD, and language-specific interview details.",
  },
  {
    id: "behavioral",
    label: "Behavioral",
    blurb: "Story banks, STAR, and what the interviewer is scoring you on.",
  },
  {
    id: "process",
    label: "Recruiting Process",
    blurb: "Timelines, applications, referrals, loops, and offers.",
  },
];

/** A drillable interview question with a model answer. Both are markdown. */
export interface HandbookQuestion {
  /** The question as an interviewer would ask it. */
  q: string;
  /** A strong answer — what a hire-signal response covers. */
  a: string;
  /** Optional: what a weak answer looks like, so the gap is visible. */
  weak?: string;
}

export interface HandbookSection {
  /** Slug-cased, unique within the chapter — used as the anchor id. */
  id: string;
  heading: string;
  /** GitHub-flavored markdown: prose, lists, tables, fenced code. */
  markdown: string;
}

export interface HandbookChapter {
  slug: string;
  title: string;
  track: Track;
  /** Sort order within the track. */
  order: number;
  /** One or two sentences shown on the index card. */
  summary: string;
  estMinutes: number;
  tags: string[];
  sections: HandbookSection[];
  /** Questions drilled in flashcard mode at /handbook/drill. */
  questions: HandbookQuestion[];
  /** LeetCode slugs matching the `problems` table, for cross-linking. */
  relatedProblems?: string[];
}

/** Flattens a chapter to plain text for substring search. */
export function chapterText(chapter: HandbookChapter): string {
  return [
    chapter.title,
    chapter.summary,
    chapter.tags.join(" "),
    ...chapter.sections.flatMap((s) => [s.heading, s.markdown]),
    ...chapter.questions.flatMap((q) => [q.q, q.a]),
  ]
    .join("\n")
    .toLowerCase();
}
