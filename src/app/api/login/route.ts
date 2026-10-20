import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  COOKIE,
  consumeLoginAttempt,
  cookieOptions,
  digest,
  newSession,
} from "@/lib/auth";
import { checkOrigin, endpoint, HttpError, json } from "@/lib/http";
import { cookies } from "next/headers";

const input = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Escribe tu usuario.")
    .max(80),
  password: z.string().min(1, "Escribe tu contraseña.").max(128),
});
// Precomputed valid Argon2id hash equalizes work for unknown accounts.
const dummyHash = argon2.hash("dummy-password-never-used", {
  type: argon2.argon2id,
});

export async function POST(request: Request) {
  return endpoint(async () => {
    checkOrigin(request);
    const data = input.parse(await request.json());
    await consumeLoginAttempt(data.username);
    const { rows } = await db.query<{
      id: string;
      password_hash: string;
      role: string;
    }>("SELECT id, password_hash, role FROM users WHERE username = $1", [
      data.username,
    ]);
    const user = rows[0];
    const valid = await argon2.verify(
      user?.password_hash ?? (await dummyHash),
      data.password,
    );
    if (!user || !valid)
      throw new HttpError(401, "Usuario o contraseña incorrectos.");
    const previous = (await cookies()).get(COOKIE)?.value;
    if (previous)
      await db.query("DELETE FROM sessions WHERE token_hash = $1", [
        digest(previous),
      ]);
    await db.query("DELETE FROM sessions WHERE expires_at < now()");
    const session = await newSession(user.id);
    const response = json({
      destination: user.role === "DISPATCHER" ? "/despacho" : "/chofer",
    });
    response.cookies.set(COOKIE, session.token, {
      ...cookieOptions(),
      expires: session.expiresAt,
    });
    return response;
  });
}
