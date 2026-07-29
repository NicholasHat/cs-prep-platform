import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "system-design-intern",
  title: "System Design at Intern Scale",
  track: "systems",
  order: 1,
  summary:
    "Interns rarely get a dedicated design round, but almost every intern gets \"okay, how would you build this?\" as a follow-up. This is the framework, the numbers, the building blocks, and five fully worked designs at the depth actually expected.",
  estMinutes: 90,
  tags: [
    "system design",
    "scalability",
    "caching",
    "sharding",
    "queues",
    "CAP",
    "rate limiting",
    "estimation",
  ],
  sections: [
    {
      id: "the-framework",
      heading: "A framework you can run in 15 minutes",
      markdown: `Most intern "design" questions are 10-20 minute tails on a coding round. The interviewer is not checking whether you know Kafka. They are checking whether you can take a vague sentence and turn it into a concrete, defensible plan without freezing.

Run the same six steps every time. Having a script is most of the score.

**1. Requirements (2-3 min).** Split functional from non-functional, out loud.

- *Functional:* what can a user actually do? Write them as verbs. "Shorten a URL", "follow it", "see click counts."
- *Non-functional:* scale, latency target, consistency needs, availability, read/write ratio. Ask for numbers; if the interviewer shrugs, propose your own and say so — "I'll assume 10M new links a day and 100:1 read-heavy; stop me if that's wrong."
- *Out of scope:* say what you are **not** building. "No auth, no analytics dashboard, no custom domains." This buys you time and shows judgement.

**2. API surface (2 min).** The API is the contract, and it forces the data model. Write 3-5 endpoints with request and response shapes. Do this before any boxes and arrows — designs that start with boxes tend to drift.

**3. Data model (3 min).** Tables or collections, primary keys, the indexes the queries need. Say which access patterns each index serves. Getting the key right is usually the whole design: in a URL shortener the key is the short code; in a chat app it is \`(conversation_id, message_id)\`.

**4. High-level components (3 min).** Client → load balancer → stateless app servers → datastore, plus whatever is genuinely needed: a cache, a queue, a blob store, a CDN. Draw the *request path* for one write and one read, end to end. Don't add a component you can't justify with a specific problem it solves.

**5. Scale it (3 min).** Now apply pressure. Where does it break first at 10x? Typical answers: the database is a single write node; a hot key melts one shard; the read path does N+1 queries. Fix them one at a time — replicas, cache, shard key change, async processing.

**6. Tradeoffs (2 min).** Name two decisions you made and the alternative you rejected, with the cost. "I used a counter-based ID for short codes instead of a hash of the URL: shorter codes and no collision handling, but the IDs are enumerable and I need a coordination service."

> **Anti-patterns that read as junior:** starting with a microservice diagram; naming technologies instead of properties ("I'd use Redis" before "I need a low-latency shared store with TTLs"); silently assuming scale; never mentioning a failure mode; refusing to commit to a choice.`,
    },
    {
      id: "estimation",
      heading: "Back-of-envelope estimation and the numbers to memorize",
      markdown: `Estimation exists to make a decision, not to be accurate. The only question it answers is: *does this fit on one machine, or do I need a distributed system?* One significant figure is plenty.

### Latency numbers worth knowing

| Operation | Time | Mental model |
| --- | --- | --- |
| L1 cache reference | ~1 ns | free |
| Branch mispredict | ~3 ns | free |
| L2 cache reference | ~4 ns | free |
| Mutex lock/unlock (uncontended) | ~20 ns | cheap |
| Main memory reference | ~100 ns | 100x slower than L1 |
| Compress 1 KB with a fast codec | ~2 µs | |
| Send 1 KB over 1 Gbps network | ~10 µs | |
| Read 1 MB sequentially from memory | ~50 µs | ~20 GB/s |
| SSD random read | ~100 µs | 1000x slower than RAM |
| Read 1 MB sequentially from SSD | ~500 µs | ~2 GB/s |
| Round trip within a datacenter | ~500 µs | |
| Disk (HDD) seek | ~10 ms | avoid entirely |
| Read 1 MB from spinning disk | ~20 ms | |
| Packet CA → Netherlands → CA | ~150 ms | speed of light, not fixable |

Three takeaways that carry the whole table: **memory is ~100x faster than SSD, SSD is ~100x faster than a cross-continent round trip, and sequential access beats random access by an order of magnitude everywhere.**

### Throughput and capacity rules of thumb

- A single well-tuned app server: **1,000-10,000 QPS** for cheap requests. Assume ~1k if the work touches a database.
- A single Postgres/MySQL instance: **thousands of simple reads/sec**, **hundreds to low thousands of writes/sec** before you tune. Millions of rows is nothing; billions is a real conversation.
- Redis: **~100k ops/sec** per instance, sub-millisecond.
- Kafka: **hundreds of thousands of messages/sec** per broker for small messages.
- Rule: **1 million requests/day ≈ 12 QPS.** Memorize this one — it converts product numbers to engineering numbers instantly.
- Peak is typically **2-3x average**. Design for peak.

### Sizing math, worked

Say 100M daily active users, each writing 2 posts/day, each post ~1 KB of text plus metadata, read 100x more than written.

\`\`\`text
Writes:   100M * 2        = 200M writes/day
          200M / 86,400   ≈ 2,300 writes/sec average
                          ≈ 7,000 writes/sec peak

Reads:    2,300 * 100     ≈ 230,000 reads/sec average

Storage:  200M * 1 KB     = 200 GB/day
          200 GB * 365    ≈ 73 TB/year   (before replication)
          with 3x replicas ≈ 220 TB/year

Bandwidth (read): 230k/s * 1 KB ≈ 230 MB/s ≈ 1.8 Gbps
\`\`\`

Now the design writes itself: 7k writes/sec does not fit one Postgres primary, so you shard or you batch. 230k reads/sec absolutely requires a cache — at a 90% hit rate the database only sees 23k reads/sec, which is still several replicas. 73 TB/year means text goes in the database and anything binary goes in object storage.

Useful constants: **86,400 sec/day ≈ 100k**, 2.5M sec/month, 30M sec/year. 2^10 ≈ 1 thousand, 2^20 ≈ 1 million, 2^30 ≈ 1 billion, 2^32 ≈ 4 billion, 2^62 ≈ 4.6 × 10^18.`,
    },
    {
      id: "load-balancing",
      heading: "Load balancing and stateless servers",
      markdown: `A load balancer spreads traffic across identical servers, removes dead ones from rotation, and gives you a single address to point DNS at. Everything else in horizontal scaling depends on it.

### Layer 4 vs layer 7

- **L4 (transport):** routes by IP and port, forwards TCP/UDP without reading the payload. Very fast, protocol-agnostic, cannot route on URL path or read cookies. Cannot terminate TLS (though many "L4" products can pass it through).
- **L7 (application):** parses HTTP. Can route \`/api/*\` to one pool and \`/static/*\` to another, terminate TLS, rewrite headers, retry idempotent requests, and do sticky sessions by cookie. Costs more CPU per request.

In an interview: "I'd use an L7 load balancer so I can terminate TLS at the edge and path-route, and because it can do health checks against a real \`/healthz\` endpoint rather than just a TCP connect."

### Algorithms

| Algorithm | When it's right |
| --- | --- |
| Round robin | Uniform servers, uniform request cost. Default. |
| Weighted round robin | Heterogeneous instance sizes. |
| Least connections | Long-lived or variable-duration requests (WebSockets, streaming). |
| Least response time | Latency-sensitive, mixed backends. |
| Consistent hashing | You need the same key to land on the same node — cache servers, sharded state. |

**Consistent hashing** is the one worth being able to explain. Naive \`hash(key) % N\` remaps nearly every key when N changes, which empties every cache at once. Consistent hashing places servers and keys on a ring; a key belongs to the first server clockwise. Adding or removing a server only moves the keys in that server's arc — roughly \`K/N\` keys instead of \`K\`. Real implementations add **virtual nodes** (each physical server placed at ~100-200 ring positions) so load is even and removing a node spreads its keys over many survivors rather than dumping them all on one neighbour.

### Health checks and failure

Active health checks (LB polls \`/healthz\`) plus passive detection (mark a backend down after N consecutive 5xx or timeouts). Two failure modes to name:

- **Cascading failure:** one server dies, its traffic moves to the survivors, which then also saturate. Mitigate with capacity headroom (run at ~50-60% so you survive losing a node), load shedding, and circuit breakers.
- **Thundering herd on recovery:** everything reconnects at once. Mitigate with jittered exponential backoff.

### Statelessness is the actual requirement

Load balancing only works if any server can serve any request. That means **no session state in process memory** — put it in a shared store (Redis, or a signed cookie/JWT held by the client). Sticky sessions are a workaround, not a design: they break when a server dies, they make deploys painful, and they produce uneven load.

If a server *must* hold state — a WebSocket connection, an in-memory game room — then you route by consistent hashing on the entity id, and you need a plan for what happens when that node dies (clients reconnect, state is rebuilt from a log or a snapshot).`,
    },
    {
      id: "caching",
      heading: "Caching layers, eviction, invalidation, and CDNs",
      markdown: `Caching is the highest-leverage move in almost every read-heavy design, and cache *invalidation* is where candidates fall apart. Know both halves.

### The layers, outermost first

1. **Browser cache** — \`Cache-Control: max-age=31536000, immutable\` on fingerprinted assets (\`app.a3f9c1.js\`). Zero network.
2. **CDN / edge cache** — geographically distributed. Serves static assets and cacheable API responses from a POP near the user, killing the ~150 ms cross-continent RTT.
3. **Reverse proxy cache** — nginx/Varnish in front of your app, caches full responses.
4. **Application cache** — Redis or Memcached. Caches query results, computed objects, sessions, rate-limit counters. This is the one you'll design.
5. **Local/in-process cache** — a map inside the server process. Nanosecond reads, but each server has its own copy, so invalidation is hard and memory is duplicated. Fine for config and feature flags.
6. **Database buffer pool** — the DB already caches hot pages in RAM. Part of why "just add a read replica" sometimes beats adding Redis.

### Read and write patterns

- **Cache-aside (lazy loading)** — the default. App checks cache; on a miss it reads the DB, writes the cache, returns. Simple, resilient (a dead cache means a slow site, not a broken one), but every miss pays full latency, and stale data lives until the TTL expires.
- **Read-through** — the cache itself loads on a miss. Same behaviour, logic lives in the cache layer.
- **Write-through** — write cache and DB together, synchronously. Cache never stale; every write is slower; you cache data nobody reads.
- **Write-behind (write-back)** — write cache, flush to DB asynchronously. Fast writes, absorbs bursts, **can lose data** if the cache dies before the flush. Only for data you can afford to lose (view counters, "last seen" timestamps).
- **Refresh-ahead** — proactively refresh hot keys before the TTL. Good for predictable hot sets, wasteful otherwise.

### Eviction policies

| Policy | Behaviour | Use when |
| --- | --- | --- |
| **LRU** | Evict least recently used | General purpose default; good temporal locality |
| **LFU** | Evict least frequently used | Stable popularity distributions; resists a one-off scan flushing the cache |
| **FIFO** | Evict oldest inserted | Rarely right; ignores access |
| **TTL** | Expire on age | Correctness bound on staleness — combine with LRU |
| **Random** | Evict a random key | Surprisingly decent, trivially cheap, no metadata |

Redis's \`allkeys-lru\` and \`allkeys-lfu\` are both approximate — they sample a handful of keys and evict the worst, because maintaining a true LRU list costs too much. Knowing that detail is a good signal.

### Invalidation strategies

1. **TTL** — simplest. You accept staleness up to the TTL. Pick the TTL from the product requirement: a 60-second-stale follower count is fine; a 60-second-stale account balance is not.
2. **Write-through invalidation** — on update, delete the key (\`DEL user:42\`), don't update it. Deleting is idempotent and race-safe; updating races with concurrent writers and can install a stale value permanently.
3. **Versioned keys** — embed a version in the key: \`user:42:v7\`. Bumping the version invalidates atomically and leaves the old entry to expire naturally. Great when one change invalidates many derived keys.
4. **Event-driven** — the DB emits a change event (CDC / outbox / replication stream), a consumer purges affected keys. Correct across services, more moving parts.

### Three cache failure modes with names

- **Thundering herd / cache stampede:** a hot key expires, 10,000 concurrent requests all miss and all hit the DB. Fix: a per-key lock or single-flight so one request recomputes while the others wait, plus **jittered TTLs** (\`ttl = 300 + random(0..60)\`) so keys don't expire in lockstep.
- **Cache penetration:** requests for keys that don't exist in the DB either (often malicious) bypass the cache every time. Fix: cache the negative result with a short TTL, or front it with a Bloom filter.
- **Hot key:** one key gets so much traffic it saturates a single cache node. Fix: replicate that key across nodes with a random suffix (\`trending:v1:{0..9}\`), or add a local in-process cache in front with a 1-second TTL.

### CDNs specifically

A CDN is a cache plus a global network. It helps in three ways: it terminates TLS near the user (saving RTTs on the handshake), it serves cached bytes without touching your origin, and it keeps a warm connection back to origin for the requests it must forward.

- **Pull CDN:** origin is the source of truth, CDN fetches on first miss. Default choice — no publish step.
- **Push CDN:** you upload assets to the CDN. Better for large, rarely-changing files where you don't want origin misses at all.
- **Cache key** is usually URL + a chosen set of headers (\`Vary: Accept-Encoding\`). Be careful: \`Vary: User-Agent\` shatters your hit rate.
- **Invalidation:** purges are slow and rate-limited, so **don't invalidate — version the URL.** Content-hash filenames make assets immutable and cacheable forever. This is the single most important CDN practice.
- Dynamic, per-user responses are usually \`Cache-Control: private, no-store\`, but you can still route them through the CDN's network for the connection reuse.`,
    },
    {
      id: "database-scaling",
      heading: "Database scaling: replicas, partitioning, sharding",
      markdown: `Scale in this order, and say the order out loud — jumping straight to sharding is a red flag.

**1. Make the queries good.** Index the columns you filter and sort on. Kill N+1 queries. A composite index on \`(user_id, created_at DESC)\` turns a feed query from a sort over millions of rows into a range scan. Most "we need to scale the DB" problems are one missing index.

**2. Vertical scaling.** A modern single box can hold hundreds of GB of RAM and do tens of thousands of QPS. It is boring, it preserves transactions and joins, and it buys years. Ceiling: hardware limits and a single point of failure.

**3. Read replicas.** Stream the write-ahead log to N followers; send reads there, writes to the primary.

- Solves read scaling only. Writes still funnel to one primary.
- Introduces **replication lag** (typically ms, occasionally seconds under load). The classic bug: user posts a comment, is redirected, reads from a lagging replica, and their comment is missing. Fixes: **read-your-writes** routing (pin a user to the primary for N seconds after a write), or return the write's result directly from the write response instead of re-reading.
- Failover: promote a replica when the primary dies. Automatic failover risks split-brain; that's why systems use a consensus-based coordinator.

**4. Partitioning within one database.** Split a big table into partitions by range (\`created_at\` month) or list (\`region\`). Same server, same SQL, but queries prune irrelevant partitions and you can drop an old month instantly instead of running a huge \`DELETE\`. Underrated intermediate step.

**5. Sharding (horizontal partitioning across machines).** Now each shard is its own database with its own primary.

### Choosing a shard key

The shard key decides everything. Good keys distribute writes evenly *and* keep the data a single query needs on one shard.

- **Hash-based:** \`shard = hash(user_id) % N\`. Even distribution, but range queries must fan out to every shard, and resharding is painful — use **consistent hashing** or a fixed large number of logical shards (e.g. 1024) mapped onto few physical nodes, so growth is a remap, not a rehash.
- **Range-based:** \`A-M\` on shard 1, \`N-Z\` on shard 2. Range queries stay local, but you get hotspots (sharding by timestamp sends *all* current writes to one shard — the classic mistake).
- **Directory/lookup-based:** a lookup service maps entity → shard. Maximum flexibility for rebalancing, but the directory is a new SPOF and an extra hop.
- **Geo:** shard by region. Good for latency and data residency; cross-region queries are expensive.

### What sharding costs you

- **No cross-shard joins.** You denormalize or you do application-side joins.
- **No cross-shard transactions** without two-phase commit or sagas — both of which you should mention and then avoid.
- **Cross-shard aggregation** (\`COUNT(*)\` over everything) needs scatter-gather or a precomputed rollup.
- **Rebalancing** is an operational project, not a config change.
- **Hot shards** happen anyway: a celebrity user's data all lives on one shard. Mitigation is usually special-casing (fan-out-on-read for celebrities, see the news feed design).

### SQL vs NoSQL, answered like an engineer

Don't say "NoSQL scales better." Say what you actually need:

- **Relational (Postgres/MySQL):** ACID transactions across rows, joins, ad-hoc queries, strong constraints, a schema you want enforced. Choose this by default for an intern-scale design and justify the switch if you need one.
- **Document (Mongo/DynamoDB):** access is by a single key, the shape varies per record, and you're happy denormalizing. Scales horizontally with less ceremony; you give up joins and multi-record transactions (mostly).
- **Wide-column (Cassandra/HBase):** enormous write volume, queries known in advance, tunable consistency, no joins. You model tables *per query*.
- **Key-value (Redis/Memcached):** caching, counters, sessions, rate limits, queues.
- **Search (Elasticsearch):** full-text relevance ranking. It is a secondary index over a source of truth, never the source of truth.
- **Blob (S3/GCS):** anything binary. Never put images in a relational database.`,
    },
    {
      id: "queues-async",
      heading: "Queues and asynchronous processing",
      markdown: `Any work that is slow, failure-prone, or not needed for the response should leave the request path. The user's HTTP request should do the minimum to be durable and correct, then hand the rest to a queue.

Typical async work: sending email/push, transcoding video, generating thumbnails, fanning out a post to followers, reindexing search, running webhooks, aggregating analytics.

### What a queue buys you

- **Latency decoupling:** respond in 50 ms instead of 5 s.
- **Load smoothing:** a traffic spike grows the queue instead of dropping requests. The queue is a buffer with a visible depth.
- **Failure isolation:** the email provider being down does not fail signup.
- **Retries with backoff** are built in, plus a **dead letter queue** for messages that fail repeatedly so they can be inspected instead of silently dropped or retried forever.

### Queue vs log

- **Task queue (SQS, RabbitMQ, Celery):** a message is consumed by one worker and then removed. Good for jobs.
- **Append-only log (Kafka, Kinesis):** messages persist for a retention window, consumers track their own offset, and **many independent consumer groups can read the same stream**. Good for events that several systems care about, and for replay after a bug.

Say which one you want and why. "I want a log, because analytics, the search indexer, and the notification service all need the same \`post_created\` event, and I want to replay a week if the indexer has a bug."

### Delivery semantics — the part interviewers probe

- **At-most-once:** ack before processing. Fast, loses messages on crash.
- **At-least-once:** ack after processing. Never loses, but **duplicates are guaranteed** — a worker can finish the work and die before acking.
- **Exactly-once:** not achievable end-to-end across arbitrary systems. What you actually do is **at-least-once delivery plus idempotent consumers**, which is *effectively* once. Say it that way; claiming exactly-once delivery is a tell.

### Ordering

Global ordering across a distributed queue means a single serialized channel and no parallelism. What you really want is **per-key ordering**: partition by \`conversation_id\` or \`user_id\` so all messages for one key go to one partition and are processed in order, while different keys run in parallel. This is exactly how Kafka partitions work.

### The transactional outbox

The subtle bug: you write to the database, then publish to the queue. If the process dies between them, the event is lost. If you publish first and the DB write fails, you emitted a lie. There is no distributed transaction across Postgres and Kafka.

The fix: in **one local transaction**, write the business row and an \`outbox\` row. A separate relay process reads unpublished outbox rows, publishes them, and marks them sent. Delivery becomes at-least-once (the relay may crash after publishing, before marking) — which is fine, because consumers are idempotent.

\`\`\`sql
BEGIN;
INSERT INTO orders (id, user_id, total_cents) VALUES ($1, $2, $3);
INSERT INTO outbox (id, topic, payload)
  VALUES (gen_random_uuid(), 'order.created', $4::jsonb);
COMMIT;
\`\`\`

### Backpressure

Queues fail by growing without bound. Always state what happens when consumers can't keep up: alert on **queue depth and consumer lag**, autoscale workers on lag, shed low-priority producers, and cap the queue with an explicit rejection rather than letting memory blow up. "Unbounded queue" is another way to spell "outage with extra steps."`,
    },
    {
      id: "cap-and-consistency",
      heading: "CAP stated correctly, and consistency models",
      markdown: `### What CAP actually says

CAP: in the presence of a **network partition**, a distributed system must choose between **consistency** (every read sees the most recent write, i.e. linearizability) and **availability** (every non-failing node answers every request).

The misquote is "pick two of three." That is wrong, and interviewers who know the material notice.

- Partition tolerance is **not a choice**. Networks partition. If you "give up P", you have a single-node system, and CAP has nothing to say about it.
- The real statement is a conditional: **when a partition happens**, you choose C or A. When there is no partition, you can have both — and systems run partition-free the vast majority of the time.
- CAP's "consistency" is specifically **linearizability**, not the C in ACID. CAP's "availability" means *every* node responds, which is stricter than "the site is up."

So a "CP" system (etcd, ZooKeeper, HBase, a Postgres primary with synchronous replication) refuses writes on the minority side of a partition — it returns errors rather than divergent data. An "AP" system (Cassandra, DynamoDB in its eventually-consistent mode, DNS) keeps accepting writes on both sides and reconciles later, so reads can be stale or conflicting.

### PACELC — the better framing

PACELC extends it: **if Partition, then A or C; Else, then Latency or Consistency.** This is the part that actually governs day-to-day design. Even with a healthy network, making a read strongly consistent means coordinating with other nodes, which costs a round trip. Most systems trade consistency for latency all the time and only think about partitions during incidents.

Say this in an interview and you are instantly above the bar.

### Consistency models, strongest to weakest

- **Linearizable (strong):** the system behaves as if there is one copy and every operation takes effect at a single instant between its call and its return. Once a write returns, every subsequent read anywhere sees it. Costs coordination on every operation. Needed for: locks, leader election, unique-constraint enforcement, "did I already charge this card?"
- **Sequential consistency:** all nodes see operations in the same order, but that order need not match real time.
- **Causal consistency:** operations that are causally related (a reply to a comment) are seen in order everywhere; concurrent operations may be seen in different orders. This is usually what a social product actually needs, and it is achievable without global coordination (vector clocks / Lamport timestamps).
- **Read-your-writes:** a user always sees their own writes. Cheap to implement (sticky routing to primary after a write) and it fixes 90% of user-visible weirdness.
- **Monotonic reads:** you never see time move backwards. Achieved by pinning a session to one replica.
- **Eventual consistency:** if writes stop, all replicas converge. Says nothing about when. Fine for follower counts, view counts, and search indexes; not fine for balances.

### Quorums

With N replicas, W write acks required, R read replies required: if **W + R > N** you are guaranteed to read at least one replica that saw the latest write. N=3, W=2, R=2 is the standard "strongly consistent enough" configuration. W=1, R=1 is fast and eventually consistent. W=N gives fast reads and fragile writes. Conflicts still need resolution — last-write-wins (lossy, needs synchronized clocks), version vectors (correct, pushes merge logic to the app), or CRDTs (converge automatically for specific data types).

### ACID, so you can contrast it

**Atomicity** (all or nothing), **Consistency** (invariants hold — this C is unrelated to CAP's), **Isolation** (concurrent transactions don't corrupt each other), **Durability** (committed means it survives a crash). Isolation levels in ascending strength: read uncommitted, read committed (Postgres default), repeatable read, serializable. Know the anomalies: dirty read, non-repeatable read, phantom read, and write skew (the one repeatable read still allows).`,
    },
    {
      id: "idempotency-retries",
      heading: "Idempotency, retries, and safe failure",
      markdown: `Distributed systems fail in a specific, annoying way: **a timeout tells you nothing.** The request may have been lost, or it may have succeeded and the response was lost. The client cannot distinguish these, so it retries, so the server must be able to absorb the retry.

### Idempotency

An operation is idempotent if doing it twice has the same effect as doing it once.

- \`GET\`, \`PUT\`, \`DELETE\`, \`HEAD\` are idempotent by HTTP definition. \`POST\` and \`PATCH\` are not.
- \`SET balance = 100\` is idempotent. \`balance = balance + 100\` is not.

For non-idempotent operations, use an **idempotency key**: the client generates a UUID and sends it as a header. The server stores it with the result.

\`\`\`python
import hashlib
import json
from typing import Any, Protocol

import asyncpg
from fastapi import HTTPException
from pydantic import BaseModel


class ChargeRequest(BaseModel):
    customer_id: str
    amount_cents: int
    currency: str


class PaymentProvider(Protocol):
    async def charge(self, req: ChargeRequest) -> dict[str, Any]: ...


def request_digest(req: ChargeRequest) -> str:
    # model_dump_json is stable for a given model: field order is declaration order.
    return hashlib.sha256(req.model_dump_json().encode()).hexdigest()


async def create_charge(
    conn: asyncpg.Connection,
    provider: PaymentProvider,
    key: str,
    req: ChargeRequest,
) -> dict[str, Any]:
    digest = request_digest(req)

    # Claim the key atomically. If the insert conflicts, someone got here first.
    claimed = await conn.fetchval(
        """
        insert into idempotency_keys (key, request_hash, status)
        values ($1, $2, 'in_progress')
        on conflict (key) do nothing
        returning key
        """,
        key,
        digest,
    )

    if claimed is None:
        prior = await conn.fetchrow(
            "select request_hash, status, response"
            "  from idempotency_keys where key = $1",
            key,
        )
        # Same key, different body: the client has a bug. Fail loudly.
        if prior["request_hash"] != digest:
            raise HTTPException(422, "idempotency key reused with a different body")
        if prior["status"] == "in_progress":
            raise HTTPException(409, "request already in flight, retry shortly")
        return json.loads(prior["response"])

    charge = await provider.charge(req)  # the real, unsafe work
    await conn.execute(
        "update idempotency_keys set status = 'done', response = $2 where key = $1",
        key,
        json.dumps(charge),
    )
    return charge
\`\`\`

Points that earn credit: the key is claimed *before* the side effect, the request body is hashed so a reused key with different content is rejected, concurrent duplicates get a 409 rather than a double charge, and keys expire (24h TTL) so the table doesn't grow forever.

### Retry policy

Retrying naively turns a blip into an outage — every client retrying in lockstep is a self-inflicted DDoS.

- **Only retry retryable errors:** timeouts, connection resets, 429, 502/503/504. Never retry a 400 or 422; the request is wrong and will stay wrong.
- **Exponential backoff with full jitter:** \`sleep = random(0, min(cap, base * 2 ** attempt))\`. The jitter matters more than the exponent — without it, retries synchronize.
- **Cap total attempts and total time.** Prefer a deadline propagated through the call chain so a retry at depth 3 doesn't blow the user's budget.
- **Circuit breaker:** after N consecutive failures, open the circuit and fail fast for a cooldown, then let a single probe through (half-open). This stops you hammering a dying dependency and gives it room to recover.
- **Retry budgets:** allow retries to be at most ~10% of total requests. Under a broad outage, retries stop amplifying.

\`\`\`python
import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import TypeVar

import httpx

T = TypeVar("T")

RETRYABLE_STATUS = frozenset({429, 502, 503, 504})


def is_retryable(err: BaseException) -> bool:
    if isinstance(err, (httpx.TimeoutException, httpx.ConnectError)):
        return True
    if isinstance(err, httpx.HTTPStatusError):
        return err.response.status_code in RETRYABLE_STATUS
    return False


async def with_retry(
    fn: Callable[[], Awaitable[T]],
    attempts: int = 4,
    base: float = 0.1,
    cap: float = 8.0,
) -> T:
    for i in range(attempts):
        try:
            return await fn()
        except Exception as err:
            if not is_retryable(err) or i == attempts - 1:
                raise
            # Full jitter: sleep uniformly in [0, min(cap, base * 2**i)] seconds.
            # The randomness is the important half. Without it every client that
            # failed at the same instant retries at the same instant, and the
            # dependency you are waiting on is hit by a thundering herd exactly
            # as it tries to recover.
            await asyncio.sleep(random.uniform(0, min(cap, base * 2**i)))
    raise AssertionError("unreachable")
\`\`\`

### Timeouts

Every network call gets a timeout. A call with no timeout eventually exhausts your thread or connection pool, and one slow dependency takes down a service that doesn't even need it. Set timeouts shorter as you go deeper in the call chain, so an inner call fails before the outer one gives up.`,
    },
    {
      id: "observability",
      heading: "Observability: how you know it works",
      markdown: `Adding "and I'd instrument it" to a design costs ten seconds and is a strong differentiator, because it shows you have operated something rather than only drawn it.

### The three signals

- **Metrics** — cheap numeric aggregates over time. Counters, gauges, histograms. Use for dashboards and alerts. Cardinality is the trap: a label with \`user_id\` in it will destroy your metrics backend.
- **Logs** — discrete events with context. Make them **structured** (JSON, not string concatenation) so they're queryable, and always include a request id, user id, and route. Sample high-volume debug logs; never sample errors.
- **Traces** — a single request's path across services, with timing per hop. A trace id is generated at the edge and propagated in headers; each service adds spans. This is the only practical way to answer "why was this specific request slow."

### Measure percentiles, not averages

Averages hide everything. If 99% of requests take 50 ms and 1% take 10 s, the average is 150 ms and looks fine — while 1 in 100 users has a broken experience. Report **p50, p95, p99, p99.9**.

Also note **tail amplification**: a page that makes 10 parallel backend calls and waits for all of them experiences roughly the p99 of the slowest, so its own p50 is dominated by the backends' tails. This is why fan-out designs need hedged requests or per-call deadlines.

### The four golden signals

**Latency** (split successful vs failed — fast errors flatter your numbers), **traffic** (QPS), **errors** (rate and class), **saturation** (how full the constrained resource is: CPU, memory, connection pool, queue depth, disk). If you can only have four dashboards, have these.

### SLI, SLO, error budget

An **SLI** is the measurement ("fraction of requests served in under 300 ms"). An **SLO** is the target ("99.9% over 30 days"). The **error budget** is the remaining 0.1% — about 43 minutes a month — and it is what makes the tradeoff concrete: if the budget is spent, you stop shipping features and fix reliability. 100% is never the target; it costs infinitely more than 99.9% and users can't tell.

### Health checks

Distinguish **liveness** ("is the process wedged? restart it") from **readiness** ("can it serve traffic right now? — its DB pool is warm, its caches are loaded"). Conflating them causes restart loops during a dependency outage. A readiness check that itself calls three downstream services will take you down when any of them blinks — check only what you truly need.`,
    },
    {
      id: "design-url-shortener",
      heading: "Worked design 1: URL shortener",
      markdown: `### Requirements

*Functional:* shorten a long URL to a short code; redirect a short code to the original; optional custom alias; optional expiry; count clicks.
*Non-functional:* redirects are the hot path and must be fast (< 50 ms) and highly available; heavily read-skewed; short codes must be permanent.
*Out of scope:* auth, analytics dashboards, spam detection.

### Estimation

100M new URLs/day → ~1,200 writes/sec average, ~3,000 peak. 100:1 read ratio → ~120,000 redirects/sec. Storage: ~500 bytes/row × 100M/day × 365 × 5 years ≈ 90 TB — big, but a sharded KV store handles it, and it tells you not to store anything extra per row.

Code length: with a 62-character alphabet (\`a-zA-Z0-9\`), 62^7 ≈ 3.5 trillion — 7 characters covers 100 years at this rate. Use 7.

### API

\`\`\`http
POST /api/v1/urls
Content-Type: application/json
Idempotency-Key: 9f1c...

{ "longUrl": "https://example.com/a/very/long/path", "customAlias": null, "expiresAt": null }

201 Created
{ "shortUrl": "https://sho.rt/aX9k2Lq", "code": "aX9k2Lq", "expiresAt": null }
\`\`\`

\`\`\`http
GET /aX9k2Lq
301/302 -> Location: https://example.com/a/very/long/path
\`\`\`

\`301\` is permanent: browsers cache it aggressively, so subsequent visits never reach your servers — cheapest, but you lose click counts and can never change the target. \`302\` sends every click through you, enabling analytics and edits at the cost of traffic. **Say the tradeoff and pick 302 if click counting is a requirement.**

### Data model

\`\`\`sql
CREATE TABLE urls (
  code        VARCHAR(7)  PRIMARY KEY,   -- shard key
  long_url    TEXT        NOT NULL,
  user_id     BIGINT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ
);
CREATE INDEX urls_user_created_idx ON urls (user_id, created_at DESC);
\`\`\`

Click events are *not* a column on this table — a counter update per redirect means 120k writes/sec against the hot path. They go to a queue as events and are aggregated:

\`\`\`sql
CREATE TABLE click_counts (
  code   VARCHAR(7),
  day    DATE,
  clicks BIGINT NOT NULL,
  PRIMARY KEY (code, day)
);
\`\`\`

### Generating the code — three options

1. **Hash the URL** (\`base62(md5(url))[:7]\`). Stateless and deduplicates identical URLs, but you must handle collisions: check-and-retry with a salt, which costs a read on every write.
2. **Random 7 chars.** Unguessable, no coordination, but needs a uniqueness check (a \`INSERT ... ON CONFLICT DO NOTHING\` retry loop). At 3.5 trillion possibilities and 100M/day, collisions are rare enough that the retry loop almost never fires.
3. **Counter + base62 encode.** A global monotonic counter, base62-encoded, gives the shortest possible codes with zero collisions. The counter is the problem: a single sequence is a bottleneck and a SPOF. Fix it with **ranged allocation** — each app server claims a block of 10,000 ids from ZooKeeper/a \`counters\` row and hands them out locally, refilling in the background. Downside: codes are sequential and therefore enumerable, letting anyone crawl every link.

**Pick:** random 7 chars, because unguessability is a real product requirement (people paste private docs into shorteners) and it needs no coordination service.

### Components

\`\`\`text
                    ┌─────────────┐
   POST /api/urls   │             │ 1. write DB, 2. warm cache
  ─────────────────▶│  Write API  │──────────────┬────────────────┐
                    │             │              ▼                ▼
                    └─────────────┘        ┌──────────┐    ┌────────────┐
                                           │  Redis   │    │  Sharded   │
   GET /:code       ┌─────────────┐  hit   │  cache   │    │  KV / SQL  │
  ────▶ CDN/LB ────▶│ Redirect API│◀──────▶│ (LRU+TTL)│◀───│  by code   │
                    │             │  miss  └──────────┘    └────────────┘
                    └──────┬──────┘
                           │ click event (fire-and-forget)
                           ▼
                    ┌────────────┐    ┌────────────┐    ┌──────────────┐
                    │   Kafka    │───▶│  Aggregator│───▶│ click_counts │
                    └────────────┘    └────────────┘    └──────────────┘
\`\`\`

**Read path:** LB → redirect service → Redis \`GET url:aX9k2Lq\` → on hit, return 302 immediately and emit a click event asynchronously; on miss, read the shard, populate the cache with a jittered TTL, return.

**Write path:** generate code → \`INSERT ... ON CONFLICT DO NOTHING\`, regenerate on conflict → write-through to cache → return.

### Scaling it

- Redirects are pure key lookups, so the app tier is stateless and scales linearly behind the LB.
- Cache hit rate should be very high — link popularity is heavily Zipfian, so a small hot set serves most traffic. At 95% hits, the datastore sees ~6k reads/sec, which a handful of shards handle.
- Shard by \`hash(code)\`, using consistent hashing with virtual nodes so adding capacity moves ~1/N of keys.
- Because rows are immutable once written, a stale cache entry is impossible except for deletes/expiry — so TTLs can be long and invalidation is a non-issue. **Call this out; it's the nicest property of the design.**
- Put the redirect endpoint behind a CDN with a short edge TTL if you can accept slightly delayed click counts.

### Tradeoffs to state

- 302 over 301: pays traffic for click counts and editability.
- Random codes over sequential: pays a uniqueness check for unguessability.
- Async click counting: click totals are eventually consistent (seconds behind) — acceptable, and it keeps the hot path a single cache read.
- SQL with sharding over a managed KV: keeps the option of custom aliases with a unique constraint and easy \`user_id\` listing; a pure KV would be simpler but needs a second index structure for "my links".`,
    },
    {
      id: "design-rate-limiter",
      heading: "Worked design 2: distributed rate limiter",
      markdown: `### Requirements

*Functional:* limit a caller to N requests per window; limits configurable per API key, per endpoint, and per IP; over-limit requests get \`429\` with a \`Retry-After\`.
*Non-functional:* adds < 5 ms to a request; must not become a SPOF (if the limiter is down, prefer letting traffic through to blocking everything); accurate enough to stop abuse, not to bill on.

### The algorithms

**Fixed window counter.** \`INCR key:{user}:{minute}\` with a 60s expiry. One counter, trivially cheap. Flaw: a client can send N requests at 11:59:59 and N more at 12:00:00 — **2x the limit across a window boundary**.

**Sliding window log.** Store a timestamp per request in a sorted set; drop entries older than the window; count what remains. Perfectly accurate, but memory is O(requests) per user — expensive at high limits.

**Sliding window counter.** Interpolate between the previous and current fixed windows:

\`\`\`text
estimate = current_count + previous_count * (overlap_fraction_of_previous_window)

e.g. at 12:00:15 with a 60s window:
  previous window count = 80, current = 12
  estimate = 12 + 80 * (45/60) = 72
\`\`\`

Two counters per key, no boundary burst, small error under non-uniform traffic. **This is the usual right answer** for HTTP APIs.

**Token bucket.** A bucket holds up to \`capacity\` tokens and refills at \`rate\` tokens/sec. Each request takes one; empty bucket means reject. Allows controlled bursts up to \`capacity\` while bounding the long-run rate — which matches how people actually use APIs. Two numbers of state (\`tokens\`, \`last_refill\`), computed lazily so no background timer is needed.

**Leaky bucket.** A FIFO queue drained at a constant rate. Smooths output completely (good in front of a fragile downstream), but queues requests instead of rejecting them, adding latency, and a full queue drops the *newest* requests.

**Pick:** token bucket for per-client API limits (bursts are legitimate), leaky bucket only when protecting something that needs a strictly even rate.

### Data model (Redis)

\`\`\`text
HASH  rl:{scope}:{identity}   ->  { tokens: "8.5", ts: "1753651200.123" }
TTL   = ceil(capacity / rate) + slack   # let idle keys expire
\`\`\`

### Implementation: atomic token bucket in Lua

The read-modify-write must be atomic or two concurrent requests both see the same token count. Redis runs a Lua script atomically on a single node, which is exactly the primitive needed.

\`\`\`lua
-- KEYS[1] = bucket key
-- ARGV[1] = capacity, ARGV[2] = refill rate (tokens/sec)
-- ARGV[3] = now (seconds, float), ARGV[4] = tokens requested
local capacity = tonumber(ARGV[1])
local rate     = tonumber(ARGV[2])
local now      = tonumber(ARGV[3])
local want     = tonumber(ARGV[4])

local state  = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(state[1])
local ts     = tonumber(state[2])
if tokens == nil then tokens = capacity; ts = now end

-- lazy refill: no timers, just elapsed time since last touch
tokens = math.min(capacity, tokens + (now - ts) * rate)

local allowed = 0
local retry_after = 0
if tokens >= want then
  tokens = tokens - want
  allowed = 1
else
  retry_after = (want - tokens) / rate
end

redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('EXPIRE', KEYS[1], math.ceil(capacity / rate) + 60)
return { allowed, tokens, retry_after }
\`\`\`

\`\`\`python
import time

from fastapi import HTTPException, Response
from redis.asyncio import Redis

redis = Redis.from_url("redis://localhost:6379")
# register_script sends EVALSHA and falls back to EVAL once, so the script body
# crosses the wire at most once per Redis node.
token_bucket = redis.register_script(TOKEN_BUCKET_LUA)


async def enforce_rate_limit(
    api_key: str, response: Response, capacity: int = 100, rate: float = 10.0
) -> None:
    # Redis converts the Lua numbers to integers on the way out, so these arrive
    # already truncated — retry_after of 0 means "less than a second".
    allowed, remaining, retry_after = await token_bucket(
        keys=[f"rl:api:{api_key}"],
        args=[capacity, rate, time.time(), 1],
    )

    response.headers["X-RateLimit-Limit"] = str(capacity)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail={"error": "rate_limited"},
            headers={"Retry-After": str(max(1, retry_after))},
        )
\`\`\`

Note the clock comes from the caller, so all limiter nodes must agree on time (NTP). Passing \`redis.call('TIME')\` instead makes the script non-deterministic for replication in older Redis — a genuinely good detail to mention.

### Components

\`\`\`text
client ──▶ LB ──▶ API gateway ──▶ [rate limit middleware] ──▶ service
                                        │
                                        ├─ local in-process bucket (fast path,
                                        │   catches obvious floods with 0 network)
                                        └─ Redis cluster (shared, authoritative)
                                              keys sharded by identity
config: rules table (scope, identity_pattern, capacity, rate) cached in-process, 30s TTL
\`\`\`

### Scaling and failure

- **Where does it run?** At the API gateway/edge, before any expensive work. Running it inside each service means the request already cost you a connection and a router hop.
- **Sharding:** the key includes the identity, so keys spread naturally across a Redis cluster. Each check is one round trip to one node, ~1 ms in-datacenter.
- **Hot identity:** one abusive key hammers one Redis node. Mitigate with a local in-process bucket that rejects the clear-cut floods without touching Redis at all.
- **Reducing Redis load at scale:** give each gateway node a *share* of the budget (limit/N) and reconcile periodically. Less accurate, far fewer round trips.
- **Fail-open vs fail-closed:** if Redis is unreachable, fail **open** for normal API limiting (better to serve traffic than to have a cache outage become a total outage), but fail **closed** for anything protecting money or auth (login attempts, password reset). Stating that this depends on what's being protected is the mature answer.

### Tradeoffs to state

- Token bucket over sliding window: allows bursts, which real clients need; slightly harder to explain to users than "100 per minute".
- Centralized Redis over per-node limits: accurate global enforcement at the cost of a network hop and a dependency; per-node is faster but lets a client get Nx the limit by spraying across nodes.
- Returning \`Retry-After\` and \`X-RateLimit-*\` headers isn't decoration — without them, well-behaved clients can only retry blindly, which makes the overload worse.`,
    },
    {
      id: "design-news-feed",
      heading: "Worked design 3: news feed",
      markdown: `### Requirements

*Functional:* post; follow/unfollow; see a feed of posts from people you follow, newest first; feed loads paginated.
*Non-functional:* feed load must be fast (< 200 ms) because it is the app's front door; posting can be slower; eventual consistency of a few seconds is acceptable ("your friend's post shows up a moment late" is fine).
*Out of scope:* ranking/ML, ads, comments, media processing.

### Estimation

300M DAU, each opening the feed 10x/day → 3B feed reads/day ≈ 35,000 reads/sec average, ~100k peak. 2 posts/user/day for 10% of users → 60M posts/day ≈ 700 writes/sec. **Read:write ≈ 50:1.** That ratio is the whole design: do work at write time so read time is cheap.

### API

\`\`\`http
POST /api/v1/posts        { "text": "...", "mediaIds": [] }        -> 201 { post }
GET  /api/v1/feed?cursor=<opaque>&limit=20                          -> 200 { items, nextCursor }
POST /api/v1/users/:id/follow                                       -> 204
\`\`\`

**Use cursor pagination, never \`OFFSET\`.** With offset, new posts arriving between page loads shift every item, so users see duplicates and gaps; and \`OFFSET 100000\` makes the database walk 100,000 rows. The cursor encodes \`(created_at, post_id)\` of the last item seen, and the query becomes an index range scan:

\`\`\`sql
WHERE (created_at, id) < ($cursor_ts, $cursor_id) ORDER BY created_at DESC, id DESC LIMIT 20
\`\`\`

### Data model

\`\`\`sql
CREATE TABLE posts (
  id          BIGINT PRIMARY KEY,        -- Snowflake: time-sortable
  author_id   BIGINT NOT NULL,
  text        TEXT   NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX posts_author_time_idx ON posts (author_id, id DESC);

CREATE TABLE follows (
  follower_id BIGINT NOT NULL,
  followee_id BIGINT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);
-- The reverse index is what fan-out needs: "who follows X?"
CREATE INDEX follows_followee_idx ON follows (followee_id, follower_id);
\`\`\`

The feed itself lives in Redis, one list per user, capped:

\`\`\`text
LIST  feed:{user_id}  ->  [post_id, post_id, ...]   (LPUSH + LTRIM to 800)
HASH  post:{post_id}  ->  the rendered post object   (TTL 7d)
\`\`\`

**Snowflake ids** matter here: a 64-bit id of \`[41-bit ms timestamp | 10-bit machine id | 12-bit sequence]\` is globally unique without coordination *and* sorts by time, so "newest first" is just "highest id first" and cursors are a single integer.

### The core choice: fan-out on write vs on read

**Fan-out on write (push).** When Alice posts, immediately append the post id to the feed list of every follower. Reading a feed is then one Redis \`LRANGE\` plus a multi-get of post bodies — a few milliseconds.

- *Cost:* a post by someone with 10M followers is 10M list writes. That's the "celebrity problem": one write becomes a storm, and most of those followers are inactive and will never read it.

**Fan-out on read (pull).** Store nothing precomputed. On feed load, fetch the followee list, query recent posts from each, merge, sort.

- *Cost:* a user following 2,000 accounts triggers a 2,000-way scatter-gather on every feed open, at 35k feed opens/sec. Unworkable as the default.

**The answer is hybrid, and saying so is the point of the question:**

- Fan-out on write for normal accounts (below ~10k followers).
- For celebrities, **don't fan out**. At read time, merge the user's precomputed feed with a live query of the handful of celebrities they follow (whose recent posts are themselves cached, so it's a couple of cache reads).
- Skip fan-out to accounts inactive for 30+ days; rebuild their feed lazily on next login.
- Cap stored feeds at ~800 entries. Anyone paginating past that falls back to the pull path — rare enough not to matter.

### Components

\`\`\`text
POST /posts
   │
   ▼
┌───────────┐   write post   ┌────────────┐
│ Post svc  │───────────────▶│ posts (SQL,│
└─────┬─────┘                │ sharded by │
      │ emit post_created    │ author_id) │
      ▼                      └────────────┘
┌───────────┐   partitioned by author_id
│  Kafka    │
└─────┬─────┘
      ▼
┌──────────────┐  read followers (excluding celebs & inactive)
│ Fanout worker│──────────────▶ follows (SQL/graph store)
└──────┬───────┘
       │ LPUSH feed:{follower} + LTRIM
       ▼
┌──────────────┐        GET /feed        ┌───────────┐
│ Redis feeds  │◀────────────────────────│ Feed svc  │──▶ merge with
└──────────────┘   LRANGE + MGET posts   └───────────┘    celebrity posts
\`\`\`

### Scaling notes

- Fan-out is embarrassingly parallel: partition Kafka by \`author_id\` and run as many workers as needed. Watch **consumer lag** — that lag *is* "how stale is the feed", so it's the metric to alert on.
- Shard \`posts\` by \`author_id\` (keeps an author's timeline on one shard) and \`follows\` by \`follower_id\` for "who do I follow" plus a reverse-sharded copy by \`followee_id\` for fan-out. Denormalizing the follow graph into two tables is a deliberate, explainable choice.
- Store post ids in the feed list, not post bodies: an edited or deleted post is fixed in one place instead of 10M, and memory stays small (8 bytes × 800 vs kilobytes × 800).
- Deletes are handled at read time — filter out ids whose post hash is gone — rather than by scrubbing millions of lists.

### Tradeoffs to state

- Precomputing feeds trades storage and write amplification for read latency — correct given 50:1 reads.
- The hybrid adds real complexity (two code paths, a follower-count threshold, a merge step) and is only justified by the celebrity tail. Say that you'd start pure push and add the pull path when a real account crosses the threshold.
- Feeds are eventually consistent: a post may take seconds to appear for everyone. The exception is the author, who must see their own post immediately — inject it client-side or write to the author's own feed synchronously (read-your-writes).`,
    },
    {
      id: "design-chat",
      heading: "Worked design 4: chat application",
      markdown: `### Requirements

*Functional:* 1:1 and small group messaging; messages delivered in real time to online users and reliably stored for offline ones; message history with pagination; delivered/read receipts; online presence.
*Non-functional:* end-to-end delivery latency < 500 ms; **no message loss ever** (the one hard durability requirement); messages within a conversation must appear in a consistent order.
*Out of scope:* end-to-end encryption, voice/video, media.

### Estimation

50M DAU, 40 messages/user/day → 2B messages/day ≈ 23,000 messages/sec average, ~70k peak. Each message ~200 bytes + metadata → ~500 GB/day, ~180 TB/year. And critically: **50M concurrent-ish WebSocket connections.** At a realistic 50k-100k connections per gateway node, that's 500-1,000 gateway machines. Connection count, not CPU, is the sizing constraint — a fact worth naming.

### Transport: why WebSocket

Polling wastes a full HTTP round trip per check and adds up to the poll interval in latency. Long polling is better but still one connection per message, with reconnect churn. SSE is server→client only — fine for notifications, wrong for chat. **WebSocket** gives a single persistent, bidirectional, low-overhead connection (2-14 bytes of frame header vs hundreds of bytes of HTTP headers). Mobile clients fall back to push notifications when backgrounded, because the OS will kill the socket.

### API

\`\`\`text
WS   /ws?token=<jwt>
  C→S  {"type":"send","clientMsgId":"uuid","conversationId":"c_9","text":"hi"}
  S→C  {"type":"ack","clientMsgId":"uuid","messageId":"01HX...","seq":4821,"ts":...}
  S→C  {"type":"message","conversationId":"c_9","messageId":"01HX...","seq":4822,...}
  S→C  {"type":"receipt","messageId":"01HX...","userId":"u_3","state":"read"}
  C→S  {"type":"ping"}    # app-level heartbeat every ~30s

HTTP GET  /api/v1/conversations/:id/messages?before=<seq>&limit=50
HTTP POST /api/v1/conversations           { "memberIds": ["u_3","u_7"] }
\`\`\`

The \`clientMsgId\` is the idempotency key: on a flaky network the client resends, and the server returns the original ack instead of creating a duplicate. This is *the* detail that separates a designed chat app from a drawn one.

### Data model

Messages are write-heavy, immutable, and always queried as "the last N in this conversation" — a perfect fit for a wide-column store (Cassandra) or a sharded SQL table partitioned by conversation.

\`\`\`sql
CREATE TABLE messages (
  conversation_id BIGINT      NOT NULL,   -- partition/shard key
  seq             BIGINT      NOT NULL,   -- per-conversation monotonic counter
  message_id      UUID        NOT NULL,
  sender_id       BIGINT      NOT NULL,
  body            TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, seq DESC)  -- clustered: last N is a range scan
);

CREATE TABLE conversation_members (
  conversation_id BIGINT NOT NULL,
  user_id         BIGINT NOT NULL,
  last_read_seq   BIGINT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, conversation_id)   -- "my conversation list"
);

CREATE TABLE client_msg_ids (            -- dedupe window
  client_msg_id UUID PRIMARY KEY,
  message_id    UUID NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()   -- TTL 24h
);
\`\`\`

**Ordering is per conversation, not global.** A per-conversation \`seq\` (allocated by the single shard that owns the conversation, or by a Redis \`INCR\`) gives every member the same order and makes "give me everything after seq 4821" a trivial catch-up query. Wall-clock timestamps from clients cannot do this — clocks disagree.

Read receipts as a single \`last_read_seq\` per member is much cheaper than a row per (message, user): one update per read event instead of N, and everything below the watermark is implicitly read.

### Components

\`\`\`text
                 ┌────────────────────────────────────────────┐
  mobile/web ───▶│  WS gateway fleet (stateful!)              │
   WebSocket     │  holds sockets; registry: user → node      │
                 └──────┬──────────────────────────┬──────────┘
                        │ inbound message          │ deliver
                        ▼                          ▲
                 ┌────────────┐              ┌─────┴──────┐
                 │ Chat svc   │              │ Pub/Sub    │  Redis / Kafka
                 │ dedupe,    │─────────────▶│ per-node   │  topic per gateway
                 │ seq alloc, │              │ channels   │  node
                 │ persist    │              └────────────┘
                 └─────┬──────┘
                       ├────────▶ messages store (sharded by conversation_id)
                       └────────▶ push queue ──▶ APNs/FCM for offline members
    presence: Redis  key online:{user} = node_id, TTL 45s, refreshed by heartbeat
\`\`\`

**Send path, step by step:** client sends over its socket → gateway forwards to chat service → dedupe on \`clientMsgId\` → allocate \`seq\` → **persist durably** → ack the sender → look up each recipient in the connection registry → publish to that gateway node's channel → gateway writes the frame to the socket. Offline recipients get a push notification and will pull on reconnect.

**Persist before ack.** If you ack first and the write fails, the sender believes a message was delivered that no longer exists. This ordering is the durability requirement in one sentence.

**Reconnect path:** client stores the highest \`seq\` it has per conversation and sends them on connect; the server streams everything after. No message loss across disconnects, and no need for a server-side per-user outbox.

### Scaling and failure

- Gateways are the one **stateful** tier. Route with least-connections (not round robin — connections are long-lived and uneven). A user↔node registry in Redis with a TTL lets any node find where to deliver.
- **Node death:** all its sockets drop. Clients reconnect with jittered backoff (without jitter, 100k clients reconnecting simultaneously will kill the next node). Because catch-up is driven by \`seq\`, recovery is automatic.
- **Group chat fan-out** is bounded by group size. For small groups, fan out on write to each member. For large channels (10k+ members), switch to fan-out on read: members subscribe to the conversation topic and pull, exactly as with the news feed's celebrity path.
- **Presence is expensive** and mostly worthless at scale — a naive design broadcasts every state change to every contact, which is O(contacts) writes per user per flap. Use a heartbeat + TTL key, only compute presence for conversations currently on screen, and debounce.
- Old messages tier to cheaper cold storage after 90 days; the hot path only ever touches recent \`seq\` ranges.

### Tradeoffs to state

- WebSocket over long polling: lower latency and overhead, at the cost of a stateful tier, connection-count-driven capacity planning, and harder deploys (rolling a gateway drops thousands of sockets — drain gradually).
- Per-conversation ordering over global ordering: gives users what they perceive as correct order without any global coordination.
- Cassandra-style store over a single SQL cluster: matches the write volume and the "last N by key" access pattern; costs you joins and ad-hoc queries, which chat doesn't need.`,
    },
    {
      id: "design-file-upload",
      heading: "Worked design 5: file upload and storage service",
      markdown: `### Requirements

*Functional:* upload a file (up to 5 GB); download it; list your files; share via link; resume an interrupted upload.
*Non-functional:* uploads must survive flaky networks; downloads should be fast worldwide; storage must be durable (no data loss); large files must not go through application servers.
*Out of scope:* real-time collaborative editing, versioning UI, folder sync.

### Estimation

10M uploads/day at an average of 5 MB → 50 TB/day ingested, ~600 MB/s sustained ingest, and ~18 PB/year before replication. That number alone rules out storing bytes in your database or on your app servers: **object storage (S3/GCS) is the only sane answer**, and the design question becomes "how do bytes get there and back without touching my servers?"

### The central idea: presigned URLs

Never proxy 5 GB through your API. Your app server's job is authorization and metadata; the bytes go **client → object store, directly**. A presigned URL is a URL with a signature, an expiry, and constraints (bucket, key, method, max size, content type) baked in — the object store verifies the signature itself, so it enforces your authorization decision without calling you.

\`\`\`text
Proxying through app servers          Presigned direct-to-S3
─────────────────────────────         ─────────────────────────
client → app (5 GB) → S3              client → app (200 bytes: "may I?")
                                      app   → client (presigned URL)
                                      client → S3 (5 GB)
                                      S3    → app (event: upload complete)

app bandwidth: 600 MB/s in + out      app bandwidth: negligible
app scaling driven by file size       app scaling driven by request count
\`\`\`

### API

\`\`\`http
POST /api/v1/uploads
{ "filename": "lecture.mp4", "sizeBytes": 5368709120, "contentType": "video/mp4",
  "sha256": "9f86d0..." }

201 Created
{
  "uploadId": "up_01HX...",
  "fileId":   "f_01HX...",
  "partSizeBytes": 8388608,
  "parts": [
    { "partNumber": 1, "url": "https://s3.../?partNumber=1&X-Amz-Signature=...", "expiresAt": "..." },
    { "partNumber": 2, "url": "...", "expiresAt": "..." }
  ]
}
\`\`\`

\`\`\`http
PUT <presigned part url>            # client uploads each part directly, in parallel
  -> 200, ETag: "d41d8c..."

POST /api/v1/uploads/up_01HX.../complete
{ "parts": [ { "partNumber": 1, "etag": "d41d8c..." }, ... ] }
  -> 200 { "fileId": "f_01HX...", "status": "processing" }

GET  /api/v1/uploads/up_01HX...     # resume: which parts are already stored?
  -> 200 { "uploaded": [1,2,3,7], "missing": [4,5,6,8] }

GET  /api/v1/files/f_01HX.../download
  -> 302 Location: https://cdn.example.com/...?signature=...&expires=...
\`\`\`

### Data model

\`\`\`sql
CREATE TABLE files (
  id           UUID PRIMARY KEY,
  owner_id     BIGINT      NOT NULL,
  filename     TEXT        NOT NULL,
  size_bytes   BIGINT      NOT NULL,
  content_type TEXT        NOT NULL,
  sha256       CHAR(64)    NOT NULL,        -- content address: enables dedupe
  storage_key  TEXT        NOT NULL,        -- 'blobs/9f/86/9f86d0...'
  status       TEXT        NOT NULL,        -- pending|uploaded|scanning|ready|failed
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX files_owner_idx  ON files (owner_id, created_at DESC);
CREATE INDEX files_sha256_idx ON files (sha256);

CREATE TABLE upload_sessions (
  id             UUID PRIMARY KEY,
  file_id        UUID NOT NULL REFERENCES files(id),
  s3_upload_id   TEXT NOT NULL,
  part_size      INT  NOT NULL,
  expires_at     TIMESTAMPTZ NOT NULL       -- abandoned uploads get reaped
);

CREATE TABLE upload_parts (
  session_id  UUID NOT NULL REFERENCES upload_sessions(id),
  part_number INT  NOT NULL,
  etag        TEXT NOT NULL,
  PRIMARY KEY (session_id, part_number)
);
\`\`\`

**Metadata in SQL, bytes in object storage.** The database row is ~300 bytes; 10M/day is 3 GB/day of metadata, which one sharded Postgres handles for years.

### Chunking, resumption, and dedupe

- **Chunk into fixed parts (8-16 MB).** A failed part retries alone instead of restarting 5 GB. Parts upload in parallel (4-8 at a time), which also beats single-stream TCP throughput on long-haul links.
- **Resume** = ask the server which part numbers it has and upload only the missing ones. The upload session is server-side state, so a client can resume from a different device or after a crash.
- **Deduplicate by content hash.** The client hashes the file first; if a row with that \`sha256\` already exists and the caller is authorized to create a reference, you create a metadata row pointing at the same \`storage_key\` and upload **zero bytes**. For a Dropbox-like product this is an enormous win. Caveat worth mentioning: cross-user dedupe leaks existence information ("this file is already known to the system"), so many products dedupe only within a user's own account.
- Verify the hash server-side after assembly. A client-asserted hash is a hint, not a guarantee.

### Components

\`\`\`text
                       ┌─────────────┐   authz, metadata, presign
   client ────────────▶│  Upload API │──────▶ metadata DB (sharded by owner_id)
     │  (small JSON)   └─────────────┘
     │
     │  PUT parts (large bytes, direct)
     ▼
┌──────────────┐   ObjectCreated event   ┌────────────┐
│Object storage│────────────────────────▶│   Queue    │
│  (S3/GCS)    │                          └─────┬──────┘
└──────┬───────┘                                ▼
       │                            ┌────────────────────────┐
       │ origin                     │ Workers:               │
       ▼                            │  verify hash           │
┌──────────────┐                    │  virus scan            │
│     CDN      │──▶ downloads       │  thumbnails/transcode  │
│ signed URLs  │                    │  set status = ready    │
└──────────────┘                    └────────────────────────┘
\`\`\`

### Scaling, durability, security

- **Downloads** are served by the CDN from signed URLs with short expiries (minutes). The CDN handles the global bandwidth; your origin sees only cache misses. Signed URLs mean you don't have to make the bucket public, and revocation is bounded by the expiry.
- **Durability** comes from the object store (S3 quotes 11 nines by replicating across availability zones). Say that you rely on it rather than reinventing replication; add cross-region replication and versioning if the requirement is disaster recovery or accidental-delete protection.
- **Storage classes:** hot objects on standard storage, objects untouched for 90 days transitioned to infrequent-access/archive by lifecycle policy. At 18 PB/year this is the single biggest cost lever.
- **Security:** always validate size and content type server-side before signing (the presigned policy should encode the max size — otherwise a client uploads 500 GB); never trust the client's filename for the storage key (path traversal, collisions) — use a UUID or the content hash; serve user content from a **separate domain** so a malicious HTML upload can't run scripts against your session cookies; scan asynchronously and keep the file in \`scanning\` status until it passes.
- **Garbage collection:** presigned uploads that are never completed leave orphaned multipart data. A reaper aborts sessions past \`expires_at\` (or an object-store lifecycle rule does it) — otherwise you pay for bytes nobody can see.

### Tradeoffs to state

- Direct-to-object-store over proxying: removes your servers from the bandwidth path entirely, at the cost of asynchronous completion (you find out via an event, so the file has a \`status\` lifecycle rather than being ready when the request returns).
- Multipart over a single PUT: complexity in the client and server-side session state, bought with resumability and parallelism — mandatory above ~100 MB.
- Content-addressed storage: free dedupe and idempotent uploads, but deleting a file becomes reference counting rather than a delete, and the privacy caveat above applies.`,
    },
  ],
  questions: [
    {
      q: "Walk me through how you'd approach a design question you've never seen before.",
      a: "Six steps, timeboxed. (1) Clarify requirements — functional as verbs, non-functional as numbers (scale, latency target, read/write ratio, consistency needs), and explicitly declare what's out of scope. (2) Write the API: 3-5 endpoints with request/response shapes, because the API forces the data model. (3) Data model: tables, primary keys, and the indexes each access pattern needs. (4) Draw the components and trace one write and one read end to end. (5) Apply pressure — where does it break at 10x, and fix that one thing (cache, replicas, shard, async). (6) Name two decisions and the alternatives I rejected, with costs. Throughout, state assumptions out loud rather than silently picking a scale.",
      weak: "I'd draw a load balancer, some microservices, Redis, and Kafka, then explain what each one does.",
    },
    {
      q: "Estimate the storage and QPS for a service where 100M users each post twice a day and read 100x more than they write.",
      a: "200M writes/day ÷ 86,400 ≈ 2,300 writes/sec average, so ~7,000 at a 3x peak. Reads are 100x: ~230,000/sec. At ~1 KB per post that's 200 GB/day, ~73 TB/year, ~220 TB with 3x replication. Conclusions: 7k writes/sec doesn't fit one primary so I shard or batch; 230k reads/sec mandates a cache — at 90% hit rate the DB still sees 23k reads/sec, so read replicas too; and 73 TB/year means text in the DB, any binary in object storage. The point of the arithmetic is those three conclusions, not the precision.",
      weak: "It's a lot of data, so I'd use a NoSQL database because those scale better.",
    },
    {
      q: "State CAP correctly. What do people get wrong?",
      a: "When a network partition occurs, a distributed system must choose between consistency (linearizability — every read sees the latest write) and availability (every non-failing node still answers). The common error is 'pick two of three': partition tolerance isn't optional, because networks partition whether you like it or not. Dropping P just means you have a single-node system. Also, CAP's C is linearizability specifically, not ACID's C, and its A means every node responds, which is stricter than 'the site is up'. PACELC is the more useful framing: if Partitioned, choose A or C; Else, choose Latency or Consistency — that second clause is what you're actually trading off on a normal day, since strong reads cost a coordination round trip.",
      weak: "CAP says you can only have two of consistency, availability, and partition tolerance, so you pick CA, CP, or AP.",
    },
    {
      q: "Your read latency is fine but the database is at 90% CPU. Walk through your options in order.",
      a: "First, look before scaling: find the top queries by total time and check for missing indexes and N+1 patterns. Most 'we need to scale' problems are one composite index. Second, vertical scaling — a bigger box is boring, preserves joins and transactions, and buys years. Third, read replicas if the load is read-dominated, accepting replication lag and adding read-your-writes routing so a user never fails to see their own write. Fourth, caching in front for hot keys, with jittered TTLs and delete-on-write invalidation. Fifth, partition large tables by time or region within the same server. Only then shard, because sharding costs cross-shard joins, cross-shard transactions, and rebalancing operations.",
      weak: "I'd shard the database across more machines.",
    },
    {
      q: "How do you choose a shard key, and what goes wrong if you get it wrong?",
      a: "A good shard key spreads writes evenly and keeps the data a single query needs on one shard. Hash-based distributes well but makes range queries fan out to every shard; range-based keeps ranges local but creates hotspots — sharding by timestamp is the classic failure, since all current writes land on one shard while the rest sit idle. Getting it wrong gives you hot shards, scatter-gather queries on your hot path, and a painful migration to fix it. Use consistent hashing or a large fixed number of logical shards mapped to fewer physical nodes so adding capacity moves ~1/N of keys instead of rehashing everything. Some skew is unavoidable — a celebrity's data on one shard — and is handled with a special-case read path, not a better key.",
    },
    {
      q: "A cached key expires and your database immediately falls over. What happened and how do you prevent it?",
      a: "A cache stampede: the key was hot, so thousands of concurrent requests missed at the same instant and all queried the database. Prevention is two things. Single-flight: take a short per-key lock so exactly one request recomputes and the rest wait for or briefly serve the stale value. And jittered TTLs — set expiry to base plus a random offset so keys that were populated together don't expire together. Related failure modes worth guarding: cache penetration, where lookups for nonexistent keys bypass the cache every time (cache the negative result with a short TTL), and hot keys that saturate a single cache node (replicate the key with a random suffix, or add a 1-second in-process cache).",
      weak: "I'd give it a longer TTL so it doesn't expire as often.",
    },
    {
      q: "Why do you delete a cache entry on write instead of updating it?",
      a: "Deleting is idempotent and race-safe; updating races. If two writers update the same row, their cache writes can land in the opposite order from their database writes, leaving a stale value cached permanently with nothing to correct it — until someone notices bad data days later. A delete just forces the next reader to reload from the source of truth, so the worst case is one extra miss. For derived data where one change invalidates many keys, versioned keys (user:42:v7) are better still: bumping the version invalidates atomically and leaves the old entries to expire naturally.",
    },
    {
      q: "Design an idempotent POST endpoint. Why can't you just deduplicate on the request body?",
      a: "The client generates a UUID and sends it as an Idempotency-Key header. The server claims that key with an INSERT ... ON CONFLICT DO NOTHING before performing the side effect, storing a hash of the request body alongside it. If the claim fails, the key was seen before: if it's still in progress, return 409 so the client retries; if it's done, return the stored response; if the body hash differs, return 422 because the client is reusing a key for a different request. Keys expire after ~24 hours. You can't dedupe on the body because legitimately identical requests exist — a user really might send the same $10 payment twice, or post 'ok' twice — and only the client knows whether the second one is a retry or a new intent.",
      weak: "I'd check whether an identical record already exists and skip the insert if it does.",
    },
    {
      q: "Can a queue give you exactly-once delivery?",
      a: "Not end to end. At-most-once acks before processing and loses messages on crash; at-least-once acks after processing and therefore produces duplicates, since a worker can complete the work and die before the ack lands. What people call exactly-once is at-least-once delivery plus idempotent consumers — dedupe on a message id, or make the operation naturally idempotent like SET rather than INCREMENT. Related: publishing to a queue and writing to a database aren't in one transaction, so use a transactional outbox — write the business row and the event row in a single local transaction and let a relay publish from the outbox.",
      weak: "Yes, brokers like Kafka support exactly-once semantics, so you turn that on.",
    },
    {
      q: "Compare rate limiting algorithms and pick one for a public API.",
      a: "Fixed window is one counter per window — cheapest, but allows 2x the limit across a window boundary. Sliding window log stores a timestamp per request: exact, but O(requests) memory per client. Sliding window counter interpolates between the previous and current window counters: two integers, no boundary burst, small error. Token bucket refills at a fixed rate up to a capacity, permitting controlled bursts while bounding the long-run rate. Leaky bucket drains a FIFO at a constant rate, smoothing output but queueing rather than rejecting. For a public API I'd use token bucket — real clients burst legitimately — implemented as a Redis hash with tokens and last-refill timestamp, updated by a Lua script so the read-modify-write is atomic, with lazy refill computed from elapsed time so no background timer is needed.",
    },
    {
      q: "Your rate limiter's Redis cluster becomes unreachable. What should happen?",
      a: "It depends on what's being protected, and saying so is the answer. For ordinary API quota enforcement, fail open: letting traffic through degrades fairness, whereas failing closed converts a cache outage into a total outage. For anything protecting money or credentials — login attempts, password resets, payment endpoints — fail closed, because the cost of unlimited attempts exceeds the cost of downtime. Either way, keep a small in-process bucket per gateway node as a fallback so obvious floods are still rejected with zero network calls, and alert loudly, since a silently-open limiter is invisible until you're being abused.",
    },
    {
      q: "Design a news feed. Fan-out on write or on read?",
      a: "Hybrid, and the reasoning is the answer. Reads outnumber writes roughly 50:1, so you want work done at write time: when someone posts, push the post id onto a capped Redis list for each follower, making a feed load one LRANGE plus a multi-get. That breaks for celebrities — one post becoming 10M list writes, most to accounts that will never read it. So for accounts above a follower threshold you don't fan out at all; at read time you merge the precomputed feed with a live query of the few celebrities that user follows. Also skip fan-out to accounts inactive for 30 days and rebuild lazily on login. Store post ids rather than bodies so edits and deletes are fixed in one place. Fan-out lag is the freshness metric to alert on.",
      weak: "I'd query the posts table for everyone the user follows, sorted by time, with a LIMIT.",
    },
    {
      q: "Why cursor pagination instead of OFFSET?",
      a: "Two reasons. Correctness: with OFFSET, rows inserted or deleted between page loads shift the whole window, so users see duplicates and silently miss items — which is guaranteed on a feed sorted by recency. Performance: OFFSET 100000 makes the database scan and discard 100,000 rows, so deep pages get linearly slower. A cursor encodes the sort key of the last item seen — (created_at, id) — and the next query is a range predicate on an index, which costs the same at page 1 and page 10,000. The cursor should be opaque to clients so you can change its contents without breaking them.",
    },
    {
      q: "In a chat app, how do you guarantee a message is never lost and never duplicated?",
      a: "Never lost: persist before you ack. The server writes the message durably, then sends the ack to the sender; if you ack first and the write fails, the sender believes something exists that doesn't. Delivery to recipients is separate — offline users get the message on reconnect because clients track the highest per-conversation sequence number they've seen and ask for everything after it. Never duplicated: the client attaches a clientMsgId UUID to each send, and the server dedupes on it, so a resend after a timeout returns the original ack rather than creating a second message. Ordering comes from a per-conversation monotonic seq allocated server-side, not client wall-clock timestamps, since clocks disagree.",
      weak: "I'd store messages in the database and send them over WebSocket, and order them by their timestamp.",
    },
    {
      q: "How would you handle a 5 GB file upload?",
      a: "Don't let the bytes touch your servers. The client calls your API with filename, size, content type, and a content hash; you authorize, create metadata rows, start a multipart upload against the object store, and return presigned URLs for each 8-16 MB part. The client PUTs parts directly to S3 in parallel, retrying individual failed parts, then calls a complete endpoint with the part ETags. An ObjectCreated event kicks off async work — verify the hash server-side, virus scan, thumbnail — while the file sits in a scanning status until ready. Resumption is a GET that returns which part numbers exist. Downloads go through a CDN with short-lived signed URLs. Details that matter: encode the max size in the presigned policy so a client can't upload 500 GB, use a UUID or content hash as the storage key rather than the client's filename, serve user content from a separate domain, and reap abandoned multipart sessions or you pay for invisible bytes.",
      weak: "I'd stream the upload through my API server and write it to S3 as it comes in.",
    },
    {
      q: "How do you know your system is healthy in production?",
      a: "The four golden signals: latency (split successful from failed requests, since fast errors flatter the numbers), traffic, error rate, and saturation of the constrained resource — connection pool, queue depth, disk. Measure latency as p50/p95/p99, never averages: 1% of requests at 10 seconds is invisible in a mean and is a broken experience for one in a hundred users. Then structured logs with a request id, and distributed traces so you can answer why one specific request was slow. Wrap it in an SLO with an error budget so reliability work has a trigger rather than a vibe. And separate liveness from readiness — conflating them causes restart loops during a dependency outage.",
    },
  ],
};
