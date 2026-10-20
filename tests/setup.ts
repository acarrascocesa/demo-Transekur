import "dotenv/config";
import { execFileSync } from "node:child_process";
import { Pool } from "pg";

export default async function setup() {
  const connectionString = process.env.TEST_DATABASE_URL;
  if (
    !connectionString ||
    !new URL(connectionString).pathname.endsWith("_test")
  )
    throw new Error("Refusing to modify a non-test database.");
  const env = {
    ...process.env,
    DATABASE_URL: connectionString,
    DEMO_PASSWORD: process.env.DEMO_PASSWORD ?? "Demo-Transekur-2026!",
  };
  execFileSync(process.execPath, ["--import", "tsx", "scripts/migrate.ts"], {
    env,
    stdio: "inherit",
  });
  const pool = new Pool({ connectionString });
  try {
    await pool.query(
      "TRUNCATE notices, services, sessions, users, vehicles, login_attempts CASCADE",
    );
  } finally {
    await pool.end();
  }
  execFileSync(process.execPath, ["--import", "tsx", "scripts/seed.ts"], {
    env,
    stdio: "inherit",
  });
}
