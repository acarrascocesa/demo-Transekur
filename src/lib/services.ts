import "server-only";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import { dayRange, today } from "./time";
import { HttpError } from "./http";
import type { Driver, Notice, PublicNotice, Service } from "./types";

// Static SQL fragments only. External values are always bound parameters.
const vehicleJson = `json_build_object(
  'brand', v.brand, 'model', v.model, 'color', v.color, 'plate', v.plate)`;
const noticeJson = `CASE WHEN n.id IS NULL THEN NULL ELSE
  json_build_object('message', n.message, 'sentAt', n.sent_at) END`;

export async function listServices(
  day: string,
  driverId?: string,
): Promise<Service[]> {
  const { gte, lt } = dayRange(day);
  const { rows } = await db.query<
    Omit<Service, "scheduledAt"> & { scheduledAt: Date }
  >(
    `SELECT s.id, s.client_name AS "clientName", s.phone, s.pickup,
      s.scheduled_at AS "scheduledAt",
      CASE WHEN $3::uuid IS NULL THEN s.public_token ELSE NULL END AS "publicToken",
      json_build_object('name', u.name) AS driver, ${vehicleJson} AS vehicle,
      ${noticeJson} AS notice
     FROM services s JOIN users u ON u.id = s.driver_id
     JOIN vehicles v ON v.id = s.vehicle_id
     LEFT JOIN notices n ON n.service_id = s.id
     WHERE s.scheduled_at >= $1 AND s.scheduled_at < $2
       AND ($3::uuid IS NULL OR s.driver_id = $3::uuid)
     ORDER BY s.scheduled_at, s.id`,
    [gte, lt, driverId ?? null],
  );
  return rows.map((row) => ({
    ...row,
    publicToken: row.publicToken ?? undefined,
    scheduledAt: row.scheduledAt.toISOString(),
  }));
}

export async function listDrivers(): Promise<Driver[]> {
  const { rows } = await db.query<Driver>(
    `SELECT u.id, u.name, json_build_object('brand', v.brand, 'model', v.model, 'plate', v.plate) AS vehicle
     FROM users u JOIN vehicles v ON v.id = u.vehicle_id
     WHERE u.role = 'DRIVER' ORDER BY u.name`,
  );
  return rows;
}

export async function publicNotice(
  token: string,
): Promise<PublicNotice | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const { rows } = await db.query<PublicNotice>(
    `SELECT json_build_object('name', u.name) AS driver,
       ${vehicleJson} AS vehicle, ${noticeJson} AS notice
     FROM services s JOIN users u ON u.id = s.driver_id
     JOIN vehicles v ON v.id = s.vehicle_id LEFT JOIN notices n ON n.service_id = s.id
     WHERE s.public_token = $1`,
    [token],
  );
  return rows[0] ?? null;
}

export async function sendNotice(
  serviceId: string,
  driverId: string,
): Promise<Notice> {
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(
      serviceId,
    )
  )
    throw new HttpError(404, "Servicio no disponible.");
  const { gte, lt } = dayRange(today());
  const { rows } = await db.query<{
    clientName: string;
    driver: string;
    brand: string;
    model: string;
    color: string;
    plate: string;
  }>(
    `SELECT s.client_name AS "clientName", u.name AS driver, v.brand, v.model, v.color, v.plate
     FROM services s JOIN users u ON u.id = s.driver_id JOIN vehicles v ON v.id = s.vehicle_id
     WHERE s.id = $1 AND s.driver_id = $2 AND s.scheduled_at >= $3 AND s.scheduled_at < $4`,
    [serviceId, driverId, gte, lt],
  );
  const s = rows[0];
  if (!s) throw new HttpError(404, "No se encontró un servicio tuyo para hoy.");
  const message = `Hola, ${s.clientName}. Tu chofer, ${s.driver}, llegará en aproximadamente 10 minutos en un ${s.brand} ${s.model}, color ${s.color}, placa ${s.plate}.`;
  const result = await db.query<{ message: string; sent_at: Date }>(
    `INSERT INTO notices (id, service_id, message) VALUES ($1, $2, $3)
     ON CONFLICT (service_id) DO NOTHING RETURNING message, sent_at`,
    [randomUUID(), serviceId, message],
  );
  // A separate statement sees the winning transaction after ON CONFLICT waits.
  const notice =
    result.rows[0] ??
    (
      await db.query<{ message: string; sent_at: Date }>(
        "SELECT message, sent_at FROM notices WHERE service_id = $1",
        [serviceId],
      )
    ).rows[0];
  return { message: notice.message, sentAt: notice.sent_at.toISOString() };
}
