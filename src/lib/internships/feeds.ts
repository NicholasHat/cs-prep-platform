import { z } from "zod";

/**
 * Public GitHub aggregator repos publish a machine-readable listings.json
 * alongside the README table. We read that file directly rather than scraping
 * markdown — same data, no parsing guesswork.
 */
export interface Feed {
  key: string;
  label: string;
  repo: string;
  url: string;
  /** Shown on the sync card so it is obvious which cycle a feed covers. */
  cycle: string;
}

export const FEEDS: Feed[] = [
  {
    key: "simplify-summer-2026",
    label: "SimplifyJobs · Summer 2026 Internships",
    repo: "SimplifyJobs/Summer2026-Internships",
    url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/.github/scripts/listings.json",
    cycle: "Summer 2026",
  },
  {
    key: "simplify-summer-2027",
    label: "SimplifyJobs · Summer 2027 Internships",
    repo: "SimplifyJobs/Summer2027-Internships",
    url: "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/.github/scripts/listings.json",
    cycle: "Summer 2027",
  },
  {
    key: "vansh-summer-2027",
    label: "vanshb03 · Summer 2027 Internships",
    repo: "vanshb03/Summer2027-Internships",
    url: "https://raw.githubusercontent.com/vanshb03/Summer2027-Internships/dev/.github/scripts/listings.json",
    cycle: "Summer 2027",
  },
  {
    key: "simplify-new-grad",
    label: "SimplifyJobs · New Grad Positions",
    repo: "SimplifyJobs/New-Grad-Positions",
    url: "https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/dev/.github/scripts/listings.json",
    cycle: "New Grad",
  },
];

/**
 * The two repo families differ slightly: SimplifyJobs emits `terms` and
 * `category`, vanshb03 emits a bare `season` and no category. Everything
 * beyond company/title/url is treated as optional so a schema drift upstream
 * degrades a field instead of failing the whole sync.
 */
const rawListingSchema = z.object({
  id: z.string(),
  company_name: z.string(),
  title: z.string(),
  url: z.string().min(1),
  active: z.boolean().optional(),
  is_visible: z.boolean().optional(),
  locations: z.array(z.string()).optional(),
  terms: z.array(z.string()).optional(),
  season: z.string().optional(),
  category: z.string().optional(),
  sponsorship: z.string().optional(),
  degrees: z.array(z.string()).optional(),
  company_url: z.string().optional(),
  date_posted: z.number().optional(),
  date_updated: z.number().optional(),
});

export type RawListing = z.infer<typeof rawListingSchema>;

export interface NormalizedListing {
  url: string;
  sourceId: string;
  sourceFeed: string;
  company: string;
  title: string;
  companyUrl: string | null;
  locations: string[];
  terms: string[];
  category: string | null;
  sponsorship: string | null;
  degrees: string[];
  active: boolean;
  datePosted: Date | null;
  dateUpdated: Date | null;
}

const secondsToDate = (n: number | undefined): Date | null =>
  typeof n === "number" && Number.isFinite(n) && n > 0
    ? new Date(n * 1000)
    : null;

function normalize(raw: RawListing, feed: Feed): NormalizedListing {
  return {
    url: raw.url.trim(),
    sourceId: raw.id,
    sourceFeed: feed.key,
    company: raw.company_name.trim(),
    title: raw.title.trim(),
    companyUrl: raw.company_url?.trim() || null,
    locations: raw.locations ?? [],
    // vanshb03 uses a single `season`; Simplify uses a `terms` array.
    terms: raw.terms ?? (raw.season ? [raw.season] : []),
    category: raw.category ?? null,
    sponsorship: raw.sponsorship ?? null,
    degrees: raw.degrees ?? [],
    active: raw.active ?? true,
    datePosted: secondsToDate(raw.date_posted),
    dateUpdated: secondsToDate(raw.date_updated),
  };
}

export interface FetchFeedResult {
  feed: Feed;
  listings: NormalizedListing[];
  /** Rows dropped because they were inactive, hidden, or malformed. */
  skipped: number;
}

/**
 * Fetches one feed and returns only rows worth tracking: currently open and
 * visible. Closed roles are excluded here and deactivated in the DB by the
 * sync, so the tracker never shows a dead posting as live.
 */
export async function fetchFeed(feed: Feed): Promise<FetchFeedResult> {
  const res = await fetch(feed.url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`${feed.repo}: HTTP ${res.status}`);
  }

  const payload: unknown = await res.json();
  if (!Array.isArray(payload)) {
    throw new Error(`${feed.repo}: expected a JSON array`);
  }

  const listings: NormalizedListing[] = [];
  // Deduped by URL: the same posting can appear twice within one feed, and a
  // repeated URL in a single upsert makes Postgres reject the whole statement.
  const seen = new Set<string>();
  let skipped = 0;

  for (const item of payload) {
    const parsed = rawListingSchema.safeParse(item);
    if (!parsed.success) {
      skipped++;
      continue;
    }
    const raw = parsed.data;
    if (raw.active === false || raw.is_visible === false) {
      skipped++;
      continue;
    }
    const listing = normalize(raw, feed);
    if (!listing.url || seen.has(listing.url)) {
      skipped++;
      continue;
    }
    seen.add(listing.url);
    listings.push(listing);
  }

  return { feed, listings, skipped };
}

/** Software-adjacent categories, used to filter the AI/ML/hardware long tail. */
export const SOFTWARE_CATEGORIES = [
  "Software",
  "Software Engineering",
  "AI/ML/Data",
  "Data Science, AI & Machine Learning",
  "Quant",
  "Quantitative Finance",
];
