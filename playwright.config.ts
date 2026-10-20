import "dotenv/config";
import { defineConfig } from "@playwright/test";

const testDb = process.env.TEST_DATABASE_URL;
if (!testDb || !new URL(testDb).pathname.endsWith("_test"))
  throw new Error(
    "Set TEST_DATABASE_URL to a dedicated database whose name ends in _test.",
  );

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 40_000,
  expect: { timeout: 10_000 },
  globalSetup: "./tests/setup.ts",
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3100",
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: false,
    timeout: 60_000,
    env: {
      DATABASE_URL: testDb,
      APP_ORIGIN: "http://localhost:3100",
      COOKIE_SECURE: "false",
      PORT: "3100",
      HOSTNAME: "127.0.0.1",
    },
  },
});
