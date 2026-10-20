import "dotenv/config";
import { Pool } from "pg";
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(782641)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    const dir = path.join(process.cwd(), "db/migrations");
    for (const name of (await readdir(dir))
      .filter((f) => /^\d+.*\.sql$/.test(f))
      .sort()) {
      const sql = await readFile(path.join(dir, name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.query<{ checksum: string }>(
        "SELECT checksum FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (existing.rows[0]) {
        if (existing.rows[0].checksum !== checksum)
          throw new Error(`Applied migration was modified: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (name, checksum) VALUES ($1,$2)",
        [name, checksum],
      );
      console.log(`Applied ${name}`);
    }
    await client.query("COMMIT");
    console.log("Database migrations complete.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
