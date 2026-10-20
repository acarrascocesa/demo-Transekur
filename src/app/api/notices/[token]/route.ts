import { endpoint, HttpError, json } from "@/lib/http";
import { publicNotice } from "@/lib/services";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  return endpoint(async () => {
    const { token } = await context.params;
    const data = await publicNotice(token);
    if (!data) throw new HttpError(404, "Este enlace no está disponible.");
    return json(data);
  });
}
