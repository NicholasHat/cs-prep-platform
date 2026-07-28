import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { internshipListings } from "@/db/schema";
import { type Feed, fetchFeed } from "./feeds";

export interface SyncResult {
  feed: string;
  label: string;
  /** Open roles written this run. */
  fetched: number;
  /** Rows the feed reported as closed, hidden, or malformed. */
  skipped: number;
  /** Rows we had marked open that this feed no longer lists. */
  deactivated: number;
  error?: string;
}

const CHUNK = 500;

/**
 * Upserts one feed by posting URL, then flips anything previously seen from
 * that feed but missing from this pull to inactive — that is how a filled
 * role leaves the tracker without deleting history.
 */
export async function syncFeed(feed: Feed): Promise<SyncResult> {
  const startedAt = new Date();
  const base = { feed: feed.key, label: feed.label };

  try {
    const { listings, skipped } = await fetchFeed(feed);

    for (let i = 0; i < listings.length; i += CHUNK) {
      await db
        .insert(internshipListings)
        .values(
          listings.slice(i, i + CHUNK).map((l) => ({ ...l, syncedAt: new Date() })),
        )
        .onConflictDoUpdate({
          target: internshipListings.url,
          set: {
            sourceId: sql`excluded.source_id`,
            sourceFeed: sql`excluded.source_feed`,
            company: sql`excluded.company`,
            title: sql`excluded.title`,
            companyUrl: sql`excluded.company_url`,
            locations: sql`excluded.locations`,
            terms: sql`excluded.terms`,
            category: sql`excluded.category`,
            sponsorship: sql`excluded.sponsorship`,
            degrees: sql`excluded.degrees`,
            active: sql`excluded.active`,
            datePosted: sql`excluded.date_posted`,
            dateUpdated: sql`excluded.date_updated`,
            syncedAt: sql`excluded.synced_at`,
          },
        });
    }

    const stale = await db
      .update(internshipListings)
      .set({ active: false })
      .where(
        and(
          eq(internshipListings.sourceFeed, feed.key),
          eq(internshipListings.active, true),
          lt(internshipListings.syncedAt, startedAt),
        ),
      )
      .returning({ url: internshipListings.url });

    return {
      ...base,
      fetched: listings.length,
      skipped,
      deactivated: stale.length,
    };
  } catch (err) {
    return {
      ...base,
      fetched: 0,
      skipped: 0,
      deactivated: 0,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function syncFeeds(feeds: Feed[]): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const feed of feeds) {
    results.push(await syncFeed(feed));
  }
  return results;
}

export function summarize(results: SyncResult[]): string {
  return results
    .map((r) =>
      r.error
        ? `${r.label}: failed (${r.error})`
        : `${r.label}: ${r.fetched} open, ${r.deactivated} closed`,
    )
    .join(" · ");
}
