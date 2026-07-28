import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "rest-api-backend",
  title: "Building a REST API Backend",
  track: "backend",
  order: 1,
  summary:
    "The complete answer to \"how do you set up an API backend?\" — stack choice, project layout, the request lifecycle end to end, a full CRUD service written twice (Express and Next.js 16 route handlers), validation, Postgres, error envelopes, config, logging, and tests.",
  estMinutes: 80,
  tags: [
    "rest",
    "http",
    "express",
    "nextjs",
    "postgres",
    "zod",
    "crud",
    "testing",
  ],
  sections: [
    {
      id: "what-a-backend-is",
      heading: "What a backend actually is",
      markdown: `Interns often answer this question by naming tools ("Express and Mongo"). That is not an answer. The interviewer wants to know whether you understand **what problem the server solves that the browser cannot**.

A web system is three long-lived responsibilities:

\`\`\`text
   Client                     Server                        Database
 ┌──────────┐   HTTP/JSON   ┌────────────────┐   SQL/TCP   ┌─────────────┐
 │ browser  │ ───────────►  │  your API      │ ──────────► │ Postgres    │
 │ mobile   │ ◄───────────  │  (stateless)   │ ◄────────── │ (stateful)  │
 │ CLI      │   status +    │                │   rows      │             │
 └──────────┘   body        └────────────────┘             └─────────────┘
                                   │
                                   ├─► cache (Redis)
                                   ├─► object storage (S3)
                                   └─► third-party APIs (Stripe, SendGrid)
\`\`\`

| Layer | Owns | Can you trust it? |
| --- | --- | --- |
| Client | Presentation, optimistic UI, local state | **No.** Anyone can open devtools, replay requests with \`curl\`, or write their own client. |
| API server | Authentication, authorization, validation, business rules, orchestration | Yes — you deploy it, you control the code and the secrets. |
| Database | Durable state, constraints, transactions | Yes, but it enforces only what you declared (\`NOT NULL\`, \`UNIQUE\`, \`CHECK\`, foreign keys). |

Three consequences fall out of that table, and they are what a good answer hits:

1. **The API is the trust boundary.** The database credentials, the Stripe secret key, and the "only an admin can delete a project" rule all live server-side. A client-side check is a UX nicety, never a security control. If your answer to "how do you stop a user editing someone else's task?" is "we hide the button", you have failed the question.
2. **The API server should be stateless.** No per-user data in process memory. Every request carries what it needs (a session cookie, a bearer token) and all durable state lives in Postgres or Redis. Statelessness is what lets you run five identical instances behind a load balancer and reboot any of them without logging anyone out.
3. **The API is a contract, not an implementation detail.** Once a mobile app ships against \`GET /v1/tasks\`, you cannot rename that field next Tuesday. Design the contract deliberately; the internals behind it are free to change.

**REST** is one style for that contract, and it is the one you will be asked about. Its core idea: model your domain as **resources** identified by URLs (\`/tasks\`, \`/tasks/42\`), and use HTTP's existing verbs (\`GET\`, \`POST\`, \`PATCH\`, \`DELETE\`) and status codes (\`200\`, \`201\`, \`404\`, \`409\`) to say what happened. The payoff is that every proxy, CDN, browser, and HTTP client already understands those semantics — a \`GET\` is cacheable and retryable without anyone writing custom code.

The classic failure mode is the "RPC over HTTP" API: \`POST /api/getTaskById\`, \`POST /api/deleteTask\`. It works, but it throws away every one of those free behaviours: caching, safe retries, standard error handling, and readable logs.`,
    },
    {
      id: "stack-and-layout",
      heading: "Picking a stack and laying out the project",
      markdown: `### Picking a stack

Interviewers do not care which stack you pick. They care that you can justify it and that you know the tradeoff you accepted.

| Stack | Good at | Real cost |
| --- | --- | --- |
| **Node + Express** | Ubiquitous, tiny API surface, every question you have is already answered on Stack Overflow | Unopinionated to a fault — you assemble validation, logging, and errors yourself. Async errors need a wrapper before Express 5. |
| **Node + Fastify** | ~2-3x Express throughput, schema-based validation and serialization built in, first-class TypeScript | Smaller plugin ecosystem; some Express middleware needs a shim. |
| **Next.js route handlers** | One deployment, one language, colocated with the UI; Web \`Request\`/\`Response\` standard APIs | You are inside a framework designed around rendering. Long-running jobs, websockets, and heavy background work want to live elsewhere. |
| **Python + FastAPI** | Pydantic validation and auto-generated OpenAPI docs are excellent; the default choice next to ML code | GIL; async story is good but the ecosystem is split between sync and async libraries. |
| **Go + net/http / chi** | Fast, tiny memory footprint, static binaries, superb concurrency | More lines of code per feature; error handling is manual and verbose. |
| **Java/Kotlin + Spring Boot** | What large enterprises actually run; mature everything | Heavy startup, deep configuration surface, slow local iteration. |

What to say out loud: *"For an internship-scale CRUD service I'd take Node with TypeScript, because the same types describe my API request bodies and my React client, and \`zod\` lets me derive both the runtime validator and the static type from one schema. If the service were CPU-bound — image processing, say — I'd move it to Go and keep Node as the edge."* That is a hire-signal answer: a choice, a reason, and the condition under which you'd choose differently.

### Project layout

The layout below is boring on purpose. Every file has exactly one reason to change.

\`\`\`text
src/
  server.ts              # process entry: read config, start listening, handle SIGTERM
  app.ts                 # build the Express app (no listen) — importable by tests
  config/
    env.ts               # parse + validate process.env once, export a typed object
  routes/
    tasks.routes.ts      # HTTP only: parse, validate, call service, map to status
    health.routes.ts
  services/
    tasks.service.ts     # business rules. Knows nothing about HTTP.
  repositories/
    tasks.repo.ts        # SQL only. Knows nothing about business rules.
  db/
    pool.ts              # the pg Pool singleton
    migrations/
      001_create_tasks.sql
  lib/
    errors.ts            # AppError hierarchy + HTTP mapping
    logger.ts            # pino instance
    validate.ts          # zod -> 422 helper
  middleware/
    requestId.ts
    errorHandler.ts
tests/
  unit/tasks.service.test.ts
  integration/tasks.routes.test.ts
\`\`\`

The rule that makes this worth doing: **dependencies point one way — route → service → repository → database.** A service never imports \`express\`. A repository never throws an HTTP status. When that holds, you can unit-test the service with a fake repository in-memory, and you can swap Express for Fastify or Next route handlers by rewriting only the \`routes/\` directory. Section 6 of this chapter does exactly that: the same service and repository are served by both frameworks.

The counter-argument you should be able to make: for a 200-line service, this is over-structured. Three layers to add one field is real friction. The honest position is that layering pays for itself the moment a second caller appears (a cron job, a CLI, a GraphQL resolver) or a second developer joins.`,
    },
    {
      id: "request-lifecycle",
      heading: "The request lifecycle, end to end",
      markdown: `"What happens when I type a URL and press enter" is asked constantly. Here it is for an API call, with the failure mode at each step — because the failure modes are what prove you have actually operated a service.

**\`curl -X POST https://api.example.com/v1/tasks\`**

1. **DNS.** \`api.example.com\` → IP, resolved from the OS cache, then the resolver, then authoritative nameservers. *Fails as:* \`ENOTFOUND\`, or worse, a stale record after a migration because the TTL was 24 hours.
2. **TCP handshake.** SYN / SYN-ACK / ACK to port 443. *Fails as:* \`ECONNREFUSED\` (nothing listening) or a hang until timeout (packets black-holed by a security group).
3. **TLS handshake.** Certificate presented and verified, cipher negotiated, keys derived. TLS 1.3 does this in one round trip. *Fails as:* expired certificate — a genuinely common outage.
4. **HTTP request written on the wire.** Literally these bytes:

\`\`\`http
POST /v1/tasks HTTP/1.1
Host: api.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGciOi...
Content-Length: 58

{"title":"Write the API chapter","priority":"high"}
\`\`\`

5. **Load balancer / reverse proxy.** Terminates TLS, picks a healthy instance, adds \`X-Forwarded-For\`. *Fails as:* \`502\` (no healthy upstream), \`504\` (upstream too slow), \`413\` (body over the proxy's limit — often before your code sees it at all).
6. **Framework receives the request.** Node's HTTP server parses the request line and headers and hands your framework a stream.
7. **Middleware chain**, in this order and for this reason:
   - request ID (so every later log line correlates)
   - structured request logging
   - CORS (must answer \`OPTIONS\` preflight before auth, or the browser never sends the real request)
   - body parsing with a size limit
   - authentication (who are you?)
   - rate limiting (keyed by user once you know who they are)
8. **Route matching.** \`POST /v1/tasks\` → the tasks router's create handler. No match → \`404\`. Path matches but method doesn't → \`405\` with an \`Allow\` header.
9. **Validation.** Parse the body against a schema. Reject early with \`400\`/\`422\` and a per-field error list. Nothing downstream should ever defensively re-check \`title\` is a string.
10. **Authorization.** Not the same as step 7. Authentication proved you are user 91; authorization decides whether user 91 may create a task in project 7.
11. **Service layer.** Business rules: is the project archived? has this user hit their task quota? Emits domain errors, not HTTP errors.
12. **Repository → connection pool → Postgres.** The pool hands out one of N open connections; the query runs inside a transaction if more than one statement must be atomic. *Fails as:* pool exhaustion (every connection checked out, requests queue and time out) — the single most common backend outage in a Node service.
13. **Serialize the response.** Map the DB row to the public shape. **Never** \`res.json(row)\` — that is how \`password_hash\` and \`internal_notes\` end up in your public API.
14. **Response written**, connection kept alive for reuse:

\`\`\`http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
X-Request-Id: 018f2a...

{"data":{"id":"9f1c2d3e-...","title":"Write the API chapter","status":"todo"}}
\`\`\`

15. **Log the outcome** — one structured line with method, path, status, duration, request ID, user ID. Metrics increment. If it threw, the stack trace goes to Sentry with the request ID attached so you can join the two.

The most useful thing in that list is the **request ID**. Generate it at the edge if the client didn't send one, put it in every log line, and return it in the response header. When a user says "it failed at 2:03", you ask for the request ID and find the exact trace in one query instead of grepping.`,
    },
    {
      id: "resource-design",
      heading: "Routing and resource design",
      markdown: `Before writing a line of code, write the table. This is the deliverable interviewers actually want when they say "show me some REST APIs" — it demonstrates you think in contracts.

The domain: a task tracker. Tasks belong to a project. Users comment on tasks.

| Intent | Method | Path | Request body | Success | Common errors |
| --- | --- | --- | --- | --- | --- |
| List tasks (filter, paginate) | \`GET\` | \`/v1/tasks?status=todo&limit=20&cursor=…\` | — | \`200\` + array + \`nextCursor\` | \`400\` bad query param |
| Create a task | \`POST\` | \`/v1/tasks\` | \`{title, projectId, priority?}\` | \`201\` + body + \`Location\` header | \`422\` validation, \`404\` project not found |
| Read one task | \`GET\` | \`/v1/tasks/{id}\` | — | \`200\` | \`404\` |
| Partial update | \`PATCH\` | \`/v1/tasks/{id}\` | \`{title?, status?, priority?}\` | \`200\` + updated body | \`404\`, \`422\`, \`409\` version conflict |
| Full replace | \`PUT\` | \`/v1/tasks/{id}\` | the complete task | \`200\` | \`404\`, \`422\` |
| Delete | \`DELETE\` | \`/v1/tasks/{id}\` | — | \`204\` no body | \`404\`, \`403\` |
| Comments on a task | \`GET\` | \`/v1/tasks/{id}/comments\` | — | \`200\` | \`404\` task not found |
| Add a comment | \`POST\` | \`/v1/tasks/{id}/comments\` | \`{body}\` | \`201\` | \`404\`, \`422\` |
| Assign (a real state transition) | \`PUT\` | \`/v1/tasks/{id}/assignee\` | \`{userId}\` | \`200\` | \`404\`, \`409\` already assigned |
| Bulk archive (non-CRUD action) | \`POST\` | \`/v1/tasks/archive\` | \`{ids: [...]}\` | \`202\` accepted | \`422\` |

Rules encoded in that table, and the reasons:

- **Nouns, plural, lowercase, hyphenated.** \`/v1/task-lists\`, never \`/v1/getTaskList\`. The verb is the HTTP method; putting it in the path duplicates it.
- **Collection vs item.** \`/tasks\` is a collection, \`/tasks/{id}\` is an item. \`POST\` to the collection creates; \`PATCH\`/\`DELETE\` on the item modifies. \`POST /tasks/{id}\` is meaningless — do not define it.
- **Nest only one level.** \`/tasks/{id}/comments\` is fine. \`/projects/{p}/tasks/{t}/comments/{c}/reactions/{r}\` is a URL nobody can build correctly. Once a resource has its own ID, give it a top-level route: \`/comments/{c}\`.
- **\`201\` gets a \`Location\` header.** It tells the client where the thing now lives without parsing the body.
- **\`204\` for delete** means "done, nothing to say". Returning \`200\` with \`{"deleted": true}\` is not wrong, but pick one and be consistent across every endpoint.
- **Actions that are not CRUD exist.** "Archive 40 tasks", "send password reset", "retry payment". Do not contort them into \`PATCH\`. Model them as a sub-resource (\`PUT /tasks/{id}/assignee\`) when there is a noun, or accept a verb path (\`POST /tasks/archive\`) when there isn't. Pretending every operation is CRUD produces worse APIs than admitting the exception.
- **Version from day one.** \`/v1/\` costs nothing today and saves you the day a client depends on a field you need to remove.`,
    },
    {
      id: "crud-express",
      heading: "Full worked CRUD: Express + TypeScript",
      markdown: `Complete, runnable code for the \`tasks\` resource. Read it top to bottom — the layering from the previous section is visible here.

**\`src/app.ts\`** — build the app without starting it, so tests can import it.

\`\`\`ts
import express from "express";
import { randomUUID } from "node:crypto";
import { tasksRouter } from "./routes/tasks.routes";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./lib/logger";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "100kb" }));

  // Request ID first: everything after this can correlate.
  app.use((req, res, next) => {
    const id = (req.header("x-request-id") ?? randomUUID()).slice(0, 64);
    res.locals.requestId = id;
    res.setHeader("X-Request-Id", id);
    next();
  });

  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      logger.info(
        {
          requestId: res.locals.requestId,
          method: req.method,
          path: req.route?.path ?? req.path,
          status: res.statusCode,
          durationMs: Math.round(ms),
        },
        "request",
      );
    });
    next();
  });

  app.get("/healthz", (_req, res) => res.json({ status: "ok" }));
  app.use("/v1/tasks", tasksRouter);

  app.use((_req, res) => {
    res.status(404).json({
      error: { code: "not_found", message: "No route matches this path." },
    });
  });

  app.use(errorHandler);
  return app;
}
\`\`\`

**\`src/server.ts\`** — the process entry point. Separate from \`app.ts\` so importing the app in a test never binds a port.

\`\`\`ts
import { createApp } from "./app";
import { env } from "./config/env";
import { pool } from "./db/pool";
import { logger } from "./lib/logger";

const server = createApp().listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "listening");
});

// Graceful shutdown: stop accepting connections, drain, close the pool.
// Without this, a deploy kills in-flight requests and leaks DB connections.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    logger.info({ signal }, "shutting down");
    server.close(async () => {
      await pool.end();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  });
}
\`\`\`

**\`src/routes/tasks.routes.ts\`** — HTTP only. Parse, validate, delegate, map the result to a status code.

\`\`\`ts
import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import * as taskService from "../services/tasks.service";
import {
  createTaskSchema,
  updateTaskSchema,
  listTasksQuerySchema,
} from "../schemas/task.schemas";
import { validate } from "../lib/validate";

/**
 * Express 4 does not catch rejected promises from async handlers — the request
 * hangs until it times out. Express 5 fixed this; wrap until you are on it.
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

const idParamSchema = z.object({ id: z.string().uuid() });

export const tasksRouter = Router();

tasksRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = validate(listTasksQuerySchema, req.query);
    const page = await taskService.listTasks(query);
    res.status(200).json({ data: page.items, nextCursor: page.nextCursor });
  }),
);

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = validate(createTaskSchema, req.body);
    const task = await taskService.createTask(input);
    res.status(201).location("/v1/tasks/" + task.id).json({ data: task });
  }),
);

tasksRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = validate(idParamSchema, req.params);
    const task = await taskService.getTask(id);
    res.status(200).json({ data: task });
  }),
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = validate(idParamSchema, req.params);
    const input = validate(updateTaskSchema, req.body);
    const task = await taskService.updateTask(id, input);
    res.status(200).json({ data: task });
  }),
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = validate(idParamSchema, req.params);
    await taskService.deleteTask(id);
    res.status(204).end();
  }),
);
\`\`\`

Note what the route handlers do **not** contain: no SQL, no \`if (!task) return res.status(404)\`. The service throws a \`NotFoundError\`; the error middleware turns that into \`404\`. Each handler is four lines because every cross-cutting concern has a home.`,
    },
    {
      id: "crud-next",
      heading: "The same API as Next.js 16 route handlers",
      markdown: `This app is Next.js 16, so know how the identical resource looks in the App Router. Route handlers are files named \`route.ts\` under \`app/\`, exporting functions named after HTTP methods. They take the **Web standard** \`Request\` and return a \`Response\` — no framework-specific \`req\`/\`res\` objects.

The local convention is in \`src/app/api/ai/route.ts\`: validate with \`zod\`, return \`Response.json(...)\` with an explicit status.

**\`src/app/api/tasks/route.ts\`** — the collection.

\`\`\`ts
import { z } from "zod";
import * as taskService from "@/services/tasks.service";
import { createTaskSchema, listTasksQuerySchema } from "@/schemas/task.schemas";
import { toErrorResponse } from "@/lib/errors";

export async function GET(req: Request) {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const parsed = listTasksQuerySchema.safeParse(params);
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "validation_failed",
          message: "Invalid query parameters.",
          fields: z.flattenError(parsed.error).fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const page = await taskService.listTasks(parsed.data);
  return Response.json(
    { data: page.items, nextCursor: page.nextCursor },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const parsed = createTaskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "validation_failed",
          message: "Invalid request body.",
          fields: z.flattenError(parsed.error).fieldErrors,
        },
      },
      { status: 422 },
    );
  }

  try {
    const task = await taskService.createTask(parsed.data);
    return Response.json(
      { data: task },
      { status: 201, headers: { Location: "/api/tasks/" + task.id } },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}
\`\`\`

**\`src/app/api/tasks/[id]/route.ts\`** — the item. Note \`params\` is a **Promise** in Next 15+ and must be awaited; the global \`RouteContext<'/api/tasks/[id]'>\` helper types it from the route literal (generated by \`next dev\` / \`next build\`, no import needed).

\`\`\`ts
import * as taskService from "@/services/tasks.service";
import { updateTaskSchema } from "@/schemas/task.schemas";
import { toErrorResponse } from "@/lib/errors";

export async function GET(_req: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  try {
    return Response.json({ data: await taskService.getTask(id) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  const parsed = updateTaskSchema.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json(
      { error: { code: "validation_failed", message: "Invalid request body." } },
      { status: 422 },
    );
  }
  try {
    return Response.json({ data: await taskService.updateTask(id, parsed.data) });
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/tasks/[id]">) {
  const { id } = await ctx.params;
  try {
    await taskService.deleteTask(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return toErrorResponse(err);
  }
}
\`\`\`

Differences worth being able to name in an interview:

| | Express | Next 16 route handlers |
| --- | --- | --- |
| Handler signature | \`(req, res, next)\`, you call \`res.json()\` | \`(request: Request, ctx)\` → you **return** a \`Response\` |
| Routing | Explicit \`router.get("/:id")\` | File system: \`app/api/tasks/[id]/route.ts\` |
| Dynamic params | \`req.params.id\` (sync) | \`await ctx.params\` — **a Promise since Next 15** |
| Cross-cutting middleware | \`app.use(...)\` chain | \`proxy.ts\` at the project root — the \`middleware.ts\` convention is **deprecated and renamed to \`proxy\`** in Next 16 |
| Error handling | Central \`errorHandler\` middleware | No global handler; a \`toErrorResponse(err)\` helper per route, or wrap handlers in a higher-order function |
| Caching | None by default | \`GET\` handlers are **not cached by default**; opt in with \`export const dynamic = "force-static"\`, or with Cache Components use \`"use cache"\` in an extracted helper |
| Body parsing | \`express.json()\` middleware | \`await request.json()\` — standard \`Request\` method |

The higher-order wrapper is worth showing, because "there's no global error middleware" is the honest weakness of route handlers and having an answer is the difference between reciting docs and having shipped something:

\`\`\`ts
// src/lib/route.ts
import { toErrorResponse } from "./errors";

type Handler<C> = (req: Request, ctx: C) => Promise<Response>;

export function route<C>(handler: Handler<C>): Handler<C> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

// usage:  export const GET = route<RouteContext<"/api/tasks/[id]">>(async (_req, ctx) => { ... })
\`\`\``,
    },
    {
      id: "curl-walkthrough",
      heading: "Hitting every endpoint with curl",
      markdown: `If you claim to have built an API, you should be able to demonstrate it from a terminal without a client. \`-i\` prints the status line and headers, which is where half the information lives.

**Create — \`201\`**

\`\`\`bash
curl -i -X POST http://localhost:3000/v1/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Write the API chapter","projectId":"6b1a7f6e-1f43-4d7e-9e10-3c1b2a0d9e77","priority":"high"}'
\`\`\`

\`\`\`http
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8
Location: /v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
X-Request-Id: 018f2a5c-0f3b-7a21-9c44-6b2e2f3a1d55

{
  "data": {
    "id": "9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
    "projectId": "6b1a7f6e-1f43-4d7e-9e10-3c1b2a0d9e77",
    "title": "Write the API chapter",
    "status": "todo",
    "priority": "high",
    "createdAt": "2026-07-27T10:14:02.113Z",
    "updatedAt": "2026-07-27T10:14:02.113Z"
  }
}
\`\`\`

**Create with a bad body — \`422\` with per-field errors**

\`\`\`bash
curl -i -X POST http://localhost:3000/v1/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"","priority":"urgent"}'
\`\`\`

\`\`\`http
HTTP/1.1 422 Unprocessable Content
Content-Type: application/json; charset=utf-8

{
  "error": {
    "code": "validation_failed",
    "message": "Request body failed validation.",
    "fields": {
      "title": ["Title must be at least 1 character."],
      "projectId": ["Required"],
      "priority": ["Expected one of: low, medium, high"]
    }
  }
}
\`\`\`

The per-field map matters: a client form can highlight three inputs from that response. \`{"error":"bad request"}\` forces the client to re-implement your validation rules to know what to show.

**List with filter and pagination — \`200\`**

\`\`\`bash
curl -s 'http://localhost:3000/v1/tasks?status=todo&limit=2' | jq
\`\`\`

\`\`\`json
{
  "data": [
    { "id": "9f1c2d3e-…", "title": "Write the API chapter", "status": "todo", "priority": "high",   "createdAt": "2026-07-27T10:14:02.113Z" },
    { "id": "1a2b3c4d-…", "title": "Review PR #418",        "status": "todo", "priority": "medium", "createdAt": "2026-07-27T09:58:41.002Z" }
  ],
  "nextCursor": "MjAyNi0wNy0yN1QwOTo1ODo0MS4wMDJafDFhMmIzYzRk"
}
\`\`\`

**Read one — \`200\`, and a miss — \`404\`**

\`\`\`bash
curl -s http://localhost:3000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f | jq .data.status
# "todo"

curl -i -s http://localhost:3000/v1/tasks/00000000-0000-4000-8000-000000000000
\`\`\`

\`\`\`http
HTTP/1.1 404 Not Found
Content-Type: application/json; charset=utf-8

{"error":{"code":"not_found","message":"Task 00000000-0000-4000-8000-000000000000 was not found."}}
\`\`\`

**Partial update — \`200\`**

\`\`\`bash
curl -i -X PATCH http://localhost:3000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f \\
  -H 'Content-Type: application/json' \\
  -d '{"status":"in_progress"}'
\`\`\`

\`\`\`http
HTTP/1.1 200 OK

{"data":{"id":"9f1c2d3e-…","title":"Write the API chapter","status":"in_progress","priority":"high","updatedAt":"2026-07-27T10:31:47.556Z"}}
\`\`\`

Only \`status\` was sent and only \`status\` changed — that is what makes it a \`PATCH\`. A \`PUT\` with the same body would be a *replacement* and should blank \`title\`.

**Delete — \`204\`, then the follow-up \`404\`**

\`\`\`bash
curl -i -X DELETE http://localhost:3000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
# HTTP/1.1 204 No Content   (no body at all)

curl -s -o /dev/null -w '%{http_code}\\n' \\
  http://localhost:3000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
# 404
\`\`\`

A nice detail to mention: a second \`DELETE\` of the same ID returning \`404\` is defensible, but returning \`204\` again is *more* useful, because it makes \`DELETE\` fully idempotent for retrying clients. Either is acceptable if documented — the interviewer is testing whether you know there is a choice.`,
    },
    {
      id: "validation",
      heading: "Request validation with zod",
      markdown: `Validation is the boundary between untrusted input and typed internals. Do it once, at the edge, and everything downstream can assume its inputs are well-formed.

\`\`\`ts
// src/schemas/task.schemas.ts
import { z } from "zod";

export const taskStatus = z.enum(["todo", "in_progress", "done"]);
export const taskPriority = z.enum(["low", "medium", "high"]);

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title must be at least 1 character.").max(200),
  projectId: z.string().uuid(),
  priority: taskPriority.default("medium"),
  dueAt: z.coerce.date().optional(),
});

// Every field optional, but reject {} — an empty PATCH is a client bug.
export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    status: taskStatus,
    priority: taskPriority,
    dueAt: z.coerce.date().nullable(),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field to update.",
  });

// Query strings are ALWAYS strings. Coerce explicitly or "limit=20" fails a
// number check, and "limit=abc" silently becomes NaN if you use Number().
export const listTasksQuerySchema = z.object({
  status: taskStatus.optional(),
  projectId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(200).optional(),
  sort: z.enum(["createdAt", "-createdAt", "dueAt", "-dueAt"]).default("-createdAt"),
});

// One schema, both the runtime guard and the static type.
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
\`\`\`

The helper that turns a failed parse into an HTTP error:

\`\`\`ts
// src/lib/validate.ts
import { z } from "zod";
import { ValidationError } from "./errors";

export function validate<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(
      "Request body failed validation.",
      z.flattenError(result.error).fieldErrors,
    );
  }
  return result.data;
}
\`\`\`

Points that separate a good answer from a shallow one:

- **\`safeParse\` over \`parse\`.** \`parse\` throws a \`ZodError\`; \`safeParse\` returns a discriminated union you handle deliberately. Use \`safeParse\` and translate the failure yourself so the client never sees zod's internal issue format leak into your public contract.
- **Validation is not just type-checking — it is a whitelist.** \`z.object()\` strips unknown keys by default. That means a client cannot smuggle \`{"role":"admin"}\` or \`{"id":"…"}\` into your create payload and have it reach an \`INSERT\`. This is mass-assignment protection, and it is free. If you want to *reject* extra keys loudly rather than silently drop them, use \`.strict()\`.
- **TypeScript types vanish at runtime.** \`req.body as CreateTaskInput\` is a lie you tell the compiler; it does zero checking. Interviewers ask this specifically to see whether you understand erasure.
- **Validate params and query too, not just bodies.** \`/tasks/abc\` with a non-UUID should be \`400\`, not a Postgres \`invalid input syntax for type uuid\` error bubbling up as a \`500\`.
- **\`400\` vs \`422\`.** \`400\` = the request is malformed (unparseable JSON, bad query param). \`422\` = syntactically valid JSON that violates your rules. Plenty of good APIs use \`400\` for both; the only wrong answer is being inconsistent within one API.`,
    },
    {
      id: "service-repository",
      heading: "The service and repository layers",
      markdown: `**Repository** = the only place SQL lives. **Service** = the only place business rules live. Neither knows what HTTP is.

\`\`\`ts
// src/services/tasks.service.ts
import * as taskRepo from "../repositories/tasks.repo";
import * as projectRepo from "../repositories/projects.repo";
import { NotFoundError, ConflictError } from "../lib/errors";
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from "../schemas/task.schemas";
import type { Task } from "../domain/task";

const MAX_OPEN_TASKS_PER_PROJECT = 500;

export async function listTasks(query: ListTasksQuery) {
  // Fetch one extra row to learn whether another page exists without COUNT(*).
  const rows = await taskRepo.list({ ...query, limit: query.limit + 1 });
  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  return {
    items,
    nextCursor: hasMore ? taskRepo.encodeCursor(items[items.length - 1]) : null,
  };
}

export async function getTask(id: string): Promise<Task> {
  const task = await taskRepo.findById(id);
  if (!task) throw new NotFoundError("Task " + id + " was not found.");
  return task;
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const project = await projectRepo.findById(input.projectId);
  if (!project) throw new NotFoundError("Project " + input.projectId + " was not found.");
  if (project.archivedAt) {
    throw new ConflictError("Cannot add tasks to an archived project.");
  }

  const openCount = await taskRepo.countOpenByProject(project.id);
  if (openCount >= MAX_OPEN_TASKS_PER_PROJECT) {
    throw new ConflictError("Project has reached its open-task limit.");
  }

  return taskRepo.insert(input);
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const existing = await getTask(id);
  if (existing.status === "done" && input.status === "todo") {
    throw new ConflictError("A completed task cannot be reopened.");
  }
  const updated = await taskRepo.update(id, input);
  if (!updated) throw new NotFoundError("Task " + id + " was not found.");
  return updated;
}

export async function deleteTask(id: string): Promise<void> {
  const deleted = await taskRepo.remove(id);
  if (!deleted) throw new NotFoundError("Task " + id + " was not found.");
}
\`\`\`

Everything interesting about that file is what it does **not** do. There is no \`res\`, no status code, no \`req.body\`. \`createTask\` is a pure function of its inputs and the database, so:

- You can call it from an HTTP route, a background worker, a CLI backfill, or a test, unchanged.
- You can unit test "cannot add tasks to an archived project" in 5 milliseconds with a fake repository — no server, no database.
- Swapping Express for Next route handlers (previous section) touches zero lines of it.

The mapping from domain error → HTTP status happens in exactly one place, the error handler. If a service ever writes \`throw new HttpError(409)\`, the layering has leaked and you have lost the ability to reuse it off the HTTP path.

**A caveat worth volunteering**, because it shows judgement rather than cargo-culting: this layering is not free. \`getTask\` is a pass-through, and if your service layer is nothing but pass-throughs, it is ceremony. Introduce it when rules appear, or when a second caller appears — not on principle.`,
    },
    {
      id: "postgres",
      heading: "Talking to Postgres: raw SQL and an ORM",
      markdown: `### Schema

\`\`\`sql
-- src/db/migrations/001_create_tasks.sql
create extension if not exists "pgcrypto";

create type task_status   as enum ('todo', 'in_progress', 'done');
create type task_priority as enum ('low', 'medium', 'high');

create table projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  archived_at timestamptz
);

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  title       text not null check (length(trim(title)) between 1 and 200),
  status      task_status   not null default 'todo',
  priority    task_priority not null default 'medium',
  due_at      timestamptz,
  version     integer     not null default 1,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Supports the default listing: filter by project + status, newest first.
create index tasks_project_status_created_idx
  on tasks (project_id, status, created_at desc);
\`\`\`

Constraints belong in the database, not only in application code. Your API is not the only thing that will ever write to this table — a migration script, a psql session, or a second service will. \`references projects(id)\` makes an orphaned task *impossible*; a check in TypeScript makes it merely unlikely.

### The pool

\`\`\`ts
// src/db/pool.ts
import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,                       // per process. 5 instances x 10 = 50 server connections.
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // fail fast instead of hanging when exhausted
});

pool.on("error", (err) => {
  // Idle client blew up (network drop, DB restart). Don't crash the process.
  console.error({ err }, "idle pg client error");
});

/** Run a callback inside a transaction, with guaranteed rollback on throw. */
export async function withTransaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release(); // MUST be in finally, or you leak a connection per error
  }
}
\`\`\`

Opening a TCP connection and authenticating to Postgres takes single-digit milliseconds — unacceptable per request. The pool keeps \`max\` connections warm. \`max\` is not "bigger is better": Postgres allocates memory per backend and its default \`max_connections\` is 100. Instances × \`max\` must stay comfortably under that, or new connections are refused. This is what PgBouncer exists to solve.

### Repository with raw SQL

\`\`\`ts
// src/repositories/tasks.repo.ts
import { pool } from "../db/pool";
import type { Task } from "../domain/task";
import type { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from "../schemas/task.schemas";

interface TaskRow {
  id: string;
  project_id: string;
  title: string;
  status: Task["status"];
  priority: Task["priority"];
  due_at: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

/** snake_case DB row -> camelCase domain object. The mapping lives HERE, once. */
function toDomain(row: TaskRow): Task {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    dueAt: row.due_at,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findById(id: string): Promise<Task | null> {
  const { rows } = await pool.query<TaskRow>(
    "select * from tasks where id = $1",
    [id],
  );
  return rows[0] ? toDomain(rows[0]) : null;
}

export async function insert(input: CreateTaskInput): Promise<Task> {
  const { rows } = await pool.query<TaskRow>(
    \`insert into tasks (project_id, title, priority, due_at)
     values ($1, $2, $3, $4)
     returning *\`,
    [input.projectId, input.title, input.priority, input.dueAt ?? null],
  );
  return toDomain(rows[0]);
}

export async function update(id: string, input: UpdateTaskInput): Promise<Task | null> {
  // coalesce($n, column) = "update only the fields that were sent".
  const { rows } = await pool.query<TaskRow>(
    \`update tasks
        set title    = coalesce($2, title),
            status   = coalesce($3, status),
            priority = coalesce($4, priority),
            due_at   = case when $5::boolean then $6 else due_at end,
            version  = version + 1,
            updated_at = now()
      where id = $1
      returning *\`,
    [
      id,
      input.title ?? null,
      input.status ?? null,
      input.priority ?? null,
      "dueAt" in input,          // distinguishes "omitted" from "explicitly null"
      input.dueAt ?? null,
    ],
  );
  return rows[0] ? toDomain(rows[0]) : null;
}

export async function remove(id: string): Promise<boolean> {
  const result = await pool.query("delete from tasks where id = $1", [id]);
  return result.rowCount === 1;
}

export async function countOpenByProject(projectId: string): Promise<number> {
  const { rows } = await pool.query<{ count: string }>(
    "select count(*) from tasks where project_id = $1 and status <> 'done'",
    [projectId],
  );
  return Number(rows[0].count); // count() returns bigint -> string in node-postgres
}

export async function list(query: ListTasksQuery & { limit: number }): Promise<Task[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (query.projectId) {
    values.push(query.projectId);
    conditions.push("project_id = $" + values.length);
  }
  if (query.status) {
    values.push(query.status);
    conditions.push("status = $" + values.length);
  }
  if (query.cursor) {
    const { createdAt, id } = decodeCursor(query.cursor);
    values.push(createdAt, id);
    conditions.push(
      "(created_at, id) < ($" + (values.length - 1) + ", $" + values.length + ")",
    );
  }

  values.push(query.limit);
  const where = conditions.length ? "where " + conditions.join(" and ") : "";
  const { rows } = await pool.query<TaskRow>(
    "select * from tasks " + where +
      " order by created_at desc, id desc limit $" + values.length,
    values,
  );
  return rows.map(toDomain);
}

export function encodeCursor(task: Task): string {
  return Buffer.from(task.createdAt.toISOString() + "|" + task.id).toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: string; id: string } {
  const [createdAt, id] = Buffer.from(cursor, "base64url").toString("utf8").split("|");
  return { createdAt, id };
}
\`\`\`

**The non-negotiable rule:** values go in the \`values\` array as \`$1\`, \`$2\`, never interpolated into the string. The dynamic \`where\` above builds only *placeholders* from user input — never user data. \`"where status = '" + status + "'"\` is a SQL injection, full stop, and an interviewer who sees it will stop evaluating anything else.

### The same repository with an ORM (Drizzle)

\`\`\`ts
// src/db/schema.ts
import { pgTable, uuid, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";

export const taskStatus = pgEnum("task_status", ["todo", "in_progress", "done"]);
export const taskPriority = pgEnum("task_priority", ["low", "medium", "high"]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull(),
  title: text("title").notNull(),
  status: taskStatus("status").notNull().default("todo"),
  priority: taskPriority("priority").notNull().default("medium"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
\`\`\`

\`\`\`ts
// src/repositories/tasks.repo.drizzle.ts
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db } from "../db/client";
import { tasks } from "../db/schema";

export async function findById(id: string) {
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row ?? null;
}

export async function insert(input: {
  projectId: string;
  title: string;
  priority: "low" | "medium" | "high";
  dueAt?: Date;
}) {
  const [row] = await db.insert(tasks).values(input).returning();
  return row;
}

export async function listOpen(projectId: string, before: Date, limit: number) {
  return db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.projectId, projectId), lt(tasks.createdAt, before), sql\`\${tasks.status} <> 'done'\`),
    )
    .orderBy(desc(tasks.createdAt))
    .limit(limit);
}
\`\`\`

| Approach | Wins | Loses |
| --- | --- | --- |
| **Raw SQL** (\`pg\`) | Total control, exact query plans, no abstraction to fight, transferable skill | Manual row → object mapping, manual types, verbose dynamic queries |
| **Query builder** (Drizzle, Kysely) | Type-safe columns, composable filters, SQL stays visible and predictable | Still need SQL knowledge; migration tooling is younger |
| **Full ORM** (Prisma, TypeORM) | Fastest CRUD, relations and migrations included, great DX | Hidden N+1 queries, surprising generated SQL, hard to express window functions or CTEs, another runtime to debug |

Say this: *"I default to a typed query builder. I want the query I wrote to be the query that runs — the failure mode of a heavy ORM is that you don't notice it issued 200 queries until production. But for a standard CRUD admin panel, Prisma is a straightforward win."*`,
    },
    {
      id: "errors-config-logging",
      heading: "Errors, config, and logging",
      markdown: `### One error envelope, everywhere

Pick a shape and never deviate. A client that must handle five error formats will handle none of them.

\`\`\`json
{
  "error": {
    "code": "validation_failed",
    "message": "Request body failed validation.",
    "fields": { "title": ["Title must be at least 1 character."] },
    "requestId": "018f2a5c-0f3b-7a21-9c44-6b2e2f3a1d55"
  }
}
\`\`\`

\`code\` is a stable machine-readable string — clients branch on it. \`message\` is for humans and may change. \`requestId\` is what a user pastes into a support ticket.

\`\`\`ts
// src/lib/errors.ts
export class AppError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = new.target.name;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fields?: Record<string, string[]>) {
    super("validation_failed", message, 422, fields);
  }
}
export class NotFoundError extends AppError {
  constructor(message: string) {
    super("not_found", message, 404);
  }
}
export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", message, 409);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource.") {
    super("forbidden", message, 403);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required.") {
    super("unauthorized", message, 401);
  }
}

/** For Next.js route handlers, which have no global error middleware. */
export function toErrorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      { error: { code: err.code, message: err.message, fields: err.fields } },
      { status: err.status },
    );
  }
  console.error({ err }, "unhandled error");
  return Response.json(
    { error: { code: "internal_error", message: "Something went wrong." } },
    { status: 500 },
  );
}
\`\`\`

\`\`\`ts
// src/middleware/errorHandler.ts
import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/errors";
import { logger } from "../lib/logger";

// Express identifies the error handler by its FOUR parameters. Drop \`next\` and
// it silently becomes ordinary middleware that never runs.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const requestId = res.locals.requestId as string | undefined;

  if (err instanceof AppError) {
    // Expected outcomes: log at warn, no stack trace, no alert.
    logger.warn({ requestId, code: err.code, status: err.status }, err.message);
    res.status(err.status).json({
      error: { code: err.code, message: err.message, fields: err.fields, requestId },
    });
    return;
  }

  // Unexpected: log the full stack, return NOTHING revealing.
  logger.error({ requestId, err }, "unhandled error");
  res.status(500).json({
    error: { code: "internal_error", message: "Something went wrong.", requestId },
  });
};
\`\`\`

The distinction between those two branches is the whole point. A \`404\` is a normal outcome and should never page anyone. An unhandled \`TypeError\` is a bug and must reach your error tracker with a stack trace. Collapsing both into \`res.status(500).send(err.message)\` gives you an alert channel nobody reads and leaks \`relation "tasks" does not exist\` — your schema — to the internet.

### Config

\`\`\`ts
// src/config/env.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug"]).default("info"),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((s) => s.split(",").map((o) => o.trim()).filter(Boolean)),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", z.flattenError(parsed.error).fieldErrors);
  process.exit(1); // Fail at boot, not on the first request at 3am.
}

export const env = parsed.data;
\`\`\`

Rules: secrets come from the environment (or a secret manager), never from git. \`.env\` is gitignored and \`.env.example\` — with keys and no values — is committed. Config is read **once** at startup and validated; a missing \`DATABASE_URL\` should crash the process immediately, not surface as a confusing \`500\` under load.

### Logging

\`\`\`ts
// src/lib/logger.ts
import pino from "pino";
import { env } from "../config/env";

export const logger = pino({
  level: env.LOG_LEVEL,
  // Never log a password, token, or full auth header — logs get shipped to
  // third parties and read by people who should not see credentials.
  redact: ["req.headers.authorization", "*.password", "*.token", "*.creditCard"],
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
\`\`\`

Log **structured JSON**, not sentences. \`logger.info({ userId, taskId, durationMs }, "task created")\` is queryable — "p99 duration for task creation by user" is one query. \`console.log("created task " + id + " for " + userId)\` is a string you can only grep. Levels that actually mean something: \`error\` = a human must look; \`warn\` = expected-but-notable (a \`409\`, a rate limit hit); \`info\` = one line per request plus significant state changes; \`debug\` = off in production.`,
    },
    {
      id: "testing",
      heading: "Testing the API",
      markdown: `Three layers, with a deliberate ratio: many unit tests (fast, precise failures), a solid band of integration tests (they catch what unit tests structurally cannot — your SQL), and a handful of end-to-end tests.

### Unit: the service, with a fake repository

\`\`\`ts
// tests/unit/tasks.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as taskRepo from "../../src/repositories/tasks.repo";
import * as projectRepo from "../../src/repositories/projects.repo";
import * as taskService from "../../src/services/tasks.service";
import { ConflictError, NotFoundError } from "../../src/lib/errors";

vi.mock("../../src/repositories/tasks.repo");
vi.mock("../../src/repositories/projects.repo");

const activeProject = { id: "p-1", name: "Platform", archivedAt: null };

describe("createTask", () => {
  beforeEach(() => vi.resetAllMocks());

  it("rejects tasks on an archived project", async () => {
    vi.mocked(projectRepo.findById).mockResolvedValue({
      ...activeProject,
      archivedAt: new Date(),
    });

    await expect(
      taskService.createTask({ title: "x", projectId: "p-1", priority: "low" }),
    ).rejects.toBeInstanceOf(ConflictError);

    expect(taskRepo.insert).not.toHaveBeenCalled();
  });

  it("rejects when the project is over its open-task limit", async () => {
    vi.mocked(projectRepo.findById).mockResolvedValue(activeProject);
    vi.mocked(taskRepo.countOpenByProject).mockResolvedValue(500);

    await expect(
      taskService.createTask({ title: "x", projectId: "p-1", priority: "low" }),
    ).rejects.toThrow(/open-task limit/);
  });

  it("404s when the project does not exist", async () => {
    vi.mocked(projectRepo.findById).mockResolvedValue(null);

    await expect(
      taskService.createTask({ title: "x", projectId: "nope", priority: "low" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
\`\`\`

These run in milliseconds and pin down business rules. What they cannot catch: a typo in your SQL, a missing column, a broken \`coalesce\`. Mocks assert your code calls what you *think* it calls — never that the database agrees.

### Integration: the real app, the real database, via supertest

\`\`\`ts
// tests/integration/tasks.routes.test.ts
import request from "supertest";
import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { createApp } from "../../src/app";
import { pool } from "../../src/db/pool";

const app = createApp();
let projectId: string;

beforeAll(async () => {
  await pool.query("select 1"); // fail loudly if DATABASE_URL is wrong
});

beforeEach(async () => {
  // Truncate between tests: deterministic, and far faster than re-migrating.
  await pool.query("truncate tasks, projects restart identity cascade");
  const { rows } = await pool.query(
    "insert into projects (name) values ('Test project') returning id",
  );
  projectId = rows[0].id;
});

afterAll(async () => {
  await pool.end();
});

describe("POST /v1/tasks", () => {
  it("creates a task and returns 201 with a Location header", async () => {
    const res = await request(app)
      .post("/v1/tasks")
      .send({ title: "Ship it", projectId, priority: "high" })
      .expect(201);

    expect(res.body.data).toMatchObject({ title: "Ship it", status: "todo" });
    expect(res.headers.location).toBe("/v1/tasks/" + res.body.data.id);

    const { rows } = await pool.query("select title from tasks where id = $1", [
      res.body.data.id,
    ]);
    expect(rows[0].title).toBe("Ship it"); // it really is in Postgres
  });

  it("returns 422 with per-field errors for an invalid body", async () => {
    const res = await request(app)
      .post("/v1/tasks")
      .send({ title: "", priority: "urgent" })
      .expect(422);

    expect(res.body.error.code).toBe("validation_failed");
    expect(Object.keys(res.body.error.fields)).toEqual(
      expect.arrayContaining(["title", "projectId", "priority"]),
    );
  });

  it("strips unknown keys instead of trusting them", async () => {
    const res = await request(app)
      .post("/v1/tasks")
      .send({ title: "Ship it", projectId, id: "attacker-chosen-id" })
      .expect(201);

    expect(res.body.data.id).not.toBe("attacker-chosen-id");
  });
});

describe("the task lifecycle", () => {
  it("creates, reads, patches, deletes, then 404s", async () => {
    const created = await request(app)
      .post("/v1/tasks")
      .send({ title: "Lifecycle", projectId })
      .expect(201);
    const id = created.body.data.id;

    await request(app).get("/v1/tasks/" + id).expect(200);

    const patched = await request(app)
      .patch("/v1/tasks/" + id)
      .send({ status: "in_progress" })
      .expect(200);
    expect(patched.body.data.status).toBe("in_progress");
    expect(patched.body.data.title).toBe("Lifecycle"); // PATCH is partial

    await request(app).delete("/v1/tasks/" + id).expect(204);
    await request(app).get("/v1/tasks/" + id).expect(404);
  });

  it("404s on a well-formed but unknown id, 400s on a malformed one", async () => {
    await request(app)
      .get("/v1/tasks/00000000-0000-4000-8000-000000000000")
      .expect(404);
    await request(app).get("/v1/tasks/not-a-uuid").expect(422);
  });
});
\`\`\`

\`supertest\` binds the app to an ephemeral port and makes a real HTTP request, so middleware, routing, validation, status codes, and headers are all genuinely exercised. That is why you export \`createApp()\` separately from \`server.ts\`.

**Where the test database comes from.** Best answer: Testcontainers — spin a throwaway Postgres in Docker per test run, run migrations against it, tear it down. It is reproducible on any laptop and in CI, and nobody's local test run can clobber a shared database. Acceptable answer: a dedicated \`app_test\` database created in CI, truncated between tests. Bad answer: mocking the database driver in an "integration" test, which tests your mocks.

**What I look for when someone says "I tested it":** do they test the failure paths? Anyone tests the \`201\`. The candidates who have actually shipped test the \`422\`, the \`404\`, the duplicate insert that must be \`409\`, and the unknown-key case above.`,
    },
  ],
  questions: [
    {
      q: "Walk me through how you'd set up an API backend from scratch.",
      a: "I'd pick Node + TypeScript with Express or Fastify, and lay the project out in layers: routes handle HTTP only, services hold business rules, repositories hold SQL. Boot sequence is: parse and validate `process.env` with zod and crash immediately if anything's missing; create a `pg` Pool; build the Express app in `app.ts` (separate from `server.ts` so tests can import it without binding a port). Middleware in order — request ID, structured logging, CORS, JSON body parsing with a size limit, auth, rate limiting — then routers, then a 404 handler, then the error handler last. Each route validates input with a zod schema, calls a service, and maps the result to a status code. Services throw domain errors like `NotFoundError`; a single error middleware maps those to a consistent `{error: {code, message, requestId}}` envelope. Postgres via parameterized queries, migrations in version-controlled SQL files. Tests: unit tests on services with fake repos, integration tests with supertest against a real Postgres in Docker. Deploy behind a load balancer with a `/healthz` endpoint and graceful SIGTERM shutdown that drains connections.",
      weak: "I'd use `npx express-generator`, then add routes and connect to a database with Mongoose. Each route does the database query and sends the JSON back.",
    },
    {
      q: "Show me the REST endpoints you'd design for a task tracker.",
      a: "`GET /v1/tasks?status=todo&limit=20&cursor=…` → 200 with a data array and nextCursor. `POST /v1/tasks` → 201 with the created body and a `Location` header. `GET /v1/tasks/{id}` → 200 or 404. `PATCH /v1/tasks/{id}` for partial updates → 200. `DELETE /v1/tasks/{id}` → 204 with no body. Comments nest one level: `GET`/`POST /v1/tasks/{id}/comments`. Genuine state transitions get a sub-resource — `PUT /v1/tasks/{id}/assignee` with `{userId}` — because that's idempotent and expresses intent better than a generic PATCH. For bulk operations that aren't CRUD, I accept a verb path like `POST /v1/tasks/archive` returning 202; contorting that into REST produces a worse API. Plural lowercase nouns, no verbs in paths, version prefix from day one, never nest more than one level deep.",
      weak: "`/getTasks`, `/createTask`, `/updateTask`, `/deleteTask` — all POST, since POST can carry a body and it's simpler to have one method.",
    },
    {
      q: "What actually happens between the client sending a request and getting a response?",
      a: "DNS resolves the hostname, TCP handshake to port 443, TLS handshake (one round trip on 1.3), then the HTTP request bytes go on the wire. A load balancer terminates TLS, picks a healthy instance, and adds `X-Forwarded-For`. My framework runs the middleware chain — request ID, logging, CORS, body parse with a size limit, auth, rate limit — then matches the route. The handler validates input against a schema and rejects with 422 if it fails. The service applies business rules and calls a repository, which checks a connection out of the pool and runs parameterized SQL. Rows come back, get mapped to a public shape (deliberately, so internal columns don't leak), and get serialized to JSON with a status code and headers. The connection stays alive for reuse. On the way out I log one structured line with method, path, status, duration, and request ID. Failure modes I'd call out: 502/504 at the LB, 413 for oversized bodies often before my code runs, and pool exhaustion — which is the most common Node backend outage.",
    },
    {
      q: "Where do you validate input, and why not just use TypeScript types?",
      a: "At the edge, in the route handler, before anything else touches it. TypeScript types are erased at compile time — `req.body as CreateTaskInput` is an assertion that performs zero runtime checking, so a client sending `{title: 42}` sails straight through into your SQL. I use zod: one schema produces both the runtime validator and, via `z.infer`, the static type, so they can't drift. Three things people miss. First, `z.object()` strips unknown keys by default, which is free mass-assignment protection — a client can't smuggle `role: \"admin\"` or a chosen `id` into a create payload. Second, query params are always strings, so you need `z.coerce.number()` or `limit=20` fails a number check. Third, validate params too — `/tasks/abc` should be a 422 from my schema, not a Postgres 'invalid input syntax for uuid' surfacing as a 500.",
      weak: "The database has NOT NULL constraints and TypeScript catches type errors, so if something's wrong it'll throw and the error handler catches it.",
    },
    {
      q: "How do you handle errors consistently across an API?",
      a: "An `AppError` base class carrying a machine-readable `code`, a human `message`, and an HTTP `status`, with subclasses `ValidationError` (422), `NotFoundError` (404), `ConflictError` (409), `ForbiddenError` (403), `UnauthorizedError` (401). Services throw domain errors and know nothing about HTTP — that's what lets me reuse a service from a cron job. One error middleware, registered last with four parameters (Express identifies it by arity — three params and it silently becomes normal middleware), branches on `err instanceof AppError`: expected errors log at warn and return their status; anything else logs the full stack to the error tracker and returns a generic 500 with no internals. Every response uses the same envelope `{error: {code, message, fields?, requestId}}` — `code` is stable so clients can branch on it, `message` is for humans, `requestId` is what a user pastes into a support ticket. On Express 4 I wrap async handlers, because a rejected promise isn't caught and the request just hangs.",
      weak: "I wrap each route in try/catch and return `res.status(500).json({error: err.message})` so the client knows what went wrong.",
    },
    {
      q: "PUT vs PATCH — when do you use each?",
      a: "PUT replaces the entire resource: the body is the complete new state, and any field you omit should be cleared. PATCH applies a partial modification: only the fields present change. So `PATCH /tasks/42 {\"status\":\"done\"}` leaves the title alone, while `PUT /tasks/42 {\"status\":\"done\"}` should blank the title — which is why sending a partial body to PUT is a bug people ship constantly. Both are idempotent: repeating the same PUT or PATCH lands on the same state. In practice most APIs expose PATCH because clients rarely have the full resource in hand. The subtlety worth raising is distinguishing 'field omitted' from 'field explicitly set to null' in a PATCH — `{dueAt: null}` means clear it, an absent `dueAt` means leave it. `\"dueAt\" in body` distinguishes them; naive `body.dueAt ?? existing` cannot.",
    },
    {
      q: "Why separate a service layer from your route handlers? Isn't that over-engineering for a small app?",
      a: "It buys two things. First, testability: I can unit test 'a task can't be added to an archived project' in milliseconds with a fake repository — no HTTP server, no database, no mocking of `req`/`res`. Second, reuse: the moment a second caller appears — a cron job, a CLI backfill, a queue consumer, a GraphQL resolver — a rule living inside an Express handler has to be copy-pasted or extracted under pressure. Concretely, this chapter's service is served by both Express and Next.js route handlers with zero changes to it. And yes, it's over-engineering for a 200-line CRUD app where every service function is a pass-through — that's genuinely ceremony. I'd introduce the layer when the first real business rule appears or the second caller shows up, not on principle.",
    },
    {
      q: "How do you talk to Postgres from Node, and how do you avoid SQL injection?",
      a: "A `pg` Pool created once at startup — opening a connection per request costs milliseconds of handshake and would exhaust `max_connections`. The pool keeps N connections warm; I set `max` per process such that instances × max stays well under Postgres's `max_connections` (default 100), and set `connectionTimeoutMillis` so requests fail fast instead of hanging when the pool is exhausted. Injection is prevented by parameterized queries: `pool.query('select * from tasks where id = $1', [id])`. The driver sends the SQL and the values separately, so the value is never parsed as SQL — `'; drop table tasks; --` is just a string that matches nothing. String concatenation of user input into SQL is the vulnerability. For dynamic filters I build only the placeholder text from a whitelist and push the actual values into the params array. Same for `ORDER BY`, which can't be parameterized — that has to come from an allowlist of column names, never from raw input.",
      weak: "I use an ORM, so injection isn't possible.",
    },
    {
      q: "How would you test this API?",
      a: "Unit tests on services with mocked repositories for business rules — fast and pinpoint. Integration tests with supertest against the real Express app and a real Postgres, because that's the only layer that catches a typo in my SQL, a missing column, or a broken partial-update `coalesce`. That's why `createApp()` lives in `app.ts` separate from `server.ts`: tests import the app without binding a port. The database comes from Testcontainers — a throwaway Postgres in Docker per run, migrations applied, torn down after — so it's reproducible locally and in CI and no shared DB gets clobbered; I truncate tables between tests for determinism. I test failure paths, not just the happy one: the 422 with per-field errors, the 404 on a valid-but-unknown UUID, the duplicate insert that must be 409, and that unknown keys in the body get stripped rather than trusted. A couple of end-to-end tests cover the full lifecycle: create → read → patch → delete → 404.",
      weak: "I use Postman to hit each endpoint after I build it and check the response looks right.",
    },
    {
      q: "What's the difference between an Express handler and a Next.js 16 route handler?",
      a: "Express gives you `(req, res, next)` and you mutate `res` — `res.status(201).json(...)`. Next route handlers use Web standards: `(request: Request, ctx)` and you *return* a `Response`, typically `Response.json(body, {status})`. Routing is file-based — `app/api/tasks/[id]/route.ts` exporting functions named `GET`, `POST`, `PATCH`, `DELETE`. The gotcha people trip on: `params` is a Promise since Next 15, so it's `const {id} = await ctx.params`, and there's a global `RouteContext<'/api/tasks/[id]'>` helper that types it from the route literal. There's no global error middleware, so I wrap handlers in a small higher-order `route()` function that catches and maps to my error envelope. Cross-cutting concerns live in `proxy.ts` at the project root — in Next 16 the `middleware.ts` convention is deprecated and renamed to `proxy`. And GET route handlers are not cached by default; you opt in with `export const dynamic = 'force-static'`.",
    },
    {
      q: "Your API is returning 500s in production. How do you debug it?",
      a: "First, confirm scope and blast radius from metrics: what's the error rate, which endpoint, did it start at a deploy? If it lines up with a deploy, roll back first and diagnose after — restoring service beats being right. Then pull the structured logs filtered to status 500 for that route and read the stack traces in the error tracker; they're grouped by fingerprint so I can see whether it's one bug or many. Every log line carries a request ID, so I can take one failing request and follow it through auth, validation, service, and query. The usual suspects in order: a database issue (pool exhausted, a migration that didn't run, a slow query timing out), an unhandled null from a changed payload shape, or a downstream dependency failing without a timeout so requests pile up. This is also the argument for the earlier design: because expected errors are 4xx and only genuine bugs are 500, a 500 spike is unambiguously a bug rather than noise from people requesting missing records.",
      weak: "I'd add console.logs and redeploy to see what's happening.",
    },
    {
      q: "How do you keep secrets and configuration out of your code?",
      a: "Everything environment-specific comes from environment variables, read and validated exactly once at startup with a zod schema that also coerces types and applies defaults. If `DATABASE_URL` is missing or malformed, the process logs the field errors and exits — I want to fail at boot in CI, not on the first request at 3am. The rest of the app imports a typed `env` object, never `process.env` directly, so a typo'd variable name is a compile error. `.env` is gitignored; `.env.example` with keys and empty values is committed so a new developer knows what's needed. In production the values come from the platform's secret store — AWS Secrets Manager, Vault, or the host's env config — not from a file. And secrets get redacted in logs: pino's `redact` on `authorization` headers, `password`, and `token` fields, because logs get shipped to third-party services and read by people who shouldn't see credentials.",
    },
    {
      q: "What should you log, and what's wrong with console.log?",
      a: "Log structured JSON, one object per event, not sentences. `logger.info({userId, taskId, durationMs, status}, 'task created')` is queryable — 'p99 latency for task creation, grouped by endpoint' is one query in any log platform. `console.log('created task ' + id)` is a string you can only grep, and it goes to stdout unbuffered and synchronously, which is a real throughput cost under load. Levels have to mean something: `error` means a human must look (unhandled exceptions), `warn` is expected-but-notable (a 409, a rate limit trip), `info` is one line per request plus significant state changes, `debug` is off in production. Every line carries the request ID so I can reconstruct a single request's path across layers. And I never log credentials, tokens, full auth headers, or PII — redaction is configured in the logger itself rather than left to the discipline of whoever writes the next log call.",
    },
    {
      q: "How do you deploy and run this in production?",
      a: "The app is stateless, so it packages into a container and runs as N identical replicas behind a load balancer, which lets me scale horizontally and restart any instance safely. `/healthz` for liveness and a separate readiness check that verifies the DB pool actually answers — otherwise the LB routes traffic to an instance that can't serve it. Graceful shutdown is essential: on SIGTERM stop accepting new connections, let in-flight requests finish, close the pool, exit — with a hard timeout so a stuck request can't block the deploy forever. Without it, every deploy drops live requests. Migrations run as a separate step before the new version rolls out, and they must be backward compatible, because during a rolling deploy old and new code run against the same schema simultaneously — so 'add a nullable column, backfill, then make it NOT NULL in a later release', never 'rename a column'. Config from environment variables, logs to stdout for the platform to collect, metrics and traces exported to whatever's running, and alerts on error rate and p99 latency rather than on individual errors.",
    },
    {
      q: "A client says your endpoint is slow. Walk me through diagnosing it.",
      a: "Measure before guessing. First, is it slow server-side or in transit? My request logs have a duration per request, so I compare server-side p99 against what the client observes — if they diverge it's network, payload size, or TLS, not my code. If it's server-side, the endpoint is almost always waiting on a query, so I look at `pg_stat_statements` for the top queries by total time and run `EXPLAIN ANALYZE` on the suspect. The classic findings, in frequency order: a sequential scan because there's no index on the filter column; an N+1 where the handler loops over 50 rows issuing a query each; `OFFSET 100000` pagination that makes Postgres scan and discard 100k rows; or `SELECT *` pulling a large text column nobody uses. Fixes in the same order: add the composite index matching the filter and sort, batch the N+1 into one query with `WHERE id = ANY($1)`, switch to keyset/cursor pagination, and select only needed columns. If the query is genuinely fast but the request is slow, I check pool saturation — requests queueing for a connection look identical to a slow database from the outside, and the fix is the opposite one.",
    },
  ],
};
