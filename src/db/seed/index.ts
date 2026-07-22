import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../schema";
import { NEETCODE_150 } from "./neetcode150";

/**
 * Idempotent seed: upserts the NeetCode 150 catalog. Safe to re-run —
 * user data (statuses, attempts, walkthroughs, review state) is untouched.
 */
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");

  const pool = new Pool({ connectionString: url });
  const db = drizzle(pool, { schema });

  for (const p of NEETCODE_150) {
    await db
      .insert(schema.problems)
      .values(p)
      .onConflictDoUpdate({
        target: schema.problems.slug,
        set: {
          title: p.title,
          category: p.category,
          difficulty: p.difficulty,
          sortOrder: p.sortOrder,
          leetcodeUrl: p.leetcodeUrl,
        },
      });
  }

  console.log(`Seeded ${NEETCODE_150.length} problems.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
