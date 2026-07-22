import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const problemStatusEnum = pgEnum("problem_status_kind", [
  "not_started",
  "attempted",
  "solved",
  "needs_review",
]);

export const attemptOutcomeEnum = pgEnum("attempt_outcome", [
  "solved",
  "solved_with_help",
  "unsolved",
]);

export const blockStatusEnum = pgEnum("block_status", [
  "planned",
  "done",
  "skipped",
  "partial",
]);

export const certStatusEnum = pgEnum("cert_status", [
  "planned",
  "in_progress",
  "completed",
]);

// ---------------------------------------------------------------------------
// NeetCode 150 tracker
// ---------------------------------------------------------------------------

/** Seeded, read-only catalog of the NeetCode 150. */
export const problems = pgTable("problems", {
  slug: varchar("slug", { length: 128 }).primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  sortOrder: integer("sort_order").notNull(),
  leetcodeUrl: text("leetcode_url").notNull(),
  neetcodeUrl: text("neetcode_url"),
});

export const problemStatus = pgTable("problem_status", {
  problemSlug: varchar("problem_slug", { length: 128 })
    .primaryKey()
    .references(() => problems.slug, { onDelete: "cascade" }),
  status: problemStatusEnum("status").notNull().default("not_started"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  problemSlug: varchar("problem_slug", { length: 128 })
    .notNull()
    .references(() => problems.slug, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  durationMin: integer("duration_min"),
  outcome: attemptOutcomeEnum("outcome").notNull(),
  note: text("note"),
});

/** One structured walkthrough per problem — your own explanation. */
export const walkthroughs = pgTable("walkthroughs", {
  problemSlug: varchar("problem_slug", { length: 128 })
    .primaryKey()
    .references(() => problems.slug, { onDelete: "cascade" }),
  pattern: text("pattern"),
  approach: text("approach"),
  complexity: text("complexity"),
  pitfalls: text("pitfalls"),
  body: text("body"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Spaced-repetition state (simplified SM-2), one row per reviewed problem. */
export const reviewState = pgTable("review_state", {
  problemSlug: varchar("problem_slug", { length: 128 })
    .primaryKey()
    .references(() => problems.slug, { onDelete: "cascade" }),
  intervalDays: real("interval_days").notNull().default(0),
  easeFactor: real("ease_factor").notNull().default(2.5),
  repetitions: integer("repetitions").notNull().default(0),
  dueDate: date("due_date").notNull(),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Schedule (planned vs actual)
// ---------------------------------------------------------------------------

/** Recurring habits: days-of-week (0=Sun..6=Sat) + a time window. */
export const habitRules = pgTable("habit_rules", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  daysOfWeek: smallint("days_of_week").array().notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(), // "HH:MM"
  durationMin: integer("duration_min").notNull(),
  linkedProblemSlug: varchar("linked_problem_slug", { length: 128 }).references(
    () => problems.slug,
    { onDelete: "set null" },
  ),
  linkedTopic: text("linked_topic"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Concrete blocks on a given day. Habit instances are materialized lazily:
 * a row exists only once a block is edited or completed.
 */
export const scheduleBlocks = pgTable("schedule_blocks", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(),
  startTime: varchar("start_time", { length: 5 }).notNull(),
  durationMin: integer("duration_min").notNull(),
  title: text("title").notNull(),
  habitRuleId: integer("habit_rule_id").references(() => habitRules.id, {
    onDelete: "set null",
  }),
  linkedProblemSlug: varchar("linked_problem_slug", { length: 128 }).references(
    () => problems.slug,
    { onDelete: "set null" },
  ),
  status: blockStatusEnum("status").notNull().default("planned"),
  actualMin: integer("actual_min"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

// ---------------------------------------------------------------------------
// Certificates
// ---------------------------------------------------------------------------

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider"),
  percentComplete: integer("percent_complete").notNull().default(0),
  targetDate: date("target_date"),
  url: text("url"),
  notes: text("notes"),
  status: certStatusEnum("status").notNull().default("in_progress"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  problemSlug: varchar("problem_slug", { length: 128 }).references(
    () => problems.slug,
    { onDelete: "set null" },
  ),
  topic: text("topic"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const noteTags = pgTable(
  "note_tags",
  {
    noteId: integer("note_id")
      .notNull()
      .references(() => notes.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.tagId] })],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const problemsRelations = relations(problems, ({ one, many }) => ({
  status: one(problemStatus, {
    fields: [problems.slug],
    references: [problemStatus.problemSlug],
  }),
  walkthrough: one(walkthroughs, {
    fields: [problems.slug],
    references: [walkthroughs.problemSlug],
  }),
  reviewState: one(reviewState, {
    fields: [problems.slug],
    references: [reviewState.problemSlug],
  }),
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  problem: one(problems, {
    fields: [attempts.problemSlug],
    references: [problems.slug],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  problem: one(problems, {
    fields: [notes.problemSlug],
    references: [problems.slug],
  }),
  noteTags: many(noteTags),
}));

export const noteTagsRelations = relations(noteTags, ({ one }) => ({
  note: one(notes, { fields: [noteTags.noteId], references: [notes.id] }),
  tag: one(tags, { fields: [noteTags.tagId], references: [tags.id] }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  noteTags: many(noteTags),
}));
