import {
  test,
  expect,
  type APIRequestContext,
  type Page,
} from "@playwright/test";
import { Pool } from "pg";
import { randomUUID, createHash } from "node:crypto";
import { today, dayRange } from "../../src/lib/time";
import AxeBuilder from "@axe-core/playwright";

const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
const demoPassword = process.env.DEMO_PASSWORD;
if (!demoPassword || demoPassword.length < 12) {
  throw new Error("Set DEMO_PASSWORD with at least 12 characters for e2e.");
}
const password: string = demoPassword;
const origin = "http://localhost:3100";
test.beforeEach(async () => {
  await pool.query("DELETE FROM login_attempts");
});
test.afterAll(async () => {
  await pool.end();
});

async function login(request: APIRequestContext, username: string) {
  const response = await request.post("/api/login", {
    headers: { Origin: origin },
    data: { username, password },
  });
  expect(response.status()).toBe(200);
}
async function loginUi(page: Page, username: string) {
  await page.goto("/login");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(
    username === "despacho" ? /\/despacho$/ : /\/chofer$/,
  );
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    username === "despacho"
      ? "Despacho"
      : username === "carlos"
        ? "Carlos"
        : "Miguel",
  );
  await page.evaluate(() => window.scrollTo(0, 0));
}
async function createService(request: APIRequestContext, overrides = {}) {
  const driverId = (
    await pool.query("SELECT id FROM users WHERE username='carlos'")
  ).rows[0].id;
  const response = await request.post("/api/services", {
    headers: { Origin: origin },
    data: {
      clientName: "Prueba de aviso",
      phone: "+1 809 555 0199",
      pickup: "Hotel de prueba · Lobby",
      date: today(),
      time: "15:00",
      driverId,
      ...overrides,
    },
  });
  return response;
}

test("login, desktop dispatch and mobile layouts render without overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.screenshot({
    path: info.outputPath("login-desktop.png"),
    fullPage: true,
  });
  await loginUi(page, "despacho");
  await expect(
    page.getByRole("heading", { name: "Despacho", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Laura Martínez")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: info.outputPath("dispatch-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: info.outputPath("dispatch-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Crear servicio", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: info.outputPath("create-mobile.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.screenshot({
    path: info.outputPath("login-mobile.png"),
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("complete UI journey: create, assigned driver, simulated message, dispatcher time", async ({
  browser,
}, info) => {
  const dispatch = await browser.newContext({ baseURL: origin });
  const driver = await browser.newContext({
    baseURL: origin,
    viewport: { width: 390, height: 844 },
  });
  const customer = await browser.newContext({
    baseURL: origin,
    viewport: { width: 390, height: 844 },
  });
  try {
    const dp = await dispatch.newPage();
    await loginUi(dp, "despacho");
    await dp
      .getByRole("button", { name: "Crear servicio", exact: true })
      .click();
    const dialog = dp.getByRole("dialog");
    await dialog.getByLabel("Cliente", { exact: true }).fill("Lucía Demo");
    await dialog.getByLabel("Teléfono").fill("+1 809 555 0190");
    await dialog
      .getByLabel("Punto de recogida")
      .fill("Hotel del Mar · Entrada principal");
    await dialog
      .getByLabel("Chofer y vehículo")
      .selectOption({ label: "Carlos Méndez · Toyota Sienna · DEMO-001" });
    await dialog
      .getByRole("button", { name: "Crear servicio", exact: true })
      .click();
    await expect(dialog).not.toBeVisible();
    const row = dp.getByRole("row").filter({ hasText: "Lucía Demo" });
    await expect(row).toBeVisible();
    const href = await row.getByRole("link").getAttribute("href");
    const cp = await customer.newPage();
    await cp.goto(href!);
    await expect(cp.getByRole("heading", { level: 1 })).toContainText(
      "Todo listo",
    );
    await cp.screenshot({
      path: info.outputPath("customer-pending.png"),
      fullPage: true,
    });
    const dr = await driver.newPage();
    await loginUi(dr, "carlos");
    expect(
      (
        await new AxeBuilder({ page: dr })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await expect(dr.getByText("Sofía Pérez")).toHaveCount(0);
    await expect(dr.getByText("Daniel Ruiz")).toHaveCount(0);
    await dr.screenshot({
      path: info.outputPath("driver-mobile.png"),
      fullPage: true,
    });
    const card = dr.locator("article").filter({ hasText: "Lucía Demo" });
    await card
      .getByRole("button", { name: "Llego en 10", exact: true })
      .click();
    await expect(card.getByText("Aviso enviado")).toBeVisible();
    await expect(cp.getByRole("heading", { level: 1 })).toContainText(
      "en camino",
    );
    await expect(cp.getByText(/Hola, Lucía Demo/)).toContainText(
      "Carlos Méndez",
    );
    await expect(cp.getByText(/Hola, Lucía Demo/)).toContainText("DEMO-001");
    expect(
      (
        await new AxeBuilder({ page: cp })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await cp.screenshot({
      path: info.outputPath("customer-sent.png"),
      fullPage: true,
    });
    await cp.setViewportSize({ width: 1440, height: 1000 });
    await cp.screenshot({
      path: info.outputPath("customer-desktop.png"),
      fullPage: true,
    });
    await expect(row.getByText(/Enviado/)).toBeVisible();
    const notice = (
      await pool.query(
        "SELECT n.sent_at FROM notices n JOIN services s ON s.id=n.service_id WHERE s.client_name=$1",
        ["Lucía Demo"],
      )
    ).rows[0];
    expect(notice.sent_at).toBeInstanceOf(Date);
    await dp.reload();
    await expect(
      dp
        .getByRole("row")
        .filter({ hasText: "Lucía Demo" })
        .getByText(/Enviado/),
    ).toBeVisible();
  } finally {
    await dispatch.close();
    await driver.close();
    await customer.close();
  }
});

test("access, ownership, day restrictions, public privacy and concurrency", async ({
  playwright,
}) => {
  const dispatch = await playwright.request.newContext({ baseURL: origin });
  const carlos = await playwright.request.newContext({ baseURL: origin });
  const miguel = await playwright.request.newContext({ baseURL: origin });
  const anon = await playwright.request.newContext({ baseURL: origin });
  try {
    expect((await anon.get("/api/services")).status()).toBe(401);
    await login(dispatch, "despacho");
    await login(carlos, "carlos");
    await login(miguel, "miguel");
    expect((await createService(carlos)).status()).toBe(403);
    const created = await createService(dispatch);
    expect(created.status()).toBe(201);
    const { id } = await created.json();
    const endpoint = `/api/services/${id}/notice`;
    expect(
      (await miguel.post(endpoint, { headers: { Origin: origin } })).status(),
    ).toBe(404);
    expect(
      (await dispatch.post(endpoint, { headers: { Origin: origin } })).status(),
    ).toBe(403);
    expect(
      (
        await carlos.post(endpoint, {
          headers: { Origin: "https://evil.example" },
        })
      ).status(),
    ).toBe(403);
    expect((await carlos.post(endpoint)).status()).toBe(403);
    const list = await (
      await carlos.get(`/api/services?date=2099-01-01`)
    ).json();
    expect(list.day).toBe(today());
    expect(
      list.services.every(
        (s: { driver: { name: string }; publicToken?: string }) =>
          s.driver.name === "Carlos Méndez" && !s.publicToken,
      ),
    ).toBe(true);
    const future = (
      await pool.query("SELECT id FROM services WHERE seed_key LIKE '%:daniel'")
    ).rows[0].id;
    expect(
      (
        await carlos.post(`/api/services/${future}/notice`, {
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(404);
    expect(
      (
        await carlos.post("/api/services/not-a-uuid/notice", {
          headers: { Origin: origin },
        })
      ).status(),
    ).toBe(404);
    const responses = await Promise.all(
      Array.from({ length: 8 }, () =>
        carlos.post(endpoint, { headers: { Origin: origin } }),
      ),
    );
    expect(responses.every((r) => r.status() === 200)).toBe(true);
    const notices = await Promise.all(responses.map((r) => r.json()));
    expect(new Set(notices.map((n) => n.notice.sentAt)).size).toBe(1);
    const count = await pool.query(
      "SELECT count(*)::int AS count FROM notices WHERE service_id=$1",
      [id],
    );
    expect(count.rows[0].count).toBe(1);
    const token = (
      await pool.query("SELECT public_token FROM services WHERE id=$1", [id])
    ).rows[0].public_token;
    const publicResponse = await anon.get(`/api/notices/${token}`);
    expect(publicResponse.headers()["cache-control"]).toContain("no-store");
    const publicData = await publicResponse.json();
    expect(Object.keys(publicData).sort()).toEqual([
      "driver",
      "notice",
      "vehicle",
    ]);
    expect(JSON.stringify(publicData)).not.toContain("555");
    expect((await anon.get("/api/notices/invalid")).status()).toBe(404);
  } finally {
    await Promise.all([
      dispatch.dispose(),
      carlos.dispose(),
      miguel.dispose(),
      anon.dispose(),
    ]);
  }
});

test("validation, session expiry and logout revocation", async ({
  request,
}) => {
  await login(request, "despacho");
  expect((await createService(request, { date: "2026-02-30" })).status()).toBe(
    400,
  );
  expect((await createService(request, { date: "2000-01-01" })).status()).toBe(
    400,
  );
  expect((await createService(request, { time: "25:00" })).status()).toBe(400);
  expect((await createService(request, { phone: "abc" })).status()).toBe(400);
  expect(
    (await createService(request, { driverId: randomUUID() })).status(),
  ).toBe(400);
  const state = await request.storageState();
  const token = state.cookies.find(
    (c) => c.name === "transekur_session",
  )!.value;
  expect(state.cookies[0].httpOnly).toBe(true);
  expect(state.cookies[0].sameSite).toBe("Lax");
  const hash = createHash("sha256").update(token).digest("hex");
  await pool.query(
    "UPDATE sessions SET expires_at=now()-interval '1 minute' WHERE token_hash=$1",
    [hash],
  );
  expect((await request.get("/api/services")).status()).toBe(401);
  await login(request, "despacho");
  const fresh = (await request.storageState()).cookies.find(
    (c) => c.name === "transekur_session",
  )!.value;
  expect(
    (
      await request.post("/api/logout", { headers: { Origin: origin } })
    ).status(),
  ).toBe(200);
  const count = (
    await pool.query(
      "SELECT count(*)::int AS n FROM sessions WHERE token_hash=$1",
      [createHash("sha256").update(fresh).digest("hex")],
    )
  ).rows[0].n;
  expect(count).toBe(0);
  expect((await request.get("/api/services")).status()).toBe(401);
});

test("SQL input is treated as data and login attempts are bounded", async ({
  request,
}) => {
  const invalid = await request.post("/api/login", {
    headers: { Origin: origin },
    data: { username: "' OR 1=1 --", password: "anything" },
  });
  expect(invalid.status()).toBe(401);
  for (let n = 0; n < 10; n++) {
    const response = await request.post("/api/login", {
      headers: { Origin: origin },
      data: { username: "unknown", password: "wrong" },
    });
    expect(response.status()).toBe(401);
  }
  expect(
    (
      await request.post("/api/login", {
        headers: { Origin: origin },
        data: { username: "unknown", password: "wrong" },
      })
    ).status(),
  ).toBe(429);
});

test("date filter includes local midnight and excludes the next day's midnight", async ({
  request,
}) => {
  await login(request, "despacho");
  const day = today();
  const { gte, lt } = dayRange(day);
  const driver = (
    await pool.query("SELECT id,vehicle_id FROM users WHERE username='carlos'")
  ).rows[0];
  const ids: string[] = [];
  for (const at of [
    new Date(gte.getTime() - 1),
    gte,
    new Date(lt.getTime() - 1),
    lt,
  ]) {
    const id = randomUUID();
    ids.push(id);
    await pool.query(
      `INSERT INTO services (id,client_name,phone,pickup,scheduled_at,driver_id,vehicle_id,public_token)
      VALUES ($1,'Límite horario','5550100','Prueba',$2,$3,$4,$5)`,
      [id, at, driver.id, driver.vehicle_id, randomUUID()],
    );
  }
  try {
    const data = await (await request.get(`/api/services?date=${day}`)).json();
    const returned = data.services.map((s: { id: string }) => s.id);
    expect(returned).toContain(ids[1]);
    expect(returned).toContain(ids[2]);
    expect(returned).not.toContain(ids[0]);
    expect(returned).not.toContain(ids[3]);
  } finally {
    await pool.query("DELETE FROM services WHERE id=ANY($1::uuid[])", [ids]);
  }
});

test("polling pauses when hidden and does not duplicate initial requests", async ({
  page,
}) => {
  await loginUi(page, "despacho");
  let reads = 0;
  page.on("request", (request) => {
    if (request.url().includes("/api/services?date=")) reads++;
  });
  await page.waitForTimeout(1200);
  expect(reads).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(5500);
  expect(reads).toBe(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "visible",
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => reads).toBeGreaterThan(0);
});

test("empty agenda and invalid public link provide useful next steps", async ({
  page,
}, info) => {
  await loginUi(page, "despacho");
  await page.getByLabel("Fecha de servicios").fill("2099-01-01");
  await expect(page.getByText("La agenda está libre")).toBeVisible();
  await page.screenshot({
    path: info.outputPath("dispatch-empty.png"),
    fullPage: true,
  });
  const response = await page.goto("/aviso/not-a-token");
  // Streaming notFound can carry HTTP 200; the UI must still reveal no service data.
  expect([200, 404]).toContain(response!.status());
  await expect(
    page.getByRole("heading", { name: "Este enlace no está disponible" }),
  ).toBeVisible();
});

test("failed notice remains retryable and never displays a false success", async ({
  page,
}, info) => {
  await loginUi(page, "carlos");
  const card = page.locator("article").filter({ hasText: "Laura Martínez" });
  await page.route("**/api/services/*/notice", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "No se pudo enviar. Intenta de nuevo." }),
    }),
  );
  await card.getByRole("button", { name: "Llego en 10", exact: true }).click();
  await expect(card.getByRole("alert")).toContainText("Intenta de nuevo");
  await expect(card.getByText("Aviso enviado")).toHaveCount(0);
  await expect(
    card.getByRole("button", { name: "Llego en 10", exact: true }),
  ).toBeEnabled();
  await page.screenshot({
    path: info.outputPath("driver-error.png"),
    fullPage: true,
  });
});
