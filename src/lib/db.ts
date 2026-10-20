import "server-only";
import { Pool } from "pg";

const globalDb = globalThis as unknown as { pool?: Pool };
export const db =
  globalDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30_000,
    statement_timeout: 10_000,
  });
if (!globalDb.pool) {
  db.on("error", () => console.error("Idle PostgreSQL connection failed"));
}
if (process.env.NODE_ENV !== "production") globalDb.pool = db;
