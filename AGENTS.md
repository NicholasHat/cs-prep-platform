<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project conventions

Local-only single-user app: no auth, no deploy target, Postgres in Docker. Don't
add auth checks, tenancy, or user ids — there is exactly one user.

## Handbook content (`src/content/handbook/`)

16 chapters of interview prep, authored as typed TS modules rather than seeded
into Postgres so they stay diffable in git. Each file exports one
`chapter: HandbookChapter` and is registered in `index.ts`.

**The markdown lives inside template literals. Escape every backtick as `` \` ``
and every `${` as `\${`.** This is the single most common way to break the build
in this directory — a fenced block is written ``\`\`\`python``. After editing,
run `npx tsc --noEmit` and load the page; a mangled fence typechecks fine and
only shows up as garbled output.

Code examples are **Python**. Three deliberate exceptions, don't "fix" them:
`language-toolkit` is a polyglot comparison; `os-concurrency` uses Java for the
memory model and JavaScript for the event loop because those are the subjects;
`networking-web` keeps three browser-only blocks (`EventSource`, layout
thrashing, `innerHTML`) in JavaScript.

When converting or adding examples, the prose has to stay true for Python, not
just the code — CPython list growth is ~1.125 not doubling, `dict` uses open
addressing, `deque` middle-indexing is O(n), ints never overflow, the recursion
limit is ~1000, and `sorted` is Timsort. A translated snippet under stale prose
is worse than no snippet.

## Internship listings

`internship_listings` is keyed by **posting URL**, not the source repo's uuid —
the same job appears across feeds under different ids. Sync upserts by URL and
flips anything a feed stopped listing to `active = false`; never delete rows, the
tracker links to them.

Sync logic lives in `src/lib/internships/sync.ts` and is shared by the server
action and `npm run db:sync-listings`. Add feeds in `feeds.ts`; the normalizer
already handles both repo shapes (`terms[]` vs a bare `season`).

## AI routes

Every model call goes through `src/lib/ai/stream.ts` — the key is server-side
only and routes must degrade to 503 when it's unset. New features use
`claude-opus-5`; the notes assistant stays on Haiku deliberately.

The cover-letter prompt forbids inventing facts and emits a trailing `NOTES`
section for gaps instead. Don't relax that to make output smoother.
