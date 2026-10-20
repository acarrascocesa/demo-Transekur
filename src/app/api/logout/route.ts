import { cookies } from "next/headers";
import { COOKIE, cookieOptions, digest } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkOrigin, endpoint, json } from "@/lib/http";

export async function POST(request: Request) {
  return endpoint(async () => {
    checkOrigin(request);
    const token = (await cookies()).get(COOKIE)?.value;
    if (token)
      await db.query("DELETE FROM sessions WHERE token_hash = $1", [
        digest(token),
      ]);
    const response = json({ ok: true });
    response.cookies.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return response;
  });
}
