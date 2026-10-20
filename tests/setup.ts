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
  const demoPassword = process.env.DEMO_PASSWORD;
  if (!demoPassword || demoPassword.length < 12)
    throw new Error("Set DEMO_PASSWORD with at least 12 characters for e2e.");
  const env = {
    ...process.env,
    DATABASE_URL: connectionString,
    DEMO_PASSWORD: demoPassword,
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
