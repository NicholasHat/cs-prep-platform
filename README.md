# CS Prep Platform

Personal web app for end-to-end DSA interview prep: NeetCode 150 tracking with
spaced review, algorithm visualizations, study schedule with planned-vs-actual
history, notes with an AI assistant, and certificate tracking.

**Stack:** Next.js (App Router) · TypeScript · Tailwind v4 + shadcn/ui ·
Neon Postgres + Drizzle · Auth.js (Google OAuth, email allowlist) ·
Anthropic Claude Haiku (notes assistant) · Vercel.

Full design rationale: see the approved implementation plan
(`~/.claude/plans/prompt-for-claude-wild-newt.md`).

## Setup

1. **Environment** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — a [Neon](https://neon.tech) Postgres connection string
   - `AUTH_SECRET` — `npx auth secret`
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth client
     (redirect URI: `<origin>/api/auth/callback/google`)
   - `ALLOWED_EMAILS` — comma-separated emails allowed to sign in
   - `ANTHROPIC_API_KEY` — server-side only; never shipped to the client

2. **Database**
   ```bash
   npm run db:push    # apply the schema to Neon
   npm run db:seed    # load the NeetCode 150 (idempotent, safe to re-run)
   ```

3. **Run**
   ```bash
   npm run dev
   ```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm test` | Vitest unit tests (spaced-repetition engine, etc.) |
| `npm run db:generate` | Generate SQL migrations from `src/db/schema.ts` |
| `npm run db:push` | Push schema to the database |
| `npm run db:seed` | Upsert the NeetCode 150 catalog |

## Deploy (Vercel)

Import the repo in Vercel, add the same env vars, deploy. Run `db:push` +
`db:seed` once against the production `DATABASE_URL`.

## Build phases

- ✅ **Phase 0 — Foundation**: scaffold, DB schema, auth (Google + allowlist), app shell
- ✅ **Phase 1 — NeetCode tracker**: 150-problem catalog, statuses, attempts + timer, walkthroughs
- ✅ **Phase 2 — Spaced review + dashboard**: SM-2-lite queue, streaks, activity heatmap
- ⏳ **Phase 3 — Schedule + calendar**: habit rules, planned-vs-actual, month history
- ⏳ **Phase 4 — Visualizer**: trace-precompute engine, per-data-structure renderers
- ⏳ **Phase 5 — Notes + AI**: notes CRUD/tags + streaming assistant (`/api/ai` route is already live)
- ⏳ **Phase 6 — Certs + rewards + polish**
