CREATE TYPE "public"."attempt_outcome" AS ENUM('solved', 'solved_with_help', 'unsolved');--> statement-breakpoint
CREATE TYPE "public"."block_status" AS ENUM('planned', 'done', 'skipped', 'partial');--> statement-breakpoint
CREATE TYPE "public"."cert_status" AS ENUM('planned', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."difficulty" AS ENUM('easy', 'medium', 'hard');--> statement-breakpoint
CREATE TYPE "public"."problem_status_kind" AS ENUM('not_started', 'attempted', 'solved', 'needs_review');--> statement-breakpoint
CREATE TABLE "attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"problem_slug" varchar(128) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"duration_min" integer,
	"outcome" "attempt_outcome" NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text,
	"percent_complete" integer DEFAULT 0 NOT NULL,
	"target_date" date,
	"url" text,
	"notes" text,
	"status" "cert_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"days_of_week" smallint[] NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"duration_min" integer NOT NULL,
	"linked_problem_slug" varchar(128),
	"linked_topic" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_tags" (
	"note_id" integer NOT NULL,
	"tag_id" integer NOT NULL,
	CONSTRAINT "note_tags_note_id_tag_id_pk" PRIMARY KEY("note_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"problem_slug" varchar(128),
	"topic" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problem_status" (
	"problem_slug" varchar(128) PRIMARY KEY NOT NULL,
	"status" "problem_status_kind" DEFAULT 'not_started' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "problems" (
	"slug" varchar(128) PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"difficulty" "difficulty" NOT NULL,
	"sort_order" integer NOT NULL,
	"leetcode_url" text NOT NULL,
	"neetcode_url" text
);
--> statement-breakpoint
CREATE TABLE "review_state" (
	"problem_slug" varchar(128) PRIMARY KEY NOT NULL,
	"interval_days" real DEFAULT 0 NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"due_date" date NOT NULL,
	"last_reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "schedule_blocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"start_time" varchar(5) NOT NULL,
	"duration_min" integer NOT NULL,
	"title" text NOT NULL,
	"habit_rule_id" integer,
	"linked_problem_slug" varchar(128),
	"status" "block_status" DEFAULT 'planned' NOT NULL,
	"actual_min" integer,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "walkthroughs" (
	"problem_slug" varchar(128) PRIMARY KEY NOT NULL,
	"pattern" text,
	"approach" text,
	"complexity" text,
	"pitfalls" text,
	"body" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_problem_slug_problems_slug_fk" FOREIGN KEY ("problem_slug") REFERENCES "public"."problems"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_rules" ADD CONSTRAINT "habit_rules_linked_problem_slug_problems_slug_fk" FOREIGN KEY ("linked_problem_slug") REFERENCES "public"."problems"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_tags" ADD CONSTRAINT "note_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_problem_slug_problems_slug_fk" FOREIGN KEY ("problem_slug") REFERENCES "public"."problems"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "problem_status" ADD CONSTRAINT "problem_status_problem_slug_problems_slug_fk" FOREIGN KEY ("problem_slug") REFERENCES "public"."problems"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_state" ADD CONSTRAINT "review_state_problem_slug_problems_slug_fk" FOREIGN KEY ("problem_slug") REFERENCES "public"."problems"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_habit_rule_id_habit_rules_id_fk" FOREIGN KEY ("habit_rule_id") REFERENCES "public"."habit_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schedule_blocks" ADD CONSTRAINT "schedule_blocks_linked_problem_slug_problems_slug_fk" FOREIGN KEY ("linked_problem_slug") REFERENCES "public"."problems"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "walkthroughs" ADD CONSTRAINT "walkthroughs_problem_slug_problems_slug_fk" FOREIGN KEY ("problem_slug") REFERENCES "public"."problems"("slug") ON DELETE cascade ON UPDATE no action;