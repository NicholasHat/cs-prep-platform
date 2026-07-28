"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, count, desc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import {
  applicationEvents,
  applications,
  companyReports,
  coverLetterTemplates,
  internshipListings,
  profile,
} from "@/db/schema";
import { FEEDS, SOFTWARE_CATEGORIES } from "@/lib/internships/feeds";
import { summarize, syncFeeds } from "@/lib/internships/sync";

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export interface ListingFilters {
  q?: string;
  feed?: string;
  category?: string;
  sponsorship?: string;
  location?: string;
  softwareOnly?: boolean;
  page?: number;
}

const PAGE_SIZE = 50;

export async function getListings(filters: ListingFilters = {}) {
  const { q, feed, category, sponsorship, location, softwareOnly, page = 1 } =
    filters;

  const where = and(
    eq(internshipListings.active, true),
    q
      ? or(
          ilike(internshipListings.company, `%${q}%`),
          ilike(internshipListings.title, `%${q}%`),
        )
      : undefined,
    feed ? eq(internshipListings.sourceFeed, feed) : undefined,
    category ? eq(internshipListings.category, category) : undefined,
    sponsorship ? eq(internshipListings.sponsorship, sponsorship) : undefined,
    // `locations` is a text[]; match any element containing the term.
    location
      ? sql`exists (
          select 1 from unnest(${internshipListings.locations}) loc
          where loc ilike ${`%${location}%`}
        )`
      : undefined,
    softwareOnly
      ? inArray(internshipListings.category, SOFTWARE_CATEGORIES)
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(internshipListings)
      .where(where)
      .orderBy(desc(internshipListings.datePosted))
      .limit(PAGE_SIZE)
      .offset((Math.max(page, 1) - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(internshipListings).where(where),
  ]);

  return { rows, total, page: Math.max(page, 1), pageSize: PAGE_SIZE };
}

/** Distinct values driving the filter dropdowns, plus per-feed counts. */
export async function getListingFacets() {
  const [categories, feeds, sponsorships] = await Promise.all([
    db
      .select({
        value: internshipListings.category,
        n: count(),
      })
      .from(internshipListings)
      .where(eq(internshipListings.active, true))
      .groupBy(internshipListings.category)
      .orderBy(desc(count())),
    db
      .select({ value: internshipListings.sourceFeed, n: count() })
      .from(internshipListings)
      .where(eq(internshipListings.active, true))
      .groupBy(internshipListings.sourceFeed),
    db
      .select({ value: internshipListings.sponsorship, n: count() })
      .from(internshipListings)
      .where(eq(internshipListings.active, true))
      .groupBy(internshipListings.sponsorship),
  ]);

  return {
    categories: categories.filter((c) => c.value),
    feeds,
    sponsorships: sponsorships.filter((s) => s.value),
  };
}

/** URLs already tracked, so the browser can show "tracked" inline. */
export async function getTrackedUrls(): Promise<Set<string>> {
  const rows = await db
    .select({ url: applications.listingUrl })
    .from(applications);
  return new Set(rows.map((r) => r.url).filter((u): u is string => !!u));
}

/** Pulls the selected feeds (all of them when none are checked). */
export async function syncListings(formData: FormData): Promise<void> {
  const selected = formData.getAll("feed").map(String).filter(Boolean);
  const targets = selected.length
    ? FEEDS.filter((f) => selected.includes(f.key))
    : FEEDS;

  const results = await syncFeeds(targets);

  revalidatePath("/applications");
  revalidatePath("/applications/listings");
  redirect(
    `/applications/listings?synced=${encodeURIComponent(summarize(results))}`,
  );
}

/** Timestamp of the newest sync, shown next to the sync button. */
export async function getLastSyncedAt(): Promise<Date | null> {
  const [row] = await db
    .select({ at: sql<Date | null>`max(${internshipListings.syncedAt})` })
    .from(internshipListings);
  return row?.at ?? null;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export async function getApplications() {
  return db.query.applications.findMany({
    with: { listing: true },
    orderBy: [applications.tier, desc(applications.updatedAt)],
  });
}

export async function getApplication(id: number) {
  const row = await db.query.applications.findFirst({
    where: eq(applications.id, id),
    with: {
      listing: true,
      events: { orderBy: [desc(applicationEvents.at)] },
    },
  });
  return row ?? null;
}

/** Counts per status, for the funnel strip at the top of the board. */
export async function getFunnelCounts() {
  const rows = await db
    .select({ status: applications.status, n: count() })
    .from(applications)
    .groupBy(applications.status);
  return Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<
    string,
    number
  >;
}

/** Applications with a next action due today or earlier, plus deadlines soon. */
export async function getDueSoon() {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select()
    .from(applications)
    .where(
      and(
        sql`${applications.status} not in ('rejected', 'withdrawn', 'offer')`,
        or(
          sql`${applications.nextActionDate} <= ${today}`,
          sql`${applications.deadline} <= (${today}::date + interval '7 days')`,
        ),
      ),
    )
    .orderBy(applications.nextActionDate)
    .limit(10);
}

export async function trackListing(formData: FormData): Promise<void> {
  const url = String(formData.get("url") ?? "");
  const listing = await db.query.internshipListings.findFirst({
    where: eq(internshipListings.url, url),
  });
  if (!listing) return;

  const existing = await db.query.applications.findFirst({
    where: eq(applications.listingUrl, url),
  });
  if (existing) {
    redirect(`/applications/${existing.id}`);
  }

  const [row] = await db
    .insert(applications)
    .values({
      listingUrl: listing.url,
      company: listing.company,
      role: listing.title,
      location: listing.locations[0] ?? null,
      jobUrl: listing.url,
    })
    .returning({ id: applications.id });

  await db.insert(applicationEvents).values({
    applicationId: row.id,
    kind: "status_change",
    detail: "Saved from listings",
  });

  revalidatePath("/applications");
  redirect(`/applications/${row.id}`);
}

const manualSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(300),
  location: z.string().max(200).optional(),
  jobUrl: z.string().max(2000).optional(),
});

export async function createApplication(formData: FormData): Promise<void> {
  const parsed = manualSchema.parse({
    company: formData.get("company"),
    role: formData.get("role"),
    location: formData.get("location") || undefined,
    jobUrl: formData.get("jobUrl") || undefined,
  });

  const [row] = await db
    .insert(applications)
    .values({
      company: parsed.company,
      role: parsed.role,
      location: parsed.location ?? null,
      jobUrl: parsed.jobUrl ?? null,
    })
    .returning({ id: applications.id });

  revalidatePath("/applications");
  redirect(`/applications/${row.id}`);
}

const updateSchema = z.object({
  company: z.string().min(1).max(200),
  role: z.string().min(1).max(300),
  location: z.string().max(200).optional(),
  jobUrl: z.string().max(2000).optional(),
  tier: z.coerce.number().int().min(1).max(3),
  appliedAt: z.string().max(10).optional(),
  deadline: z.string().max(10).optional(),
  nextAction: z.string().max(500).optional(),
  nextActionDate: z.string().max(10).optional(),
  referral: z.string().max(300).optional(),
  notes: z.string().max(20_000).optional(),
});

export async function updateApplication(
  id: number,
  formData: FormData,
): Promise<void> {
  const raw = Object.fromEntries(
    [
      "company",
      "role",
      "location",
      "jobUrl",
      "tier",
      "appliedAt",
      "deadline",
      "nextAction",
      "nextActionDate",
      "referral",
      "notes",
    ].map((k) => [k, formData.get(k) || undefined]),
  );
  const parsed = updateSchema.parse(raw);

  await db
    .update(applications)
    .set({
      company: parsed.company,
      role: parsed.role,
      location: parsed.location ?? null,
      jobUrl: parsed.jobUrl ?? null,
      tier: parsed.tier,
      appliedAt: parsed.appliedAt ?? null,
      deadline: parsed.deadline ?? null,
      nextAction: parsed.nextAction ?? null,
      nextActionDate: parsed.nextActionDate ?? null,
      referral: parsed.referral ?? null,
      notes: parsed.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
}

const STATUSES = [
  "saved",
  "applied",
  "online_assessment",
  "phone_screen",
  "onsite",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
] as const;

export async function setApplicationStatus(
  id: number,
  status: string,
): Promise<void> {
  const parsed = z.enum(STATUSES).parse(status);

  // Stamp the application date the first time it moves out of "saved".
  const current = await db.query.applications.findFirst({
    where: eq(applications.id, id),
  });
  const appliedAt =
    parsed !== "saved" && !current?.appliedAt
      ? new Date().toISOString().slice(0, 10)
      : current?.appliedAt ?? null;

  await db
    .update(applications)
    .set({ status: parsed, appliedAt, updatedAt: new Date() })
    .where(eq(applications.id, id));

  await db.insert(applicationEvents).values({
    applicationId: id,
    kind: "status_change",
    detail: `Status → ${parsed.replace(/_/g, " ")}`,
  });

  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
}

export async function addApplicationEvent(
  id: number,
  formData: FormData,
): Promise<void> {
  const detail = String(formData.get("detail") ?? "").trim();
  if (!detail) return;
  const kind = z
    .enum(["status_change", "interview", "follow_up", "note"])
    .catch("note")
    .parse(formData.get("kind"));

  await db.insert(applicationEvents).values({
    applicationId: id,
    kind,
    detail: detail.slice(0, 2000),
  });
  revalidatePath(`/applications/${id}`);
}

export async function deleteApplication(id: number): Promise<void> {
  await db.delete(applications).where(eq(applications.id, id));
  revalidatePath("/applications");
  redirect("/applications");
}

export async function saveCoverLetter(
  id: number,
  body: string,
): Promise<void> {
  await db
    .update(applications)
    .set({
      coverLetter: body.slice(0, 40_000),
      coverLetterUpdatedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));
  revalidatePath(`/applications/${id}`);
}

// ---------------------------------------------------------------------------
// Cover letter templates & profile
// ---------------------------------------------------------------------------

export async function getTemplates() {
  return db
    .select()
    .from(coverLetterTemplates)
    .orderBy(desc(coverLetterTemplates.isDefault), coverLetterTemplates.name);
}

export async function getDefaultTemplate() {
  const rows = await db
    .select()
    .from(coverLetterTemplates)
    .orderBy(desc(coverLetterTemplates.isDefault), desc(coverLetterTemplates.updatedAt))
    .limit(1);
  return rows[0] ?? null;
}

const templateSchema = z.object({
  name: z.string().min(1).max(200),
  body: z.string().min(1).max(40_000),
});

export async function saveTemplate(formData: FormData): Promise<void> {
  const idRaw = formData.get("id");
  const parsed = templateSchema.parse({
    name: formData.get("name") || "Base cover letter",
    body: formData.get("body"),
  });

  if (idRaw) {
    const id = Number(idRaw);
    await db
      .update(coverLetterTemplates)
      .set({ ...parsed, updatedAt: new Date() })
      .where(eq(coverLetterTemplates.id, id));
  } else {
    const [{ n }] = await db
      .select({ n: count() })
      .from(coverLetterTemplates);
    await db
      .insert(coverLetterTemplates)
      .values({ ...parsed, isDefault: n === 0 });
  }
  revalidatePath("/applications/letters");
}

export async function setDefaultTemplate(id: number): Promise<void> {
  await db.update(coverLetterTemplates).set({ isDefault: false });
  await db
    .update(coverLetterTemplates)
    .set({ isDefault: true })
    .where(eq(coverLetterTemplates.id, id));
  revalidatePath("/applications/letters");
}

export async function deleteTemplate(id: number): Promise<void> {
  await db.delete(coverLetterTemplates).where(eq(coverLetterTemplates.id, id));
  revalidatePath("/applications/letters");
}

export async function getProfile() {
  const rows = await db.select().from(profile).where(eq(profile.id, 1));
  return rows[0] ?? null;
}

const profileSchema = z.object({
  fullName: z.string().max(200).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  school: z.string().max(200).optional(),
  gradYear: z.string().max(20).optional(),
  links: z.string().max(1000).optional(),
  resumeText: z.string().max(40_000).optional(),
  highlights: z.string().max(10_000).optional(),
});

export async function saveProfile(formData: FormData): Promise<void> {
  const parsed = profileSchema.parse(
    Object.fromEntries(
      [
        "fullName",
        "email",
        "phone",
        "school",
        "gradYear",
        "links",
        "resumeText",
        "highlights",
      ].map((k) => [k, formData.get(k) || undefined]),
    ),
  );

  const values = {
    id: 1,
    fullName: parsed.fullName ?? null,
    email: parsed.email ?? null,
    phone: parsed.phone ?? null,
    school: parsed.school ?? null,
    gradYear: parsed.gradYear ?? null,
    links: parsed.links ?? null,
    resumeText: parsed.resumeText ?? null,
    highlights: parsed.highlights ?? null,
    updatedAt: new Date(),
  };

  await db
    .insert(profile)
    .values(values)
    .onConflictDoUpdate({ target: profile.id, set: values });

  revalidatePath("/applications/letters");
}

// ---------------------------------------------------------------------------
// Company interview reports
// ---------------------------------------------------------------------------

export const companyKey = async (name: string) =>
  name.trim().toLowerCase().replace(/\s+/g, " ");

export async function getCompanyReport(company: string) {
  const key = await companyKey(company);
  const rows = await db
    .select()
    .from(companyReports)
    .where(eq(companyReports.companyKey, key));
  return rows[0] ?? null;
}

export async function saveCompanyReport(
  company: string,
  body: string,
  model: string,
): Promise<void> {
  const key = await companyKey(company);
  const values = {
    companyKey: key,
    company: company.trim(),
    body: body.slice(0, 60_000),
    model,
    generatedAt: new Date(),
  };
  await db
    .insert(companyReports)
    .values(values)
    .onConflictDoUpdate({ target: companyReports.companyKey, set: values });
  revalidatePath("/applications");
}

/** Companies with a cached report, for the reports index. */
export async function getCompanyReports() {
  return db
    .select({
      companyKey: companyReports.companyKey,
      company: companyReports.company,
      generatedAt: companyReports.generatedAt,
    })
    .from(companyReports)
    .orderBy(desc(companyReports.generatedAt));
}

/** Recently posted listings, used for the "new since yesterday" callout. */
export async function getFreshListingCount(sinceDays = 3) {
  const since = new Date(Date.now() - sinceDays * 86_400_000);
  const [{ n }] = await db
    .select({ n: count() })
    .from(internshipListings)
    .where(
      and(
        eq(internshipListings.active, true),
        gt(internshipListings.datePosted, since),
      ),
    );
  return n;
}
