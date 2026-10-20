import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { apiUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkOrigin, endpoint, HttpError, json } from "@/lib/http";
import { listServices } from "@/lib/services";
import { today, validDay } from "@/lib/time";

const input = z.object({
  clientName: z
    .string()
    .trim()
    .min(2, "Escribe el nombre del cliente.")
    .max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[\d ()-]{7,25}$/, "Escribe un teléfono válido.")
    .refine(
      (v) => v.replace(/\D/g, "").length >= 7,
      "Escribe un teléfono válido.",
    ),
  pickup: z.string().trim().min(3, "Escribe el punto de recogida.").max(250),
  date: z
    .string()
    .refine(validDay, "Selecciona una fecha válida.")
    .refine((v) => v >= today(), "La fecha no puede ser anterior a hoy."),
  time: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Selecciona una hora válida."),
  driverId: z.string().uuid("Selecciona un chofer válido."),
});

export async function GET(request: Request) {
  return endpoint(async () => {
    const user = await apiUser();
    const date =
      user.role === "DRIVER"
        ? today()
        : (new URL(request.url).searchParams.get("date") ?? today());
    if (!validDay(date))
      throw new HttpError(400, "Selecciona una fecha válida.");
    return json({
      services: await listServices(
        date,
        user.role === "DRIVER" ? user.id : undefined,
      ),
      day: date,
    });
  });
}

export async function POST(request: Request) {
  return endpoint(async () => {
    checkOrigin(request);
    await apiUser("DISPATCHER");
    const data = input.parse(await request.json());
    const { rows } = await db.query<{ id: string }>(
      `INSERT INTO services (id, client_name, phone, pickup, scheduled_at, driver_id, vehicle_id, public_token)
       SELECT $1, $2, $3, $4, $5, u.id, u.vehicle_id, $6
       FROM users u WHERE u.id = $7 AND u.role = 'DRIVER' AND u.vehicle_id IS NOT NULL
       RETURNING id`,
      [
        randomUUID(),
        data.clientName,
        data.phone,
        data.pickup,
        new Date(`${data.date}T${data.time}:00-04:00`),
        randomBytes(24).toString("hex"),
        data.driverId,
      ],
    );
    if (!rows[0])
      throw new HttpError(400, "Selecciona un chofer con vehículo.");
    return json(rows[0], 201);
  });
}
