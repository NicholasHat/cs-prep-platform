"use server";

import { sql } from "drizzle-orm";
import { db } from "@/db";
import { toLocalDateString } from "@/lib/srs";

export interface CategoryProgress {
  category: string;
  total: number;
  solved: number;
}

export async function getCategoryProgress(): Promise<CategoryProgress[]> {
  const rows = await db.execute(sql`
    select
      p.category,
      count(*)::int as total,
      count(*) filter (where ps.status in ('solved', 'needs_review'))::int as solved,
      min(p.sort_order) as first_order
    from problems p
    left join problem_status ps on ps.problem_slug = p.slug
    group by p.category
    order by first_order
  `);
  return rows.rows.map((r) => ({
    category: r.category as string,
    total: r.total as number,
    solved: r.solved as number,
  }));
}

/**
 * Days (YYYY-MM-DD) with any activity — a logged attempt or a completed
 * schedule block — over the trailing `days` window, plus the current streak.
 */
export async function getActivity(days = 140) {
  const rows = await db.execute(sql`
    select d, sum(n)::int as n from (
      select date(a.date) as d, count(*) as n
      from attempts a
      where a.date > now() - make_interval(days => ${days})
      group by 1
      union all
      select b.date as d, count(*) as n
      from schedule_blocks b
      where b.status in ('done', 'partial')
        and b.date > (now() - make_interval(days => ${days}))::date
      group by 1
    ) t group by d order by d
  `);

  const byDay = new Map<string, number>();
  for (const r of rows.rows) {
    const key =
      r.d instanceof Date ? toLocalDateString(r.d) : String(r.d).slice(0, 10);
    byDay.set(key, r.n as number);
  }

  // Current streak: consecutive active days ending today or yesterday.
  let streak = 0;
  const cursor = new Date();
  if (!byDay.has(toLocalDateString(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // today not yet active — streak may still be alive
  }
  while (byDay.has(toLocalDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { byDay: Object.fromEntries(byDay), streak };
}
