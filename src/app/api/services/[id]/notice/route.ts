import { apiUser } from "@/lib/auth";
import { checkOrigin, endpoint, json } from "@/lib/http";
import { sendNotice } from "@/lib/services";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return endpoint(async () => {
    checkOrigin(request);
    const user = await apiUser("DRIVER");
    const { id } = await context.params;
    const notice = await sendNotice(id, user.id);
    return json({ notice });
  });
}
