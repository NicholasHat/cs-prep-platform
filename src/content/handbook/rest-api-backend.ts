import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "rest-api-backend",
  title: "Building a REST API Backend",
  track: "backend",
  order: 1,
  summary:
    "The complete answer to \"how do you set up an API backend?\" — stack choice, project layout, the request lifecycle end to end, a full CRUD service in Python and FastAPI, Pydantic validation, dependency injection, Postgres with raw SQL and SQLAlchemy, error envelopes, config, logging, and tests.",
  estMinutes: 80,
  tags: [
    "rest",
    "http",
    "python",
    "fastapi",
    "pydantic",
    "postgres",
    "sqlalchemy",
    "crud",
    "testing",
  ],
  sections: [
    {
      id: "what-a-backend-is",
      heading: "What a backend actually is",
      markdown: `Interns often answer this question by naming tools ("FastAPI and Mongo"). That is not an answer. The interviewer wants to know whether you understand **what problem the server solves that the browser cannot**.

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
| **Python + FastAPI** | Pydantic validation and auto-generated OpenAPI docs are excellent, dependency injection is built in, async-native, and it sits right next to any ML code you already have | The ecosystem is split between sync and async libraries, so one blocking import can stall the event loop. The GIL means CPU-bound work needs processes, not threads. |
| **Python + Django REST Framework** | Batteries included — ORM, migrations, admin, auth, permissions. Enormous ecosystem, very fast to a working product | Opinionated and heavy; async support is still partial. You inherit the whole framework whether you wanted it or not. |
| **Python + Flask** | Tiny, unopinionated, easy to read end to end | You assemble validation, serialization, docs, and error handling yourself — which is exactly what FastAPI already did for you. |
| **Node.js + TypeScript** | One language across browser and server, huge package ecosystem, excellent JSON throughput | Unopinionated to a fault; CPU-bound work blocks the single-threaded event loop just as badly. |
| **Go + net/http / chi** | Fast, tiny memory footprint, static binaries, superb concurrency | More lines of code per feature; error handling is manual and verbose. |
| **Java/Kotlin + Spring Boot** | What large enterprises actually run; mature everything | Heavy startup, deep configuration surface, slow local iteration. |

What to say out loud: *"For an internship-scale CRUD service I'd take Python with FastAPI. One Pydantic model gives me the runtime validator, the static type, and the OpenAPI schema, so the docs cannot drift from the code, and \`Depends()\` lets me swap a real repository for a fake one in tests without patching imports. If the service were CPU-bound — image processing, say — I'd move that work to a worker process or a Go service and keep FastAPI as the edge."* That is a hire-signal answer: a choice, a reason, and the condition under which you'd choose differently.

### Project layout

The layout below is boring on purpose. Every file has exactly one reason to change.

\`\`\`text
app/
  main.py                    # create_app(): routers, middleware, exception handlers
  config.py                  # pydantic-settings BaseSettings, read once at boot
  logging_config.py          # JSON formatter + redaction filter
  errors.py                  # AppError hierarchy + the exception handlers
  middleware.py              # request id + access log
  deps.py                    # Depends() wiring: pool -> connection -> repo -> service
  pagination.py              # cursor encode/decode (no SQL, no HTTP)
  domain/
    task.py                  # Task, Project, TaskStatus, TaskPriority — plain Python
  schemas/
    task.py                  # Pydantic models: TaskCreate, TaskUpdate, TaskOut
  routers/
    tasks.py                 # HTTP only: path/query/body params -> service -> status
    health.py
  services/
    tasks.py                 # business rules. Knows nothing about HTTP.
  repositories/
    tasks_asyncpg.py         # SQL only. Knows nothing about business rules.
    tasks_sqlalchemy.py      # the same repository, written with the ORM
  db/
    pool.py                  # asyncpg pool created in the lifespan handler
    orm.py                   # SQLAlchemy declarative models + async engine
    migrations/
      001_create_tasks.sql
tests/
  conftest.py                # fixtures: pool, clean database, AsyncClient
  unit/test_tasks_service.py
  integration/test_tasks_api.py
pyproject.toml
\`\`\`

The rule that makes this worth doing: **dependencies point one way — router → service → repository → database.** A service never imports \`fastapi\`. A repository never raises an HTTP status. When that holds, you can unit-test the service against an in-memory fake in milliseconds, and you can put a second front end on the same service — a CLI, a queue consumer, a scheduled job — without touching a line of it.

The counter-argument you should be able to make: for a 200-line service, this is over-structured. Three layers to add one field is real friction. The honest position is that layering pays for itself the moment a second caller appears (a cron job, a CLI, a background worker) or a second developer joins.`,
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
6. **The ASGI server receives the request.** Uvicorn parses the request line and headers, builds a \`scope\` dict, and calls your application with \`receive\`/\`send\` callables. Your framework is a function of that scope; it never touches sockets.
7. **Middleware chain**, in this order and for this reason:
   - request ID (so every later log line correlates)
   - structured access logging
   - CORS (must answer the \`OPTIONS\` preflight before auth, or the browser never sends the real request)
   - authentication (who are you?)
   - rate limiting (keyed by user once you know who they are)

   Middleware is registered outermost-last: the one you add last wraps everything added before it, so the request-id layer goes on last and sees every request, including the ones CORS rejects.
8. **Route matching.** \`POST /v1/tasks\` → the tasks router's create handler. No match → \`404\`. Path matches but method doesn't → \`405\` with an \`Allow\` header, generated for you from the routes you declared.
9. **Validation and body parsing.** The framework reads the body, parses the JSON, and validates it against the declared model *before your function is called*. A failure never reaches your code — it becomes a \`422\` with a per-field list. Nothing downstream should ever defensively re-check that \`title\` is a string.
10. **Authorization.** Not the same as step 7. Authentication proved you are user 91; authorization decides whether user 91 may create a task in project 7.
11. **Service layer.** Business rules: is the project archived? has this user hit their task quota? Raises domain errors, not HTTP errors.
12. **Repository → connection pool → Postgres.** The pool hands out one of N open connections; the query runs inside a transaction if more than one statement must be atomic. *Fails as:* pool exhaustion (every connection checked out, requests queue and time out) — the single most common backend outage. Its evil twin in an async service is a blocking call on the event loop, which stalls every concurrent request at once.
13. **Serialize the response.** Map the database row to the public shape. **Never** return the raw row — declare a response model and let the framework project onto it, or \`password_hash\` and \`internal_notes\` end up in your public API.
14. **Response written**, connection kept alive for reuse:

\`\`\`http
HTTP/1.1 201 Created
content-type: application/json
location: /v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
x-request-id: 018f2a5c-0f3b-7a21-9c44-6b2e2f3a1d55

{"data":{"id":"9f1c2d3e-...","title":"Write the API chapter","status":"todo"}}
\`\`\`

15. **Log the outcome** — one structured line with method, path, status, duration, request ID, user ID. Metrics increment. If it raised, the traceback goes to Sentry with the request ID attached so you can join the two.

The most useful thing in that list is the **request ID**. Generate it at the edge if the client didn't send one, put it in every log line, and return it in the response header. When a user says "it failed at 2:03", you ask for the request ID and find the exact trace in one query instead of grepping.`,
    },
    {
      id: "resource-design",
      heading: "Routing and resource design",
      markdown: `Before writing a line of code, write the table. This is the deliverable interviewers actually want when they say "show me some REST APIs" — it demonstrates you think in contracts.

The domain: a task tracker. Tasks belong to a project. Users comment on tasks. The wire format is \`snake_case\`, matching the Python attribute names, so there is no mapping layer to get wrong.

| Intent | Method | Path | Request body | Success | Common errors |
| --- | --- | --- | --- | --- | --- |
| List tasks (filter, paginate) | \`GET\` | \`/v1/tasks?status=todo&limit=20&cursor=…\` | — | \`200\` + \`data\` array + \`next_cursor\` | \`422\` bad query param |
| Create a task | \`POST\` | \`/v1/tasks\` | \`{title, project_id, priority?, due_at?}\` | \`201\` + body + \`location\` header | \`422\` validation, \`404\` project not found, \`409\` project archived |
| Read one task | \`GET\` | \`/v1/tasks/{task_id}\` | — | \`200\` | \`404\`, \`422\` malformed UUID |
| Partial update | \`PATCH\` | \`/v1/tasks/{task_id}\` | \`{title?, status?, priority?, due_at?}\` | \`200\` + updated body | \`404\`, \`422\`, \`409\` illegal transition |
| Full replace | \`PUT\` | \`/v1/tasks/{task_id}\` | the complete task | \`200\` | \`404\`, \`422\` |
| Delete | \`DELETE\` | \`/v1/tasks/{task_id}\` | — | \`204\` no body | \`404\`, \`403\` |
| Comments on a task | \`GET\` | \`/v1/tasks/{task_id}/comments\` | — | \`200\` | \`404\` task not found |
| Add a comment | \`POST\` | \`/v1/tasks/{task_id}/comments\` | \`{body}\` | \`201\` | \`404\`, \`422\` |
| Assign (a real state transition) | \`PUT\` | \`/v1/tasks/{task_id}/assignee\` | \`{user_id}\` | \`200\` | \`404\`, \`409\` already assigned |
| Bulk archive (non-CRUD action) | \`POST\` | \`/v1/tasks/archive\` | \`{ids: [...]}\` | \`202\` accepted | \`422\` |

Rules encoded in that table, and the reasons:

- **Nouns, plural, lowercase, hyphenated.** \`/v1/task-lists\`, never \`/v1/getTaskList\`. The verb is the HTTP method; putting it in the path duplicates it.
- **Collection vs item.** \`/tasks\` is a collection, \`/tasks/{task_id}\` is an item. \`POST\` to the collection creates; \`PATCH\`/\`DELETE\` on the item modifies. \`POST /tasks/{task_id}\` is meaningless — do not define it.
- **Nest only one level.** \`/tasks/{task_id}/comments\` is fine. \`/projects/{p}/tasks/{t}/comments/{c}/reactions/{r}\` is a URL nobody can build correctly. Once a resource has its own ID, give it a top-level route: \`/comments/{comment_id}\`.
- **\`201\` gets a \`location\` header.** It tells the client where the thing now lives without parsing the body.
- **\`204\` for delete** means "done, nothing to say". Returning \`200\` with \`{"deleted": true}\` is not wrong, but pick one and be consistent across every endpoint.
- **Actions that are not CRUD exist.** "Archive 40 tasks", "send password reset", "retry payment". Do not contort them into \`PATCH\`. Model them as a sub-resource (\`PUT /tasks/{task_id}/assignee\`) when there is a noun, or accept a verb path (\`POST /tasks/archive\`) when there isn't. Pretending every operation is CRUD produces worse APIs than admitting the exception.
- **Version from day one.** \`/v1/\` costs nothing today and saves you the day a client depends on a field you need to remove.
- **Path parameter names are part of your code, not just the URL.** The route is declared as \`"/{task_id}"\` and the handler takes an argument called \`task_id\` annotated \`UUID\`; the names must match, and that annotation is what produces the \`422\` for \`/v1/tasks/not-a-uuid\` instead of a database error.`,
    },
    {
      id: "crud-express",
      heading: "Full worked CRUD: FastAPI and Pydantic",
      markdown: `Complete, runnable code for the \`tasks\` resource. Read it top to bottom — the layering from the previous section is visible here.

**\`app/main.py\`** — build the app in a function so tests can construct a fresh one, and export a module-level \`app\` for the server to import.

\`\`\`python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.pool import lifespan
from app.errors import register_exception_handlers
from app.logging_config import configure_logging
from app.middleware import RequestContextMiddleware
from app.routers import health, tasks


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Task API",
        version="1.0.0",
        summary="A small CRUD service used as a worked example.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Middleware is applied outermost-last: RequestContextMiddleware is added
    # after CORS, so it wraps it and every request gets an id — including the
    # preflight requests CORS answers on its own.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
    )
    app.add_middleware(RequestContextMiddleware)

    register_exception_handlers(app)
    app.include_router(health.router)
    app.include_router(tasks.router)
    return app


app = create_app()
\`\`\`

There is no \`server.py\` to write. The process entry point is the ASGI server:

\`\`\`bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --timeout-graceful-shutdown 10
\`\`\`

On \`SIGTERM\`, uvicorn stops accepting connections, lets in-flight requests finish, then runs the shutdown half of the \`lifespan\` handler — which is where the connection pool is closed. Without that, every deploy drops live requests and leaks database connections. \`--timeout-graceful-shutdown\` is the hard cap so one stuck request cannot block the deploy forever.

**\`app/routers/health.py\`** — liveness and readiness are different questions and need different endpoints.

\`\`\`python
from fastapi import APIRouter

from app.deps import ConnectionDep

router = APIRouter(tags=["ops"])


@router.get("/healthz", summary="Liveness: is the process running?")
async def healthz() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/readyz", summary="Readiness: can this instance serve traffic?")
async def readyz(connection: ConnectionDep) -> dict[str, str]:
    await connection.fetchval("select 1")
    return {"status": "ready"}
\`\`\`

If \`/readyz\` did not touch the database, the load balancer would happily route traffic to an instance whose pool cannot reach Postgres.

**\`app/routers/tasks.py\`** — HTTP only. Declare the inputs, delegate, map the result to a status code.

\`\`\`python
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, Response, status

from app.deps import TaskServiceDep
from app.schemas.task import (
    TaskCreate,
    TaskListQuery,
    TaskListResponse,
    TaskOut,
    TaskResponse,
    TaskUpdate,
)

router = APIRouter(prefix="/v1/tasks", tags=["tasks"])


@router.get("", summary="List tasks")
async def list_tasks(
    service: TaskServiceDep,
    query: Annotated[TaskListQuery, Query()],
) -> TaskListResponse:
    page = await service.list_tasks(query)
    return TaskListResponse(
        data=[TaskOut.model_validate(task) for task in page.items],
        next_cursor=page.next_cursor,
    )


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a task")
async def create_task(
    payload: TaskCreate,
    service: TaskServiceDep,
    response: Response,
) -> TaskResponse:
    task = await service.create_task(payload)
    response.headers["Location"] = f"/v1/tasks/{task.id}"
    return TaskResponse(data=TaskOut.model_validate(task))


@router.get("/{task_id}", summary="Read one task")
async def get_task(task_id: UUID, service: TaskServiceDep) -> TaskResponse:
    task = await service.get_task(task_id)
    return TaskResponse(data=TaskOut.model_validate(task))


@router.patch("/{task_id}", summary="Partially update a task")
async def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    service: TaskServiceDep,
) -> TaskResponse:
    task = await service.update_task(task_id, payload)
    return TaskResponse(data=TaskOut.model_validate(task))


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    summary="Delete a task",
)
async def delete_task(task_id: UUID, service: TaskServiceDep) -> None:
    await service.delete_task(task_id)
\`\`\`

Five things in that file are worth being able to explain:

- **The return annotation is the response model.** \`-> TaskResponse\` tells the framework to validate and serialize the return value through \`TaskResponse\`, which is what stops an internal column leaking: anything not declared on \`TaskOut\` is dropped on the way out, whatever the repository handed back.
- **\`status_code\` lives on the decorator**, not in the body of the handler, so the documented status and the real status cannot drift.
- **\`204\` needs \`response_class=Response\`.** A \`204\` must have no body at all; without that argument the framework would try to serialize \`None\` into a JSON body and produce an invalid response.
- **The path is \`""\`, not \`"/"\`.** With \`prefix="/v1/tasks"\`, \`""\` registers \`/v1/tasks\` exactly; \`"/"\` would register \`/v1/tasks/\` and make every client eat a redirect.
- **There is no \`if task is None: return 404\`.** The service raises \`NotFoundError\`; a registered exception handler turns that into a \`404\` with the standard envelope. Each handler is three lines because every cross-cutting concern has a home.

**You get the docs for free.** Because every input and output is a declared type, the app serves an OpenAPI 3.1 document at \`/openapi.json\` and browsable, executable documentation at \`/docs\` (Swagger UI) and \`/redoc\`. That is worth saying out loud in an interview: the schema is generated from the code that actually runs, so it cannot go stale, and a front-end team can generate a typed client from it before your endpoint is finished.`,
    },
    {
      id: "crud-next",
      heading: "Dependency injection and the async model",
      markdown: `The handlers above never mention a connection pool, a repository, or a session. That is not magic — it is the dependency injection system, and it is the part of this framework most worth understanding, because it is where testability, resource cleanup, and auth all come from.

### Wiring the layers with \`Depends()\`

**\`app/deps.py\`** — the whole graph in one file: pool → connection → repositories → service.

\`\`\`python
from collections.abc import AsyncIterator
from typing import Annotated

import asyncpg
from fastapi import Depends, Request

from app.repositories.tasks_asyncpg import ProjectRepository, TaskRepository
from app.services.tasks import TaskService


def get_pool(request: Request) -> asyncpg.Pool:
    """The pool is created once in the lifespan handler and lives on app.state."""
    return request.app.state.pool


PoolDep = Annotated[asyncpg.Pool, Depends(get_pool)]


async def get_connection(pool: PoolDep) -> AsyncIterator[asyncpg.Connection]:
    """Check a connection out for the duration of one request, always return it."""
    async with pool.acquire() as connection:
        yield connection


ConnectionDep = Annotated[asyncpg.Connection, Depends(get_connection)]


def get_task_repository(connection: ConnectionDep) -> TaskRepository:
    return TaskRepository(connection)


def get_project_repository(connection: ConnectionDep) -> ProjectRepository:
    return ProjectRepository(connection)


def get_task_service(
    tasks: Annotated[TaskRepository, Depends(get_task_repository)],
    projects: Annotated[ProjectRepository, Depends(get_project_repository)],
) -> TaskService:
    return TaskService(tasks=tasks, projects=projects)


TaskServiceDep = Annotated[TaskService, Depends(get_task_service)]
\`\`\`

Four properties of that graph are the interview answer:

1. **Dependencies are cached per request.** \`get_connection\` appears twice in the graph — once under each repository — but it runs once. Both repositories get the *same* connection, which is what makes it possible to wrap them in one transaction. Pass \`Depends(fn, use_cache=False)\` when you deliberately want two separate instances.
2. **A dependency that \`yield\`s is a resource with cleanup.** The code before \`yield\` runs on the way in, the code after runs on the way out — after your handler returns — even if the handler raised. That is how a connection is guaranteed to go back to the pool without a single \`try/finally\` in a route.
3. **It is typed, and the type is the wiring.** \`TaskServiceDep\` is just \`Annotated[TaskService, Depends(get_task_service)]\`. Handlers ask for \`service: TaskServiceDep\` and get a fully constructed service; nothing imports a global.
4. **It is overridable.** \`app.dependency_overrides[get_pool] = lambda: test_pool\` replaces one node of the graph in a test with no patching of module internals. That single feature is why the integration tests later in this chapter are short.

Cross-cutting concerns are dependencies too. Authentication is the canonical example — declared once on the router, applied to every route inside it:

\`\`\`python
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.deps import ConnectionDep
from app.domain.user import User
from app.errors import UnauthorizedError

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    connection: ConnectionDep,
) -> User:
    if credentials is None:
        raise UnauthorizedError("Authentication required.")
    row = await connection.fetchrow(
        "select id, email, role from users where api_token = $1 and revoked_at is null",
        credentials.credentials,
    )
    if row is None:
        raise UnauthorizedError("Invalid or expired token.")
    return User(id=row["id"], email=row["email"], role=row["role"])


CurrentUser = Annotated[User, Depends(get_current_user)]

# In the router: every route below now requires a valid bearer token, and the
# security scheme shows up in the generated OpenAPI document automatically.
# router = APIRouter(prefix="/v1/tasks", dependencies=[Depends(get_current_user)])
\`\`\`

A handler that also needs the identity — for authorization, not just authentication — takes \`user: CurrentUser\` as a parameter and passes it to the service. Authorization ("may *this* user modify *that* task?") belongs in the service, next to the rest of the business rules, not in the route.

### \`async def\` vs \`def\`, and the bug that follows from getting it wrong

This framework runs on an event loop, and it treats your two kinds of handler completely differently:

| You write | Where it runs | Consequence |
| --- | --- | --- |
| \`async def\` | Directly on the event loop, in the same thread as every other request | Thousands of concurrent requests are fine — *as long as every wait inside is awaited*. One blocking call freezes all of them. |
| \`def\` (plain) | Handed to a worker threadpool automatically | Blocking calls are safe, but concurrency is capped at the threadpool size (40 by default), and each thread costs memory. |

The rule: **if the function ever blocks, it must not be \`async def\`.** The failure mode is not a crash, which is what makes it a genuine production bug — it is latency that gets worse under load and cannot be reproduced with one request on a laptop.

\`\`\`python
import time

import anyio
import httpx
import requests
from fastapi import APIRouter

router = APIRouter(tags=["async"])


# WRONG. requests.get() blocks the thread, and this thread is the event loop.
# While those 2 seconds elapse, no other request in this process makes any
# progress — not even the health check. Under load the queue grows without limit.
@router.get("/bad")
async def bad() -> dict[str, str]:
    response = requests.get("https://api.example.com/slow", timeout=2)
    return {"status": str(response.status_code)}


# RIGHT: an async client, awaited. The event loop runs other requests while
# this one waits on the network.
@router.get("/good")
async def good() -> dict[str, str]:
    async with httpx.AsyncClient(timeout=2.0) as client:
        response = await client.get("https://api.example.com/slow")
    return {"status": str(response.status_code)}


# ALSO RIGHT: no async keyword at all. The framework runs this in a worker
# thread, so blocking is contained. Use this for libraries with no async port.
@router.get("/legacy")
def legacy() -> dict[str, str]:
    response = requests.get("https://api.example.com/slow", timeout=2)
    return {"status": str(response.status_code)}


# RIGHT for a one-off blocking call inside an otherwise async handler:
# push it to a thread explicitly.
@router.get("/hashed")
async def hashed() -> dict[str, str]:
    digest = await anyio.to_thread.run_sync(expensive_hash, "some-input")
    return {"digest": digest}


def expensive_hash(value: str) -> str:
    time.sleep(0.5)  # stands in for bcrypt, image resizing, PDF rendering
    return value[::-1]
\`\`\`

Things that block and are easy to miss inside an \`async def\`: \`time.sleep\`, \`requests\`, a synchronous database driver, \`open().read()\` on a large file, \`subprocess.run\`, \`bcrypt\`, JSON-parsing a 50 MB payload, and any tight loop over a million rows. The first three are the ones people actually ship.

Two follow-ons an interviewer may push on. First, **the same rule applies to dependencies**: a \`def\` dependency is threadpooled, an \`async def\` dependency runs on the loop, so a blocking call in a dependency is exactly as damaging as one in a handler. Second, **async does not make CPU-bound work faster** — the GIL means a hot Python loop stalls the loop whether you await it or not. CPU-bound work goes to a process pool or a separate worker service; async only buys you concurrency on *waiting*.`,
    },
    {
      id: "curl-walkthrough",
      heading: "Hitting every endpoint with curl",
      markdown: `If you claim to have built an API, you should be able to demonstrate it from a terminal without a client. \`-i\` prints the status line and headers, which is where half the information lives. (You could also click through \`/docs\`, but a terminal transcript is what an interviewer can read over your shoulder.)

**Create — \`201\`**

\`\`\`bash
curl -i -X POST http://localhost:8000/v1/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"Write the API chapter","project_id":"6b1a7f6e-1f43-4d7e-9e10-3c1b2a0d9e77","priority":"high"}'
\`\`\`

\`\`\`http
HTTP/1.1 201 Created
content-type: application/json
location: /v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
x-request-id: 018f2a5c-0f3b-7a21-9c44-6b2e2f3a1d55

{
  "data": {
    "id": "9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f",
    "project_id": "6b1a7f6e-1f43-4d7e-9e10-3c1b2a0d9e77",
    "title": "Write the API chapter",
    "status": "todo",
    "priority": "high",
    "due_at": null,
    "version": 1,
    "created_at": "2026-07-27T10:14:02.113000Z",
    "updated_at": "2026-07-27T10:14:02.113000Z"
  }
}
\`\`\`

**Create with a bad body — \`422\` with per-field errors**

\`\`\`bash
curl -i -X POST http://localhost:8000/v1/tasks \\
  -H 'Content-Type: application/json' \\
  -d '{"title":"","priority":"urgent"}'
\`\`\`

\`\`\`http
HTTP/1.1 422 Unprocessable Content
content-type: application/json
x-request-id: 018f2a5c-4b77-7c02-a1de-9d0e6a4f2b31

{
  "error": {
    "code": "validation_failed",
    "message": "Request failed validation.",
    "fields": {
      "title": ["String should have at least 1 character"],
      "project_id": ["Field required"],
      "priority": ["Input should be 'low', 'medium' or 'high'"]
    },
    "request_id": "018f2a5c-4b77-7c02-a1de-9d0e6a4f2b31"
  }
}
\`\`\`

Three separate problems reported in one response, so a client form can highlight three inputs at once. \`{"error":"bad request"}\` forces the client to re-implement your validation rules to know what to show. Those messages are generated by the validator, not written by hand — the next section shows the raw shape they arrive in and the handler that reshapes them into this envelope.

**List with filter and pagination — \`200\`**

\`\`\`bash
curl -s 'http://localhost:8000/v1/tasks?status=todo&limit=2' | jq
\`\`\`

\`\`\`json
{
  "data": [
    { "id": "9f1c2d3e-…", "project_id": "6b1a7f6e-…", "title": "Write the API chapter", "status": "todo", "priority": "high",   "due_at": null, "version": 1, "created_at": "2026-07-27T10:14:02.113000Z", "updated_at": "2026-07-27T10:14:02.113000Z" },
    { "id": "1a2b3c4d-…", "project_id": "6b1a7f6e-…", "title": "Review PR 418",         "status": "todo", "priority": "medium", "due_at": null, "version": 1, "created_at": "2026-07-27T09:58:41.002000Z", "updated_at": "2026-07-27T09:58:41.002000Z" }
  ],
  "next_cursor": "MjAyNi0wNy0yN1QwOTo1ODo0MS4wMDIrMDA6MDB8MWEyYjNjNGQ"
}
\`\`\`

An unknown query parameter is rejected rather than ignored, because the query model sets \`extra="forbid"\`:

\`\`\`bash
curl -s 'http://localhost:8000/v1/tasks?limit=500' | jq -c .error.fields
# {"limit":["Input should be less than or equal to 100"]}
\`\`\`

**Read one — \`200\`, a miss — \`404\`, a malformed id — \`422\`**

\`\`\`bash
curl -s http://localhost:8000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f | jq .data.status
# "todo"

curl -i -s http://localhost:8000/v1/tasks/00000000-0000-4000-8000-000000000000
\`\`\`

\`\`\`http
HTTP/1.1 404 Not Found
content-type: application/json

{"error":{"code":"not_found","message":"Task 00000000-0000-4000-8000-000000000000 was not found.","fields":null,"request_id":"018f2a5c-…"}}
\`\`\`

\`\`\`bash
curl -s http://localhost:8000/v1/tasks/not-a-uuid | jq -c .error.fields
# {"task_id":["Input should be a valid UUID, invalid length: expected length 32 for simple format, found 10"]}
\`\`\`

That last one is free: the handler annotates \`task_id: UUID\`, so a junk path segment never reaches the service and never reaches Postgres as an \`invalid input syntax for type uuid\` error surfacing as a \`500\`.

**Partial update — \`200\`**

\`\`\`bash
curl -i -X PATCH http://localhost:8000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f \\
  -H 'Content-Type: application/json' \\
  -d '{"status":"in_progress"}'
\`\`\`

\`\`\`http
HTTP/1.1 200 OK
content-type: application/json

{"data":{"id":"9f1c2d3e-…","project_id":"6b1a7f6e-…","title":"Write the API chapter","status":"in_progress","priority":"high","due_at":null,"version":2,"created_at":"2026-07-27T10:14:02.113000Z","updated_at":"2026-07-27T10:31:47.556000Z"}}
\`\`\`

Only \`status\` was sent and only \`status\` changed — that is what makes it a \`PATCH\`. A \`PUT\` with the same body would be a *replacement* and should blank \`title\`. Note \`version\` incremented: that column is what an optimistic-concurrency check would compare against.

An empty patch is a client bug, so it is rejected rather than silently doing nothing:

\`\`\`bash
curl -s -X PATCH http://localhost:8000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f \\
  -H 'Content-Type: application/json' -d '{}' | jq -c .error.fields
# {"body":["Value error, Provide at least one field to update."]}
\`\`\`

**Delete — \`204\`, then the follow-up \`404\`**

\`\`\`bash
curl -i -X DELETE http://localhost:8000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
# HTTP/1.1 204 No Content   (no body at all)

curl -s -o /dev/null -w '%{http_code}\\n' \\
  http://localhost:8000/v1/tasks/9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f
# 404
\`\`\`

A nice detail to mention: a second \`DELETE\` of the same ID returning \`404\` is defensible, but returning \`204\` again is *more* useful, because it makes \`DELETE\` fully idempotent for retrying clients. Either is acceptable if documented — the interviewer is testing whether you know there is a choice.`,
    },
    {
      id: "validation",
      heading: "Request validation with Pydantic",
      markdown: `Validation is the boundary between untrusted input and typed internals. Do it once, at the edge, and everything downstream can assume its inputs are well-formed.

The domain types come first, because both the API models and the repository need them and neither should own them:

\`\`\`python
# app/domain/task.py
from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from uuid import UUID


class TaskStatus(StrEnum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"


class TaskPriority(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


@dataclass(frozen=True, slots=True)
class Task:
    id: UUID
    project_id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_at: datetime | None
    version: int
    created_at: datetime
    updated_at: datetime


@dataclass(frozen=True, slots=True)
class Project:
    id: UUID
    name: str
    archived_at: datetime | None
\`\`\`

Then the wire models. **Request models and response models are separate types on purpose** — they have different fields, different optionality, and different trust levels.

\`\`\`python
# app/schemas/task.py
from datetime import datetime
from typing import Annotated, Literal, Self
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.domain.task import TaskPriority, TaskStatus

Title = Annotated[str, Field(min_length=1, max_length=200)]


class TaskCreate(BaseModel):
    """What a client may send to POST /v1/tasks."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    title: Title
    project_id: UUID
    priority: TaskPriority = TaskPriority.MEDIUM
    due_at: datetime | None = None


class TaskUpdate(BaseModel):
    """Every field optional — but an empty patch is a client bug, not a no-op."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)

    title: Title | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_at: datetime | None = None

    @model_validator(mode="after")
    def reject_empty_patch(self) -> Self:
        if not self.model_fields_set:
            raise ValueError("Provide at least one field to update.")
        return self


class TaskOut(BaseModel):
    """What leaves the server. from_attributes lets it read the Task dataclass
    (or a SQLAlchemy row) directly: TaskOut.model_validate(task)."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_at: datetime | None
    version: int
    created_at: datetime
    updated_at: datetime


class TaskResponse(BaseModel):
    data: TaskOut


class TaskListResponse(BaseModel):
    data: list[TaskOut]
    next_cursor: str | None = None


class TaskListQuery(BaseModel):
    """Query parameters are a model too — same validation, same error shape.
    extra='forbid' turns a typo'd parameter into a 422 instead of a silent
    ignore, which is the difference between a five-second bug and a long one."""

    model_config = ConfigDict(extra="forbid")

    status: TaskStatus | None = None
    project_id: UUID | None = None
    limit: int = Field(default=20, ge=1, le=100)
    cursor: str | None = Field(default=None, max_length=200)
    sort: Literal["created_at", "-created_at", "due_at", "-due_at"] = "-created_at"
\`\`\`

### What the framework does with those models, for free

Declaring \`payload: TaskCreate\` on a handler makes the framework read the body, parse the JSON, validate it, and — only if all of that succeeds — call your function. A failure never reaches your code. Out of the box it becomes a \`422\` whose body is the raw validator output:

\`\`\`json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "title"],
      "msg": "String should have at least 1 character",
      "input": "",
      "ctx": { "min_length": 1 },
      "url": "https://errors.pydantic.dev/2.13/v/string_too_short"
    },
    {
      "type": "missing",
      "loc": ["body", "project_id"],
      "msg": "Field required",
      "input": { "title": "", "priority": "urgent" },
      "url": "https://errors.pydantic.dev/2.13/v/missing"
    },
    {
      "type": "enum",
      "loc": ["body", "priority"],
      "msg": "Input should be 'low', 'medium' or 'high'",
      "input": "urgent",
      "ctx": { "expected": "'low', 'medium' or 'high'" },
      "url": "https://errors.pydantic.dev/2.13/v/enum"
    }
  ]
}
\`\`\`

That is already better than most hand-written APIs: three problems reported at once, each with a machine-readable \`type\` and an exact location. But it is a *different shape* from the \`{"error": {...}}\` envelope every other failure in this API uses, it echoes the client's input back (which can contain a password), and it links to a library's documentation from your public contract. So it gets normalized:

\`\`\`python
# app/errors.py (excerpt — the rest of this file is in the next section)
from collections import defaultdict

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


async def handle_request_validation_error(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    fields: defaultdict[str, list[str]] = defaultdict(list)
    for error in exc.errors():
        # loc looks like ("body", "title") or ("query", "limit") or
        # ("path", "task_id"); drop the location kind, keep the field path.
        location = ".".join(str(part) for part in error["loc"][1:]) or "body"
        fields[location].append(error["msg"])

    return error_response(
        request,
        status_code=422,
        code="validation_failed",
        message="Request failed validation.",
        fields=dict(fields),
    )
\`\`\`

One envelope for validation failures, business-rule failures, and unexpected failures alike. The cost is a dozen lines; the benefit is that a client writes one error-handling branch instead of three.

### Points that separate a good answer from a shallow one

- **Validation is a whitelist, not just a type check.** \`extra="ignore"\` means a client cannot smuggle \`{"role": "admin"}\` or \`{"id": "…"}\` into a create payload and have it reach an \`INSERT\`. This is mass-assignment protection and it is free. Use \`extra="forbid"\` when you would rather reject an unrecognised key loudly than drop it silently — the right default for query parameters, where a typo is otherwise invisible.
- **Type hints vanish at runtime.** Annotating a plain function \`def create(payload: TaskCreate)\` and calling it with a dict does exactly nothing — Python does not check annotations. It is the validator built from the model that enforces them. Interviewers ask this specifically to see whether you know the difference between an annotation and a check.
- **Coercion is deliberate, not accidental.** Query strings are always strings on the wire; \`limit: int\` accepts \`"20"\` and converts it, but rejects \`"abc"\` with a clear message rather than silently producing a nonsense value. Strict mode is available per field or per model when you want \`"20"\` to be an error.
- **\`model_fields_set\` is how a \`PATCH\` distinguishes "omitted" from "explicitly null".** \`{"due_at": null}\` means clear the due date; an absent \`due_at\` means leave it alone. Both produce \`due_at is None\` on the model, so only \`model_dump(exclude_unset=True)\` can tell them apart — and that is exactly what the repository's update method uses.
- **Validate params and query too, not just bodies.** \`/v1/tasks/abc\` with a non-UUID is a \`422\` from the path annotation, long before Postgres could complain.
- **\`400\` vs \`422\`.** \`400\` = the request is malformed (unparseable JSON, missing content type). \`422\` = syntactically valid JSON that violates your rules. This framework picks \`422\` for you and is consistent about it; the only wrong answer is being inconsistent within one API.`,
    },
    {
      id: "service-repository",
      heading: "The service and repository layers",
      markdown: `**Repository** = the only place SQL lives. **Service** = the only place business rules live. Neither knows what HTTP is.

The service depends on \`Protocol\` classes rather than on a concrete repository. That is one extra type declaration, and it buys two things: the direction of the dependency is now inward (the service defines what it needs, the repository conforms), and a fake in a test is checked by the type checker rather than by hope.

\`\`\`python
# app/services/tasks.py
from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.task import Project, Task, TaskStatus
from app.errors import ConflictError, NotFoundError
from app.pagination import encode_cursor
from app.schemas.task import TaskCreate, TaskListQuery, TaskUpdate

MAX_OPEN_TASKS_PER_PROJECT = 500


class TaskRepositoryProtocol(Protocol):
    async def find_by_id(self, task_id: UUID) -> Task | None: ...
    async def list(self, query: TaskListQuery, limit: int) -> list[Task]: ...
    async def insert(self, payload: TaskCreate) -> Task: ...
    async def update(self, task_id: UUID, payload: TaskUpdate) -> Task | None: ...
    async def delete(self, task_id: UUID) -> bool: ...
    async def count_open_by_project(self, project_id: UUID) -> int: ...


class ProjectRepositoryProtocol(Protocol):
    async def find_by_id(self, project_id: UUID) -> Project | None: ...


@dataclass(frozen=True, slots=True)
class TaskPage:
    items: list[Task]
    next_cursor: str | None


class TaskService:
    def __init__(
        self,
        tasks: TaskRepositoryProtocol,
        projects: ProjectRepositoryProtocol,
    ) -> None:
        self._tasks = tasks
        self._projects = projects

    async def list_tasks(self, query: TaskListQuery) -> TaskPage:
        # Fetch one extra row to learn whether another page exists without count(*).
        rows = await self._tasks.list(query, limit=query.limit + 1)
        has_more = len(rows) > query.limit
        items = rows[: query.limit] if has_more else rows
        next_cursor = encode_cursor(items[-1]) if has_more and items else None
        return TaskPage(items=items, next_cursor=next_cursor)

    async def get_task(self, task_id: UUID) -> Task:
        task = await self._tasks.find_by_id(task_id)
        if task is None:
            raise NotFoundError(f"Task {task_id} was not found.")
        return task

    async def create_task(self, payload: TaskCreate) -> Task:
        project = await self._projects.find_by_id(payload.project_id)
        if project is None:
            raise NotFoundError(f"Project {payload.project_id} was not found.")
        if project.archived_at is not None:
            raise ConflictError("Cannot add tasks to an archived project.")

        open_count = await self._tasks.count_open_by_project(project.id)
        if open_count >= MAX_OPEN_TASKS_PER_PROJECT:
            raise ConflictError("Project has reached its open-task limit.")

        return await self._tasks.insert(payload)

    async def update_task(self, task_id: UUID, payload: TaskUpdate) -> Task:
        existing = await self.get_task(task_id)
        if existing.status is TaskStatus.DONE and payload.status is TaskStatus.TODO:
            raise ConflictError("A completed task cannot be reopened.")

        updated = await self._tasks.update(task_id, payload)
        if updated is None:
            raise NotFoundError(f"Task {task_id} was not found.")
        return updated

    async def delete_task(self, task_id: UUID) -> None:
        if not await self._tasks.delete(task_id):
            raise NotFoundError(f"Task {task_id} was not found.")
\`\`\`

The cursor helpers live outside both layers, because they are a pure function of a domain object — no SQL, no HTTP:

\`\`\`python
# app/pagination.py
import base64
import binascii
from datetime import datetime
from uuid import UUID

from app.domain.task import Task
from app.errors import ValidationFailedError


def encode_cursor(task: Task) -> str:
    """Keyset pagination: the cursor is the sort key of the last row returned."""
    raw = f"{task.created_at.isoformat()}|{task.id}"
    return base64.urlsafe_b64encode(raw.encode()).decode().rstrip("=")


def decode_cursor(cursor: str) -> tuple[datetime, UUID]:
    padded = cursor + "=" * (-len(cursor) % 4)
    try:
        created_at_raw, task_id_raw = base64.urlsafe_b64decode(padded).decode().split("|")
        return datetime.fromisoformat(created_at_raw), UUID(task_id_raw)
    except (ValueError, UnicodeDecodeError, binascii.Error) as exc:
        raise ValidationFailedError(
            "Request failed validation.",
            fields={"cursor": ["Not a valid pagination cursor."]},
        ) from exc
\`\`\`

Everything interesting about the service file is what it does **not** do. There is no response object, no status code, no request body. \`create_task\` is a function of its arguments and its repositories, so:

- You can call it from a route, a background worker, a CLI backfill, or a test, unchanged.
- You can unit test "cannot add tasks to an archived project" in milliseconds against an in-memory fake — no server, no database, no HTTP client.
- Putting a second front end on it — a scheduled job, a queue consumer — touches zero lines of it.

The mapping from domain error → HTTP status happens in exactly one place, the exception handlers. If a service ever raises \`HTTPException(status_code=409)\`, the layering has leaked and you have lost the ability to reuse it off the HTTP path. \`HTTPException\` is a fine tool *in a router* for something genuinely HTTP-shaped; it does not belong below one.

**A caveat worth volunteering**, because it shows judgement rather than cargo-culting: this layering is not free. \`get_task\` is nearly a pass-through, and if your service layer is nothing but pass-throughs, it is ceremony. Introduce it when rules appear, or when a second caller appears — not on principle.`,
    },
    {
      id: "postgres",
      heading: "Talking to Postgres: raw SQL and an ORM",
      markdown: `### Schema

\`\`\`sql
-- app/db/migrations/001_create_tasks.sql
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

Constraints belong in the database, not only in application code. Your API is not the only thing that will ever write to this table — a migration script, a psql session, or a second service will. \`references projects(id)\` makes an orphaned task *impossible*; a check in Python makes it merely unlikely.

### The pool

\`\`\`python
# app/db/pool.py
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI

from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Startup runs before the first request, shutdown after the last one."""
    settings = get_settings()
    pool = await asyncpg.create_pool(
        dsn=str(settings.database_url),
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,   # per process, not per cluster
        max_inactive_connection_lifetime=30.0,
        command_timeout=5.0,                  # a query may not run forever
        timeout=5.0,                          # fail fast when the pool is drained
    )
    if pool is None:
        raise RuntimeError("Could not create the database pool.")

    app.state.pool = pool
    try:
        yield
    finally:
        await pool.close()
\`\`\`

Opening a TCP connection and authenticating to Postgres takes single-digit milliseconds — unacceptable per request. The pool keeps \`max_size\` connections warm. \`max_size\` is not "bigger is better": Postgres allocates memory per backend and its default \`max_connections\` is 100. Instances × \`max_size\` must stay comfortably under that, or new connections are refused. This is what PgBouncer exists to solve.

When more than one statement must be atomic, ask for a transactional connection instead — the dependency owns the commit and the rollback, so no handler can forget either:

\`\`\`python
# app/deps.py (continued — PoolDep is defined earlier in this file)
from collections.abc import AsyncIterator

import asyncpg


async def get_transactional_connection(pool: PoolDep) -> AsyncIterator[asyncpg.Connection]:
    async with pool.acquire() as connection:
        async with connection.transaction():
            # Commits when the handler returns; rolls back if it raises, because
            # the exception propagates out through this dependency's teardown.
            yield connection
\`\`\`

### Repository with raw SQL (asyncpg)

\`\`\`python
# app/repositories/tasks_asyncpg.py
from enum import Enum
from typing import Any
from uuid import UUID

import asyncpg

from app.domain.task import Project, Task, TaskPriority, TaskStatus
from app.pagination import decode_cursor
from app.schemas.task import TaskCreate, TaskListQuery, TaskUpdate

# A hard-coded allowlist. User input never contributes a column name.
UPDATABLE_COLUMNS = ("title", "status", "priority", "due_at")


def _to_task(row: asyncpg.Record) -> Task:
    """Row -> domain object. The mapping lives HERE, once."""
    return Task(
        id=row["id"],
        project_id=row["project_id"],
        title=row["title"],
        status=TaskStatus(row["status"]),
        priority=TaskPriority(row["priority"]),
        due_at=row["due_at"],
        version=row["version"],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def _db_value(value: Any) -> Any:
    return value.value if isinstance(value, Enum) else value


class TaskRepository:
    def __init__(self, connection: asyncpg.Connection) -> None:
        self._connection = connection

    async def find_by_id(self, task_id: UUID) -> Task | None:
        row = await self._connection.fetchrow(
            "select * from tasks where id = $1", task_id
        )
        return _to_task(row) if row is not None else None

    async def insert(self, payload: TaskCreate) -> Task:
        row = await self._connection.fetchrow(
            """
            insert into tasks (project_id, title, priority, due_at)
            values ($1, $2, $3, $4)
            returning *
            """,
            payload.project_id,
            payload.title,
            payload.priority.value,
            payload.due_at,
        )
        return _to_task(row)

    async def update(self, task_id: UUID, payload: TaskUpdate) -> Task | None:
        # exclude_unset is what distinguishes "field omitted" from "field sent
        # as null": only the keys the client actually sent appear here.
        changes = payload.model_dump(exclude_unset=True)

        assignments: list[str] = []
        values: list[Any] = [task_id]
        for column in UPDATABLE_COLUMNS:
            if column in changes:
                values.append(_db_value(changes[column]))
                assignments.append(f"{column} = \${len(values)}")

        if not assignments:
            return await self.find_by_id(task_id)

        row = await self._connection.fetchrow(
            f"""
            update tasks
               set {', '.join(assignments)},
                   version = version + 1,
                   updated_at = now()
             where id = $1
            returning *
            """,
            *values,
        )
        return _to_task(row) if row is not None else None

    async def delete(self, task_id: UUID) -> bool:
        result = await self._connection.execute(
            "delete from tasks where id = $1", task_id
        )
        return result == "DELETE 1"

    async def count_open_by_project(self, project_id: UUID) -> int:
        return await self._connection.fetchval(
            "select count(*) from tasks where project_id = $1 and status <> 'done'",
            project_id,
        )

    async def list(self, query: TaskListQuery, limit: int) -> list[Task]:
        conditions: list[str] = []
        values: list[Any] = []

        if query.project_id is not None:
            values.append(query.project_id)
            conditions.append(f"project_id = \${len(values)}")
        if query.status is not None:
            values.append(query.status.value)
            conditions.append(f"status = \${len(values)}")
        if query.cursor is not None:
            created_at, last_id = decode_cursor(query.cursor)
            values.extend((created_at, last_id))
            conditions.append(
                f"(created_at, id) < (\${len(values) - 1}, \${len(values)})"
            )

        values.append(limit)
        where = f"where {' and '.join(conditions)}" if conditions else ""
        rows = await self._connection.fetch(
            f"select * from tasks {where} "
            f"order by created_at desc, id desc limit \${len(values)}",
            *values,
        )
        return [_to_task(row) for row in rows]


class ProjectRepository:
    def __init__(self, connection: asyncpg.Connection) -> None:
        self._connection = connection

    async def find_by_id(self, project_id: UUID) -> Project | None:
        row = await self._connection.fetchrow(
            "select id, name, archived_at from projects where id = $1", project_id
        )
        if row is None:
            return None
        return Project(id=row["id"], name=row["name"], archived_at=row["archived_at"])
\`\`\`

**The non-negotiable rule:** values are passed as positional arguments and referenced as \`$1\`, \`$2\`, never interpolated into the string. The driver sends the statement and the values separately, so \`'; drop table tasks; --\` is just a string that matches nothing. The dynamic \`where\` and \`set\` clauses above build only *placeholder text and allowlisted column names* — never user data. \`"where status = '" + status + "'"\` is a SQL injection, full stop, and an interviewer who sees it will stop evaluating anything else. The same rule applies to \`order by\`, which cannot be parameterized at all: the sort key has to be mapped from an allowlist (\`Literal["created_at", "-created_at", …]\` in the query model) to a fixed fragment of SQL.

### The same repository with an ORM (SQLAlchemy 2.0, async)

\`\`\`python
# app/db/orm.py
from datetime import datetime
from enum import Enum
from uuid import UUID

from sqlalchemy import DateTime, Enum as SAEnum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.config import get_settings
from app.domain.task import TaskPriority, TaskStatus


class Base(DeclarativeBase):
    pass


def _pg_enum(enum_type: type[Enum], name: str) -> SAEnum:
    # values_callable stores the enum *values* ('todo'), not the member names
    # ('TODO'). Skipping it is the mistake everyone makes exactly once.
    return SAEnum(
        enum_type, name=name, values_callable=lambda e: [member.value for member in e]
    )


class TaskRow(Base):
    __tablename__ = "tasks"

    # Mapped[...] annotations ARE the column types; nullability comes from
    # whether the annotation includes None.
    id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid()
    )
    project_id: Mapped[UUID] = mapped_column(
        PgUUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(200))
    status: Mapped[TaskStatus] = mapped_column(
        _pg_enum(TaskStatus, "task_status"), default=TaskStatus.TODO
    )
    priority: Mapped[TaskPriority] = mapped_column(
        _pg_enum(TaskPriority, "task_priority"), default=TaskPriority.MEDIUM
    )
    due_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    version: Mapped[int] = mapped_column(Integer, default=1, server_default="1")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


_settings = get_settings()

# The async engine needs the asyncpg dialect in the URL.
engine = create_async_engine(
    str(_settings.database_url).replace("postgresql://", "postgresql+asyncpg://", 1),
    pool_size=_settings.db_pool_max_size,
    max_overflow=0,
    pool_pre_ping=True,
)

# expire_on_commit=False matters in async code: with the default, touching any
# attribute after commit triggers a lazy refresh, which cannot run implicitly
# in async and raises MissingGreenlet.
SessionFactory = async_sessionmaker(engine, expire_on_commit=False)
\`\`\`

\`\`\`python
# app/repositories/tasks_sqlalchemy.py
from collections.abc import AsyncIterator
from uuid import UUID

from sqlalchemy import delete, func, select, tuple_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.orm import SessionFactory, TaskRow
from app.domain.task import Task, TaskStatus
from app.pagination import decode_cursor
from app.schemas.task import TaskCreate, TaskListQuery, TaskUpdate


async def get_session() -> AsyncIterator[AsyncSession]:
    """One session, one request, one transaction — committed in one place."""
    async with SessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


def _to_task(row: TaskRow) -> Task:
    return Task(
        id=row.id,
        project_id=row.project_id,
        title=row.title,
        status=row.status,
        priority=row.priority,
        due_at=row.due_at,
        version=row.version,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


class SqlAlchemyTaskRepository:
    """Satisfies TaskRepositoryProtocol, so the service does not change at all."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def find_by_id(self, task_id: UUID) -> Task | None:
        row = await self._session.get(TaskRow, task_id)
        return _to_task(row) if row is not None else None

    async def insert(self, payload: TaskCreate) -> Task:
        row = TaskRow(
            project_id=payload.project_id,
            title=payload.title,
            priority=payload.priority,
            due_at=payload.due_at,
        )
        self._session.add(row)
        await self._session.flush()    # emit the INSERT now...
        await self._session.refresh(row)  # ...and read back the server defaults
        return _to_task(row)

    async def update(self, task_id: UUID, payload: TaskUpdate) -> Task | None:
        row = await self._session.get(TaskRow, task_id)
        if row is None:
            return None
        # The keys can only be this model's field names — a validated model is
        # not a free-form dict, so this is not mass assignment.
        for column, value in payload.model_dump(exclude_unset=True).items():
            setattr(row, column, value)
        row.version += 1
        await self._session.flush()
        return _to_task(row)

    async def delete(self, task_id: UUID) -> bool:
        result = await self._session.execute(
            delete(TaskRow).where(TaskRow.id == task_id)
        )
        return result.rowcount == 1

    async def count_open_by_project(self, project_id: UUID) -> int:
        statement = (
            select(func.count())
            .select_from(TaskRow)
            .where(
                TaskRow.project_id == project_id,
                TaskRow.status != TaskStatus.DONE,
            )
        )
        return (await self._session.execute(statement)).scalar_one()

    async def list(self, query: TaskListQuery, limit: int) -> list[Task]:
        statement = (
            select(TaskRow)
            .order_by(TaskRow.created_at.desc(), TaskRow.id.desc())
            .limit(limit)
        )
        if query.project_id is not None:
            statement = statement.where(TaskRow.project_id == query.project_id)
        if query.status is not None:
            statement = statement.where(TaskRow.status == query.status)
        if query.cursor is not None:
            created_at, last_id = decode_cursor(query.cursor)
            statement = statement.where(
                tuple_(TaskRow.created_at, TaskRow.id) < (created_at, last_id)
            )

        result = await self._session.execute(statement)
        return [_to_task(row) for row in result.scalars().all()]
\`\`\`

Swapping one implementation for the other is a one-line change in \`deps.py\`, because both satisfy \`TaskRepositoryProtocol\` and both return domain \`Task\` objects rather than rows. That is the payoff of having a repository layer at all, and it is worth pointing at when someone asks whether the layering earns its keep.

| Approach | Wins | Loses |
| --- | --- | --- |
| **Raw SQL** (asyncpg) | Total control, exact query plans, no abstraction to fight, the fastest driver available, transferable skill | Manual row → object mapping, verbose dynamic queries, no migration tooling of its own |
| **Core-style \`select()\`** (SQLAlchemy 2.0) | Composable filters, columns checked by the type checker, the SQL stays visible and predictable, Alembic migrations | You still have to know SQL; the statement API takes a week to feel natural |
| **Full ORM** (identity map, relationships, lazy loading) | Fastest CRUD, relations and cascades for free, great developer experience | Hidden N+1 queries, surprising generated SQL, lazy loads that explode in async code, another layer to debug |

Say this: *"I default to explicit statements — I want the query I wrote to be the query that runs, because the failure mode of a heavy ORM is that you don't notice it issued 200 queries until production. But for a standard CRUD admin panel the ORM is a straightforward win, and I'd use \`selectinload\` rather than pretending lazy loading is fine."*`,
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
    "message": "Request failed validation.",
    "fields": { "title": ["String should have at least 1 character"] },
    "request_id": "018f2a5c-0f3b-7a21-9c44-6b2e2f3a1d55"
  }
}
\`\`\`

\`code\` is a stable machine-readable string — clients branch on it. \`message\` is for humans and may change. \`request_id\` is what a user pastes into a support ticket.

\`\`\`python
# app/errors.py
from collections import defaultdict
from typing import Any, ClassVar

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.logging_config import get_logger

logger = get_logger(__name__)


class AppError(Exception):
    """Base class for every *expected* failure.

    It carries HTTP-shaped metadata but raises no HTTP machinery, so a service
    that raises it stays usable from a worker or a CLI.
    """

    code: ClassVar[str] = "internal_error"
    status_code: ClassVar[int] = 500

    def __init__(
        self,
        message: str,
        *,
        fields: dict[str, list[str]] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.fields = fields


class ValidationFailedError(AppError):
    code = "validation_failed"
    status_code = 422


class NotFoundError(AppError):
    code = "not_found"
    status_code = 404


class ConflictError(AppError):
    code = "conflict"
    status_code = 409


class ForbiddenError(AppError):
    code = "forbidden"
    status_code = 403

    def __init__(self, message: str = "You do not have access to this resource.") -> None:
        super().__init__(message)


class UnauthorizedError(AppError):
    code = "unauthorized"
    status_code = 401

    def __init__(self, message: str = "Authentication required.") -> None:
        super().__init__(message)


_CODE_BY_STATUS: dict[int, str] = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    413: "payload_too_large",
    429: "rate_limited",
}


def error_response(
    request: Request,
    *,
    status_code: int,
    code: str,
    message: str,
    fields: dict[str, list[str]] | None = None,
) -> JSONResponse:
    # request.state is backed by the ASGI scope, so it is readable here even for
    # handlers that run outside the middleware stack.
    request_id: str | None = getattr(request.state, "request_id", None)
    body: dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
            "fields": fields,
            "request_id": request_id,
        }
    }
    headers = {"X-Request-Id": request_id} if request_id else None
    return JSONResponse(status_code=status_code, content=body, headers=headers)


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        # Expected outcome: log at warning, no traceback, no alert.
        logger.warning(
            "handled application error",
            extra={"code": exc.code, "status": exc.status_code, "path": request.url.path},
        )
        return error_response(
            request,
            status_code=exc.status_code,
            code=exc.code,
            message=exc.message,
            fields=exc.fields,
        )

    @app.exception_handler(RequestValidationError)
    async def handle_request_validation_error(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        fields: defaultdict[str, list[str]] = defaultdict(list)
        for error in exc.errors():
            location = ".".join(str(part) for part in error["loc"][1:]) or "body"
            fields[location].append(error["msg"])
        return error_response(
            request,
            status_code=422,
            code="validation_failed",
            message="Request failed validation.",
            fields=dict(fields),
        )

    @app.exception_handler(StarletteHTTPException)
    async def handle_http_exception(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        # Covers the framework's own 404s and 405s, plus any HTTPException a
        # router raises for something genuinely HTTP-shaped.
        return error_response(
            request,
            status_code=exc.status_code,
            code=_CODE_BY_STATUS.get(exc.status_code, "http_error"),
            message=str(exc.detail),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        # Unexpected: log the full traceback, return NOTHING revealing.
        logger.exception("unhandled error", extra={"path": request.url.path})
        return error_response(
            request,
            status_code=500,
            code="internal_error",
            message="Something went wrong.",
        )
\`\`\`

The distinction between the last two handlers is the whole point. A \`404\` is a normal outcome and should never page anyone. An unhandled \`KeyError\` is a bug and must reach your error tracker with a traceback. Collapsing both into \`return JSONResponse({"error": str(exc)}, status_code=500)\` gives you an alert channel nobody reads and leaks \`relation "tasks" does not exist\` — your schema — to the internet.

Two details worth knowing about that last handler: it catches everything, so nothing escapes as an HTML error page; and it is installed on the outermost error middleware, which means the test client will still re-raise the original exception unless you construct it with \`raise_server_exceptions=False\`. That is a feature — in tests you want the traceback, not the sanitised \`500\`.

### Config

\`\`\`python
# app/config.py
from functools import lru_cache
from typing import Literal

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Every environment-specific value, declared once and validated at boot.

    Field names map to environment variables case-insensitively, so
    'database_url' is read from DATABASE_URL.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    environment: Literal["development", "test", "production"] = "development"
    port: int = 8000
    database_url: PostgresDsn
    log_level: Literal["CRITICAL", "ERROR", "WARNING", "INFO", "DEBUG"] = "INFO"
    db_pool_min_size: int = 1
    db_pool_max_size: int = 10
    cors_origins: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Cached, so the environment is read and validated exactly once."""
    return Settings()
\`\`\`

\`database_url\` has no default, so a missing \`DATABASE_URL\` raises a validation error the first time \`get_settings()\` runs — at import, before the server binds a port. That is the behaviour you want: fail at boot in CI, not on the first request at 3am. The rest of the app imports \`get_settings()\` and never reads the environment directly, so a typo'd variable name is caught in one place instead of returning \`None\` somewhere deep in a handler.

Rules: secrets come from the environment (or a secret manager), never from source control. \`.env\` is gitignored and \`.env.example\` — with keys and no values — is committed. In production the values come from the platform's secret store, not from a file on disk.

### Logging

\`\`\`python
# app/logging_config.py
import json
import logging
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

# Set by the middleware, read by every log record produced during that request.
request_id_ctx: ContextVar[str | None] = ContextVar("request_id", default=None)

# Attributes the logging module puts on every record; anything else on a record
# arrived via extra={...} and is application data worth emitting.
_STANDARD_ATTRS = frozenset(
    {
        "args", "asctime", "created", "exc_info", "exc_text", "filename",
        "funcName", "levelname", "levelno", "lineno", "message", "module",
        "msecs", "msg", "name", "pathname", "process", "processName",
        "relativeCreated", "stack_info", "stacklevel", "taskName", "thread",
        "threadName",
    }
)

_SENSITIVE_KEYS = frozenset(
    {"password", "token", "authorization", "secret", "api_key", "credit_card"}
)


class RedactFilter(logging.Filter):
    """Redaction belongs in the logger, not in the discipline of whoever writes
    the next log call."""

    def filter(self, record: logging.LogRecord) -> bool:
        for key in list(record.__dict__):
            if key.lower() in _SENSITIVE_KEYS:
                record.__dict__[key] = "[redacted]"
        return True


class JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, tz=UTC).isoformat(),
            "level": record.levelname.lower(),
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
        }
        payload.update(
            {
                key: value
                for key, value in record.__dict__.items()
                if key not in _STANDARD_ATTRS and not key.startswith("_")
            }
        )
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: str) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    handler.addFilter(RedactFilter())

    root = logging.getLogger()
    root.handlers = [handler]  # replace, don't append, or every line prints twice
    root.setLevel(level)

    # Let the server's own loggers flow into this handler instead of formatting
    # their own lines in a different shape.
    for name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        server_logger = logging.getLogger(name)
        server_logger.handlers = []
        server_logger.propagate = True


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
\`\`\`

The request-id middleware is what makes those lines joinable:

\`\`\`python
# app/middleware.py
import time
import uuid
from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.logging_config import get_logger, request_id_ctx

logger = get_logger("app.access")


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assign a request id, publish it three ways, log one line per request."""

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Trust an inbound id so a trace spans services, but bound its length —
        # it ends up in logs and headers.
        request_id = (request.headers.get("x-request-id") or str(uuid.uuid4()))[:64]
        request.state.request_id = request_id  # for the exception handlers
        token = request_id_ctx.set(request_id)  # for every log record
        started = time.perf_counter()

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "request failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                },
            )
            raise
        else:
            response.headers["X-Request-Id"] = request_id  # for the client
            logger.info(
                "request",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round((time.perf_counter() - started) * 1000, 2),
                },
            )
            return response
        finally:
            request_id_ctx.reset(token)
\`\`\`

Log **structured JSON**, not sentences. \`logger.info("task created", extra={"user_id": user_id, "task_id": task_id, "duration_ms": ms})\` is queryable — "p99 duration for task creation by user" is one query. \`print(f"created task {task_id} for {user_id}")\` is a string you can only grep, and it writes to stdout unbuffered on every call, which is a real throughput cost under load. One caveat on \`extra\`: the keys must not collide with the attribute names the logging module already puts on a record (\`message\`, \`args\`, \`name\`, \`module\`, \`lineno\`, …), or the call raises.

Levels that actually mean something: \`error\` = a human must look; \`warning\` = expected-but-notable (a \`409\`, a rate limit hit); \`info\` = one line per request plus significant state changes; \`debug\` = off in production.`,
    },
    {
      id: "testing",
      heading: "Testing the API",
      markdown: `Three layers, with a deliberate ratio: many unit tests (fast, precise failures), a solid band of integration tests (they catch what unit tests structurally cannot — your SQL), and a handful of end-to-end tests.

\`\`\`toml
# pyproject.toml
[tool.pytest.ini_options]
asyncio_mode = "auto"          # plain "async def test_..." functions just work
testpaths = ["tests"]
\`\`\`

### Unit: the service, against an in-memory fake

\`\`\`python
# tests/unit/test_tasks_service.py
from dataclasses import replace
from datetime import UTC, datetime
from uuid import UUID, uuid4

import pytest

from app.domain.task import Project, Task, TaskPriority, TaskStatus
from app.errors import ConflictError, NotFoundError
from app.schemas.task import TaskCreate, TaskListQuery, TaskUpdate
from app.services.tasks import TaskService


class FakeTaskRepository:
    """Implements TaskRepositoryProtocol, so the type checker catches drift
    between the fake and the real repository."""

    def __init__(self, tasks: list[Task] | None = None, open_count: int = 0) -> None:
        self.tasks: dict[UUID, Task] = {task.id: task for task in tasks or []}
        self.open_count = open_count
        self.inserted: list[TaskCreate] = []

    async def find_by_id(self, task_id: UUID) -> Task | None:
        return self.tasks.get(task_id)

    async def list(self, query: TaskListQuery, limit: int) -> list[Task]:
        return list(self.tasks.values())[:limit]

    async def insert(self, payload: TaskCreate) -> Task:
        self.inserted.append(payload)
        now = datetime.now(UTC)
        task = Task(
            id=uuid4(),
            project_id=payload.project_id,
            title=payload.title,
            status=TaskStatus.TODO,
            priority=payload.priority,
            due_at=payload.due_at,
            version=1,
            created_at=now,
            updated_at=now,
        )
        self.tasks[task.id] = task
        return task

    async def update(self, task_id: UUID, payload: TaskUpdate) -> Task | None:
        existing = self.tasks.get(task_id)
        if existing is None:
            return None
        updated = replace(
            existing,
            **payload.model_dump(exclude_unset=True),
            version=existing.version + 1,
        )
        self.tasks[task_id] = updated
        return updated

    async def delete(self, task_id: UUID) -> bool:
        return self.tasks.pop(task_id, None) is not None

    async def count_open_by_project(self, project_id: UUID) -> int:
        return self.open_count


class FakeProjectRepository:
    def __init__(self, project: Project | None) -> None:
        self._project = project

    async def find_by_id(self, project_id: UUID) -> Project | None:
        if self._project is not None and self._project.id == project_id:
            return self._project
        return None


ACTIVE_PROJECT = Project(id=uuid4(), name="Platform", archived_at=None)


async def test_rejects_tasks_on_an_archived_project() -> None:
    archived = replace(ACTIVE_PROJECT, archived_at=datetime.now(UTC))
    tasks = FakeTaskRepository()
    service = TaskService(tasks=tasks, projects=FakeProjectRepository(archived))

    with pytest.raises(ConflictError, match="archived project"):
        await service.create_task(TaskCreate(title="x", project_id=archived.id))

    assert tasks.inserted == []


async def test_rejects_when_the_project_is_over_its_open_task_limit() -> None:
    tasks = FakeTaskRepository(open_count=500)
    service = TaskService(tasks=tasks, projects=FakeProjectRepository(ACTIVE_PROJECT))

    with pytest.raises(ConflictError, match="open-task limit"):
        await service.create_task(TaskCreate(title="x", project_id=ACTIVE_PROJECT.id))


async def test_404s_when_the_project_does_not_exist() -> None:
    service = TaskService(
        tasks=FakeTaskRepository(), projects=FakeProjectRepository(None)
    )

    with pytest.raises(NotFoundError):
        await service.create_task(TaskCreate(title="x", project_id=uuid4()))


async def test_a_completed_task_cannot_be_reopened() -> None:
    now = datetime.now(UTC)
    done = Task(
        id=uuid4(),
        project_id=ACTIVE_PROJECT.id,
        title="Shipped",
        status=TaskStatus.DONE,
        priority=TaskPriority.LOW,
        due_at=None,
        version=3,
        created_at=now,
        updated_at=now,
    )
    service = TaskService(
        tasks=FakeTaskRepository([done]),
        projects=FakeProjectRepository(ACTIVE_PROJECT),
    )

    with pytest.raises(ConflictError, match="reopened"):
        await service.update_task(done.id, TaskUpdate(status=TaskStatus.TODO))
\`\`\`

These run in milliseconds and pin down business rules. What they cannot catch: a typo in your SQL, a missing column, a broken partial update. A fake asserts that your code calls what you *think* it calls — never that the database agrees.

### Integration: the real app, the real database, over real HTTP

\`\`\`python
# tests/conftest.py
from collections.abc import AsyncIterator
from uuid import UUID

import asyncpg
import pytest
from httpx import ASGITransport, AsyncClient

from app.deps import get_pool
from app.main import create_app

TEST_DSN = "postgresql://app:app@localhost:5432/app_test"


@pytest.fixture(scope="session")
async def pool() -> AsyncIterator[asyncpg.Pool]:
    pool = await asyncpg.create_pool(dsn=TEST_DSN, min_size=1, max_size=5)
    assert pool is not None, "could not connect to the test database"
    try:
        yield pool
    finally:
        await pool.close()


@pytest.fixture(autouse=True)
async def clean_database(pool: asyncpg.Pool) -> None:
    # Truncate between tests: deterministic, and far faster than re-migrating.
    await pool.execute("truncate tasks, projects restart identity cascade")


@pytest.fixture
async def project_id(pool: asyncpg.Pool) -> UUID:
    return await pool.fetchval(
        "insert into projects (name) values ('Test project') returning id"
    )


@pytest.fixture
async def client(pool: asyncpg.Pool) -> AsyncIterator[AsyncClient]:
    app = create_app()
    # The ASGI transport does not run the lifespan handler, so the app's own
    # pool is never created — override the one dependency that provides it.
    app.dependency_overrides[get_pool] = lambda: pool
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as http:
        yield http
    app.dependency_overrides.clear()
\`\`\`

\`\`\`python
# tests/integration/test_tasks_api.py
from uuid import UUID

import asyncpg
from httpx import AsyncClient


async def test_create_returns_201_with_a_location_header(
    client: AsyncClient, pool: asyncpg.Pool, project_id: UUID
) -> None:
    response = await client.post(
        "/v1/tasks",
        json={"title": "Ship it", "project_id": str(project_id), "priority": "high"},
    )

    assert response.status_code == 201
    task = response.json()["data"]
    assert task["title"] == "Ship it"
    assert task["status"] == "todo"
    assert response.headers["location"] == f"/v1/tasks/{task['id']}"

    stored = await pool.fetchval(
        "select title from tasks where id = $1", UUID(task["id"])
    )
    assert stored == "Ship it"  # it really is in Postgres


async def test_invalid_body_returns_422_with_per_field_errors(
    client: AsyncClient,
) -> None:
    response = await client.post("/v1/tasks", json={"title": "", "priority": "urgent"})

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "validation_failed"
    assert set(error["fields"]) == {"title", "project_id", "priority"}


async def test_unknown_keys_are_stripped_rather_than_trusted(
    client: AsyncClient, project_id: UUID
) -> None:
    response = await client.post(
        "/v1/tasks",
        json={
            "title": "Ship it",
            "project_id": str(project_id),
            "id": "00000000-0000-4000-8000-00000000dead",
            "version": 99,
        },
    )

    assert response.status_code == 201
    assert response.json()["data"]["id"] != "00000000-0000-4000-8000-00000000dead"
    assert response.json()["data"]["version"] == 1


async def test_the_task_lifecycle(client: AsyncClient, project_id: UUID) -> None:
    created = await client.post(
        "/v1/tasks", json={"title": "Lifecycle", "project_id": str(project_id)}
    )
    assert created.status_code == 201
    task_id = created.json()["data"]["id"]

    assert (await client.get(f"/v1/tasks/{task_id}")).status_code == 200

    patched = await client.patch(
        f"/v1/tasks/{task_id}", json={"status": "in_progress"}
    )
    assert patched.status_code == 200
    assert patched.json()["data"]["status"] == "in_progress"
    assert patched.json()["data"]["title"] == "Lifecycle"  # PATCH is partial

    deleted = await client.delete(f"/v1/tasks/{task_id}")
    assert deleted.status_code == 204
    assert deleted.content == b""

    assert (await client.get(f"/v1/tasks/{task_id}")).status_code == 404


async def test_unknown_id_is_404_and_a_malformed_id_is_422(
    client: AsyncClient,
) -> None:
    missing = await client.get("/v1/tasks/00000000-0000-4000-8000-000000000000")
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "not_found"

    malformed = await client.get("/v1/tasks/not-a-uuid")
    assert malformed.status_code == 422
    assert "task_id" in malformed.json()["error"]["fields"]
\`\`\`

The client makes a real request through the whole stack — middleware, routing, validation, the exception handlers, serialization — against the real app object, so status codes and headers are genuinely exercised rather than asserted about in isolation. That is why \`create_app()\` is a function: each test gets a fresh app whose dependency graph it can rewrite.

The synchronous client is worth knowing too, for a quick smoke test or when a test has no reason to be async:

\`\`\`python
# tests/integration/test_smoke.py
from fastapi.testclient import TestClient

from app.main import create_app


def test_openapi_document_is_served() -> None:
    # TestClient runs the lifespan handler, so this needs a reachable database.
    with TestClient(create_app()) as client:
        response = client.get("/openapi.json")

    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/v1/tasks" in paths
    assert "/v1/tasks/{task_id}" in paths
    assert set(paths["/v1/tasks/{task_id}"]) == {"get", "patch", "delete"}
\`\`\`

Asserting on the generated document is cheap insurance: it fails the moment someone deletes an endpoint a client depends on.

**Where the test database comes from.** Best answer: Testcontainers — spin a throwaway Postgres in Docker per test run, apply migrations against it, tear it down. It is reproducible on any laptop and in CI, and nobody's local test run can clobber a shared database. Acceptable answer: a dedicated \`app_test\` database created in CI, truncated between tests. Bad answer: replacing the driver with a mock in an "integration" test, which tests your mocks.

**What I look for when someone says "I tested it":** do they test the failure paths? Anyone tests the \`201\`. The candidates who have actually shipped test the \`422\`, the \`404\`, the duplicate insert that must be \`409\`, and the unknown-key case above.`,
    },
  ],
  questions: [
    {
      q: "Walk me through how you'd set up an API backend from scratch.",
      a: "I'd pick Python with FastAPI and lay the project out in layers: routers handle HTTP only, services hold business rules, repositories hold SQL. Boot sequence is: read and validate the environment once with a pydantic-settings `Settings` class and crash immediately if `DATABASE_URL` is missing; create an asyncpg pool in the lifespan handler so it opens before the first request and closes on shutdown; build the app in a `create_app()` function so tests can construct a fresh one. Middleware in order — request ID and access logging outermost, then CORS, then auth — then the routers, then the exception handlers. Each endpoint declares its inputs as annotated parameters and a Pydantic model, so validation happens before my function is called and a bad body is a 422 with a per-field list I never wrote code for. The handler calls a service injected with `Depends()` and returns a response model; `status_code` sits on the decorator. Services raise domain errors like `NotFoundError`; one `@app.exception_handler(AppError)` maps those to a consistent `{error: {code, message, fields, request_id}}` envelope. Postgres via parameterized queries, migrations in version-controlled SQL files. Tests: unit tests on services with in-memory fakes, integration tests with `httpx.AsyncClient` against a real Postgres in Docker. Deploy behind a load balancer with `/healthz` and `/readyz`, and let uvicorn drain in-flight requests on SIGTERM. And I get OpenAPI docs at `/docs` for free, generated from the same models that do the validating.",
      weak: "I'd start a FastAPI file, add the routes, and connect to a database in each route with a global client. Each route does the query and returns the dict.",
    },
    {
      q: "Show me the REST endpoints you'd design for a task tracker.",
      a: "`GET /v1/tasks?status=todo&limit=20&cursor=…` → 200 with a data array and `next_cursor`. `POST /v1/tasks` → 201 with the created body and a `location` header. `GET /v1/tasks/{task_id}` → 200, or 404 if it doesn't exist, or 422 if the id isn't a UUID. `PATCH /v1/tasks/{task_id}` for partial updates → 200. `DELETE /v1/tasks/{task_id}` → 204 with no body at all. Comments nest one level: `GET`/`POST /v1/tasks/{task_id}/comments`. Genuine state transitions get a sub-resource — `PUT /v1/tasks/{task_id}/assignee` with `{user_id}` — because that's idempotent and expresses intent better than a generic PATCH. For bulk operations that aren't CRUD, I accept a verb path like `POST /v1/tasks/archive` returning 202; contorting that into REST produces a worse API. Plural lowercase nouns, no verbs in paths, version prefix from day one, never nest more than one level deep. I'd keep the wire format snake_case so it matches the field names on the models and there's no mapping layer to get wrong.",
      weak: "`/getTasks`, `/createTask`, `/updateTask`, `/deleteTask` — all POST, since POST can carry a body and it's simpler to have one method.",
    },
    {
      q: "What actually happens between the client sending a request and getting a response?",
      a: "DNS resolves the hostname, TCP handshake to port 443, TLS handshake (one round trip on 1.3), then the HTTP request bytes go on the wire. A load balancer terminates TLS, picks a healthy instance, and adds `X-Forwarded-For`. The ASGI server parses the request and calls my app with a scope dict; the middleware stack runs outermost-in — request ID, access logging, CORS, auth — then the router matches the path and method. The framework parses the body and validates it against the declared model before my function is called, so a bad payload becomes a 422 without reaching my code. The handler calls a service, which applies business rules and calls a repository; the repository has a pooled connection injected by a `Depends()` that will return it to the pool on the way out, and runs parameterized SQL. Rows come back, get mapped to domain objects, then projected onto a declared response model — deliberately, so internal columns can't leak — and serialized with a status code and headers. On the way out I log one structured line with method, path, status, duration, and request ID. Failure modes I'd call out: 502/504 at the load balancer, 413 for oversized bodies often before my code runs, pool exhaustion, and — specific to an async service — a blocking call on the event loop, which makes every concurrent request slow at once.",
    },
    {
      q: "Where do you validate input, and why aren't Python type hints enough?",
      a: "At the edge, before anything else touches it. A type hint on a plain function is documentation — Python does not check it at runtime, so calling it with a dict of the wrong shape does exactly nothing. What enforces the annotation is the validator Pydantic builds from the model, and FastAPI runs it before my handler is invoked. Three things people miss. First, validation is a whitelist, not just a type check: `extra=\"ignore\"` means a client can't smuggle `role: admin` or a chosen `id` into a create payload and have it reach an INSERT — that's free mass-assignment protection, and `extra=\"forbid\"` is the right default for query parameters where a typo would otherwise be silently ignored. Second, request and response models should be separate types: `TaskCreate` has no `id` because clients don't choose it, and `TaskOut` is what stops `password_hash` leaking, because anything not declared on it is dropped on the way out. Third, validate path and query parameters too — annotating `task_id: UUID` turns `/v1/tasks/abc` into a 422 instead of a Postgres 'invalid input syntax for uuid' surfacing as a 500. The bonus is that the same models generate the OpenAPI schema, so the docs can't drift from the validation.",
      weak: "The database has NOT NULL constraints and I've annotated the function parameters, so if something's wrong it'll throw and the handler catches it.",
    },
    {
      q: "How do you handle errors consistently across an API?",
      a: "An `AppError` base class carrying a machine-readable `code` and an HTTP `status_code` as class attributes, with subclasses `ValidationFailedError` (422), `NotFoundError` (404), `ConflictError` (409), `ForbiddenError` (403), `UnauthorizedError` (401). Services raise domain errors and import nothing from the web framework — that's what lets me reuse a service from a worker. Then `@app.exception_handler(AppError)` maps them to one envelope, `{error: {code, message, fields, request_id}}`: `code` is stable so clients can branch on it, `message` is for humans, `request_id` is what a user pastes into a support ticket. A second handler on `Exception` catches everything else, logs the full traceback with `logger.exception`, and returns a generic 500 with no internals — expected errors log at warning and never page anyone, unexpected ones go to the error tracker. I also register a handler for `RequestValidationError`, because the framework's built-in 422 body is a different shape from my envelope and echoes the client's input back, which can contain a password. `HTTPException` is fine inside a router for something genuinely HTTP-shaped, but it must never appear below the routing layer.",
      weak: "I wrap each route in try/except and return `JSONResponse({\"error\": str(exc)}, status_code=500)` so the client knows what went wrong.",
    },
    {
      q: "PUT vs PATCH — when do you use each?",
      a: "PUT replaces the entire resource: the body is the complete new state, and any field you omit should be cleared. PATCH applies a partial modification: only the fields present change. So `PATCH /v1/tasks/42 {\"status\":\"done\"}` leaves the title alone, while `PUT /v1/tasks/42 {\"status\":\"done\"}` should blank the title — which is why sending a partial body to PUT is a bug people ship constantly. Both are idempotent: repeating the same PUT or PATCH lands on the same state. In practice most APIs expose PATCH because clients rarely have the full resource in hand. The subtlety worth raising is distinguishing 'field omitted' from 'field explicitly set to null' in a PATCH — `{\"due_at\": null}` means clear it, an absent `due_at` means leave it. Both give you `due_at is None` on the model, so the only thing that can tell them apart is `model_fields_set`, which is what `model_dump(exclude_unset=True)` uses; I build the SET clause from exactly those keys. I also reject an empty patch body with a model validator, because `{}` is a client bug rather than a no-op.",
    },
    {
      q: "Why separate a service layer from your route handlers? Isn't that over-engineering for a small app?",
      a: "It buys two things. First, testability: I can unit test 'a task can't be added to an archived project' in milliseconds against an in-memory fake — no server, no database, no HTTP client. Because the service depends on a `Protocol` rather than a concrete repository, the type checker verifies the fake still matches the real thing, so the test can't silently rot. Second, reuse: the moment a second caller appears — a scheduled job, a CLI backfill, a queue consumer — a rule living inside a route handler has to be copy-pasted or extracted under pressure. Concretely, in this chapter the same service runs against a raw-SQL repository and a SQLAlchemy one with zero changes, because both satisfy the same protocol and both return domain objects. And yes, it's over-engineering for a 200-line CRUD app where every service method is a pass-through — that's genuinely ceremony. I'd introduce the layer when the first real business rule appears or the second caller shows up, not on principle.",
    },
    {
      q: "How does dependency injection work here, and what does it actually buy you?",
      a: "A dependency is just a callable, declared with `Annotated[TaskService, Depends(get_task_service)]` on the handler parameter. FastAPI resolves the whole graph per request — pool, then connection, then repositories, then the service — and caches each node within that request, so both repositories get the same connection and can therefore share a transaction. A dependency that uses `yield` is a resource with cleanup: the code before `yield` runs on the way in, the code after runs after the handler returns, even if it raised, which is how a connection is guaranteed to go back to the pool without a single try/finally in a route. Three concrete payoffs. It's typed, so handlers ask for a service rather than reaching for a global. It composes — auth is a dependency I attach to a router with `dependencies=[Depends(get_current_user)]`, and it shows up in the OpenAPI security scheme automatically. And it's overridable: `app.dependency_overrides[get_pool] = lambda: test_pool` swaps one node in a test with no monkeypatching of module internals, which is why my integration tests are five lines each. The one thing to watch is that a `def` dependency runs in a threadpool while an `async def` one runs on the event loop, so a blocking call in a dependency is exactly as damaging as one in a handler.",
    },
    {
      q: "When should an endpoint be `async def`, and when should it be plain `def`?",
      a: "`async def` runs directly on the event loop, in the same thread as every other request in that process — which is what lets one worker handle thousands of concurrent connections, but only if every wait inside is awaited. A plain `def` endpoint is handed to a worker threadpool automatically, so blocking is contained, but concurrency is capped at the pool size, 40 by default. So the rule is: if the function ever blocks, it must not be `async def`. Calling `requests.get`, `time.sleep`, or a synchronous database driver inside an `async def` handler freezes the entire process for the duration — not just that request, every request, including the health check. It's a nasty bug because nothing crashes and it's invisible with one request on a laptop; it shows up as latency that gets worse under load. The fixes, in order of preference: use an async library (asyncpg, `httpx.AsyncClient`); push a one-off blocking call to a thread with `anyio.to_thread.run_sync`; or just drop the `async` keyword and let the framework threadpool the whole handler. And async doesn't help CPU-bound work at all — the GIL means a hot loop stalls the event loop whether you await it or not, so that goes to a process pool or a separate worker.",
      weak: "I make everything `async def` because it's faster.",
    },
    {
      q: "How do you talk to Postgres from Python, and how do you avoid SQL injection?",
      a: "An asyncpg pool created once in the lifespan handler — opening a connection per request costs milliseconds of handshake and would exhaust `max_connections`. The pool keeps N connections warm; I set `max_size` per process so instances × max_size stays well under Postgres's `max_connections` (default 100), and set an acquire timeout so requests fail fast instead of hanging when the pool is drained. A `Depends()` checks a connection out for the duration of one request and returns it on the way out. Injection is prevented by parameterized queries: `connection.fetchrow('select * from tasks where id = $1', task_id)`. The driver sends the statement and the values separately, so the value is never parsed as SQL — `'; drop table tasks; --` is just a string that matches nothing. String concatenation of user input into SQL is the vulnerability. For dynamic filters I build only the placeholder text — `$1`, `$2` — and push the actual values into the argument list; column names come from a hard-coded allowlist, never from the payload. Same for `ORDER BY`, which can't be parameterized at all: the sort key is a `Literal` on the query model that maps to a fixed fragment of SQL. If I'm using SQLAlchemy instead, `select()` with `where(TaskRow.id == task_id)` compiles to a bound parameter for the same reason — but `text()` with an f-string inside it is just as injectable as raw concatenation.",
      weak: "I use an ORM, so injection isn't possible.",
    },
    {
      q: "How would you test this API?",
      a: "Unit tests on services against in-memory fakes for business rules — fast and pinpoint, and the fake implements the same `Protocol` the real repository does so the type checker catches drift. Integration tests with `httpx.AsyncClient` over the ASGI transport against the real app and a real Postgres, because that's the only layer that catches a typo in my SQL, a missing column, or a broken partial update. The app is built by a `create_app()` function so each test gets a fresh instance, and `app.dependency_overrides[get_pool]` points it at the test pool — no patching of module internals. The database comes from Testcontainers, a throwaway Postgres in Docker per run with migrations applied, so it's reproducible locally and in CI and no shared database gets clobbered; I truncate tables between tests in an autouse fixture for determinism. I test failure paths, not just the happy one: the 422 with per-field errors, the 404 on a valid-but-unknown UUID, the 422 on a malformed one, the conflict that must be 409, and that unknown keys in the body get stripped rather than trusted. A lifecycle test covers create → read → patch → delete → 404, and one test asserts on `/openapi.json` so deleting an endpoint a client depends on fails the build.",
      weak: "I use the interactive docs page to hit each endpoint after I build it and check the response looks right.",
    },
    {
      q: "Your API is returning 500s in production. How do you debug it?",
      a: "First, confirm scope and blast radius from metrics: what's the error rate, which endpoint, did it start at a deploy? If it lines up with a deploy, roll back first and diagnose after — restoring service beats being right. Then pull the structured logs filtered to status 500 for that route and read the tracebacks in the error tracker; they're grouped by fingerprint so I can see whether it's one bug or many. Every log line carries a request ID from the middleware, so I can take one failing request and follow it through auth, validation, service, and query. The usual suspects in order: a database issue (pool exhausted, a migration that didn't run, a slow query hitting the command timeout), an unhandled `None` from a changed payload shape, or a downstream dependency failing without a timeout so requests pile up. This is also the argument for the earlier design: because expected errors are 4xx raised as `AppError` and only genuine bugs reach the catch-all handler, a 500 spike is unambiguously a bug rather than noise from people requesting missing records.",
      weak: "I'd add print statements and redeploy to see what's happening.",
    },
    {
      q: "How do you keep secrets and configuration out of your code?",
      a: "Everything environment-specific comes from environment variables, read and validated exactly once at startup by a pydantic-settings `Settings` class that also coerces types and applies defaults. `database_url` has no default, so a missing `DATABASE_URL` raises a validation error at import — I want to fail at boot in CI, not on the first request at 3am. `get_settings()` is `lru_cache`d and the rest of the app calls that rather than reading `os.environ` directly, so there's one place a variable name can be wrong. `.env` is gitignored; `.env.example` with keys and empty values is committed so a new developer knows what's needed. In production the values come from the platform's secret store — AWS Secrets Manager, Vault, or the orchestrator's env config — not from a file on disk. And secrets get redacted in logs by a filter attached to the handler, covering `authorization`, `password`, and `token` keys, because logs get shipped to third-party services and read by people who shouldn't see credentials.",
    },
    {
      q: "What should you log, and what's wrong with print()?",
      a: "Log structured JSON, one object per event, not sentences. `logger.info('task created', extra={'user_id': user_id, 'task_id': task_id, 'duration_ms': ms})` is queryable — 'p99 latency for task creation, grouped by endpoint' is one query in any log platform. `print(f'created task {task_id}')` is a string you can only grep, it bypasses levels and filters entirely so you can't turn it down in production, and it writes unbuffered on every call, which is a real throughput cost under load. I use a `logging.Formatter` subclass that emits JSON and pulls anything passed via `extra` onto the record, plus a filter that redacts sensitive keys, configured once at startup — and I point the server's own loggers at the same handler so every line in the stream has the same shape. Levels have to mean something: `error` means a human must look, `warning` is expected-but-notable like a 409 or a rate limit trip, `info` is one line per request plus significant state changes, `debug` is off in production. Every line carries the request ID via a `ContextVar` set in the middleware, so I can reconstruct one request's path across layers without threading a parameter through every function. And I never log credentials, tokens, or PII.",
    },
    {
      q: "How do you deploy and run this in production?",
      a: "The app is stateless, so it packages into a container and runs as N identical replicas behind a load balancer, which lets me scale horizontally and restart any instance safely. Inside the container, uvicorn workers — one process per core is the starting point, since the GIL means a single process can't use more than one. `/healthz` for liveness and a separate `/readyz` that actually queries the database, because otherwise the load balancer routes traffic to an instance whose pool can't reach Postgres. Graceful shutdown matters: on SIGTERM uvicorn stops accepting connections and lets in-flight requests finish, then the lifespan shutdown closes the connection pool — with `--timeout-graceful-shutdown` as a hard cap so one stuck request can't block the deploy forever. Migrations run as a separate step before the new version rolls out, and they must be backward compatible, because during a rolling deploy old and new code run against the same schema simultaneously — so 'add a nullable column, backfill, then make it NOT NULL in a later release', never 'rename a column'. Config from environment variables, logs to stdout for the platform to collect, metrics and traces exported, and alerts on error rate and p99 latency rather than on individual errors.",
    },
    {
      q: "A client says your endpoint is slow. Walk me through diagnosing it.",
      a: "Measure before guessing. First, is it slow server-side or in transit? My access log has a duration per request, so I compare server-side p99 against what the client observes — if they diverge it's network, payload size, or TLS, not my code. If it's server-side, the endpoint is almost always waiting on a query, so I look at `pg_stat_statements` for the top queries by total time and run `EXPLAIN ANALYZE` on the suspect. The classic findings, in frequency order: a sequential scan because there's no index on the filter column; an N+1 where the handler loops over 50 rows issuing a query each — trivially easy to cause with a lazy-loading ORM relationship; `OFFSET 100000` pagination that makes Postgres scan and discard 100k rows; or `select *` pulling a large text column nobody uses. Fixes in the same order: add the composite index matching the filter and sort, batch the N+1 into one query with `where id = any($1)` or an eager load, switch to keyset/cursor pagination, and select only the needed columns. If the queries are genuinely fast but the request is slow, I check two things that look identical from outside: pool saturation, where requests queue waiting for a connection, and a blocking call on the event loop, where one slow synchronous operation makes every concurrent request look slow. The first is fixed by more connections or fewer, the second by moving the call off the loop — so it's worth telling them apart before changing anything.",
    },
  ],
};
