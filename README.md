# CS Prep Platform

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Postgres](https://img.shields.io/badge/Postgres-4169E1?logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Local First](https://img.shields.io/badge/local--first-brightgreen)

Personal software-engineering internship prep app. Everything for one recruiting cycle in one place — study, practice, apply, track. Runs on your machine — no accounts, no deploys, no auth.

**Study** — an interview handbook covering REST/backend design, the LeetCode pattern catalog, CS fundamentals, system design, behavioral prep, and a company-by-company loop reference, with every chapter's interview questions drillable as flashcards.

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

## Listing sources

Internship listings are pulled from public community-maintained repos — their
`listings.json`, not the README table:

| Cycle | Repo |
|---|---|
| Summer 2026 | [SimplifyJobs/Summer2026-Internships](https://github.com/SimplifyJobs/Summer2026-Internships) |
| Summer 2027 | [vanshb03/Summer2027-Internships](https://github.com/vanshb03/Summer2027-Internships) |
| New grad | [SimplifyJobs/New-Grad-Positions](https://github.com/SimplifyJobs/New-Grad-Positions) |

Add or change a feed in `src/lib/internships/feeds.ts`. Syncing upserts by
posting URL and marks anything a feed has dropped as closed, so filled roles
leave the tracker without losing your application history.

## Hosting it later

Restore the auth files from git history (`git log --all --oneline -- src/auth.ts`), point `DATABASE_URL` at a hosted Postgres, deploy to Vercel.
