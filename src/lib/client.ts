"use client";
export class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function fetcher<T>(url: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new FetchError(
      "No se pudieron actualizar los datos. Comprueba tu conexión.",
      0,
    );
  }
  const data = await response.json();
  if (!response.ok)
    throw new FetchError(
      data.error ?? "No se pudieron actualizar los datos.",
      response.status,
    );
  return data;
}
export async function post<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw new FetchError(
      data.error ?? "No se pudo completar la acción.",
      response.status,
    );
  return data;
}
export const polling = {
  refreshInterval: 5000,
  refreshWhenHidden: false,
  refreshWhenOffline: false,
  revalidateOnFocus: true,
  revalidateOnMount: false,
  shouldRetryOnError: false,
  dedupingInterval: 2000,
};
export const errorMessage = (error: unknown) =>
  error instanceof FetchError
    ? error.message
    : "No se pudo conectar. Comprueba tu conexión e intenta de nuevo.";
