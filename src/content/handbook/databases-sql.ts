import type { HandbookChapter } from "./types";

export const chapter: HandbookChapter = {
  slug: "databases-sql",
  title: "Databases & SQL",
  track: "backend",
  order: 3,
  summary:
    "Modeling, the SQL you'll be asked to write live, how indexes actually work, reading a query plan, transactions and isolation levels, locking and deadlocks, pooling, and honest SQL-vs-NoSQL tradeoffs — plus seven worked live-coding exercises.",
  estMinutes: 95,
  tags: [
    "sql",
    "postgres",
    "indexes",
    "transactions",
    "acid",
    "isolation",
    "joins",
    "query-plans",
    "nosql",
  ],
  sections: [
    {
      id: "relational-modeling",
      heading: "Relational modeling and normal forms",
      markdown: `A relational schema is a set of claims about your domain: what exists, what identifies it, and which things relate to which. Get it wrong and every query afterwards fights the model.

### The three relationship shapes

| Shape | Implementation | Example |
| --- | --- | --- |
| **One-to-many** | Foreign key on the *many* side | \`tasks.project_id → projects.id\` |
| **Many-to-many** | A junction table with two foreign keys | \`task_tags(task_id, tag_id)\` |
| **One-to-one** | FK with a \`UNIQUE\` constraint, or share a primary key | \`user_profiles.user_id\` unique → \`users.id\` |

A useful test in an interview: say the relationship out loud in both directions. "A project has many tasks; a task belongs to one project" → FK on \`tasks\`. "A task has many tags; a tag has many tasks" → junction table. Candidates who skip this step routinely produce a many-to-many modelled as a comma-separated string column, which is unqueryable and unindexable.

### Normalization

Normal forms are rules for eliminating redundancy. Redundancy is not primarily a storage problem — it is an *update anomaly* problem: the same fact stored twice will eventually disagree with itself.

Start from a denormalized mess:

\`\`\`text
orders(order_id, customer_name, customer_email, customer_city,
       product_names, product_prices, order_total)
\`\`\`

**1NF — atomic values, no repeating groups.** \`product_names = "Keyboard, Mouse, Monitor"\` violates it. You cannot index it, join on it, or ask "how many monitors sold?" without string parsing. Split into an \`order_items\` table, one row per item.

**2NF — 1NF, plus no non-key column depends on only *part* of a composite key.** In \`order_items(order_id, product_id, quantity, product_name)\`, the key is \`(order_id, product_id)\` but \`product_name\` depends only on \`product_id\`. Rename a product and you must update every historical row. Move it to \`products\`.

**3NF — 2NF, plus no non-key column depends on another non-key column.** If \`orders\` holds \`customer_id\`, \`customer_email\`, and \`customer_city\`, those depend on \`customer_id\`, not on \`order_id\`. A customer changing city means updating thousands of order rows, and if one update fails you now have two answers to "where does this customer live?" Move them to \`customers\`.

The working definition to recite: **every non-key column depends on the key, the whole key, and nothing but the key.**

\`\`\`sql
create table customers (
  id      bigserial primary key,
  email   citext not null unique,
  name    text   not null,
  city    text
);

create table products (
  id          bigserial primary key,
  sku         text not null unique,
  name        text not null,
  price_cents integer not null check (price_cents >= 0)
);

create table orders (
  id          bigserial primary key,
  customer_id bigint not null references customers(id),
  status      text not null default 'pending',
  placed_at   timestamptz not null default now()
);

create table order_items (
  order_id   bigint not null references orders(id) on delete cascade,
  product_id bigint not null references products(id),
  quantity   integer not null check (quantity > 0),
  -- Price is intentionally COPIED here, not read from products.
  unit_price_cents integer not null check (unit_price_cents >= 0),
  primary key (order_id, product_id)
);
\`\`\`

### The exception that proves you understand the rule

\`order_items.unit_price_cents\` looks like a 3NF violation — the price is already in \`products\`. It is not, and this is the detail that separates someone reciting normal forms from someone who has built a system. The price on an order is **the price at the time of purchase**, a different fact from the product's current price. If you join to \`products\` for it, tomorrow's price change silently rewrites last year's invoices and your revenue reports.

The general principle: normalize facts that are *the same fact*; copy facts that are *point-in-time snapshots*.

Deliberate denormalization for performance is covered later, but the order matters: **normalize first, denormalize only with a measured reason.** Denormalizing early gives you consistency bugs in exchange for performance you had no evidence you needed.`,
    },
    {
      id: "keys-and-constraints",
      heading: "Keys and constraints",
      markdown: `### Keys

- **Primary key** — the chosen unique identifier. Implicitly \`NOT NULL\` and \`UNIQUE\`; Postgres backs it with a unique B-tree index automatically.
- **Candidate key** — any column set that *could* be the primary key (\`email\` on \`users\`, if it's unique and non-null).
- **Natural key** — a key with business meaning: email, ISBN, SKU.
- **Surrogate key** — a meaningless generated identifier: \`bigserial\`, \`uuid\`.
- **Composite key** — a key spanning multiple columns, standard on junction tables: \`primary key (order_id, product_id)\`.
- **Foreign key** — a column referencing another table's key. Enforces referential integrity: you cannot insert an order for a customer that doesn't exist, and you cannot delete a customer that still has orders (unless you specify otherwise).

**Natural vs surrogate:** prefer surrogate primary keys. Natural keys change — people change email addresses, companies re-issue SKUs — and a changing primary key means cascading updates through every referencing table. Keep the natural key as a \`UNIQUE\` constraint, which gives you the integrity guarantee without the fragility.

**\`bigserial\` vs \`uuid\`:** sequential integers are compact (8 bytes vs 16), index well because inserts append to the right edge of the B-tree, and are readable in logs — but they leak business information (\`/orders/1042\` tells a competitor your order volume) and require a database round trip to learn the ID. UUIDv4 can be generated client-side and reveals nothing, but random values scatter inserts across the whole index, causing page splits and a larger, less cache-friendly index. **UUIDv7 is the modern answer**: time-ordered, so it inserts sequentially like an integer while staying unguessable.

### Constraints

Every constraint is a rule the database will enforce no matter what writes to it — your API, a migration script, a psql session, or the second service someone adds next year. Application-level validation is a better error message; the constraint is the actual guarantee.

\`\`\`sql
create table subscriptions (
  id           bigserial primary key,
  user_id      bigint not null references users(id) on delete cascade,
  plan         text not null check (plan in ('free', 'pro', 'enterprise')),
  seats        integer not null default 1 check (seats between 1 and 1000),
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  -- Multi-column CHECK: a date range that cannot be inverted.
  constraint valid_period check (ended_at is null or ended_at > started_at)
);

-- Partial unique index: at most ONE active subscription per user, while
-- allowing unlimited historical (ended) ones. A plain UNIQUE cannot express this.
create unique index one_active_subscription_per_user
  on subscriptions (user_id)
  where ended_at is null;
\`\`\`

| Constraint | Guarantees |
| --- | --- |
| \`NOT NULL\` | The column always has a value |
| \`UNIQUE\` | No two rows share this value. **NULLs are exempt** — you can have many NULLs in a unique column |
| \`PRIMARY KEY\` | \`UNIQUE\` + \`NOT NULL\`, one per table |
| \`FOREIGN KEY\` | The referenced row exists |
| \`CHECK\` | An arbitrary boolean over the row |
| \`EXCLUDE\` | Generalized uniqueness — e.g. no two bookings whose time ranges overlap |
| \`DEFAULT\` | A value when none is supplied (not strictly a constraint) |

### Foreign key referential actions

\`\`\`sql
on delete cascade      -- delete the children too (order_items when an order goes)
on delete restrict     -- refuse the delete (the default: no action)
on delete set null     -- orphan the child, null out the FK (tasks.assignee_id)
\`\`\`

Choose deliberately. \`cascade\` on \`users\` is how someone deletes one row and loses a million. \`restrict\` is the safe default and forces you to think about cleanup order.

### Two details that come up constantly

**NULL is not a value, it is "unknown".** \`NULL = NULL\` is \`NULL\`, not true — that is why you write \`is null\`. It propagates through arithmetic (\`5 + NULL = NULL\`) and is skipped by aggregates (\`count(col)\` ignores NULLs, \`count(*)\` doesn't). \`NOT IN (subquery)\` returning a single NULL makes the whole predicate NULL and the result set empty — a genuinely common bug, and the reason to prefer \`NOT EXISTS\`.

**Deferrable constraints.** \`deferrable initially deferred\` checks a constraint at \`COMMIT\` rather than per statement, which is how you insert two rows that reference each other.`,
    },
    {
      id: "joins",
      heading: "JOINs, worked out",
      markdown: `Live-coding a JOIN is the single most common database interview task. Work from these two tables — small enough to trace by hand, which is exactly how you should reason about a join you're unsure of.

\`\`\`sql
create table departments (id int primary key, name text);
insert into departments values (10, 'Engineering'), (20, 'Research'), (30, 'Design');

create table employees (id int primary key, name text, dept_id int, salary int);
insert into employees values
  (1, 'Ada',   10, 180000),
  (2, 'Grace', 20, 165000),
  (3, 'Linus', 10, 150000),
  (4, 'Barbara', null, 140000);   -- not yet assigned to a department
\`\`\`

**employees**

| id | name | dept_id | salary |
| --- | --- | --- | --- |
| 1 | Ada | 10 | 180000 |
| 2 | Grace | 20 | 165000 |
| 3 | Linus | 10 | 150000 |
| 4 | Barbara | NULL | 140000 |

**departments**

| id | name |
| --- | --- |
| 10 | Engineering |
| 20 | Research |
| 30 | Design |

### INNER JOIN — rows that match on both sides

\`\`\`sql
select e.name as employee, d.name as department
  from employees e
  join departments d on d.id = e.dept_id;
\`\`\`

| employee | department |
| --- | --- |
| Ada | Engineering |
| Grace | Research |
| Linus | Engineering |

Barbara is gone (no \`dept_id\`) and Design is gone (no employees). Inner join = intersection.

### LEFT JOIN — every left row, matched or not

\`\`\`sql
select e.name as employee, d.name as department
  from employees e
  left join departments d on d.id = e.dept_id;
\`\`\`

| employee | department |
| --- | --- |
| Ada | Engineering |
| Grace | Research |
| Linus | Engineering |
| Barbara | NULL |

Barbara is preserved with NULLs on the right. This is what you want for "list all employees, with their department if they have one".

### RIGHT JOIN — every right row

\`\`\`sql
select e.name as employee, d.name as department
  from employees e
  right join departments d on d.id = e.dept_id;
\`\`\`

| employee | department |
| --- | --- |
| Ada | Engineering |
| Linus | Engineering |
| Grace | Research |
| NULL | Design |

Identical to a LEFT JOIN with the tables swapped. Most teams standardize on LEFT because reading a query where the preserved side flips mid-statement is needlessly hard.

### FULL OUTER JOIN — everything from both

| employee | department |
| --- | --- |
| Ada | Engineering |
| Grace | Research |
| Linus | Engineering |
| Barbara | NULL |
| NULL | Design |

### CROSS JOIN — Cartesian product

4 × 3 = 12 rows. Useful deliberately (generate a date × region grid to report zeros), catastrophic accidentally — an omitted join condition produces exactly this and is how a query returns 40 million rows.

### SELF JOIN — a table joined to itself

\`\`\`sql
alter table employees add column manager_id int references employees(id);
update employees set manager_id = 1 where id in (2, 3);

select e.name as employee, m.name as manager
  from employees e
  left join employees m on m.id = e.manager_id;
\`\`\`

| employee | manager |
| --- | --- |
| Ada | NULL |
| Grace | Ada |
| Linus | Ada |
| Barbara | NULL |

\`LEFT\` matters: with an inner join, Ada — who has no manager — disappears from her own org chart.

### The three JOIN traps interviewers check for

**1. A \`WHERE\` on the right table silently converts a LEFT JOIN into an INNER JOIN.**

\`\`\`sql
-- BROKEN: employees with no department are filtered out again, because
-- NULL <> 'Design' is NULL, not true.
select e.name from employees e
  left join departments d on d.id = e.dept_id
 where d.name <> 'Design';

-- CORRECT: filter conditions on the outer side belong in the ON clause.
select e.name from employees e
  left join departments d on d.id = e.dept_id and d.name <> 'Design';
\`\`\`

The rule: \`ON\` decides what *matches*; \`WHERE\` filters the *result*, and it runs after the NULLs have been manufactured.

**2. Joining a one-to-many relationship multiplies rows, which corrupts aggregates.** If each employee has 3 payslips, \`join payslips\` triples the employee rows and \`sum(e.salary)\` is now 3× wrong. Aggregate in a subquery or CTE first, then join to the aggregate.

**3. \`COUNT(*)\` vs \`COUNT(column)\` after a LEFT JOIN.**

\`\`\`sql
select d.name, count(*) as wrong, count(e.id) as right
  from departments d
  left join employees e on e.dept_id = d.id
 group by d.name;
\`\`\`

| name | wrong | right |
| --- | --- | --- |
| Engineering | 2 | 2 |
| Research | 1 | 1 |
| Design | **1** | **0** |

Design has zero employees, but the LEFT JOIN produced one row with NULLs, and \`count(*)\` counts rows. \`count(e.id)\` counts non-NULL values and gives 0. This exact question appears in interviews constantly.`,
    },
    {
      id: "grouping-windows-ctes",
      heading: "GROUP BY, HAVING, window functions, and CTEs",
      markdown: `### GROUP BY and HAVING

\`\`\`sql
select d.name                as department,
       count(*)              as headcount,
       round(avg(e.salary))  as avg_salary,
       max(e.salary)         as top_salary
  from employees e
  join departments d on d.id = e.dept_id
 group by d.name
having count(*) >= 2
 order by avg_salary desc;
\`\`\`

**\`WHERE\` filters rows before grouping; \`HAVING\` filters groups after.** \`WHERE salary > 150000\` removes individuals; \`HAVING avg(salary) > 150000\` removes whole departments. You cannot use an aggregate in \`WHERE\` — at that point the groups don't exist yet.

The logical evaluation order — worth memorizing, because it explains three separate "why doesn't this work" questions:

\`\`\`text
FROM → JOIN → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY → LIMIT
\`\`\`

That order tells you: (a) you cannot reference a \`SELECT\` alias in \`WHERE\` (the alias doesn't exist yet), (b) you *can* reference it in \`ORDER BY\` (it does by then), and (c) every non-aggregated \`SELECT\` column must appear in \`GROUP BY\`, because after grouping there is no single row to take it from.

### Window functions

A window function computes across a set of rows **without collapsing them**. That is the whole distinction: \`GROUP BY\` turns 4 rows into 2; a window function keeps 4 rows and adds a column.

\`\`\`sql
select name,
       dept_id,
       salary,
       rank()       over (partition by dept_id order by salary desc) as rank_in_dept,
       dense_rank() over (partition by dept_id order by salary desc) as dense_rank_in_dept,
       row_number() over (partition by dept_id order by salary desc) as row_num,
       avg(salary)  over (partition by dept_id)                      as dept_avg,
       salary - lag(salary) over (order by salary)                   as gap_to_next_lower,
       sum(salary)  over (order by id rows between unbounded preceding and current row)
                                                                     as running_total
  from employees;
\`\`\`

| Function | Does |
| --- | --- |
| \`row_number()\` | 1, 2, 3, 4 — always distinct, ties broken arbitrarily |
| \`rank()\` | 1, 2, 2, 4 — ties share a rank, then it **skips** |
| \`dense_rank()\` | 1, 2, 2, 3 — ties share a rank, no gap |
| \`lag(col, n)\` / \`lead(col, n)\` | Value from n rows back / ahead — month-over-month deltas |
| \`first_value\` / \`last_value\` / \`nth_value\` | Value at a position in the window |
| \`ntile(4)\` | Bucket rows into quartiles |
| Any aggregate \`over (...)\` | \`sum\`, \`avg\`, \`count\` computed per window |

\`PARTITION BY\` splits rows into independent windows (restart the ranking per department). \`ORDER BY\` inside \`OVER\` defines the order the function walks. The **frame clause** (\`rows between unbounded preceding and current row\`) defines which rows are visible from the current one — that's how you get running totals and moving averages.

A trap worth knowing: with an \`ORDER BY\` in the \`OVER\` clause and no explicit frame, the default frame is \`range between unbounded preceding and current row\`, which includes *all peer rows tied at the current value*. For a strict running total you want \`rows\`, not \`range\`.

**Window functions cannot appear in \`WHERE\` or \`HAVING\`** — they're evaluated after both. To filter on one, wrap it:

\`\`\`sql
select * from (
  select name, dept_id, salary,
         rank() over (partition by dept_id order by salary desc) as r
    from employees
) ranked
where r <= 3;
\`\`\`

### Subqueries vs CTEs

\`\`\`sql
-- Scalar subquery: returns exactly one value
select name, salary,
       (select round(avg(salary)) from employees) as company_avg
  from employees;

-- Correlated subquery: re-evaluated per outer row. Readable, often slow.
select d.name,
       (select count(*) from employees e where e.dept_id = d.id) as headcount
  from departments d;

-- EXISTS: stops at the first match — usually the best anti/semi-join form
select d.name from departments d
 where not exists (select 1 from employees e where e.dept_id = d.id);

-- CTE: named, readable, composable
with dept_stats as (
  select dept_id, count(*) as headcount, avg(salary) as avg_salary
    from employees
   where dept_id is not null
   group by dept_id
),
well_paid as (
  select * from dept_stats where avg_salary > 155000
)
select d.name, w.headcount, round(w.avg_salary) as avg_salary
  from well_paid w
  join departments d on d.id = w.dept_id
 order by w.avg_salary desc;
\`\`\`

**\`NOT IN\` vs \`NOT EXISTS\`:** if the subquery returns a single NULL, \`NOT IN\` returns *no rows at all*, because \`x NOT IN (1, NULL)\` evaluates to NULL rather than true. \`NOT EXISTS\` handles NULLs correctly and is usually planned better. Default to \`NOT EXISTS\`.

**CTEs and optimization:** in Postgres before 12, a CTE was an **optimization fence** — always materialized, never pushed into. Since 12 they are inlined by default when referenced once and not recursive, and you can force either behaviour with \`materialized\` / \`not materialized\`. Knowing this distinction is a strong signal; assuming CTEs are always free is a common gap.

### Recursive CTEs

\`\`\`sql
-- Walk the management chain from the top down.
with recursive org as (
  select id, name, manager_id, 1 as depth, name::text as path
    from employees
   where manager_id is null              -- anchor: the roots

  union all

  select e.id, e.name, e.manager_id, org.depth + 1, org.path || ' > ' || e.name
    from employees e
    join org on org.id = e.manager_id    -- recursive step
)
select depth, path from org order by path;
\`\`\`

| depth | path |
| --- | --- |
| 1 | Ada |
| 2 | Ada > Grace |
| 2 | Ada > Linus |

This is the answer to any hierarchy question: org charts, threaded comments, category trees, graph traversal. Add a depth cap in production — a cycle in the data makes it run forever.`,
    },
    {
      id: "indexes",
      heading: "Indexes: how they work and when they hurt",
      markdown: `An index is a separate, ordered data structure that lets the database find rows without reading the whole table. Without one, \`where email = 'x'\` is a **sequential scan**: read every page of the table.

### B-tree mechanics

Postgres's default index is a B+tree: a balanced tree where internal nodes hold key ranges and pointers, and leaf nodes hold keys plus row pointers (in Postgres, a \`ctid\` — the physical location).

\`\`\`text
                    [ 50 | 100 ]                 <- root
                   /     |      \\
          [10|25|40]  [60|75|90]  [120|150]      <- internal
           /  |  \\      ...          ...
        leaves: sorted keys -> heap row pointers, linked left-to-right
\`\`\`

- **Lookup is O(log n)** in the number of *pages*, and the fanout is huge — hundreds of keys per 8KB page. A billion-row table is typically 4-5 levels deep, so a lookup is a handful of page reads, and the upper levels are almost always cached in memory.
- **Leaves are linked**, so a range scan (\`where created_at > $1\`) finds the start and then walks sequentially. That is why B-trees serve \`=\`, \`<\`, \`>\`, \`BETWEEN\`, \`IN\`, sorting, and prefix \`LIKE 'abc%'\` — but **not** \`LIKE '%abc'\`, which has no known starting point.
- **Sorted order is free.** An index on \`(created_at desc)\` can satisfy \`ORDER BY created_at DESC LIMIT 20\` by reading 20 leaf entries, skipping the sort entirely.

Other index types worth naming: **GIN** for full-text search, \`jsonb\` containment, and array membership; **GiST** for geometric and range types (and exclusion constraints); **BRIN** for enormous naturally-ordered tables like time-series logs, where a tiny index storing min/max per block range is enough; **Hash** for equality only, and rarely worth it over a B-tree.

### Composite index column order

This is the highest-yield index question, and most candidates get it wrong.

\`\`\`sql
create index idx_tasks on tasks (project_id, status, created_at desc);
\`\`\`

Think of it as sorting by \`project_id\`, then \`status\`, then \`created_at\` — like a phone book sorted by last name, then first name.

| Query | Uses the index? |
| --- | --- |
| \`where project_id = 7\` | **Yes** — leftmost prefix |
| \`where project_id = 7 and status = 'todo'\` | **Yes** — full prefix |
| \`where project_id = 7 and status = 'todo' order by created_at desc\` | **Yes** — filter *and* sort, no sort step at all |
| \`where status = 'todo'\` | **No** (or a slow full index scan) — skips the leading column |
| \`where project_id = 7 order by created_at desc\` | Partially — seeks on \`project_id\`, then must sort, because \`status\` sits between them |

**The leftmost-prefix rule:** an index on \`(a, b, c)\` serves \`(a)\`, \`(a, b)\`, and \`(a, b, c)\`, but not \`(b)\` or \`(b, c)\`. It's the phone book: you cannot find everyone named "Grace" without reading the whole book.

The ordering heuristic: **equality columns first, then the range or sort column last.** A range predicate consumes the ordering — once you scan \`created_at > $1\`, everything after it in the index is no longer sorted usefully.

### Covering indexes and index-only scans

Normally an index gives you a row pointer and the database then reads the heap page — a random I/O per row. If every column the query needs is *in the index*, that heap read is skipped: an **index-only scan**.

\`\`\`sql
-- Query: select status, created_at from tasks where project_id = $1;
create index idx_cover on tasks (project_id) include (status, created_at);
\`\`\`

\`INCLUDE\` stores extra columns in the leaves without making them part of the sort key, so they don't bloat the tree or affect the prefix rule. (Postgres caveat worth mentioning: index-only scans still consult the visibility map, so a table with heavy recent writes and no recent \`VACUUM\` will fall back to heap fetches.)

### Partial and expression indexes

\`\`\`sql
-- Index only the rows you actually query. Smaller, faster, cheaper to maintain.
create index idx_active_tasks on tasks (project_id, created_at desc)
  where status <> 'done';

-- Function calls in a predicate defeat a plain index. Index the expression.
create index idx_users_lower_email on users (lower(email));
-- now: where lower(email) = lower($1)  can use it
\`\`\`

### When an index hurts

Indexes are not free, and being able to say why is what distinguishes a real answer:

1. **Every write pays.** An \`INSERT\` updates the table *and* every index on it. Ten indexes means eleven structures to modify per insert. Write-heavy tables with many indexes slow down measurably.
2. **Disk and memory.** Indexes can exceed the table's own size. They compete with data for the buffer cache — a huge unused index evicts hot pages.
3. **Low-selectivity columns are pointless.** An index on a boolean where 90% of rows are \`true\` won't be used for \`= true\`: fetching 90% of rows via random index lookups is *slower* than a sequential scan. The planner knows this. Selectivity is the point — an index earns its keep when it eliminates most of the table.
4. **Small tables.** Under a few thousand rows, a sequential scan of a handful of cached pages beats index traversal. The planner will ignore your index and be right.
5. **Redundant indexes.** \`(a)\` is redundant if \`(a, b)\` exists — the composite already serves the prefix. Duplicate indexes cost writes and buy nothing.
6. **Wrapping a column in a function kills it.** \`where date(created_at) = '2026-07-27'\` cannot use an index on \`created_at\`. Rewrite as a range: \`where created_at >= '2026-07-27' and created_at < '2026-07-28'\`. Same for \`where email ilike $1\` against a plain index, and implicit type casts on the column side.

\`\`\`sql
-- Find unused indexes before adding more.
select relname as table, indexrelname as index,
       idx_scan as scans, pg_size_pretty(pg_relation_size(indexrelid)) as size
  from pg_stat_user_indexes
 where idx_scan = 0
 order by pg_relation_size(indexrelid) desc;
\`\`\`

Also know: **\`CREATE INDEX\` takes a lock that blocks writes.** On a production table you use \`create index concurrently\`, which is slower and can fail, leaving an invalid index you must drop and retry — but doesn't take the site down.`,
    },
    {
      id: "explain",
      heading: "EXPLAIN and reading a query plan",
      markdown: `\`EXPLAIN\` shows the plan the optimizer chose with its *estimates*. \`EXPLAIN ANALYZE\` **actually runs the query** and adds real timings and row counts. Always use \`ANALYZE\` when diagnosing — and remember it executes, so wrap a destructive statement in a transaction you roll back.

\`\`\`sql
explain (analyze, buffers, format text)
select t.id, t.title, u.name
  from tasks t
  join users u on u.id = t.assignee_id
 where t.project_id = 7 and t.status = 'todo'
 order by t.created_at desc
 limit 20;
\`\`\`

\`\`\`text
Limit  (cost=0.85..48.21 rows=20 width=68) (actual time=0.041..0.312 rows=20 loops=1)
  Buffers: shared hit=27
  ->  Nested Loop  (cost=0.85..1893.44 rows=800 width=68)
                   (actual time=0.039..0.301 rows=20 loops=1)
        Buffers: shared hit=27
        ->  Index Scan using idx_tasks_project_status_created on tasks t
              (cost=0.42..612.30 rows=800 width=44)
              (actual time=0.021..0.088 rows=20 loops=1)
              Index Cond: ((project_id = 7) AND (status = 'todo'::task_status))
              Buffers: shared hit=7
        ->  Index Scan using users_pkey on users u
              (cost=0.43..1.60 rows=1 width=32)
              (actual time=0.008..0.009 rows=1 loops=20)
              Index Cond: (id = t.assignee_id)
              Buffers: shared hit=20
Planning Time: 0.183 ms
Execution Time: 0.348 ms
\`\`\`

### How to read it

- **Read inside-out, bottom-up.** The deepest indented node runs first and feeds its parent.
- **\`cost=0.85..48.21\`** — arbitrary units, not milliseconds. The first number is startup cost (before the first row), the second is total. A node like \`Sort\` has a high startup cost because it must consume everything before emitting anything.
- **\`rows=800\` (estimated) vs \`rows=20\` (actual)** — this comparison is the most valuable thing in the output. A large divergence means the planner's statistics are wrong, so its choices downstream are guesses. Fix it with \`ANALYZE tablename\`, or by raising the statistics target on a skewed column.
- **\`loops=20\`** — the node ran 20 times. **Actual time is per loop**, so total time for that node is \`0.009 × 20\`. Missing this is how people misread nested loops.
- **\`Buffers: shared hit=27\`** — pages served from cache. \`read=\` means it went to disk. A query with a tiny row count but enormous \`read\` is doing far more I/O than the result suggests.

### Node types worth recognizing

| Node | Meaning | When it's a problem |
| --- | --- | --- |
| \`Seq Scan\` | Read the whole table | On a large table with a selective filter — a missing index |
| \`Index Scan\` | Walk the index, fetch matching heap rows | Fine. If it returns most of the table, a Seq Scan would've been cheaper |
| \`Index Only Scan\` | Everything came from the index | The best case |
| \`Bitmap Heap Scan\` | Collect row locations from an index, sort them, read the heap in physical order | Normal for medium selectivity — it beats thousands of random reads |
| \`Nested Loop\` | For each outer row, probe the inner | Great for small outer sets; quadratic if the outer estimate is badly wrong |
| \`Hash Join\` | Build a hash of the smaller side, probe with the larger | Best for big unsorted joins. Watch for \`Batches: 8\` — it spilled to disk |
| \`Merge Join\` | Both inputs sorted, walk together | Good when inputs are already sorted by an index |
| \`Sort\` | Explicit sort | \`Sort Method: external merge Disk: 51MB\` means it spilled — raise \`work_mem\` or index the sort |
| \`Materialize\` / \`Memoize\` | Cache an inner result for reuse | Usually helpful |

### The diagnostic loop

1. Find the slow query — \`pg_stat_statements\` ordered by \`total_exec_time\`, not by \`mean\`. A 5ms query run a million times costs more than a 3-second report run twice.
2. \`EXPLAIN (ANALYZE, BUFFERS)\` it.
3. Find the node with the largest actual time, remembering to multiply by \`loops\`.
4. Ask why: sequential scan on a big table (missing index)? Estimate wildly off (stale statistics)? Sort spilling to disk (\`work_mem\`, or an index that provides the order)? Nested loop over far more rows than estimated (bad selectivity estimate, often a correlated predicate)?
5. Change one thing. Re-run. Confirm the plan actually changed — adding an index the planner then ignores is the most common false victory.

\`\`\`sql
create extension if not exists pg_stat_statements;

select substr(query, 1, 80) as query,
       calls,
       round(total_exec_time)::int as total_ms,
       round(mean_exec_time::numeric, 2) as mean_ms,
       rows
  from pg_stat_statements
 order by total_exec_time desc
 limit 10;
\`\`\``,
    },
    {
      id: "transactions-acid",
      heading: "Transactions and ACID",
      markdown: `A transaction is a group of statements that succeed or fail as a unit.

\`\`\`sql
begin;
  update accounts set balance = balance - 100 where id = 1;
  update accounts set balance = balance + 100 where id = 2;
commit;   -- or rollback; and neither update ever happened
\`\`\`

Without this, a crash between the two statements destroys 100 units of money. That is the whole motivation.

### ACID

**Atomicity** — all or nothing. There is no state in which the debit landed and the credit didn't. Postgres implements this with a write-ahead log: changes are journalled before they're applied, so a crash mid-transaction is undone on recovery.

**Consistency** — the transaction moves the database from one valid state to another, where "valid" means every constraint holds: foreign keys, checks, uniqueness. Note this is the weakest of the four as a *database* guarantee — it mostly means "the DB enforces the rules you declared". The C in ACID is not the C in CAP; they are unrelated and conflating them is a common slip.

**Isolation** — concurrent transactions don't see each other's uncommitted work. How *much* they're insulated is the isolation level, and that's the next section.

**Durability** — once \`COMMIT\` returns, the data survives a power cut. Achieved by flushing the WAL to disk (\`fsync\`) before acknowledging. This is why commits have a latency floor, and why \`synchronous_commit = off\` makes writes faster at the cost of losing the last few hundred milliseconds on a crash — a legitimate tradeoff for analytics ingest, never for payments.

### Transactions in application code

\`\`\`python
from uuid import UUID

import asyncpg


class NotFoundError(Exception):
    """Maps to HTTP 404."""


class ConflictError(Exception):
    """Maps to HTTP 409."""


async def transfer_funds(
    pool: asyncpg.Pool, from_id: UUID, to_id: UUID, cents: int
) -> None:
    # acquire() returns the connection to the pool on exit, even if the body raises.
    async with pool.acquire() as conn:
        # transaction() issues BEGIN, then COMMIT on success, ROLLBACK on a raise.
        async with conn.transaction():
            # Lock both rows, always in a consistent order (see the deadlock section).
            rows = await conn.fetch(
                """
                select id, balance
                  from accounts
                 where id = any($1::uuid[])
                 order by id
                   for update
                """,
                sorted([from_id, to_id]),
            )
            if len(rows) != 2:
                raise NotFoundError("Account not found.")

            source = next(row for row in rows if row["id"] == from_id)
            if source["balance"] < cents:
                raise ConflictError("Insufficient funds.")

            await conn.execute(
                "update accounts set balance = balance - $2 where id = $1",
                from_id,
                cents,
            )
            await conn.execute(
                "update accounts set balance = balance + $2 where id = $1",
                to_id,
                cents,
            )
            await conn.execute(
                "insert into ledger (from_id, to_id, amount_cents)"
                " values ($1, $2, $3)",
                from_id,
                to_id,
                cents,
            )
\`\`\`

Rules that matter in production:

- **Keep transactions short.** An open transaction holds locks and pins the oldest snapshot, which prevents vacuum from cleaning up dead rows — the cause of unbounded table bloat.
- **Never do I/O inside a transaction.** An HTTP call to Stripe inside \`BEGIN...COMMIT\` holds a database connection open for the duration of a network round trip. Under load that exhausts the pool and takes the service down.
- **Always acquire the connection with \`async with\`.** \`async with pool.acquire()\` returns the connection even when the body raises. A connection taken with a bare \`await pool.acquire()\` and lost on an exception path leaks permanently; do it enough times and every request hangs waiting for the pool.
- **Savepoints** give partial rollback inside a transaction: \`savepoint s1; ... rollback to s1;\`. Useful when one optional step is allowed to fail.

### Read-modify-write is the classic bug

\`\`\`python
async def withdraw_broken(conn: asyncpg.Connection, account_id: UUID) -> None:
    """BROKEN even inside a transaction at READ COMMITTED: two concurrent runs
    both read 100 and both write 90, so two withdrawals cost only 10."""
    balance = await conn.fetchval(
        "select balance from accounts where id = $1", account_id
    )
    await conn.execute(
        "update accounts set balance = $2 where id = $1", account_id, balance - 10
    )


async def withdraw(conn: asyncpg.Connection, account_id: UUID) -> None:
    """Correct: let the database compute from the current value, atomically."""
    status = await conn.execute(
        "update accounts set balance = balance - 10"
        " where id = $1 and balance >= 10",
        account_id,
    )
    # asyncpg returns the command tag, so "UPDATE 0" means the predicate matched
    # nothing — insufficient funds, with no separate read-and-check step.
    if status == "UPDATE 0":
        raise ConflictError("Insufficient funds.")
\`\`\`

The fix is to make the update *relative* rather than absolute, or to take a lock with \`SELECT ... FOR UPDATE\`. Recognizing this pattern is what the whole isolation-level discussion is ultimately about.`,
    },
    {
      id: "isolation-levels",
      heading: "The four isolation levels and the anomalies they prevent",
      markdown: `### The anomalies

| Anomaly | What happens |
| --- | --- |
| **Dirty read** | You read a row another transaction wrote but hasn't committed. If it rolls back, you acted on data that never existed. |
| **Non-repeatable read** | You read a row, someone else commits an \`UPDATE\` to it, you read it again in the same transaction and get a different value. |
| **Phantom read** | You run \`select count(*) where status='todo'\` twice in one transaction; between them someone inserts a matching row, so the *set* of rows changed. |
| **Lost update** | Two transactions read the same value, both compute a new one, and the second overwrites the first. |
| **Write skew** | Two transactions read overlapping data, each checks an invariant that holds individually, and their combined writes break it. |

### The levels

| Level | Dirty read | Non-repeatable read | Phantom | Cost |
| --- | --- | --- | --- | --- |
| **Read Uncommitted** | Possible¹ | Possible | Possible | Lowest |
| **Read Committed** | No | Possible | Possible | Low — **Postgres default** |
| **Repeatable Read** | No | No | No² | Medium |
| **Serializable** | No | No | No | Highest |

¹ **Postgres does not implement Read Uncommitted** — asking for it gives you Read Committed. Its MVCC design has no mechanism to expose uncommitted rows. MySQL's InnoDB does implement it, and defaults to Repeatable Read.

² The SQL standard permits phantoms at Repeatable Read; Postgres's snapshot-based implementation prevents them anyway. Know both the standard and the implementation — interviewers who care about this topic will.

### What each level actually does in Postgres

**Read Committed** (default): each *statement* takes a fresh snapshot. So two \`SELECT\`s in one transaction can return different data — that's the non-repeatable read. It's the right default because it's cheap and most web requests are one short statement.

**Repeatable Read**: the *transaction* takes one snapshot at its first statement and sees that consistent view throughout. If it tries to update a row that another transaction has committed a change to since the snapshot, Postgres raises \`could not serialize access due to concurrent update\` (SQLSTATE \`40001\`) and you must retry.

**Serializable** (SSI — Serializable Snapshot Isolation): Postgres tracks read/write dependencies between concurrent transactions and aborts any that would produce a result no serial ordering could. It gives you the strongest guarantee without traditional read locks, so it's far cheaper than the old two-phase-locking implementations — but **your application must handle \`40001\` and retry.**

\`\`\`python
import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import TypeVar

import asyncpg

T = TypeVar("T")

# 40001 serialization_failure, 40P01 deadlock_detected — both are retryable.
RETRYABLE_SQLSTATES = frozenset({"40001", "40P01"})


async def with_serializable_retry(
    pool: asyncpg.Pool,
    fn: Callable[[asyncpg.Connection], Awaitable[T]],
    max_attempts: int = 3,
) -> T:
    for attempt in range(1, max_attempts + 1):
        try:
            async with pool.acquire() as conn:
                async with conn.transaction(isolation="serializable"):
                    return await fn(conn)
        except asyncpg.PostgresError as err:
            if err.sqlstate not in RETRYABLE_SQLSTATES or attempt == max_attempts:
                raise
            # Full jitter, so competing transactions don't retry in lockstep.
            await asyncio.sleep(random.uniform(0, 0.01 * 2**attempt))
    raise AssertionError("unreachable")
\`\`\`

### Write skew — the anomaly that needs Serializable

The canonical example: a hospital requires **at least one doctor on call** at all times.

\`\`\`text
T1 (Alice): select count(*) from doctors where on_call = true;  -- returns 2, OK
T2 (Bob):   select count(*) from doctors where on_call = true;  -- returns 2, OK
T1:         update doctors set on_call = false where name = 'Alice';   commit;
T2:         update doctors set on_call = false where name = 'Bob';     commit;
-- Result: zero doctors on call. Each transaction was individually valid.
\`\`\`

Repeatable Read does **not** prevent this, because the two transactions modify *different rows* — there is no update conflict to detect. Only Serializable catches it, because SSI notices that each transaction read data the other wrote. The alternatives are an explicit lock (\`select ... for update\` on all shift rows) or a database-level constraint.

**Being able to explain write skew, and why Repeatable Read misses it, is one of the strongest signals in a database interview.** Most candidates stop at "Serializable is the strictest".

### What to actually use

Read Committed for ordinary CRUD. Repeatable Read when a transaction issues multiple reads that must agree — a report, a multi-step calculation. Serializable when an invariant spans rows and money or safety is involved, with a retry loop, and after benchmarking: contention causes aborts, and under high write contention the retries can cost more than an explicit lock.`,
    },
    {
      id: "locking-deadlocks",
      heading: "Locking, optimistic vs pessimistic, and deadlocks",
      markdown: `### Pessimistic locking — take the lock first

\`\`\`sql
begin;
  -- Blocks any other transaction trying to lock the same row, until commit.
  select * from inventory where sku = 'ABC-1' for update;
  update inventory set quantity = quantity - 1 where sku = 'ABC-1';
commit;
\`\`\`

| Variant | Behaviour |
| --- | --- |
| \`for update\` | Exclusive row lock; other writers *and* other \`for update\` readers block |
| \`for no key update\` | Weaker — allows concurrent FK reference checks |
| \`for share\` | Shared lock; readers coexist, writers block |
| \`for update nowait\` | Raise an error immediately instead of waiting |
| \`for update skip locked\` | **Skip** locked rows — the correct way to build a job queue |

\`\`\`sql
-- A work queue that N workers can poll concurrently with zero contention.
update jobs
   set status = 'running', started_at = now()
 where id = (
   select id from jobs
    where status = 'queued'
    order by created_at
    for update skip locked
    limit 1
 )
returning *;
\`\`\`

Pessimistic locking is correct when contention is high and a conflict is likely — inventory for a flash sale, seat booking. The cost is that lock waits serialize your throughput, and a long-held lock behind slow application code creates a queue.

### Optimistic locking — assume no conflict, verify at write

\`\`\`sql
alter table tasks add column version integer not null default 1;
\`\`\`

\`\`\`python
from uuid import UUID

import asyncpg
from pydantic import BaseModel


class TaskPatch(BaseModel):
    title: str | None = None
    status: str | None = None


async def update_task(
    pool: asyncpg.Pool, task_id: UUID, expected_version: int, patch: TaskPatch
) -> asyncpg.Record:
    row = await pool.fetchrow(
        """
        update tasks
           set title = coalesce($3, title),
               status = coalesce($4, status),
               version = version + 1,
               updated_at = now()
         where id = $1 and version = $2
        returning *
        """,
        task_id,
        expected_version,
        patch.title,
        patch.status,
    )

    if row is None:
        # Zero rows updated: either the row is gone, or someone else wrote it first.
        exists = await pool.fetchval("select 1 from tasks where id = $1", task_id)
        if exists:
            raise ConflictError(
                "This task was modified by someone else. Reload and retry."
            )
        raise NotFoundError("Task not found.")
    return row
\`\`\`

No lock is ever held; the \`where version = $2\` predicate is the check, and it's atomic because a single \`UPDATE\` statement is. This maps directly onto HTTP: return \`ETag: "v7"\`, require \`If-Match\`, and answer a mismatch with \`412 Precondition Failed\`.

| | Optimistic | Pessimistic |
| --- | --- | --- |
| Lock held | None | From \`SELECT FOR UPDATE\` until commit |
| Best when | Conflicts are rare | Conflicts are likely |
| Failure mode | Wasted work, user retries | Lock waits, reduced concurrency, deadlock risk |
| Scales across services | Yes — it's just a column | Requires a shared database transaction |
| Typical use | Editing a document, a CRUD API | Inventory decrement, seat booking, account balance |

### Deadlocks

Two transactions each hold a lock the other needs:

\`\`\`text
T1: update accounts set … where id = 1;   -- holds lock on row 1
T2: update accounts set … where id = 2;   -- holds lock on row 2
T1: update accounts set … where id = 2;   -- waits for T2
T2: update accounts set … where id = 1;   -- waits for T1  -> deadlock
\`\`\`

Postgres detects the cycle (after \`deadlock_timeout\`, default 1s), kills one transaction with SQLSTATE \`40P01\`, and lets the other proceed. You cannot prevent detection from happening — you prevent the cycle.

**Prevention, in order of effectiveness:**

1. **Always acquire locks in a consistent global order.** Sort the IDs before locking, as in the transfer example earlier. If every transaction locks in ascending ID order, a cycle is impossible. This is the answer interviewers want.
2. **Keep transactions short** and touch as few rows as possible.
3. **Do a single statement where you can.** \`update … where balance >= 10\` needs no read-then-write, so there's no window.
4. **Use \`skip locked\`** for queue-style workloads so workers never contend.
5. **Retry on \`40P01\`** with backoff and jitter — deadlocks are a normal, expected condition in a concurrent system, not a bug to be eliminated entirely.

Also know the **lock hierarchy**: row locks are what application code usually hits, but DDL takes table locks. \`ALTER TABLE … ADD COLUMN NOT NULL DEFAULT\` used to rewrite the whole table under an \`ACCESS EXCLUSIVE\` lock — blocking every read and write. Modern Postgres avoids the rewrite for constant defaults, but \`ALTER TABLE\` waiting behind one long-running \`SELECT\` will queue every subsequent query behind *it*, which is how a "trivial" migration takes a site down.`,
    },
    {
      id: "connection-pooling",
      heading: "Connection pooling",
      markdown: `Each Postgres connection is a **separate OS process** with its own memory (several MB). \`max_connections\` defaults to 100 not because of an arbitrary limit but because processes are expensive: past a few hundred, context switching and memory pressure make the server *slower* under more connections, not faster.

Opening a connection means a TCP handshake, TLS negotiation, authentication, and process fork — single-digit milliseconds. Doing that per HTTP request is unacceptable, so you pool.

\`\`\`python
import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.pool = await asyncpg.create_pool(
        dsn=os.environ["DATABASE_URL"],
        min_size=0,
        max_size=10,                              # per worker process
        timeout=5.0,                              # fail fast rather than hang
        max_inactive_connection_lifetime=30.0,    # return idle connections to the OS
        command_timeout=10.0,                     # give up on a slow query client-side
        server_settings={"statement_timeout": "10000"},  # and kill it server-side
    )
    try:
        yield
    finally:
        await app.state.pool.close()


app = FastAPI(lifespan=lifespan)
\`\`\`

The SQLAlchemy equivalent is \`create_async_engine(url, pool_size=10, max_overflow=0, pool_timeout=5, pool_recycle=1800)\` — note that SQLAlchemy's ceiling is \`pool_size + max_overflow\`, so leaving \`max_overflow\` at its default of 10 quietly doubles the number you thought you configured.

### Sizing

The arithmetic is what people miss: **total connections = worker processes × pool \`max_size\`**, plus anything else touching the database — Celery or ARQ workers, cron jobs, Alembic migration runs, your psql session, the BI tool. Note that the multiplier is *processes*, not instances: \`uvicorn --workers 4\` on five machines is twenty pools, and each one is separate, because a pool cannot be shared across a fork. Twenty pools at \`max_size=20\` is 400 connections against a default limit of 100, and the failure is \`FATAL: sorry, too many clients already\` at exactly the moment traffic spikes.

Counter-intuitively, **smaller pools are often faster.** A common starting point is \`(cores × 2) + effective_spindles\`; for a modern 4-core Postgres box that's around 10 *in total*, so divide by your worker count. Beyond the point where the database is saturated, extra connections don't add throughput — they add queueing *inside* the database, where you can't see it, instead of queueing in your pool, where you can.

### PgBouncer

When you genuinely need hundreds of app processes (or serverless functions, where each invocation may open its own connection), put PgBouncer in front. It multiplexes many client connections onto few server connections.

| Mode | Behaviour | Constraint |
| --- | --- | --- |
| **Session** | A server connection is held for the client's whole session | Safe for everything; least multiplexing benefit |
| **Transaction** | A server connection is assigned per transaction | The usual choice. **Breaks session state**: prepared statements, \`SET\`, advisory locks, \`LISTEN/NOTIFY\` |
| **Statement** | Per statement | Multi-statement transactions are impossible |

Transaction mode is why asyncpg needs \`statement_cache_size=0\` behind PgBouncer (it prepares every query by name, and the name is bound to a server connection you no longer own on the next statement), and why SQLAlchemy's asyncpg dialect exposes \`prepared_statement_cache_size=0\` for the same reason. Getting this wrong produces the memorable error \`prepared statement "__asyncpg_stmt_1__" already exists\` under load and never in development.

### Diagnosing pool exhaustion

The symptom is deceptive: **every endpoint gets slow, including ones that don't touch the database**, because requests queue waiting for a connection. It looks like "the database is slow" when the database is idle.

\`\`\`sql
-- Who's connected and what are they doing?
select state, count(*), max(now() - state_change) as longest
  from pg_stat_activity
 where datname = current_database()
 group by state;

-- Transactions left open by a bug — these hold locks and block vacuum.
select pid, now() - xact_start as duration, state, left(query, 60) as query
  from pg_stat_activity
 where state = 'idle in transaction'
   and now() - xact_start > interval '30 seconds'
 order by duration desc;
\`\`\`

\`idle in transaction\` is the smoking gun. It means code called \`BEGIN\`, then did something slow or threw, and never committed or rolled back — usually an HTTP call inside a transaction, or a connection acquired outside \`async with\` and dropped on an exception path. Set \`idle_in_transaction_session_timeout\` so the database kills those rather than letting them accumulate.

The three rules: acquire the connection as late as possible, release it in a \`finally\`, and never hold one across a network call to anything else.`,
    },
    {
      id: "scaling-and-nosql",
      heading: "Scaling: denormalization, replication, sharding, and NoSQL",
      markdown: `### The order you actually do things

Interviewers like this question because the *sequence* reveals judgement. Reaching for sharding before you've added an index is a red flag.

1. **Index correctly and fix the queries.** Most "we've outgrown Postgres" turns out to be one missing composite index and an N+1.
2. **Cache** — Redis for expensive computed results, HTTP caching for public reads.
3. **Read replicas** — stream WAL to followers and route reads there. Cheap and effective, since most workloads are read-heavy.
4. **Vertical scaling** — a bigger box. Unfashionable, and it works: a single modern Postgres instance handles tens of thousands of TPS.
5. **Denormalize specific hot paths** with measured justification.
6. **Partition** large tables within one database.
7. **Shard** across databases. Last, because it's irreversible in practice.

### Replication

**Streaming replication**: the primary ships its write-ahead log to replicas that replay it. Writes go to the primary; reads can go anywhere.

- **Asynchronous** (default): the primary commits without waiting for replicas. Fast, but replicas lag — usually milliseconds, occasionally seconds under load. A crash can lose the last unreplicated commits.
- **Synchronous**: the primary waits for a replica to confirm before acknowledging. No data loss on failover, at the cost of commit latency and a hard dependency on the replica's health.

**The read-your-own-writes problem**, which is the follow-up you should pre-empt: a user updates their profile (primary), the redirect reads from a replica that hasn't caught up, and the change appears to have vanished. Fixes: route reads to the primary for a short window after a user's write; pin a session to the primary; or track the WAL position and wait for the replica to reach it.

### Partitioning vs sharding

**Partitioning** splits one table into pieces inside one database — usually by range on a timestamp.

\`\`\`sql
create table events (
  id bigserial, occurred_at timestamptz not null, payload jsonb
) partition by range (occurred_at);

create table events_2026_07 partition of events
  for values from ('2026-07-01') to ('2026-08-01');
\`\`\`

Queries with \`where occurred_at >= …\` prune to the relevant partitions, indexes stay small, and dropping old data is \`drop table events_2026_01\` — instant, versus a \`DELETE\` that takes hours and bloats the table.

**Sharding** splits data across *separate database servers* by a shard key (\`user_id\`, \`tenant_id\`). It's the only way past one machine's write capacity, and it costs you a great deal:

- Cross-shard joins and transactions are gone. Anything spanning shards happens in application code.
- \`UNIQUE\` across all shards is no longer enforceable by the database.
- Rebalancing is an operational project. Consistent hashing reduces reshuffling but doesn't eliminate it.
- A bad shard key creates hotspots — sharding by \`country\` when 60% of users are in one country buys you nothing.

Say this: *"I'd shard last, because it's the only step that's genuinely hard to undo. Multi-tenant B2B shards naturally by tenant, which is the easy case since queries rarely cross tenants."*

### Denormalization

Deliberate, measured redundancy:

\`\`\`sql
-- Instead of count(*) over 4M comments on every page load:
alter table posts add column comment_count integer not null default 0;

create or replace function bump_comment_count() returns trigger as $$
begin
  if tg_op = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comment_count = comment_count - 1 where id = old.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger comment_count_trigger
  after insert or delete on comments
  for each row execute function bump_comment_count();
\`\`\`

The tradeoffs to state: writes get slower and now contend on the \`posts\` row (a hot post becomes a lock hotspot), and the counter *will* drift if any write path bypasses the trigger — so you need a periodic reconciliation job. Materialized views are the alternative when staleness is acceptable: \`refresh materialized view concurrently\` on a schedule.

### SQL vs NoSQL, honestly

| | Relational (Postgres) | Document (Mongo) | Key-value (Redis, DynamoDB) | Wide-column (Cassandra) |
| --- | --- | --- | --- | --- |
| Schema | Enforced | Flexible per document | None | Per-column-family |
| Joins | Native | Limited (\`$lookup\`) | None | None |
| Transactions | Full ACID, multi-row | Multi-document since 4.0, with caveats | Limited | Lightweight transactions only |
| Query flexibility | Arbitrary ad-hoc SQL | Good within a document | Key access only | Must match the partition key |
| Horizontal write scale | Hard (sharding) | Built in | Built in | Built in, linear |
| Best for | Anything relational, which is most things | Genuinely document-shaped, variable-schema data | Caching, sessions, rate limits, leaderboards | Massive write volume, time series |

**What I want to hear from a candidate:** *"Postgres by default. It gives me ACID transactions, joins, constraints, and ad-hoc queries, and modern Postgres handles JSON with \`jsonb\` and GIN indexes, so 'my data is unstructured' is rarely a reason to leave. I'd add Redis for caching, sessions, and rate limiting, because those are genuinely key-value and want an in-memory store. I'd choose Cassandra or DynamoDB for a write volume a single primary can't take — event ingestion at millions of writes per second — accepting that I must design every query into the partition key up front. The failure mode I've seen is picking a document store to avoid writing migrations, then discovering that a schema you don't declare still exists; it just lives implicitly in application code, in five slightly different versions."*

Two more terms you should be able to define crisply:

- **CAP** — under a network *partition*, you choose availability or consistency. It says nothing about the non-partitioned case, so "Mongo is AP and Postgres is CP" is a sloppier statement than people think. **PACELC** extends it usefully: else (no partition), you still trade latency against consistency.
- **BASE** — Basically Available, Soft state, Eventual consistency. The deliberate opposite of ACID, and the right model when availability beats immediate correctness (a follower count, a recommendation feed) and the wrong one for money.`,
    },
    {
      id: "exercises",
      heading: "Live SQL exercises with solutions",
      markdown: `Schema for all exercises:

\`\`\`sql
create table customers (id int primary key, name text, country text, signed_up_at date);
create table orders (
  id int primary key,
  customer_id int references customers(id),
  placed_at timestamptz not null,
  status text not null,          -- 'paid' | 'refunded' | 'pending'
  total_cents int not null
);
create table order_items (
  order_id int references orders(id),
  product_id int,
  quantity int not null,
  unit_price_cents int not null,
  primary key (order_id, product_id)
);
create table employees (id int primary key, name text, dept_id int, salary int);
\`\`\`

---

### 1. Second-highest salary

*Return the second-highest distinct salary. Return NULL if it doesn't exist.*

\`\`\`sql
-- Cleanest: OFFSET over distinct values. The scalar subquery yields NULL
-- automatically when there is no second row.
select (select distinct salary
          from employees
         order by salary desc
         offset 1 limit 1) as second_highest;
\`\`\`

\`\`\`sql
-- Generalizes to Nth, and handles ties correctly.
select salary
  from (select salary, dense_rank() over (order by salary desc) as r
          from employees) ranked
 where r = 2
 limit 1;
\`\`\`

**Why \`dense_rank\` and not \`rank\`:** with salaries 100, 100, 90, \`rank()\` gives 1, 1, 3 — there is no rank 2, so the query returns nothing. \`dense_rank()\` gives 1, 1, 2 and correctly returns 90. Interviewers plant duplicate salaries specifically to test this. \`row_number()\` is wrong for a different reason: it would return the *second row*, i.e. 100 again.

---

### 2. Top 3 earners per department

\`\`\`sql
with ranked as (
  select e.id, e.name, e.dept_id, e.salary,
         dense_rank() over (partition by e.dept_id order by e.salary desc) as r
    from employees e
)
select dept_id, name, salary, r
  from ranked
 where r <= 3
 order by dept_id, r, name;
\`\`\`

Two things being tested: that you know a window function **cannot** go in \`WHERE\` (it's evaluated after), so it must be wrapped in a CTE or subquery; and that you choose the ranking function deliberately — \`dense_rank\` returns everyone tied at third, \`row_number\` returns exactly three and arbitrarily drops a tied employee.

A Postgres-specific alternative that's often faster with the right index:

\`\`\`sql
select d.id, top.name, top.salary
  from departments d
  cross join lateral (
    select e.name, e.salary
      from employees e
     where e.dept_id = d.id
     order by e.salary desc
     limit 3
  ) top;
\`\`\`

---

### 3. Customers with no orders (three ways)

\`\`\`sql
-- A. NOT EXISTS — the default choice. NULL-safe, stops at the first match.
select c.id, c.name
  from customers c
 where not exists (select 1 from orders o where o.customer_id = c.id);

-- B. LEFT JOIN ... IS NULL — the anti-join, the classic interview answer.
select c.id, c.name
  from customers c
  left join orders o on o.customer_id = c.id
 where o.id is null;

-- C. NOT IN — CORRECT ONLY IF customer_id is NOT NULL.
select c.id, c.name
  from customers c
 where c.id not in (select customer_id from orders where customer_id is not null);
\`\`\`

**Say why C is dangerous.** If \`orders.customer_id\` contains a single NULL, \`c.id NOT IN (1, 2, NULL)\` evaluates to NULL rather than true for every row, and the query returns **zero rows** with no error. This is the NULL trap, and volunteering it is worth more than the query itself.

---

### 4. Monthly revenue with month-over-month growth

\`\`\`sql
with monthly as (
  select date_trunc('month', placed_at) as month,
         sum(total_cents)               as revenue_cents,
         count(*)                       as order_count
    from orders
   where status = 'paid'
   group by 1
)
select month,
       revenue_cents / 100.0 as revenue,
       order_count,
       lag(revenue_cents) over (order by month) / 100.0 as prev_revenue,
       round(
         100.0 * (revenue_cents - lag(revenue_cents) over (order by month))
              / nullif(lag(revenue_cents) over (order by month), 0),
         1
       ) as mom_growth_pct,
       sum(revenue_cents) over (order by month
                                rows between unbounded preceding and current row)
         / 100.0 as cumulative_revenue
  from monthly
 order by month;
\`\`\`

Three things being checked: \`lag()\` for the previous period; \`nullif(x, 0)\` to avoid division by zero (which would abort the whole query); and an explicit \`rows between unbounded preceding and current row\` frame for the running total. Bonus point for noting that months with no paid orders are simply absent — if you need zeros, \`generate_series\` the months and \`LEFT JOIN\` to them.

---

### 5. Find and delete duplicate rows, keeping the earliest

\`\`\`sql
-- Find them.
select email, count(*) as copies, min(id) as keep_id, array_agg(id order by id) as all_ids
  from customers
 group by email
having count(*) > 1;

-- Delete all but the earliest, using ctid so it works even with no unique key.
delete from customers c
 using (
   select ctid,
          row_number() over (partition by lower(email) order by id) as rn
     from customers
 ) dup
 where c.ctid = dup.ctid
   and dup.rn > 1;

-- Then make it impossible to happen again. THIS is the real answer.
create unique index customers_email_unique on customers (lower(email));
\`\`\`

Anyone can write the \`DELETE\`. The follow-up is always "how do you stop it recurring?", and the answer is a constraint, plus \`insert ... on conflict (lower(email)) do nothing\` on the write path — not an application-level "check if it exists first", which races.

---

### 6. Consecutive-day login streaks (gaps and islands)

*For each user, find their longest run of consecutive days with a login.*

\`\`\`sql
with distinct_days as (
  select distinct user_id, logged_at::date as day
    from logins
),
grouped as (
  -- The trick: for consecutive days, (day - row_number()) is CONSTANT.
  -- Day 1,2,3 minus rows 1,2,3 all give the same anchor date; a gap shifts it.
  select user_id, day,
         day - (row_number() over (partition by user_id order by day))::int as grp
    from distinct_days
),
streaks as (
  select user_id, grp,
         min(day) as streak_start,
         max(day) as streak_end,
         count(*) as streak_length
    from grouped
   group by user_id, grp
)
select distinct on (user_id) user_id, streak_start, streak_end, streak_length
  from streaks
 order by user_id, streak_length desc, streak_start desc;
\`\`\`

The \`day - row_number()\` identity is the standard gaps-and-islands technique; it also solves "find gaps in an ID sequence" and "collapse overlapping time ranges". \`distinct on\` is Postgres-specific and picks the first row per group given the \`ORDER BY\` — a compact substitute for a second window function.

---

### 7. Products never ordered, plus per-customer order stats in one pass

\`\`\`sql
-- Products with zero orders.
select p.id, p.name
  from products p
 where not exists (select 1 from order_items oi where oi.product_id = p.id);

-- Per-customer stats. Aggregate FILTER is cleaner than sum(case when ...).
select c.id,
       c.name,
       count(o.id)                                        as total_orders,
       count(*) filter (where o.status = 'paid')           as paid_orders,
       count(*) filter (where o.status = 'refunded')       as refunded_orders,
       coalesce(sum(o.total_cents) filter (where o.status = 'paid'), 0) / 100.0
                                                          as lifetime_value,
       max(o.placed_at)                                    as last_order_at
  from customers c
  left join orders o on o.customer_id = c.id
 group by c.id, c.name
 order by lifetime_value desc;
\`\`\`

Watch two things. The \`LEFT JOIN\` keeps customers with no orders, so \`count(o.id)\` (not \`count(*)\`) correctly yields 0 for them. And \`filter (where …)\` is the idiomatic Postgres form of conditional aggregation — \`sum(case when status = 'paid' then total_cents else 0 end)\` is equivalent and portable, but \`filter\` reads better and is worth knowing by name.

---

### 8. Median order value

\`\`\`sql
-- percentile_cont interpolates between the two middle values (true median).
-- percentile_disc returns an actual value from the data set.
select
  percentile_cont(0.5) within group (order by total_cents) / 100.0 as median,
  percentile_disc(0.5) within group (order by total_cents) / 100.0 as median_disc,
  percentile_cont(0.95) within group (order by total_cents) / 100.0 as p95,
  round(avg(total_cents) / 100.0, 2)                                as mean
  from orders
 where status = 'paid';
\`\`\`

Worth adding out loud: report the median and p95 rather than the mean for anything money- or latency-shaped, because both distributions are heavily right-skewed and the mean hides the tail.`,
    },
  ],
  questions: [
    {
      q: "Explain the difference between an INNER JOIN and a LEFT JOIN, and give me a case where using the wrong one is a bug.",
      a: "INNER JOIN returns only rows with a match on both sides; LEFT JOIN returns every row from the left table, with NULLs where the right has no match. The bug case: 'list all departments with their headcount'. With an INNER JOIN, a department with zero employees vanishes from the report entirely — you don't get a zero, you get nothing, so the number nobody wants to see is the number you can't see. Two related traps. First, `count(*)` after a LEFT JOIN counts the manufactured NULL row, so an empty department shows headcount 1; you need `count(e.id)`, which ignores NULLs. Second, putting a condition on the right table in `WHERE` silently converts a LEFT JOIN back to an INNER JOIN, because `NULL <> 'x'` is NULL, not true. Conditions on the outer side belong in the `ON` clause; `ON` decides what matches, `WHERE` filters the result after the NULLs already exist.",
      weak: "LEFT JOIN gets everything from the left table and INNER JOIN gets the matching rows. I'd use LEFT JOIN when I want all the data.",
    },
    {
      q: "You have a query filtering on three columns. How do you decide the index and the column order?",
      a: "One composite index, ordered equality columns first and the range or sort column last. For `where project_id = $1 and status = $2 order by created_at desc`, that's `(project_id, status, created_at desc)`. The reason is the leftmost-prefix rule: a B-tree on (a, b, c) is sorted by a, then b, then c — like a phone book by last name then first name — so it serves queries on (a), (a,b), and (a,b,c), but not on (b) alone. And a range predicate consumes the ordering: once you scan a range on a column, everything to its right in the index is no longer usefully sorted, which is why range and sort columns go last. Done right, that index satisfies the filter *and* the ORDER BY, so the plan has no Sort node at all and `LIMIT 20` reads 20 leaf entries. I'd verify with `EXPLAIN ANALYZE` that the planner actually uses it — adding an index the planner ignores is the most common false victory. And I'd check whether an existing index already covers it as a prefix, since a redundant index costs writes and buys nothing.",
    },
    {
      q: "When would adding an index make things worse?",
      a: "Four cases. Write-heavy tables: every INSERT updates the table and every index on it, so ten indexes means eleven structures modified per write. Low-selectivity columns: an index on a boolean that's 90% true won't be used for `= true`, because fetching 90% of rows through random index lookups is slower than a sequential scan — the planner knows this and will ignore it, so you've paid the write cost for nothing. Small tables, where a seq scan of a few cached pages beats tree traversal. And redundant indexes: `(a)` is pointless when `(a, b)` exists, since the composite serves the prefix. There's also memory pressure — indexes compete with data for the buffer cache, so a large unused index evicts hot pages. I'd audit with `pg_stat_user_indexes` for `idx_scan = 0` before adding more. Separately, creating one takes a lock that blocks writes, so on a production table it has to be `create index concurrently`, which is slower and can leave an invalid index you must drop and retry.",
    },
    {
      q: "Walk me through reading an EXPLAIN ANALYZE plan.",
      a: "Read it inside-out, bottom-up: the deepest indented node runs first and feeds its parent. For each node I compare the estimated `rows` to the actual `rows` — a large divergence means the planner's statistics are stale, so every downstream choice was made on bad information, and `ANALYZE tablename` may fix it outright. I look at actual time, remembering it's *per loop*: a node with `loops=20` and 0.009ms is 0.18ms total, and missing that is how people misread nested loops. `BUFFERS` tells me `shared hit` versus `read` — a query returning ten rows but reading thousands of pages is doing far more I/O than the result suggests. Then the node types: a Seq Scan on a large table with a selective filter means a missing index; a Sort with `external merge Disk: 51MB` means it spilled and needs either more work_mem or an index providing the order; a Hash Join with `Batches: 8` also spilled; and a Nested Loop over vastly more rows than estimated usually means a bad selectivity estimate on correlated predicates. Then I change one thing and re-run, and confirm the plan actually changed rather than just the timing.",
      weak: "I'd look for 'Seq Scan' in the output — that means it's not using an index, so I'd add one.",
    },
    {
      q: "What are the ACID properties?",
      a: "Atomicity: all statements in a transaction commit or none do, so there's no state where a debit landed without its credit — Postgres gets this from the write-ahead log, journalling changes before applying them so a crash mid-transaction is undone on recovery. Consistency: the transaction moves from one valid state to another, where valid means every declared constraint holds — foreign keys, checks, uniqueness. Worth noting this is the weakest of the four as a guarantee, and the C in ACID is unrelated to the C in CAP; conflating them is a common slip. Isolation: concurrent transactions don't see each other's uncommitted work, with the degree controlled by the isolation level. Durability: once COMMIT returns, the data survives a power cut, because the WAL is fsynced before acknowledging — which is why commits have a latency floor, and why `synchronous_commit = off` trades the last few hundred milliseconds of data on a crash for faster writes. That's a legitimate choice for analytics ingest and never for payments.",
    },
    {
      q: "Explain the isolation levels and what each one prevents.",
      a: "Read Uncommitted allows dirty reads — seeing uncommitted data that might roll back. Postgres doesn't actually implement it; asking for it gives you Read Committed, because its MVCC design has no way to expose uncommitted rows. Read Committed, the Postgres default, prevents dirty reads: each *statement* takes a fresh snapshot, so two SELECTs in one transaction can disagree — that's a non-repeatable read. Repeatable Read takes one snapshot for the whole transaction, so all reads agree; the standard still permits phantoms at this level, but Postgres's snapshot implementation prevents them too. Serializable guarantees the result is equivalent to some serial execution. Postgres implements it as SSI — it tracks read/write dependencies and aborts transactions that would produce an impossible result, which means my application has to catch SQLSTATE 40001 and retry with backoff. In practice: Read Committed for ordinary CRUD, Repeatable Read when several reads in one transaction must agree, Serializable when an invariant spans rows and correctness matters more than throughput — after benchmarking, because under high contention the aborts can cost more than an explicit lock.",
    },
    {
      q: "What's write skew, and which isolation level do you need for it?",
      a: "Two transactions read overlapping data, each checks an invariant that holds from its own snapshot, and their combined writes break it — even though neither wrote a row the other read. The canonical case is 'at least one doctor must be on call': Alice and Bob each read `count(*) where on_call = true`, both see 2, both conclude it's safe to go off call, each updates their own row, and now zero doctors are on call. Repeatable Read does not prevent this, and that's the key point — the transactions update *different* rows, so there's no update conflict to detect. Only Serializable catches it, because SSI notices each transaction read data the other wrote and aborts one with a serialization failure. The alternatives if you don't want Serializable: take an explicit `select ... for update` over all the shift rows so the reads conflict, or express the invariant as a database constraint. Write skew is worth knowing precisely because it's the anomaly that shows why 'Repeatable Read is nearly as good as Serializable' is wrong.",
    },
    {
      q: "Optimistic or pessimistic locking?",
      a: "It depends on how likely a conflict is. Pessimistic — `select ... for update` inside a transaction — takes the lock before reading, so nobody else can touch the row until you commit. That's right when contention is high and a conflict is likely: decrementing inventory in a flash sale, booking a seat. The cost is that lock waits serialize throughput and long-held locks create queues and deadlock risk. Optimistic adds a `version` column and writes with `where id = $1 and version = $2`, incrementing it; if the update affects zero rows — `RETURNING` gives back nothing — someone else won and you return a 409 telling the client to reload. No lock is ever held, and the check is atomic because a single UPDATE is. That's right when conflicts are rare, which covers most CRUD — two people editing the same document at the same second is unusual. It also maps straight onto HTTP: serve `ETag`, require `If-Match`, answer a mismatch with 412. And it works across services without a shared transaction, since it's just a column. My default is optimistic, switching to pessimistic when I measure real contention.",
      weak: "Pessimistic locking is safer because it locks the row, so I'd use SELECT FOR UPDATE to be sure nothing gets overwritten.",
    },
    {
      q: "What causes a deadlock and how do you prevent one?",
      a: "Two transactions each hold a lock the other needs: T1 locks row 1 then wants row 2, T2 locks row 2 then wants row 1. Postgres detects the cycle after `deadlock_timeout` — one second by default — kills one transaction with SQLSTATE 40P01, and lets the other proceed. You can't stop detection; you prevent the cycle. The main fix is acquiring locks in a consistent global order: sort the IDs before locking, so if every transaction locks in ascending order a cycle is impossible. Then: keep transactions short, touch as few rows as possible, and prefer a single statement where you can — `update accounts set balance = balance - 10 where id = $1 and balance >= 10` needs no read-then-write, so there's no window at all. For queue workloads, `for update skip locked` means workers never contend for the same row. And I'd retry on 40P01 with backoff and jitter, because in a concurrent system deadlocks are an expected condition rather than a bug to eliminate entirely. One thing people miss: DDL takes table-level locks, so an ALTER TABLE stuck behind one long SELECT queues every subsequent query behind it — that's how a trivial migration takes a site down.",
    },
    {
      q: "Why do you need a connection pool, and how do you size it?",
      a: "Each Postgres connection is a separate OS process with several MB of its own memory, and opening one costs a TCP handshake, TLS, auth, and a fork — single-digit milliseconds, which is unacceptable per request. A pool keeps N connections warm and hands them out. Sizing is arithmetic people skip: total connections is worker *processes* times pool max_size — not instances, since a pool can't be shared across a fork, so `uvicorn --workers 4` on five machines is twenty pools — plus background workers, cron jobs, migration runners, the BI tool, and your psql session. Twenty pools at max_size 20 is 400 against a default `max_connections` of 100, and it fails with 'too many clients' exactly when traffic spikes. Counter-intuitively smaller pools are often faster — roughly cores × 2 as a starting point — because past the point where the database is saturated, extra connections just move the queue *inside* the database where you can't observe it. Past a few hundred processes the server gets slower, not faster. For hundreds of app processes or serverless, PgBouncer in transaction mode multiplexes many clients onto few server connections, at the cost of breaking session state — prepared statements, SET, advisory locks. And the symptom of exhaustion is deceptive: every endpoint gets slow including ones that don't touch the database, because requests queue for a connection while the database sits idle.",
    },
    {
      q: "You've normalized to 3NF. When would you denormalize?",
      a: "When I've measured a specific read path that's too slow and the alternatives are exhausted. The usual example is a comment count: `count(*)` over four million comments on every page load versus a `comment_count` column on posts maintained by a trigger. I'd state the costs explicitly, because that's what makes it a decision rather than a shortcut. Writes get slower and now contend on the posts row, so a hot post becomes a lock hotspot. The counter will drift if any write path bypasses the trigger — a bulk import, a manual DELETE — so it needs a periodic reconciliation job. And there are now two sources of truth. Before doing it, I'd try the cheaper options: the right index, a Redis cache with a TTL if staleness is acceptable, or a materialized view refreshed on a schedule, which keeps the denormalization out of the write path entirely. The important exception, which isn't really denormalization: `order_items.unit_price_cents` duplicating the product price is correct, because the price at purchase time is a genuinely different fact from the current price. Normalize facts that are the same fact; copy point-in-time snapshots.",
    },
    {
      q: "SQL or NoSQL for a new product?",
      a: "Postgres, unless I have a specific reason not to. It gives me ACID transactions, joins, foreign keys and check constraints, and arbitrary ad-hoc queries — which matters most early, when I don't yet know what I'll need to ask. Modern Postgres handles semi-structured data with `jsonb` and GIN indexes, so 'my data is unstructured' is rarely a reason to leave, and I can start relational and add JSON columns for the genuinely variable parts. I'd add Redis for caching, sessions, and rate limiting, because those are truly key-value and want an in-memory store with TTLs. I'd choose Cassandra or DynamoDB for write volume a single primary can't absorb — event ingestion in the millions per second — accepting that every query must be designed into the partition key up front and ad-hoc analysis is gone. The failure mode I've watched happen: teams pick a document store to avoid writing migrations, then find that a schema you don't declare still exists — it just lives implicitly in application code, in five slightly different versions, and now you're doing migrations in a background job with no transaction.",
      weak: "MongoDB, because it's more flexible and scales horizontally, and you don't have to define a schema up front so you can move faster.",
    },
    {
      q: "How would you find the second-highest salary?",
      a: "`select distinct salary from employees order by salary desc offset 1 limit 1` — wrapping it in a scalar subquery so it returns NULL rather than an empty set when there's no second value. The `distinct` matters: with salaries 100, 100, 90 the answer should be 90, and without it you'd return 100. The version that generalizes is a window function: `dense_rank() over (order by salary desc)` in a subquery, filtered to `r = 2`. It has to be a subquery because window functions can't appear in WHERE — they're evaluated after it. And the ranking function choice is deliberate: `rank()` gives 1, 1, 3 for those salaries so there is no rank 2 and the query returns nothing; `row_number()` returns the second row, which is 100 again. Only `dense_rank()` is correct. Interviewers plant duplicate salaries specifically to see whether you noticed.",
    },
    {
      q: "Write a query for the top 3 earners in each department.",
      a: "A CTE with `dense_rank() over (partition by dept_id order by salary desc)`, then filter `where r <= 3` outside it. The subquery or CTE is mandatory because a window function can't go in WHERE — it's evaluated after WHERE and HAVING. `PARTITION BY` is what restarts the ranking per department rather than ranking globally. On the function choice: `dense_rank` returns everyone tied at third place, which is usually what a human means by 'top 3'; `row_number` returns exactly three rows and arbitrarily drops a tied employee. I'd say that tradeoff out loud and ask which they want. In Postgres there's also a `cross join lateral` form — for each department, a correlated subquery with `order by salary desc limit 3` — which is often faster with an index on `(dept_id, salary desc)`, because it can seek and stop after three rows per department instead of ranking every employee.",
    },
    {
      q: "How do you find customers who have never placed an order?",
      a: "`NOT EXISTS` is my default: `select c.* from customers c where not exists (select 1 from orders o where o.customer_id = c.id)`. It's NULL-safe and the planner turns it into an anti-join that stops at the first match. The equivalent classic form is a LEFT JOIN with `where o.id is null` — same plan in Postgres, and worth knowing because it's the shape interviewers often expect. The one I'd flag as dangerous is `NOT IN` with a subquery: if `orders.customer_id` contains a single NULL, `c.id NOT IN (1, 2, NULL)` evaluates to NULL rather than true for every row, so the query silently returns zero rows with no error. That's the NULL trap, and it's exactly why I default to NOT EXISTS. If I did have to use NOT IN I'd add `where customer_id is not null` to the subquery.",
    },
    {
      q: "A query that used to be fast is now slow. How do you diagnose it?",
      a: "First confirm it's actually the query and not the system: check `pg_stat_activity` for lock waits and long-running transactions, and check whether the box is under CPU or I/O pressure. If it's the query, `EXPLAIN (ANALYZE, BUFFERS)` it and compare the plan against what I expect. The usual causes, roughly in order. Data volume crossed a threshold and the planner flipped from an index scan to a sequential scan — often correct, and the fix is a better index or a more selective query. Statistics went stale after a bulk load, so estimates are wildly off; `ANALYZE` fixes that immediately. Table bloat from a long-open transaction preventing vacuum, so the table has far more pages than live rows. An index got dropped or invalidated by a failed `create index concurrently`. Parameter sniffing or a type mismatch causing an implicit cast on the column side, which silently disables the index. Or the query text changed subtly — someone wrapped a column in a function, like `where date(created_at) = $1`, which no index on `created_at` can serve; rewriting it as a half-open range restores the index. I'd also check `pg_stat_statements` ordered by total time, not mean, since a 5ms query run a million times matters more than a 3-second report.",
    },
  ],
};
