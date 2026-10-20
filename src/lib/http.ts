import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function checkOrigin(request: Request) {
  const expected = process.env.APP_ORIGIN;
  if (!expected) throw new Error("APP_ORIGIN is required");
  if (request.headers.get("origin") !== new URL(expected).origin)
    throw new HttpError(403, "Solicitud no permitida.");
}

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

export async function endpoint(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError)
      return json({ error: error.message }, error.status);
    if (error instanceof ZodError)
      return json(
        { error: error.issues[0]?.message ?? "Revisa los datos." },
        400,
      );
    if (error instanceof SyntaxError)
      return json({ error: "Solicitud inválida." }, 400);
    // Do not log request bodies, credentials, or public access tokens.
    console.error(
      "Request failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      { error: "No se pudo completar la solicitud. Intenta de nuevo." },
      500,
    );
  }
}
