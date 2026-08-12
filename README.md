# CS Prep Platform

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Postgres](https://img.shields.io/badge/Postgres-4169E1?logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Local First](https://img.shields.io/badge/local--first-brightgreen)

Personal software-engineering internship prep app. Everything for one recruiting cycle in one place — study, practice, apply, track. Runs on your machine — no accounts, no deploys, no auth.

**Study** — a 16-chapter interview handbook: the LeetCode pattern catalog, complexity and data structures, backend and API design, system design, CS fundamentals, behavioral prep, and a company-by-company loop reference. Code examples are **Python** (FastAPI for the backend chapters); 260 interview questions are drillable as flashcards.

**Practice** — NeetCode 150 tracker, algorithm visualizer, spaced-repetition review, notes with an AI assistant.

**Apply** — internship listings synced from the public GitHub aggregator repos, an application pipeline tracker, cover letters tailored from your own base letter, and an AI rundown of any company's interview process.

## Setup

1. Install [Docker Desktop](https://docker.com).
2. Copy the env file and add your Anthropic key ([console.anthropic.com](https://console.anthropic.com)):
   ```bash
   cp .env.example .env
   ```
3. Start everything:
   ```bash
   docker compose up -d
   npm install
   npm run db:push
   npm run db:seed
   ```

## Run

```bash
npm run dev        # → http://localhost:3000
```

Database keeps running in Docker between sessions. `docker compose stop` to pause it.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm test` | Unit tests |
| `npm run db:push` | Apply schema to Postgres |
| `npm run db:seed` | Load the NeetCode 150 |
| `npm run db:sync-listings` | Pull internship listings from the GitHub feeds (also a button in the app) |
| `npm run db:backup` | Dump the database — `npm run -s db:backup > backup.sql` |
| `npm run db:generate` | Generate SQL migrations |

## Handbook

Chapters live in `src/content/handbook/` as typed TypeScript modules — not in the
database — so they stay diffable and reviewable in git. Each file exports one
`chapter: HandbookChapter` (contract in `types.ts`) and is registered in
`index.ts`.

```
src/content/handbook/
  types.ts     HandbookChapter contract + track definitions
  index.ts     registry — add new chapters here
  <slug>.ts    one chapter per file
```

Adding or editing a chapter:

1. Copy the shape of an existing chapter. `slug` must match the filename, and
   every `sections[].id` must be unique within the chapter — it's the anchor id.
2. **Markdown lives in template literals, so escape every backtick as `` \` ``
   and every `${` as `\${`.** This is the one way to break the build here; a
   fenced block is written ``\`\`\`python``.
3. Import it in `index.ts` and add it to the `CHAPTERS` array.

Code examples are Python, with three deliberate exceptions: `language-toolkit`
is a polyglot comparison; `os-concurrency` keeps Java for the memory model and
JavaScript for the event loop, since those are the subjects of those sections;
and `networking-web` keeps three browser-only blocks (`EventSource`, layout
thrashing, `innerHTML`) in JavaScript.

`relatedProblems` takes LeetCode slugs from the seeded NeetCode 150 — unknown
slugs are dropped silently rather than erroring, so cross-links can't break a page.

## Listing sources

Internship listings are pulled from public community-maintained repos — their
`listings.json`, not the README table:

| Cycle | Repo |
|---|---|
| Summer 2026 | [SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships) |
| Summer 2027 | [SimplifyJobs/Summer2027-Internships](https://github.com/SimplifyJobs/Summer2027-Internships) |
| Summer 2027 | [vanshb03/Summer2027-Internships](https://github.com/vanshb03/Summer2027-Internships) |
| New grad | [SimplifyJobs/New-Grad-Positions](https://github.com/SimplifyJobs/New-Grad-Positions) |

Add or change a feed in `src/lib/internships/feeds.ts`. Syncing upserts by
posting URL and marks anything a feed has dropped as closed, so filled roles
leave the tracker without losing your application history.

## AI features

Three streaming routes, all going through `src/lib/ai/stream.ts` so the API key
never leaves the server. Without `ANTHROPIC_API_KEY` set they return 503 with a
clear message and the rest of the app works normally.

| Route | Used by | Model |
|---|---|---|
| `/api/ai` | Notes assistant — summarize, quiz, clarify | `claude-haiku-4-5` (short, latency-sensitive) |
| `/api/ai/cover-letter` | Tailors your base letter to one application | `claude-opus-5` |
| `/api/ai/company-report` | Interview-loop rundown, cached per company | `claude-opus-5` |

The cover-letter prompt is instructed never to invent facts — if the posting
wants something your letter and profile don't support, it says so in a trailing
`NOTES` section instead of fabricating experience. Fill in your background on
`/applications/letters` to give it real material to work from.

## Hosting it later

Restore the auth files from git history (`git log --all --oneline -- src/auth.ts`), point `DATABASE_URL` at a hosted Postgres, deploy to Vercel.
