import "server-only";
import { randomBytes, createHash } from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { HttpError } from "./http";

export const COOKIE = "transekur_session";
export type Role = "DISPATCHER" | "DRIVER";
export type AuthUser = { id: string; name: string; role: Role };
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secureCookie = () => process.env.COOKIE_SECURE !== "false";
export const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: secureCookie(),
  path: "/",
});

export const currentUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const { rows } = await db.query<AuthUser>(
    `SELECT u.id, u.name, u.role
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > now()`,
    [digest(token)],
  );
  return rows[0] ?? null;
});

export async function apiUser(role?: Role) {
  const user = await currentUser();
  if (!user)
    throw new HttpError(401, "Tu sesión terminó. Vuelve a iniciar sesión.");
  if (role && user.role !== role)
    throw new HttpError(403, "No tienes acceso a esta acción.");
  return user;
}

export async function pageUser(role: Role) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.role !== role)
    redirect(user.role === "DISPATCHER" ? "/despacho" : "/chofer");
  return user;
}

export async function newSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 86_400_000);
  await db.query(
    "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)",
    [digest(token), userId, expiresAt],
  );
  return { token, expiresAt };
}

export async function consumeLoginAttempt(username: string) {
  const now = Date.now();
  const window = Math.floor(now / 900_000);
  // A per-account limit plus a generous global bound (no untrusted X-Forwarded-For).
  const keys = [
    { key: `account:${digest(username)}:${window}`, max: 10 },
    { key: `global:${window}`, max: 200 },
  ];
  const rows = await Promise.all(
    keys.map(({ key }) =>
      db.query<{ count: number }>(
        `INSERT INTO login_attempts (key, count, expires_at) VALUES ($1, 1, $2)
       ON CONFLICT (key) DO UPDATE SET count = login_attempts.count + 1
       RETURNING count`,
        [key, new Date((window + 2) * 900_000)],
      ),
    ),
  );
  if (rows.some((row, index) => row.rows[0].count > keys[index].max))
    throw new HttpError(
      429,
      "Demasiados intentos. Intenta de nuevo en 15 minutos.",
    );
  await db.query("DELETE FROM login_attempts WHERE expires_at < now()");
}
