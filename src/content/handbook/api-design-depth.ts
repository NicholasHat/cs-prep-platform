import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "api-design-depth",
  title: "API Design: The Follow-Up Questions",
  track: "backend",
  order: 2,
  summary:
    "What the interviewer asks after you've described CRUD: idempotency, the real status code map, cursor pagination, versioning, auth, rate limiting, caching, CORS, injection safety, webhooks, idempotency keys, and where REST stops being the right answer.",
  estMinutes: 90,
  tags: [
    "rest",
    "http",
    "auth",
    "jwt",
    "caching",
    "pagination",
    "rate-limiting",
    "cors",
    "security",
    "graphql",
  ],
  sections: [
    {
      id: "methods-idempotency-safety",
      heading: "HTTP methods, safety, and idempotency",
      markdown: `Two properties define the useful behaviour of every HTTP method. Interviewers ask about them because they are the difference between an API that survives a flaky network and one that double-charges customers.

- **Safe** — the method does not change server state. Safe methods can be prefetched by a browser, crawled by a bot, and retried by anything.
- **Idempotent** — making the request *N* times has the same effect on server state as making it once. The *response* may differ (first \`DELETE\` → \`204\`, second → \`404\`); what matters is the resulting state.

| Method | Safe | Idempotent | Cacheable | Body | Use for |
| --- | --- | --- | --- | --- | --- |
| \`GET\` | Yes | Yes | Yes | No | Retrieve a resource |
| \`HEAD\` | Yes | Yes | Yes | No | Headers only — check existence, size, \`ETag\` |
| \`OPTIONS\` | Yes | Yes | No | No | Capability discovery; CORS preflight |
| \`POST\` | **No** | **No** | Rarely | Yes | Create a subordinate resource; non-idempotent actions |
| \`PUT\` | No | **Yes** | No | Yes | Replace a resource at a known URL |
| \`PATCH\` | No | Usually¹ | No | Yes | Partial modification |
| \`DELETE\` | No | **Yes** | No | Optional | Remove a resource |

¹ \`PATCH\` is idempotent if the patch is *absolute* (\`{"status":"done"}\` — apply it twice, same state). It is **not** if the patch is *relative* (\`{"$inc":{"views":1}}\`). The spec does not require idempotency for \`PATCH\`; your implementation should aim for it.

### Why this matters in practice

A mobile client sends \`POST /orders\`. The request reaches the server, the order is created, and then the connection drops before the response arrives. The client sees a timeout. Does it retry?

- If it does, you get **two orders**. \`POST\` is not idempotent, so the client cannot safely retry.
- If it doesn't, the user thinks the order failed when it succeeded.

There is no correct client behaviour here — the API is broken. The fix is **idempotency keys** (covered later in this chapter): the client generates a UUID, sends it as \`Idempotency-Key\`, and the server guarantees at-most-once processing. Every serious payments API does this.

Contrast with \`PUT /users/42/avatar\`. The client picks the URL, so a retry overwrites the same object. Safe to retry unconditionally, and this is exactly why "\`PUT\` when the client knows the identifier, \`POST\` when the server assigns it" is the standard rule.

### Two mistakes worth being able to name

**\`GET\` with side effects.** \`GET /users/42/delete\` looks harmless until a browser prefetcher, a link scanner in an email client, or a corporate proxy warms the URL and deletes the user. Google Web Accelerator famously wiped data from admin panels built this way. Safe means safe.

**\`GET\` with a body.** Some servers and proxies drop it silently. If your query genuinely doesn't fit in a URL (a complex search), the pragmatic answer is \`POST /searches\` returning a search resource — and say out loud that you know you're trading away cacheability for expressiveness.`,
    },
    {
      id: "status-codes",
      heading: "The status code map, and when each is genuinely correct",
      markdown: `Anyone can recite \`200\`, \`404\`, \`500\`. The signal is in knowing \`409\` vs \`422\`, \`401\` vs \`403\`, and \`202\` vs \`201\`.

| Code | Name | Use it when | Trap |
| --- | --- | --- | --- |
| \`200\` | OK | Successful \`GET\`, \`PUT\`, \`PATCH\`, or a \`DELETE\` that returns a body | Returning \`200\` with \`{"success":false}\` — the whole point of status codes is that clients don't parse bodies to know |
| \`201\` | Created | \`POST\` created a resource. Include a \`Location\` header | Using it for a \`PATCH\` that didn't create anything |
| \`202\` | Accepted | Work was queued, not done. Return a job URL to poll | Pretending work is done when a queue might drop it |
| \`204\` | No Content | Success with nothing to return — typically \`DELETE\` | Sending a body anyway; some clients hang waiting for it |
| \`301\` / \`308\` | Moved Permanently | The URL changed forever. \`308\` preserves the method | \`301\` lets clients rewrite \`POST\` to \`GET\`; browsers cache \`301\` aggressively and it is very hard to undo |
| \`302\` / \`307\` | Found / Temporary Redirect | Temporary relocation. \`307\` preserves the method | Same method-rewriting trap as \`301\` |
| \`304\` | Not Modified | Conditional \`GET\` and the client's cached copy is still valid | Sending a body — \`304\` must have none |
| \`400\` | Bad Request | Malformed request: unparseable JSON, bad query param type | Using it as a catch-all for every client-side problem |
| \`401\` | Unauthorized | **Not authenticated.** No/invalid/expired credentials. Must send \`WWW-Authenticate\` | Using it when the user *is* logged in but lacks permission — that's \`403\` |
| \`403\` | Forbidden | Authenticated, identity understood, but not allowed | Leaking existence: if a user shouldn't know a resource exists, return \`404\` instead |
| \`404\` | Not Found | No resource at this URL | Returning it for a bad *body* — that's \`422\` |
| \`405\` | Method Not Allowed | Path exists, method doesn't. **Must** include \`Allow: GET, POST\` | Returning \`404\` and leaving the client guessing |
| \`409\` | Conflict | The request conflicts with current state: duplicate unique key, stale version, reopening a closed ticket | Using it for validation errors — the request was fine, the *state* wasn't |
| \`410\` | Gone | Existed, deliberately removed, will not return | Rarely worth the bookkeeping unless clients need to purge |
| \`412\` | Precondition Failed | \`If-Match\` / \`If-Unmodified-Since\` didn't hold — optimistic concurrency | — |
| \`415\` | Unsupported Media Type | \`Content-Type\` isn't something you accept | — |
| \`422\` | Unprocessable Content | Syntactically valid, semantically invalid: \`title\` empty, \`email\` malformed | Some APIs use \`400\` for this. Fine — just be consistent |
| \`429\` | Too Many Requests | Rate limited. Include \`Retry-After\` | Omitting \`Retry-After\`, so clients hammer you harder |
| \`500\` | Internal Server Error | **Your bug.** Unhandled exception | Using it for anything the client caused. A 500 should mean "page someone" |
| \`502\` | Bad Gateway | Upstream returned garbage | — |
| \`503\` | Service Unavailable | Overloaded or in maintenance. Include \`Retry-After\` | — |
| \`504\` | Gateway Timeout | Upstream too slow | — |

### The three distinctions you will actually be asked

**\`401\` vs \`403\`.** \`401\` = "I don't know who you are" → the client should log in or refresh a token. \`403\` = "I know exactly who you are, and no" → re-authenticating changes nothing. Getting this backwards sends clients into infinite token-refresh loops.

**\`422\` vs \`409\`.** \`422\` means the *payload* is wrong — you can fix it by editing the request (empty title, bad enum). \`409\` means the payload is fine but the *world* is wrong — email already taken, task already assigned, version stale. The client's remedy differs: correct the form vs refetch and retry.

**\`404\` vs \`403\` for authorization failures.** If returning \`403\` reveals that a resource exists, you have an enumeration leak — an attacker walks \`/users/1\`, \`/users/2\` and maps your database by which IDs return \`403\` instead of \`404\`. GitHub returns \`404\` for private repos you can't see, for exactly this reason. Volunteering this tradeoff is a strong signal.

**A rule that keeps your alerting useful:** 4xx means the client did something wrong and nobody gets paged; 5xx means you have a bug and someone does. If a missing record produces a \`500\`, your error rate is permanent noise and real incidents hide inside it.`,
    },
    {
      id: "resource-naming-filtering-sorting",
      heading: "Resource naming, filtering, and sorting",
      markdown: `### Naming

| Do | Don't | Why |
| --- | --- | --- |
| \`/v1/task-lists\` | \`/v1/TaskLists\`, \`/v1/task_lists\` | Lowercase, hyphenated. URLs are case-sensitive after the host; mixed case guarantees someone gets it wrong |
| \`/tasks\` (plural) | \`/task\` | A collection is plural; \`/tasks/42\` reads naturally as one of them |
| \`/tasks/42\` | \`/tasks?id=42\` | Path identifies a resource; query filters a collection. This is what makes \`/tasks/42\` cacheable as its own entity |
| \`POST /tasks\` | \`POST /tasks/create\` | The method is the verb |
| \`/tasks/42/comments\` | \`/comments?taskId=42\` for creation | Nesting one level expresses ownership; \`POST\` to the nested collection is unambiguous |
| \`/comments/42\` | \`/projects/1/tasks/7/comments/42\` | If a resource has a global ID, give it a top-level URL too |

### Filtering

Filters go in the query string as \`field=value\`:

\`\`\`text
GET /v1/tasks?status=todo&priority=high&projectId=7
GET /v1/tasks?createdAfter=2026-01-01T00:00:00Z
GET /v1/tasks?status=todo,in_progress          # comma = OR within one field
GET /v1/tasks?q=deploy                          # free-text search
\`\`\`

Two rules that matter more than the syntax:

1. **Whitelist filterable fields.** \`Object.entries(req.query)\` fed into a \`WHERE\` clause is how you end up letting clients filter on \`password_hash\` and confirm values one character at a time. Every filterable field is an explicit key in your zod schema.
2. **Every filterable field needs an index, or a documented limit.** An unindexed \`WHERE\` on a 10M-row table is a sequential scan you just exposed to the public internet.

For anything more expressive than equality, stop inventing syntax. \`?filter[price][gte]=100\` and \`?filter=price>100\` both end in a hand-written parser nobody wants to maintain. At that point you either adopt a real query language (OData, GraphQL) or accept a \`POST /v1/tasks/search\` with a structured JSON body — and say out loud you're trading cacheability for expressiveness.

### Sorting

\`\`\`text
GET /v1/tasks?sort=-createdAt          # leading '-' means descending
GET /v1/tasks?sort=priority,-createdAt # multi-key, in order
\`\`\`

**\`ORDER BY\` cannot be parameterized.** \`order by $1\` does not work in Postgres — you cannot bind an identifier. So sort fields must come from an allowlist, mapped to real column names:

\`\`\`ts
const SORTABLE = {
  createdAt: "created_at",
  dueAt: "due_at",
  priority: "priority",
} as const;

function orderBy(sort: string): string {
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  const column = SORTABLE[key as keyof typeof SORTABLE];
  if (!column) throw new ValidationError("Unsupported sort field: " + key);
  return column + (desc ? " desc" : " asc");
}
\`\`\`

**Always add a tiebreaker.** \`order by created_at desc\` with duplicate timestamps has no defined order between ties, so a row can appear on page 1 *and* page 2 while another never appears at all. \`order by created_at desc, id desc\` makes the ordering total and the pagination correct. This is the bug that makes people think their pagination is "randomly dropping rows".`,
    },
    {
      id: "pagination",
      heading: "Pagination: offset vs cursor",
      markdown: `Never return an unbounded collection. \`GET /tasks\` on a table that grows to ten million rows will eventually take your service down, and it will happen on the day you're least able to deal with it. Default \`limit=20\`, cap at \`100\`.

### Offset pagination

\`\`\`text
GET /v1/tasks?limit=20&offset=40
\`\`\`

\`\`\`sql
select * from tasks order by created_at desc, id desc limit 20 offset 40;
\`\`\`

Simple, supports jumping to an arbitrary page, and lets you show "page 7 of 412". Two problems make it unusable at scale.

**It gets slower the deeper you go.** \`OFFSET 100000\` does not skip rows cheaply — Postgres must produce the first 100,020 rows in order and then discard 100,000 of them. Page 1 is 2ms; page 5,000 is 800ms. The cost is linear in the offset.

**It skips and duplicates rows under concurrent writes.** You read page 1 (rows 1-20). Someone inserts a new row that sorts to position 1. You read page 2 with \`offset=20\` — everything shifted down by one, so the row that was #20 is now #21 and you see it twice, and one row is never returned. On an infinite-scroll feed users see duplicates; on a backfill job you silently skip records.

### Cursor (keyset) pagination

Instead of "skip N rows", say "give me rows after *this exact row*".

\`\`\`text
GET /v1/tasks?limit=20
GET /v1/tasks?limit=20&cursor=MjAyNi0wNy0yN1QwOTo1ODo0MS4wMDJafDFhMmIzYzRk
\`\`\`

\`\`\`sql
-- Row-value comparison: exactly the tuple ordering we sort by.
select * from tasks
 where (created_at, id) < ($1, $2)
 order by created_at desc, id desc
 limit 21;                                  -- +1 to detect "has more"
\`\`\`

With an index on \`(created_at desc, id desc)\`, Postgres seeks straight to the position and reads 21 rows. **Page 5,000 costs the same as page 1**, and concurrent inserts cannot shift your position, because the position is a row identity rather than a count.

\`\`\`ts
// src/lib/cursor.ts
export interface Cursor {
  createdAt: string;
  id: string;
}

export function encodeCursor(c: Cursor): string {
  return Buffer.from(JSON.stringify(c)).toString("base64url");
}

export function decodeCursor(raw: string): Cursor {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (typeof parsed?.createdAt !== "string" || typeof parsed?.id !== "string") {
      throw new Error("shape");
    }
    return parsed;
  } catch {
    throw new ValidationError("Malformed cursor.");
  }
}

export async function listTasks(limit: number, cursor?: string) {
  const values: unknown[] = [];
  let where = "";
  if (cursor) {
    const { createdAt, id } = decodeCursor(cursor);
    values.push(createdAt, id);
    where = "where (created_at, id) < ($1, $2)";
  }
  values.push(limit + 1);

  const { rows } = await pool.query(
    "select * from tasks " + where +
      " order by created_at desc, id desc limit $" + values.length,
    values,
  );

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return {
    items,
    nextCursor: hasMore
      ? encodeCursor({
          createdAt: items[items.length - 1].created_at.toISOString(),
          id: items[items.length - 1].id,
        })
      : null,
  };
}
\`\`\`

**Base64-encode the cursor** — not for security (it is trivially decodable), but to make it opaque so clients treat it as a token rather than parsing it and coupling themselves to your sort key. If it *must* be tamper-proof, sign it with HMAC.

| | Offset | Cursor |
| --- | --- | --- |
| Deep-page performance | Degrades linearly | Constant |
| Jump to page N | Yes | No — sequential only |
| Total count / "page 7 of 412" | Easy | Requires a separate \`COUNT(*)\` |
| Correct under concurrent writes | No — skips and duplicates | Yes |
| Arbitrary re-sorting | Trivial | Cursor is tied to the sort key |
| Implementation | Trivial | Moderate |

**What to say:** *"Offset for an admin table with a few thousand rows where users want to jump to page 40. Cursor for anything user-facing, infinite-scroll, high-volume, or any API a third party integrates against — Stripe, Twitter, and Slack all use cursors, and the reason isn't just speed, it's correctness under concurrent writes."*

If a product genuinely needs both a total count and deep paging, the honest answer is to return an *approximate* count (\`reltuples\` from \`pg_class\`, or a cached count) rather than running \`COUNT(*)\` over 10M rows on every request.`,
    },
    {
      id: "versioning",
      heading: "Versioning",
      markdown: `You need versioning the first time you must make a **breaking** change. Breaking means: removing or renaming a field, changing a type, adding a required request field, tightening validation, or changing a status code's meaning. Adding an *optional* field or a new endpoint is not breaking — a well-written client ignores unknown fields.

| Strategy | Example | Pros | Cons |
| --- | --- | --- | --- |
| **URL path** | \`/v1/tasks\`, \`/v2/tasks\` | Obvious, visible in logs and dashboards, easy to route at the proxy, trivially testable in a browser | Purists object that the URL should identify a resource, not a representation. Version sprawl across routers |
| **Header** | \`Accept: application/vnd.acme.v2+json\` | URLs stay stable; arguably the "correct" HTTP answer | Invisible in logs and browser tabs; caches need \`Vary: Accept\`; every client integration is harder |
| **Query param** | \`/tasks?version=2\` | Easy to add | Easy to omit; interacts badly with caching |
| **Date-pinned** | \`Anthropic-Version: 2026-07-27\` (Stripe, Anthropic) | Fine-grained, per-account pinning, no big-bang migrations | Serious infrastructure: you maintain N transformation layers |

**What I want to hear:** *"URL path versioning — \`/v1/\` — from day one, because it costs nothing before you need it and it's visible in every log line and metric, so I can actually see who is still on v1 before I turn it off. But I'd avoid creating v2 for as long as possible: most changes can be made additively, and every version you support is a version you test, document, and keep alive."*

### Avoiding v2 in the first place

- **Add, never remove.** New field alongside the old one; deprecate the old in docs; remove it a year later once metrics show zero reads.
- **Expand/contract for renames.** Write both fields, read the new one, drop the old after clients migrate. Same pattern as a zero-downtime database migration.
- **Version the resource, not the API.** If only \`/tasks\` broke, you can serve \`/v2/tasks\` and leave every other route on v1 rather than duplicating the whole surface.
- **Default conservatively.** New behaviour behind an opt-in flag; flip the default in the next major version.

### Deprecating properly

Announce with a date. Emit the standard headers so it shows up in client logs:

\`\`\`http
Deprecation: Sun, 01 Nov 2026 00:00:00 GMT
Sunset: Wed, 01 Apr 2027 00:00:00 GMT
Link: </v2/tasks>; rel="successor-version"
\`\`\`

Instrument per-version request counts by client so you know who is affected before you break them. Then actually turn it off — a v1 you never remove is a v1 you maintain forever, and the maintenance cost is what versioning was supposed to bound.`,
    },
    {
      id: "authn-authz",
      heading: "Authentication and authorization",
      markdown: `**Authentication** = who are you. **Authorization** = what may you do. Mixing them up is the single most common vocabulary error in these interviews.

### The four mechanisms

| Mechanism | How it works | Best for | Where it bites |
| --- | --- | --- | --- |
| **Session cookie** | Server stores a session record; client holds an opaque ID in an \`HttpOnly\` cookie | First-party web apps | Requires a session store; needs CSRF protection because cookies are sent automatically |
| **JWT (bearer)** | Signed, self-contained token in \`Authorization: Bearer …\`, verified without a lookup | Stateless services, mobile clients, service-to-service | **Cannot be revoked** before expiry; size grows with claims; storage on web is a real problem |
| **API key** | Long-lived opaque secret per integration | Server-to-server, third-party integrations | Long-lived: needs scoping, rotation, and hashed storage |
| **OAuth2 / OIDC** | Delegated authorization; OIDC adds an identity layer on top | "Sign in with Google", third-party access to user data | Genuinely complex; the failure mode is implementing it yourself |

### Session cookies

\`\`\`ts
res.cookie("sid", sessionId, {
  httpOnly: true,   // JavaScript cannot read it -> XSS can't steal it directly
  secure: true,     // HTTPS only
  sameSite: "lax",  // not sent on cross-site POSTs -> blocks most CSRF
  maxAge: 1000 * 60 * 60 * 24 * 7,
  path: "/",
});
\`\`\`

The server keeps \`sessionId → {userId, expiresAt}\` in Redis or Postgres. Logging out, or banning a user, is a single \`DELETE\` and takes effect on the very next request. That instant revocation is the reason sessions remain the right default for first-party web apps despite being "stateless-unfriendly".

The cost: a lookup per request (cheap — Redis is sub-millisecond) and CSRF exposure, because browsers attach cookies to cross-site requests automatically. \`SameSite=Lax\` blocks the classic cross-site form POST; add a synchronizer token or double-submit cookie if you need \`SameSite=None\`.

### JWTs, and where they bite you

\`\`\`text
header.payload.signature
{"alg":"RS256","typ":"JWT"}.{"sub":"91","role":"admin","exp":1785000000}.<sig>
\`\`\`

The signature proves the payload was issued by you and hasn't been altered. Verification is a local signature check — no database round trip — which is why JWTs scale horizontally and work well between services.

Now the parts candidates miss, which is exactly what the follow-up question is for:

1. **The payload is signed, not encrypted.** It is base64url — anyone can read it. Never put anything secret in a JWT.
2. **You cannot revoke one.** Fire an admin at 10:00 and their token stays valid until \`exp\`. The mitigations all reintroduce state: short expiry (5-15 min) plus a refresh token, or a revocation list checked per request — at which point you have a session with extra steps.
3. **Stale claims.** \`role: "admin"\` was true at issue time. Demote the user and the old token still says admin until it expires. Any authorization decision from a long-lived claim is a decision made from stale data.
4. **\`alg: none\` and algorithm confusion.** Historic libraries accepted \`{"alg":"none"}\` and skipped verification, or let an attacker sign an RS256 token with the *public* key treated as an HMAC secret. Always pin the expected algorithm in the verify call; never trust the header.
5. **Browser storage has no good answer.** \`localStorage\` is readable by any XSS. A cookie is safer (\`HttpOnly\`) but then you're back to CSRF — and if you're using cookies anyway, ask why you needed a JWT rather than a session.

\`\`\`ts
import jwt from "jsonwebtoken";

const payload = jwt.verify(token, PUBLIC_KEY, {
  algorithms: ["RS256"],           // pin it — never read alg from the header
  issuer: "https://auth.acme.com",
  audience: "https://api.acme.com",
  clockTolerance: 5,
});
\`\`\`

**The rule of thumb worth stating:** first-party web app → session cookies. Mobile or service-to-service → short-lived JWT access token + refresh token, with refresh tokens stored server-side so they *can* be revoked. Third-party integrations → API keys with scopes, or OAuth2 if a user is delegating access to their data.

### API keys

Store a **hash** of the key, not the key — a leaked database should not hand over working credentials. Show the plaintext exactly once at creation. Prefix it (\`sk_live_…\`) so secret scanners on GitHub can detect and auto-revoke it. Scope keys to the minimum permissions and support rotation with an overlap window so a customer can roll keys without downtime.

### OAuth2 / OIDC in one paragraph

Authorization Code + PKCE: your app redirects the user to the provider, the user authenticates *there* (you never see their password), the provider redirects back with a short-lived \`code\`, and your server exchanges that code plus a secret for tokens. PKCE adds a per-request \`code_verifier\` so an intercepted code is useless. OAuth2 is *authorization* (an access token for an API); **OIDC** layers *authentication* on top by adding an \`id_token\` — a JWT describing who the user is. If someone says "we use OAuth to log people in", the precise version is "we use OIDC".

### Authorization: RBAC vs ABAC

**RBAC** — permissions attach to roles, roles attach to users.

\`\`\`ts
const PERMISSIONS = {
  viewer: ["task:read"],
  member: ["task:read", "task:create", "task:update"],
  admin: ["task:read", "task:create", "task:update", "task:delete", "project:manage"],
} as const;

function requirePermission(permission: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const perms = PERMISSIONS[req.user.role] ?? [];
    if (!perms.includes(permission)) throw new ForbiddenError();
    next();
  };
}
\`\`\`

Simple, auditable, and enough for most products. It breaks down when rules depend on the *relationship* between the user and the specific object — "a member may edit a task **only in a project they belong to**, and only **before it's archived**". Role alone cannot express that.

**ABAC** — decide from attributes of subject, resource, action, and environment:

\`\`\`ts
function canEditTask(user: User, task: Task, project: Project): boolean {
  if (user.role === "admin") return true;
  if (!project.memberIds.includes(user.id)) return false;
  if (project.archivedAt) return false;
  return task.createdBy === user.id || user.role === "member";
}
\`\`\`

More expressive, harder to audit ("who can edit task 42?" now requires evaluating a function against live data).

**The non-negotiable part**, and the thing interviewers are really checking: authorization is enforced **per object**, in the service layer, not by a route-level role check. \`requirePermission("task:update")\` confirms members may update *some* task; it says nothing about *this* task. If you only check the role, any member can \`PATCH /tasks/{any-id}\` and edit another company's data. That is IDOR — broken object-level authorization — and it is consistently the number one item on the OWASP API Security Top 10.`,
    },
    {
      id: "rate-limiting",
      heading: "Rate limiting",
      markdown: `Rate limiting protects you from three different things, and knowing which one you're solving picks the algorithm: accidental client bugs (a retry loop), deliberate abuse (credential stuffing, scraping), and cost control (an expensive endpoint hit in a tight loop).

### The algorithms

| Algorithm | How it works | Handles bursts | Memory | Note |
| --- | --- | --- | --- | --- |
| **Fixed window** | Count per user per minute; reset on the boundary | Badly | Tiny | 2× burst at the boundary: 100 requests at 11:59:59 plus 100 at 12:00:00 |
| **Sliding window log** | Store every request timestamp, count those within the window | Exactly | High | Precise but O(requests) memory per user |
| **Sliding window counter** | Weighted blend of the current and previous fixed windows | Well | Tiny | The usual production compromise |
| **Token bucket** | Bucket of \`capacity\` tokens refills at \`rate\`/sec; each request takes one | **Deliberately** | Tiny (2 numbers) | The standard answer; AWS and Stripe use it |
| **Leaky bucket** | Requests queue and drain at a fixed rate | Smooths | Queue | Shapes traffic rather than rejecting it |

**Token bucket is the answer to give**, because it separates two things the others conflate: the sustained rate (refill) and the tolerated burst (capacity). A user who has been idle accumulates tokens and can spend them in one burst — which is what real clients do when a page loads and fires eight requests at once.

\`\`\`ts
// src/lib/rateLimit.ts — token bucket in Redis, atomic via Lua.
import type Redis from "ioredis";

const SCRIPT = \`
local key      = KEYS[1]
local rate     = tonumber(ARGV[1])   -- tokens per second
local capacity = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])   -- seconds, fractional
local cost     = tonumber(ARGV[4])

local bucket = redis.call('HMGET', key, 'tokens', 'ts')
local tokens = tonumber(bucket[1])
local ts     = tonumber(bucket[2])
if tokens == nil then
  tokens = capacity
  ts     = now
end

-- Refill for elapsed time, clamped to capacity.
local elapsed = math.max(0, now - ts)
tokens = math.min(capacity, tokens + elapsed * rate)

local allowed = 0
if tokens >= cost then
  tokens  = tokens - cost
  allowed = 1
end

redis.call('HMSET', key, 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', key, math.ceil(capacity / rate) * 2)

local retry_after = 0
if allowed == 0 then
  retry_after = (cost - tokens) / rate
end
return { allowed, tokens, retry_after }
\`;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export async function consume(
  redis: Redis,
  key: string,
  ratePerSecond: number,
  capacity: number,
  cost = 1,
): Promise<RateLimitResult> {
  const [allowed, tokens, retryAfter] = (await redis.eval(
    SCRIPT,
    1,
    key,
    String(ratePerSecond),
    String(capacity),
    String(Date.now() / 1000),
    String(cost),
  )) as [number, number, number];

  return {
    allowed: allowed === 1,
    remaining: Math.floor(tokens),
    retryAfterSeconds: Math.ceil(retryAfter),
  };
}
\`\`\`

\`\`\`ts
// src/middleware/rateLimit.ts
export function rateLimit(ratePerSecond: number, capacity: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Key by user when authenticated; by IP otherwise. Never key an
    // authenticated API purely by IP — one corporate NAT shares an IP.
    const key = "rl:" + (req.user?.id ?? req.ip);
    const result = await consume(redis, key, ratePerSecond, capacity);

    res.setHeader("RateLimit-Limit", capacity);
    res.setHeader("RateLimit-Remaining", result.remaining);

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfterSeconds);
      res.status(429).json({
        error: {
          code: "rate_limited",
          message: "Too many requests. Retry in " + result.retryAfterSeconds + "s.",
        },
      });
      return;
    }
    next();
  };
}
\`\`\`

### Details that separate a real answer from a textbook one

- **State must be shared.** An in-memory counter with five instances behind a load balancer gives every user 5× the limit. Redis, or the load balancer/API gateway itself.
- **The check must be atomic.** Read-modify-write across two round trips races under concurrency. That is why the logic is a Lua script — Redis runs it atomically.
- **Key by identity, then by IP.** Keying an authenticated API by IP alone punishes everyone behind one office NAT and does nothing against a botnet. Key by user ID or API key when you have one.
- **Different limits per endpoint.** \`POST /login\` and \`POST /password-reset\` need far tighter limits than \`GET /tasks\` — that's your defence against credential stuffing. Expensive endpoints can charge \`cost > 1\` from the same bucket.
- **Always return \`Retry-After\`.** Without it, well-meaning clients retry immediately and make the overload worse. Pair it with documented exponential backoff plus jitter on the client.
- **Rate limit before expensive work, after authentication.** You need identity to key the bucket, but you don't want to run the query before deciding to reject.
- **429 vs 503.** \`429\` = *you* exceeded *your* quota. \`503\` = the service is overloaded for everyone. Load shedding under global overload is a different mechanism from per-user quotas.`,
    },
    {
      id: "caching",
      heading: "Caching, ETags, and conditional requests",
      markdown: `Caching questions test whether you understand that HTTP already has a caching protocol, and that you don't need Redis to use it.

### \`Cache-Control\`

\`\`\`http
Cache-Control: public, max-age=3600                       # any cache, 1 hour
Cache-Control: private, max-age=60                        # browser only, not a CDN
Cache-Control: no-cache                                   # cache it, but revalidate every time
Cache-Control: no-store                                   # never write it down anywhere
Cache-Control: public, max-age=60, stale-while-revalidate=600
\`\`\`

| Directive | Means |
| --- | --- |
| \`public\` | Any cache may store it, including shared CDNs |
| \`private\` | Only the end user's browser. **Use for anything user-specific** |
| \`max-age=N\` | Fresh for N seconds; served without contacting the server |
| \`no-cache\` | Confusingly named: *store it*, but revalidate before every use |
| \`no-store\` | Do not persist at all — auth endpoints, anything with secrets |
| \`stale-while-revalidate=N\` | Serve stale for up to N seconds while refreshing in the background |
| \`immutable\` | Never revalidate — for content-hashed asset URLs |

The single most dangerous mistake: \`Cache-Control: public\` on a user-specific response. A shared CDN caches user A's \`/v1/me\` and serves it to user B. Anything that varies by \`Authorization\` must be \`private\` (or \`no-store\`), and must set \`Vary: Authorization\` so caches key on it.

### ETag and the 304 flow

An \`ETag\` is an opaque version identifier for a representation — a hash of the body, or a row's \`updated_at\`/\`version\`.

\`\`\`http
# 1. First request
GET /v1/tasks/42

HTTP/1.1 200 OK
ETag: "a3f1c9e7"
Cache-Control: private, max-age=0, must-revalidate
Content-Length: 412

{"data":{"id":"42","title":"Write the API chapter", ...}}

# 2. Later, the client revalidates
GET /v1/tasks/42
If-None-Match: "a3f1c9e7"

HTTP/1.1 304 Not Modified
ETag: "a3f1c9e7"
Cache-Control: private, max-age=0, must-revalidate
(no body)
\`\`\`

The client already has the bytes, so the \`304\` sends none. On a mobile network that is the difference between 412 bytes and ~120 bytes of headers, and no JSON parse.

\`\`\`ts
import { createHash } from "node:crypto";

app.get("/v1/tasks/:id", async (req, res) => {
  const task = await taskService.getTask(req.params.id);
  const body = JSON.stringify({ data: task });
  const etag = '"' + createHash("sha1").update(body).digest("base64url") + '"';

  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", "private, max-age=0, must-revalidate");

  if (req.header("if-none-match") === etag) {
    res.status(304).end();       // MUST have no body
    return;
  }
  res.type("application/json").send(body);
});
\`\`\`

Note what this does and doesn't save: the database query still ran. To save the query too, derive the ETag from something cheap — a \`version\` column or \`updated_at\` — and check it before fetching the full row.

**Strong vs weak.** \`"abc"\` is strong: byte-identical. \`W/"abc"\` is weak: semantically equivalent, so it can ignore differences like whitespace or a \`generatedAt\` timestamp. Use weak when your serializer isn't byte-stable, otherwise every response looks changed and you never get a \`304\`.

**\`Last-Modified\` / \`If-Modified-Since\`** is the older, coarser cousin — one-second granularity, so two edits in the same second are indistinguishable. Prefer \`ETag\`.

### ETags for optimistic concurrency

The same header solves the lost-update problem. Two users load task 42, both edit the title, and the second write silently overwrites the first. With \`If-Match\`, the second write is rejected:

\`\`\`http
PATCH /v1/tasks/42
If-Match: "a3f1c9e7"

HTTP/1.1 412 Precondition Failed
\`\`\`

Server-side that's \`update tasks set … where id = $1 and version = $2\`; if \`rowCount === 0\`, the row moved on and you return \`412\` (or \`409\`). This is a strong thing to volunteer — most candidates only know ETags as a bandwidth optimisation.

### Where caches live

1. **Browser** — \`Cache-Control\` on your responses. Free, closest to the user.
2. **CDN / reverse proxy** — great for public, cacheable \`GET\`s. Watch the cache key: it must include everything that varies the response.
3. **Application cache (Redis)** — for expensive computed results. This is where you own invalidation, and where it gets hard.
4. **Database buffer cache** — Postgres already keeps hot pages in memory; a lot of "we need Redis" turns out to be "we need an index".

**Invalidation strategies:** TTL (simplest, accepts staleness); write-through (update the cache on every write — consistent, more code); explicit delete on write (common, but a missed path leaves stale data forever). Also know **cache stampede**: a popular key expires and 1,000 concurrent requests all miss and hit the database at once. Fix with a short lock so one request refills while others serve stale, or with \`stale-while-revalidate\` semantics.`,
    },
    {
      id: "cors",
      heading: "CORS and what preflight actually is",
      markdown: `CORS is the topic candidates most often get *directionally* wrong. The correct framing: **CORS is enforced by the browser, not by your server.** \`curl\`, Postman, and your mobile app ignore it entirely. CORS is not a security control protecting your API — it is a *relaxation* of a browser restriction called the same-origin policy.

### The same-origin policy

An origin is **scheme + host + port**. \`https://app.acme.com\` and \`https://api.acme.com\` are different origins; so are \`http://\` and \`https://\` versions of the same host, and \`:3000\` vs \`:8080\`.

By default a browser will *send* a cross-origin request but refuses to let JavaScript **read the response**. The reason is cookies: browsers attach cookies for \`api.acme.com\` to any request to that host, whatever page initiated it. Without the same-origin policy, \`evil.com\` could run \`fetch("https://yourbank.com/accounts")\` in your browser, ride your session cookie, and read your balance. CORS is the mechanism by which \`api.acme.com\` says "I'm willing to let \`app.acme.com\` read my responses."

### Simple requests vs preflight

A request is **simple** (no preflight) only if all hold:

- method is \`GET\`, \`HEAD\`, or \`POST\`
- headers are limited to CORS-safelisted ones (\`Accept\`, \`Accept-Language\`, \`Content-Language\`, \`Content-Type\`)
- \`Content-Type\` is \`text/plain\`, \`multipart/form-data\`, or \`application/x-www-form-urlencoded\`

Note what's missing: **\`Content-Type: application/json\` is not on that list, and neither is \`Authorization\`.** So essentially every real API call from a browser is preflighted.

A **preflight** is an automatic \`OPTIONS\` request the browser sends *before* the real one, asking permission:

\`\`\`http
OPTIONS /v1/tasks HTTP/1.1
Origin: https://app.acme.com
Access-Control-Request-Method: POST
Access-Control-Request-Headers: content-type, authorization
\`\`\`

\`\`\`http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: https://app.acme.com
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
Vary: Origin
\`\`\`

Only then does the browser send the actual \`POST\`, which must *also* carry \`Access-Control-Allow-Origin\` on its response.

**Why the browser does this:** it protects servers written before CORS existed. A cross-origin \`DELETE\` that reached such a server would have already done damage by the time the browser decided not to show the response. Preflight asks permission *before* the state-changing request is sent.

\`\`\`ts
import cors from "cors";

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header = not a browser (curl, server-to-server). Allow.
      if (!origin) return callback(null, true);
      callback(null, env.CORS_ORIGINS.includes(origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
    exposedHeaders: ["X-Request-Id", "RateLimit-Remaining"],
    maxAge: 86_400,
  }),
);
\`\`\`

### The traps

- **\`Access-Control-Allow-Origin: *\` cannot be combined with \`credentials: true\`.** The spec forbids it, and browsers reject it. With credentials you must echo a specific, allowlisted origin — and set \`Vary: Origin\` so a cache doesn't serve one origin's allow header to another.
- **Echoing \`Origin\` blindly is \`*\` with extra steps.** \`res.setHeader("Access-Control-Allow-Origin", req.headers.origin)\` allows every site on the internet. Check against an allowlist.
- **CORS must run before auth.** Preflight \`OPTIONS\` carries no \`Authorization\` header by design. If auth middleware runs first and 401s the \`OPTIONS\`, the browser never sends the real request and the developer sees a confusing "CORS error" that is actually an ordering bug.
- **Response headers are invisible to JS unless exposed.** Only a handful are readable by default. If clients need \`X-Request-Id\` or a pagination header, list it in \`Access-Control-Expose-Headers\`.
- **A "CORS error" in the console is usually not a CORS bug.** If the server 500s, the error response often lacks CORS headers, so the browser reports a CORS failure and hides the real one. Check the network tab's status code, and reproduce with \`curl\`.
- **CORS ≠ CSRF protection.** CORS governs *reading responses*; the request is often still sent. Use \`SameSite\` cookies and CSRF tokens for state-changing requests.`,
    },
    {
      id: "input-validation-injection",
      heading: "Input validation and injection safety",
      markdown: `Every injection vulnerability is the same bug: **untrusted data was interpreted as code.** The fix is always the same shape: keep data and code in separate channels so the data can never be parsed as instructions.

### SQL injection

\`\`\`ts
// Vulnerable. Input "'; drop table users; --" ends the string and adds a statement.
const { rows } = await pool.query(
  "select * from users where email = '" + email + "'",
);

// Safe. Driver sends SQL and values on separate channels; the value is never parsed as SQL.
const { rows } = await pool.query(
  "select * from users where email = $1",
  [email],
);
\`\`\`

The subtleties that show you actually understand it rather than reciting "use prepared statements":

- **Identifiers cannot be parameterized.** \`order by $1\` and \`from $1\` do not work — placeholders bind *values*, not table or column names. Dynamic sort columns and table names must come from an allowlist, mapped to literal strings in your code.
- **ORMs are not automatic protection.** A tagged template like Drizzle's \`sql\` helper interpolates *parameters*, so it is safe; \`db.execute("select * from t where id = " + id)\` is not, in any library. Raw-query escape hatches exist in every ORM and that is exactly where the vulnerability lives.
- **\`LIKE\` needs its own escaping.** User input containing \`%\` in a \`LIKE\` pattern is not injection, but it is a denial-of-service: \`%\` alone matches every row.

### The rest of the injection family

| Attack | Where | Fix |
| --- | --- | --- |
| **XSS** | User content rendered into HTML | Contextual output encoding; React escapes by default — the hole is \`dangerouslySetInnerHTML\`. Add a Content-Security-Policy |
| **Command injection** | \`exec("convert " + filename)\` | \`execFile\`/\`spawn\` with an argument array; never build a shell string |
| **Path traversal** | \`readFile("./uploads/" + name)\` with \`../../etc/passwd\` | Resolve the path and assert it stays under the base directory |
| **NoSQL injection** | \`{email: req.body.email}\` where the body sends \`{"$ne": null}\` | Validate types — a schema that requires a string rejects an object |
| **SSRF** | Fetching a user-supplied URL | Allowlist hosts; block private ranges (\`169.254.169.254\` is the cloud metadata endpoint) |
| **Prototype pollution** | Deep-merging user JSON containing \`__proto__\` | Never merge untrusted objects; \`Object.create(null)\`; schema-validate first |

\`\`\`ts
// Path traversal, done correctly.
import path from "node:path";

const BASE = path.resolve("/srv/uploads");

function safePath(userSuppliedName: string): string {
  const resolved = path.resolve(BASE, userSuppliedName);
  if (resolved !== BASE && !resolved.startsWith(BASE + path.sep)) {
    throw new ForbiddenError("Path escapes the upload directory.");
  }
  return resolved;
}
\`\`\`

### Validation as a security boundary

Beyond types, validation limits *magnitude*, and that is what turns validation into availability protection:

\`\`\`ts
const schema = z.object({
  title: z.string().trim().min(1).max(200),          // bounded length
  tags: z.array(z.string().max(40)).max(20),         // bounded array
  page: z.coerce.number().int().min(1).max(10_000),  // bounded page depth
  limit: z.coerce.number().int().min(1).max(100),    // bounded fan-out
});

app.use(express.json({ limit: "100kb" }));           // bounded body
\`\`\`

Without bounds, one request can ask for 10 million rows, or send a 2GB body, or supply a 50,000-element array that makes you issue 50,000 queries. Those are all availability bugs, and they are all closed by a \`max()\`.

Two more that get raised as follow-ups:

- **Mass assignment.** \`db.insert(req.body)\` lets a client send \`{"role":"admin"}\` or \`{"accountBalance":1000000}\`. \`z.object()\` strips unknown keys by default, which closes it — but only if you insert the *parsed* object, never the raw body.
- **ReDoS.** A regex with nested quantifiers like \`/^(a+)+$/\` against attacker input can hang the event loop for minutes. Node is single-threaded, so one such request stalls the whole process. Prefer simple patterns and bound the input length before matching.`,
    },
    {
      id: "webhooks-idempotency-keys",
      heading: "Webhooks and idempotency keys",
      markdown: `### Webhooks: your API in reverse

Polling \`GET /payments/{id}\` every second to see if it settled is wasteful and slow. A webhook inverts it: you register a URL, and the provider \`POST\`s to it when something happens.

Everything about consuming webhooks correctly follows from one fact: **the endpoint is a public URL that anyone on the internet can call.**

**1. Verify the signature.** The provider signs the raw body with a shared secret; you recompute and compare.

\`\`\`ts
import { createHmac, timingSafeEqual } from "node:crypto";
import express from "express";

// The signature covers the RAW bytes. Parsed-then-re-serialized JSON will not
// match — key order and whitespace differ. Capture the raw body.
app.post(
  "/webhooks/payments",
  express.raw({ type: "application/json", limit: "1mb" }),
  async (req, res) => {
    const signatureHeader = req.header("X-Signature") ?? "";
    const timestamp = req.header("X-Timestamp") ?? "";

    // Replay protection: reject anything older than 5 minutes.
    const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(ageSeconds) || ageSeconds > 300) {
      res.status(400).json({ error: { code: "stale_webhook" } });
      return;
    }

    const expected = createHmac("sha256", env.WEBHOOK_SECRET)
      .update(timestamp + "." + req.body.toString("utf8"))
      .digest("hex");

    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    // Length check first: timingSafeEqual throws on mismatched lengths.
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      res.status(401).json({ error: { code: "bad_signature" } });
      return;
    }

    const event = JSON.parse(req.body.toString("utf8"));

    // At-least-once delivery: the same event WILL arrive twice. Dedupe on the
    // provider's event id, with a unique constraint doing the real work.
    const inserted = await pool.query(
      "insert into webhook_events (id, type, payload) values ($1, $2, $3) on conflict (id) do nothing",
      [event.id, event.type, event],
    );
    if (inserted.rowCount === 0) {
      res.status(200).json({ status: "duplicate_ignored" });
      return;
    }

    // Acknowledge fast, process asynchronously. Providers time out in seconds
    // and will retry — turning a slow handler into a thundering herd.
    await queue.enqueue("process-webhook", { eventId: event.id });
    res.status(200).json({ status: "accepted" });
  },
);
\`\`\`

The five rules, each with its reason:

1. **Verify the signature** — otherwise anyone can \`POST\` "payment succeeded" and get free goods.
2. **Include a timestamp in the signed payload** — a signature alone is replayable forever.
3. **Use \`timingSafeEqual\`** — \`===\` on secrets leaks information through timing. It's a marginal attack over the internet, but it costs one line and interviewers look for it.
4. **Dedupe on the event ID** — delivery is *at-least-once*, never exactly-once. Design for duplicates rather than hoping.
5. **Return 2xx fast, process later** — most providers time out in 5-10 seconds and retry with backoff. Doing the work inline means a slow database turns one event into ten retries.

**When you're the one sending webhooks:** sign the payload, retry with exponential backoff and jitter, cap attempts, expose a delivery log so customers can debug, and disable endpoints that fail persistently.

### Idempotency keys

Back to the broken retry from the first section: \`POST /orders\` succeeds, the response is lost, the client retries, and the customer is charged twice. Idempotency keys make \`POST\` safely retryable.

The client generates a UUID per *logical operation* (not per HTTP attempt) and sends it:

\`\`\`http
POST /v1/charges
Idempotency-Key: 7f8b1c2d-3e4f-4a5b-8c9d-0e1f2a3b4c5d
Content-Type: application/json

{"amount": 4999, "currency": "usd", "source": "card_1234"}
\`\`\`

\`\`\`sql
create table idempotency_keys (
  key            text primary key,
  request_hash   text        not null,
  status         text        not null default 'in_progress',  -- in_progress | completed
  response_code  integer,
  response_body  jsonb,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '24 hours'
);
\`\`\`

\`\`\`ts
export async function withIdempotency(
  key: string,
  requestHash: string,
  handler: () => Promise<{ status: number; body: unknown }>,
) {
  // The unique PK is what makes this race-safe: two concurrent retries, only
  // one INSERT wins. No application-level lock required.
  const claim = await pool.query(
    "insert into idempotency_keys (key, request_hash) values ($1, $2) on conflict (key) do nothing returning key",
    [key, requestHash],
  );

  if (claim.rowCount === 0) {
    const { rows } = await pool.query(
      "select request_hash, status, response_code, response_body from idempotency_keys where key = $1",
      [key],
    );
    const existing = rows[0];

    // Same key, different body = a client bug. Fail loudly rather than
    // returning a response for an operation they didn't request.
    if (existing.request_hash !== requestHash) {
      throw new ConflictError("Idempotency key reused with a different request body.");
    }
    if (existing.status === "in_progress") {
      throw new ConflictError("A request with this idempotency key is in progress.");
    }
    return { status: existing.response_code, body: existing.response_body, replayed: true };
  }

  const result = await handler();
  await pool.query(
    "update idempotency_keys set status = 'completed', response_code = $2, response_body = $3 where key = $1",
    [key, result.status, result.body],
  );
  return { ...result, replayed: false };
}
\`\`\`

Points worth making unprompted:

- **The key comes from the client**, because only the client knows that attempt #2 is the *same* logical operation as attempt #1. A server-generated key can't dedupe a retry.
- **Hash the request body.** Reusing a key with a different body is a client bug and must be a \`409\`, not a silent replay of the wrong response.
- **Expire keys.** 24 hours is Stripe's window. Storing them forever is a table that only grows.
- **Ideally, claim the key in the same transaction as the work.** Otherwise a crash between "work committed" and "key marked completed" leaves the key \`in_progress\` and the retry blocked — recoverable, but you should know the gap exists.
- **Idempotency is not the same as deduplication by content.** Two genuinely separate $50 charges a second apart are both valid; only the key distinguishes "retry" from "do it again".`,
    },
    {
      id: "payload-shape-and-alternatives",
      heading: "N+1, payload shape, and REST vs GraphQL vs gRPC",
      markdown: `### The N+1 query problem

\`\`\`ts
// 1 query for the tasks, then N more — one per task. 50 tasks = 51 round trips.
const tasks = await taskRepo.list({ limit: 50 });
for (const task of tasks) {
  task.assignee = await userRepo.findById(task.assigneeId);
}
\`\`\`

Each query might be 1ms, but 51 sequential round trips is 51ms of pure latency, and it scales linearly with page size. It is the most common performance bug in application code, and ORMs cause it invisibly through lazy-loaded relations.

Three fixes, in order of preference:

\`\`\`ts
// 1. A single JOIN — best when you always need the related data.
const { rows } = await pool.query(\`
  select t.*, u.id as assignee_id, u.name as assignee_name
    from tasks t
    left join users u on u.id = t.assignee_id
   order by t.created_at desc
   limit 50
\`);

// 2. Two queries with an IN clause — better when the relation is one-to-many
//    (a JOIN would multiply rows) or optional.
const tasks = await taskRepo.list({ limit: 50 });
const ids = [...new Set(tasks.map((t) => t.assigneeId).filter(Boolean))];
const { rows: users } = await pool.query(
  "select * from users where id = any($1::uuid[])",
  [ids],
);
const byId = new Map(users.map((u) => [u.id, u]));
for (const task of tasks) task.assignee = byId.get(task.assigneeId) ?? null;

// 3. DataLoader — batches and dedupes automatically within a tick. The standard
//    answer for GraphQL, where you cannot know the access pattern up front.
const userLoader = new DataLoader(async (ids: readonly string[]) => {
  const { rows } = await pool.query("select * from users where id = any($1::uuid[])", [ids]);
  const byId = new Map(rows.map((u) => [u.id, u]));
  return ids.map((id) => byId.get(id) ?? null);
});
\`\`\`

**How to detect it:** count queries per request in a test, or log query counts in development and alert above a threshold. Every N+1 I've seen in production was invisible locally with 10 seed rows and catastrophic with 10,000 real ones.

### Over-fetching and under-fetching

**Over-fetching:** a mobile list view needs \`id\` and \`title\`, and \`GET /tasks\` returns 40 fields including a 5KB description. Wasted bandwidth and battery.

**Under-fetching:** rendering a task detail page needs the task, its assignee, its project, and its comments — four round trips, each waiting on the last on a 200ms mobile connection.

REST's answers, all partial and all worth naming:

- **Sparse fieldsets:** \`GET /tasks?fields=id,title,status\`. Effective, but it fragments your cache and complicates ETags.
- **Embedding:** \`GET /tasks/42?include=assignee,comments\`. Solves under-fetching, at the cost of an endpoint whose response shape depends on a query parameter.
- **Purpose-built endpoints:** \`GET /tasks/42/detail-view\` returning exactly what one screen needs. Pragmatic and fast; drifts toward one endpoint per screen, which is the Backend-for-Frontend pattern — a legitimate choice, not a failure.

GraphQL exists precisely because those answers are unsatisfying at scale.

### The comparison

| | REST | GraphQL | gRPC |
| --- | --- | --- | --- |
| Transport / format | HTTP/1.1+, JSON | HTTP POST, JSON | HTTP/2, Protocol Buffers (binary) |
| Schema | Optional (OpenAPI) | **Required**, strongly typed, introspectable | **Required**, \`.proto\` |
| Fetching | Fixed shape per endpoint | Client specifies exactly the fields it wants | Fixed per RPC method |
| Over/under-fetching | Both possible | Solved by design | Both possible |
| HTTP caching | **Excellent** — URL is the cache key | Poor — everything is \`POST /graphql\` | N/A (not HTTP semantics) |
| Status codes | Native and meaningful | Usually \`200\` with an \`errors\` array | gRPC status codes |
| Streaming | SSE / WebSockets bolted on | Subscriptions | **First class**, bidirectional |
| Browser support | Native | Native | Needs grpc-web + a proxy |
| Tooling / debugging | \`curl\`, any HTTP tool | GraphiQL is excellent; \`curl\` is awkward | Needs \`grpcurl\`; payloads aren't human-readable |
| Main risk | Endpoint sprawl, over/under-fetching | N+1 by default; an unbounded query can DoS you | Operational complexity; weak browser story |

**How to answer "which would you pick?"** — with a decision, not a survey:

*"REST by default. It's cacheable at every layer, every tool speaks it, and status codes carry meaning for free. I'd reach for GraphQL when many different clients need different shapes of the same graph — a web app, an iOS app, and a partner integration all hitting one product catalog — because otherwise I'll end up maintaining a per-screen endpoint for each. The costs are real though: N+1 unless every resolver goes through DataLoader, query depth and complexity limits to stop a malicious query, and you lose HTTP caching. gRPC I'd use for internal service-to-service calls where I control both ends and want a typed contract, code generation, and binary efficiency — not for a public or browser-facing API."*

That answer works because it names the condition that flips the decision. "GraphQL is more modern" does not.`,
    },
  ],
  questions: [
    {
      q: "What does idempotent mean, and which HTTP methods are?",
      a: "Idempotent means N identical requests leave the server in the same state as one. `GET`, `HEAD`, `OPTIONS`, `PUT`, and `DELETE` are; `POST` is not; `PATCH` is if the patch is absolute (`{status: 'done'}`) but not if it's relative (`{$inc: {views: 1}}`). The response can differ — first `DELETE` returns 204, second returns 404 — what matters is the resulting state. It matters because networks fail after the server has already processed a request: the client times out without knowing whether it succeeded. With an idempotent method it can just retry. With `POST` it can't, which is why a retry on `POST /orders` creates two orders, and why payments APIs use idempotency keys — a client-generated UUID the server uses to guarantee at-most-once processing. Safety is the related property: safe methods don't change state at all, which is why `GET /users/42/delete` is a genuine bug — a browser prefetcher or link scanner will eventually hit it.",
      weak: "Idempotent means the same input gives the same output, like a pure function. GET is idempotent because it just reads data.",
    },
    {
      q: "401 vs 403, and 422 vs 409 — when is each correct?",
      a: "401 means not authenticated: no credentials, or they're invalid or expired. The client's remedy is to log in or refresh a token, and the response should carry `WWW-Authenticate`. 403 means authenticated and identified, but not permitted — re-authenticating changes nothing. Getting these backwards sends clients into infinite token-refresh loops. 422 means the payload is semantically wrong and the client can fix it by editing the request: empty title, invalid enum, malformed email. 409 means the payload is fine but the current state conflicts: email already registered, task already assigned, version stale. Different remedies — fix the form vs refetch and retry. One nuance worth adding: for authorization failures on resources the user shouldn't know exist, 404 is better than 403, because 403 confirms existence and lets an attacker enumerate IDs. GitHub returns 404 for private repos for exactly that reason.",
    },
    {
      q: "How would you paginate a large collection, and why not just use OFFSET?",
      a: "Cursor (keyset) pagination for anything user-facing or high-volume. Instead of 'skip 100,000 rows', the cursor encodes the last row's sort key and you query `where (created_at, id) < ($1, $2) order by created_at desc, id desc limit 21` — fetching one extra row to know whether there's a next page. Two reasons OFFSET fails. Performance: `OFFSET 100000` makes Postgres produce 100,020 ordered rows and discard 100,000, so cost grows linearly with depth — page 1 is 2ms, page 5,000 is 800ms. Correctness: if a row is inserted while you're paging, everything shifts and you see a duplicate on the next page while another row is never returned. Cursors are immune because the position is a row identity, not a count. I base64-encode the cursor so clients treat it as opaque rather than coupling to my sort key, and I always include a unique tiebreaker like `id` in the ORDER BY — without it, rows with equal timestamps have undefined order and pagination genuinely drops rows. The tradeoffs: no jumping to page 40, and no cheap total count. Offset is still right for an admin table of a few thousand rows.",
      weak: "I'd use `?page=2&limit=20` and translate it to LIMIT/OFFSET. It's the standard approach and easy for clients.",
    },
    {
      q: "Session cookies or JWTs? Talk me through the tradeoffs.",
      a: "Sessions for first-party web apps, JWTs for mobile and service-to-service. With a session, the server stores `sessionId -> {userId, expiresAt}` in Redis and the client holds an opaque ID in an HttpOnly, Secure, SameSite cookie. The cost is a lookup per request — sub-millisecond in Redis. The benefit is instant revocation: logout or a ban is one DELETE and takes effect on the next request. JWTs are self-contained and signed, so verification is a local signature check with no round trip, which is why they scale horizontally. But the payload is signed, not encrypted — anyone can read it — and crucially you cannot revoke one. Fire someone at 10:00 and their token works until it expires. Every mitigation reintroduces state: short expiry plus refresh tokens, or a revocation list checked per request, which is a session with extra steps. Claims also go stale: `role: admin` was true at issue time. And in a browser there's no good storage — localStorage is XSS-readable, a cookie is safer but reintroduces CSRF, at which point you should ask why you didn't just use a session. If I use JWTs I pin the algorithm in the verify call, because `alg: none` and RS256/HMAC confusion are real historical exploits.",
      weak: "JWTs, because they're stateless so you don't need a database lookup, which makes the app scale better.",
    },
    {
      q: "How do you make sure user A can't read user B's data?",
      a: "Object-level authorization checks in the service layer, on every read and every write. The critical distinction is that a route-level role check is not enough: `requirePermission('task:update')` confirms this user may update *some* task, not *this* task. If that's all you have, any authenticated member can `PATCH /tasks/{any-id}` and edit another company's data. That's IDOR — broken object-level authorization — and it's consistently number one on the OWASP API Security Top 10. Concretely, the service loads the task, loads the project, and checks the user is a member of that project before doing anything. In SQL that often means scoping the query itself: `where id = $1 and project_id = any($2)` rather than fetching then filtering, so a missing check can't leak. For extra defence at scale, Postgres row-level security enforces it in the database so no query path can bypass it. And on failure I return 404 rather than 403 where existence itself is sensitive, so an attacker can't enumerate IDs by which ones give 403.",
      weak: "The frontend only shows users their own tasks, and every request needs a valid JWT, so they can't see anything that isn't theirs.",
    },
    {
      q: "Implement rate limiting for an API. Which algorithm and why?",
      a: "Token bucket, in Redis, via a Lua script. Each user gets a bucket of `capacity` tokens refilling at `rate` per second; each request consumes one, and when the bucket is empty you return 429 with `Retry-After`. Token bucket wins because it separates sustained rate from burst tolerance: a user who's been idle accumulates tokens and can spend them at once, which is what real clients do when a page loads and fires eight requests. Fixed windows allow a 2x burst across the boundary — 100 requests at 11:59:59 plus 100 at 12:00:00. Implementation details that matter: the state must be shared, because an in-memory counter across five instances gives everyone 5x the limit; the read-modify-write must be atomic, which is why it's a Lua script rather than two round trips; and you key by user ID or API key when authenticated, falling back to IP, because IP-only punishes an entire office behind one NAT and does nothing against a botnet. I'd apply much tighter limits to `POST /login` and password reset than to reads — that's the credential-stuffing defence — and let expensive endpoints charge more than one token. Always return `Retry-After`, or clients retry instantly and make the overload worse.",
    },
    {
      q: "Explain ETags and the 304 flow.",
      a: "An ETag is an opaque version identifier for a representation — a hash of the body, or a row's version/updated_at. The server sends `ETag: \"a3f1c9e7\"` with the 200. On the next request the client sends `If-None-Match: \"a3f1c9e7\"`; if the resource is unchanged the server returns 304 Not Modified with no body, and the client reuses its cached copy. That saves the bytes and the JSON parse — meaningful on mobile. Note it doesn't save the database query unless you derive the ETag from something cheap like a version column and check it before fetching the row. Strong ETags mean byte-identical; weak (`W/\"…\"`) means semantically equivalent, which you want if your serializer isn't byte-stable, otherwise you never get a 304. The part most people miss: the same mechanism gives you optimistic concurrency. `PATCH` with `If-Match: \"a3f1c9e7\"` lets the server reject a write whose base version is stale with 412 Precondition Failed — that's the fix for two users overwriting each other's edits. Server-side it's `update ... where id = $1 and version = $2` and checking rowCount.",
    },
    {
      q: "What is CORS and why does the browser send an OPTIONS request first?",
      a: "CORS is a browser mechanism, not a server-side security control — curl and mobile apps ignore it entirely. By default the same-origin policy lets a page send a cross-origin request but stops JavaScript reading the response, because browsers attach cookies for a host to any request to that host. Without it, evil.com could fetch yourbank.com/accounts in your browser using your session cookie and read the result. CORS is how the API opts in to letting a specific origin read its responses. The OPTIONS preflight happens for any request that isn't 'simple' — and `Content-Type: application/json` and `Authorization` are both outside the safelist, so essentially every real API call is preflighted. The browser asks first, with `Origin`, `Access-Control-Request-Method`, and `Access-Control-Request-Headers`, and only sends the real request if the server's `Access-Control-Allow-*` headers permit it. The reason is that a cross-origin DELETE would have already done its damage by the time the browser decided not to show the response — preflight asks permission before the state-changing request goes out. Traps: `Allow-Origin: *` can't be combined with credentials; echoing the Origin header without an allowlist is `*` with extra steps; CORS middleware must run before auth, or the credential-less preflight gets 401'd; and a 'CORS error' in the console is usually a 500 whose error response lacked the headers.",
      weak: "CORS stops other websites from calling your API. You fix CORS errors by setting `Access-Control-Allow-Origin: *` on the server.",
    },
    {
      q: "How do you version an API, and when do you need to?",
      a: "You need it the first time you make a breaking change: removing or renaming a field, changing a type, adding a required request field, tightening validation, or changing what a status code means. Adding an optional field or a new endpoint isn't breaking, because a well-written client ignores unknown fields. I default to URL path versioning — `/v1/tasks` — from day one, because it costs nothing before you need it and it's visible in every log line and metric, so I can measure who's still on v1 before turning it off. Header versioning via `Accept: application/vnd.acme.v2+json` is arguably more correct HTTP, but it's invisible in logs and browser tabs and makes every integration harder. Date-pinned versions like Stripe's are the most flexible and by far the most infrastructure. The more important half of the answer is avoiding v2: make changes additively, use expand/contract for renames (write both, read the new one, drop the old once clients migrate), version a single resource rather than the whole surface, and put new behaviour behind an opt-in flag. When you do deprecate, announce a date, send `Deprecation` and `Sunset` headers, instrument per-version usage by client, and actually remove it — a version you never remove is one you maintain forever.",
    },
    {
      q: "What's the N+1 query problem and how do you fix it?",
      a: "You run one query to fetch N rows, then one more query per row to fetch a relation — 51 round trips for 50 tasks and their assignees. Each query might be 1ms, but they're sequential, so latency grows linearly with page size. ORMs cause it invisibly through lazy-loaded relations, and it's usually invisible locally with 10 seed rows and catastrophic with 10,000 real ones. Three fixes. A JOIN, when you always need the related data — one query, one round trip. Two queries with `where id = any($1)` and an in-memory Map to stitch them, which is better for one-to-many relations where a JOIN would multiply rows. Or DataLoader, which batches and dedupes lookups within a tick — the standard answer in GraphQL, where you can't know the access pattern up front. To detect it, count queries per request in tests or log the count in development and fail above a threshold; you cannot rely on noticing it by feel.",
    },
    {
      q: "Design a webhook receiver. What can go wrong?",
      a: "It's a public URL anyone can POST to, so: verify the HMAC signature over the raw request body — parsed-then-reserialized JSON won't match because key order and whitespace differ, so I capture the raw body with `express.raw`. Compare with `timingSafeEqual`, not `===`. The signed payload must include a timestamp, and I reject anything older than about five minutes, because a valid signature is otherwise replayable forever. Delivery is at-least-once, never exactly-once, so I dedupe on the provider's event ID with a unique constraint and `on conflict do nothing` — that's race-safe without an application lock. Then acknowledge with 200 immediately and enqueue the real work: providers time out in 5-10 seconds and retry, so a slow handler turns one event into a thundering herd of retries. Other failure modes: out-of-order delivery, so handlers should be written against the current state rather than assuming sequence; and a bad payload should still return 2xx once recorded, because returning 500 for something I'll never process just burns the provider's retry budget.",
      weak: "I'd add a POST endpoint that takes the event and updates the database. If it's slow I'd optimize the query.",
    },
    {
      q: "How do you stop a payment endpoint from double-charging on a retry?",
      a: "Idempotency keys. The client generates a UUID per logical operation — not per HTTP attempt — and sends it as `Idempotency-Key`. The server inserts that key into a table with a primary key constraint using `on conflict (key) do nothing`; if the insert wins, it's a new operation and I do the work, then store the status code and response body against the key. If the insert loses, this is a retry, so I return the stored response. The unique constraint is what makes it race-safe under two concurrent retries — no application-level locking. Details that matter: I hash the request body and store it, so reusing a key with a *different* body returns 409 rather than silently replaying the wrong response, since that's a client bug. Keys expire — Stripe uses 24 hours — because otherwise the table only grows. Ideally the key claim commits in the same transaction as the work, otherwise a crash in between leaves the key `in_progress` and blocks the retry. And it's worth saying the key must come from the client, because only the client knows attempt #2 is the same logical operation as attempt #1 — the server can't tell a retry from a genuine second $50 charge.",
    },
    {
      q: "REST or GraphQL for a new product?",
      a: "REST by default. It's cacheable at every layer because the URL is the cache key, every tool and proxy speaks it, and status codes carry meaning without me inventing an error protocol. I'd switch to GraphQL when several different clients need different shapes of the same graph — a web app, an iOS app, and a partner integration over one product catalog — because with REST I'd end up maintaining a per-screen endpoint for each of them, and that's the problem GraphQL was built for. The costs are real and I'd name them: N+1 by default unless every resolver goes through DataLoader; you need query depth and complexity limits or one malicious nested query DoSes you; HTTP caching is mostly gone because everything is `POST /graphql`; and errors come back as 200 with an errors array, so monitoring needs custom work. gRPC is a different question — I'd use it for internal service-to-service calls where I own both ends and want a typed contract, generated clients, and binary efficiency, but not for anything browser-facing, since it needs grpc-web and a proxy.",
      weak: "GraphQL, because it's more flexible and the frontend can request exactly what it needs, so there's less back-and-forth with the backend team.",
    },
    {
      q: "What's the difference between authentication and authorization, and where does each live in your code?",
      a: "Authentication establishes identity — who are you. Authorization decides permission — may you do this to this object. Authentication is a cross-cutting concern, so it lives in middleware: read the cookie or bearer token, verify it, load the user, attach it to the request. It runs once, early, before rate limiting so I can key limits by user. Authorization is not cross-cutting, and that's the part people get wrong. Coarse role checks can sit in middleware — 'only admins can reach this route' — but the check that actually matters is per-object and needs the resource loaded, so it belongs in the service layer: load the task, load its project, confirm this user is a member and the project isn't archived. Putting object-level checks in middleware is impossible without duplicating the fetch, and skipping them entirely is the IDOR vulnerability. On the model: RBAC — permissions attached to roles — is enough for most products and is easy to audit. ABAC, deciding from attributes of the user, resource, and environment, is what you need when the rule depends on the relationship between the user and the specific object, at the cost of being much harder to answer 'who can edit this?' about.",
    },
    {
      q: "Which caching headers would you set on a user-specific API response, and why?",
      a: "`Cache-Control: private, max-age=0, must-revalidate` plus an `ETag`, and `Vary: Authorization`. `private` is the important one: it means only the end user's browser may store it, never a shared CDN. If you set `public` on a user-specific response, a CDN caches user A's `/v1/me` and serves it to user B — that's a real data leak and it's the mistake I look for. `Vary: Authorization` tells any cache that the response depends on that header, so responses aren't keyed by URL alone. `max-age=0, must-revalidate` with an ETag gives revalidation on every use: the client sends `If-None-Match` and usually gets a 304 with no body, so it's cheap without ever serving stale data. For genuinely public, non-user-specific data — a public product listing — I'd use `public, max-age=60, stale-while-revalidate=600` so a CDN absorbs the traffic and refreshes in the background. For login, token, and payment endpoints, `no-store`, full stop. And I'd mention cache stampede: when a hot key expires, a thousand concurrent requests all miss and hit the database at once, so you want a lock so one refills while the rest serve stale.",
    },
    {
      q: "You're given a public API endpoint to harden. What do you check?",
      a: "In rough order of severity. Object-level authorization: does the handler verify this user may touch this specific resource, or only that they're logged in? That's the most common serious hole. Then input validation as a whitelist with bounds — types, enums, max lengths, max array sizes, a capped `limit`, and a body size limit on the parser — because unbounded input is an availability bug even when it isn't an injection. Then injection: all values parameterized, and any dynamic identifier like a sort column coming from an allowlist, since placeholders can't bind identifiers. Then mass assignment: the insert uses the parsed and stripped object, never `req.body`. Then rate limiting keyed by user with a much tighter limit if it's an auth endpoint. Then output: does the serializer map to an explicit public shape, or does it return the raw row with `password_hash` and internal columns? Then error handling: 4xx for client mistakes and a generic 500 that leaks nothing — no SQL text, no stack traces. Then transport and headers: HTTPS only, HSTS, a CORS allowlist rather than a wildcard, and `no-store` on anything sensitive. Finally logging: is the request logged with a request ID and are credentials redacted?",
    },
  ],
};
