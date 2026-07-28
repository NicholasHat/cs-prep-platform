import Link from "next/link";
import { Check, ExternalLink, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FEEDS } from "@/lib/internships/feeds";
import { cn } from "@/lib/utils";
import {
  getLastSyncedAt,
  getListingFacets,
  getListings,
  getTrackedUrls,
  syncListings,
  trackListing,
} from "@/server/applications";

export const metadata = { title: "Internship listings" };
export const dynamic = "force-dynamic";

type Params = Promise<{
  q?: string;
  feed?: string;
  category?: string;
  sponsorship?: string;
  location?: string;
  software?: string;
  page?: string;
  synced?: string;
}>;

/** Rebuilds the current query string with one key overridden. */
function withParam(
  params: Record<string, string | undefined>,
  key: string,
  value: string | undefined,
) {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, [key]: value })) {
    if (v && k !== "synced" && !(key !== "page" && k === "page")) {
      next.set(k, v);
    }
  }
  const qs = next.toString();
  return `/applications/listings${qs ? `?${qs}` : ""}`;
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? 1) || 1;
  const softwareOnly = sp.software !== "0";

  const [{ rows, total, pageSize }, facets, tracked, lastSynced] =
    await Promise.all([
      getListings({
        q: sp.q,
        feed: sp.feed,
        category: sp.category,
        sponsorship: sp.sponsorship,
        location: sp.location,
        softwareOnly,
        page,
      }),
      getListingFacets(),
      getTrackedUrls(),
      getLastSyncedAt(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const feedLabel = (key: string) =>
    FEEDS.find((f) => f.key === key)?.label ?? key;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Internship listings
          </h1>
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} open roles ·{" "}
            {lastSynced
              ? `synced ${lastSynced.toLocaleString()}`
              : "never synced"}
          </p>
        </div>
        <form action={syncListings}>
          <Button type="submit" variant="outline" size="sm" className="gap-1">
            <RefreshCw className="size-4" /> Sync all feeds
          </Button>
        </form>
      </div>

      {sp.synced && (
        <Card className="border-emerald-500/40">
          <CardContent className="flex items-start gap-2 py-3 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <span>{sp.synced}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {FEEDS.map((f) => {
              const n = facets.feeds.find((x) => x.value === f.key)?.n ?? 0;
              return (
                <div key={f.key} className="rounded-md border p-3">
                  <div className="text-sm font-medium">{f.cycle}</div>
                  <a
                    href={`https://github.com/${f.repo}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:underline"
                  >
                    {f.repo} <ExternalLink className="size-3" />
                  </a>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {n.toLocaleString()} open
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <form className="flex flex-wrap gap-2" action="/applications/listings">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Company or title…"
            className="pl-8"
          />
        </div>
        <Input
          name="location"
          defaultValue={sp.location ?? ""}
          placeholder="Location"
          className="w-40"
        />
        {sp.feed && <input type="hidden" name="feed" value={sp.feed} />}
        {sp.category && (
          <input type="hidden" name="category" value={sp.category} />
        )}
        {!softwareOnly && <input type="hidden" name="software" value="0" />}
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-1.5">
        <Link href={withParam(sp, "feed", undefined)}>
          <Badge variant={sp.feed ? "outline" : "default"}>all sources</Badge>
        </Link>
        {FEEDS.map((f) => (
          <Link key={f.key} href={withParam(sp, "feed", f.key)}>
            <Badge variant={sp.feed === f.key ? "default" : "outline"}>
              {f.cycle}
            </Badge>
          </Link>
        ))}
        <span className="mx-1 text-muted-foreground">|</span>
        <Link href={withParam(sp, "software", softwareOnly ? "0" : undefined)}>
          <Badge variant={softwareOnly ? "default" : "outline"}>
            software &amp; adjacent only
          </Badge>
        </Link>
        {facets.categories.slice(0, 5).map((c) => (
          <Link
            key={c.value}
            href={withParam(
              sp,
              "category",
              sp.category === c.value ? undefined : (c.value ?? undefined),
            )}
          >
            <Badge variant={sp.category === c.value ? "default" : "outline"}>
              {c.value} · {c.n}
            </Badge>
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((l) => {
          const isTracked = tracked.has(l.url);
          return (
            <Card key={l.url}>
              <CardContent className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{l.company}</span>
                    {l.category && (
                      <Badge variant="secondary" className="text-xs">
                        {l.category}
                      </Badge>
                    )}
                    {l.sponsorship &&
                      l.sponsorship !== "Other" && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            l.sponsorship === "Does Not Offer Sponsorship" &&
                              "border-red-500/40 text-red-600 dark:text-red-400",
                          )}
                        >
                          {l.sponsorship}
                        </Badge>
                      )}
                  </div>
                  <div className="text-sm text-muted-foreground">{l.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{l.locations.join(" · ") || "Location N/A"}</span>
                    {l.terms.length > 0 && <span>{l.terms.join(", ")}</span>}
                    <span>{feedLabel(l.sourceFeed)}</span>
                    {l.datePosted && (
                      <span>posted {l.datePosted.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a href={l.url} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Apply <ExternalLink className="size-3.5" />
                    </Button>
                  </a>
                  {isTracked ? (
                    <Badge variant="secondary" className="gap-1">
                      <Check className="size-3" /> tracked
                    </Badge>
                  ) : (
                    <form action={trackListing}>
                      <input type="hidden" name="url" value={l.url} />
                      <Button type="submit" size="sm" variant="outline">
                        Track
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No listings match. Try syncing the feeds or relaxing the filters.
          </p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={withParam(sp, "page", String(page - 1))}>
                <Button variant="outline" size="sm">
                  Previous
                </Button>
              </Link>
            )}
            {page < totalPages && (
              <Link href={withParam(sp, "page", String(page + 1))}>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
