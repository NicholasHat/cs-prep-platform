# CS Prep Platform

![Next.js](https://img.shields.io/badge/Next.js-black?logo=next.js) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white) ![Postgres](https://img.shields.io/badge/Postgres-4169E1?logo=postgresql&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white) ![Local First](https://img.shields.io/badge/local--first-brightgreen)

Personal DSA interview prep app. Problem tracker, algorithm visualizer, study schedule, notes with an AI assistant, and certificate tracking. Runs on your machine — no accounts, no deploys, no auth.

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
| `npm run db:backup` | Dump the database — `npm run -s db:backup > backup.sql` |
| `npm run db:generate` | Generate SQL migrations |

## Hosting it later

Restore the auth files from git history (`git log --all --oneline -- src/auth.ts`), point `DATABASE_URL` at a hosted Postgres, deploy to Vercel.
