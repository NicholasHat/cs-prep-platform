# CS Prep Platform

Personal, local-first web app for end-to-end DSA interview prep: NeetCode 150
tracking with spaced review, algorithm visualizations, study schedule with
planned-vs-actual history, notes with an AI assistant, and certificate
tracking.

**Stack:** Next.js (App Router) · TypeScript · Tailwind v4 + shadcn/ui ·
Postgres (Docker) + Drizzle · Anthropic Claude Haiku (notes assistant).

Runs entirely on your machine — no accounts, no deploys, no auth. The only
external service is the Anthropic API for the notes assistant.

## Setup (once)

1. Install [Docker Desktop](https://docker.com) if you don't have it.
2. Copy the env file and add your Anthropic key
   ([console.anthropic.com](https://console.anthropic.com)):
   ```bash
   cp .env.example .env
   # edit .env → set ANTHROPIC_API_KEY
   ```
3. Start the database, create the tables, load the NeetCode 150:
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

The database keeps running in Docker between sessions (`docker compose stop`
to pause it, `docker compose up -d` to resume).

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm test` | Vitest unit tests (SRS engine, schedule merge, visualizer traces) |
| `npm run db:push` | Apply the schema to Postgres |
| `npm run db:seed` | Upsert the NeetCode 150 catalog (idempotent) |
| `npm run db:backup` | Dump the database to stdout — `npm run -s db:backup > backup.sql` |
| `npm run db:generate` | Generate SQL migrations from `src/db/schema.ts` |

## Hosting it later (optional)

The app was designed hosted-first and scaled back on purpose; going back is
additive: restore the Auth.js + proxy files from git history
(`git log --all --oneline -- src/auth.ts`), point `DATABASE_URL` at a hosted
Postgres (e.g. Neon), and deploy to Vercel. The schema and queries are plain
Postgres throughout — no rewrite needed.

## Build phases

- ✅ **Phase 0 — Foundation**: scaffold, DB schema, app shell
- ✅ **Phase 1 — NeetCode tracker**: 150-problem catalog, statuses, attempts + timer, walkthroughs
- ✅ **Phase 2 — Spaced review + dashboard**: SM-2-lite queue, streaks, activity heatmap
- ✅ **Phase 3 — Schedule + calendar**: habit rules, planned-vs-actual, month history
- ✅ **Phase 4 — Visualizer**: trace-precompute engine, 12 algorithms across array/grid/stack renderers
- ✅ **Phase 5 — Notes + AI**: notes CRUD/search/tags + streaming Claude Haiku assistant
- ✅ **Phase 6 — Certs + rewards**: certificate tracking, solve/category-completion celebrations
