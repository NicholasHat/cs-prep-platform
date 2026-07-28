import "dotenv/config";
import { FEEDS } from "../lib/internships/feeds";
import { summarize, syncFeeds } from "../lib/internships/sync";

/**
 * CLI mirror of the in-app sync button: `npm run db:sync-listings`.
 * Handy for a cron job so listings are fresh before you open the app.
 * Pass feed keys to limit the run, e.g. `... -- vansh-summer-2027`.
 */
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const wanted = process.argv.slice(2);
  const targets = wanted.length
    ? FEEDS.filter((f) => wanted.includes(f.key))
    : FEEDS;

  if (!targets.length) {
    throw new Error(
      `No feed matched. Known keys: ${FEEDS.map((f) => f.key).join(", ")}`,
    );
  }

  const results = await syncFeeds(targets);
  console.log(summarize(results));
  process.exit(results.some((r) => r.error) ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
