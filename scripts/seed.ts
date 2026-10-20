import "dotenv/config";
import { Pool } from "pg";
import argon2 from "argon2";
import { randomBytes, randomUUID } from "node:crypto";
import { today } from "../src/lib/time";

async function main() {
  const password = process.env.DEMO_PASSWORD;
  if (!password || password.length < 12)
    throw new Error("Set DEMO_PASSWORD with at least 12 characters.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(782642)");
    const vehicleSpecs = [
      ["Toyota", "Sienna", "negro", "DEMO-001"],
      ["Chevrolet", "Suburban", "blanco", "DEMO-002"],
    ];
    const vehicleIds: string[] = [];
    for (const spec of vehicleSpecs) {
      await client.query(
        `INSERT INTO vehicles (id,brand,model,color,plate) VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (plate) DO NOTHING`,
        [randomUUID(), ...spec],
      );
      vehicleIds.push(
        (
          await client.query<{ id: string }>(
            "SELECT id FROM vehicles WHERE plate=$1",
            [spec[3]],
          )
        ).rows[0].id,
      );
    }
    const users = [
      {
        username: "despacho",
        name: "Ana Rodríguez",
        role: "DISPATCHER",
        vehicle: null,
      },
      {
        username: "carlos",
        name: "Carlos Méndez",
        role: "DRIVER",
        vehicle: vehicleIds[0],
      },
      {
        username: "miguel",
        name: "Miguel Santos",
        role: "DRIVER",
        vehicle: vehicleIds[1],
      },
    ];
    const ids: string[] = [];
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    for (const u of users) {
      // Never overwrite credentials or assignments when re-running the seed.
      await client.query(
        `INSERT INTO users (id,username,name,password_hash,role,vehicle_id)
         VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (username) DO NOTHING`,
        [randomUUID(), u.username, u.name, hash, u.role, u.vehicle],
      );
      ids.push(
        (
          await client.query<{ id: string }>(
            "SELECT id FROM users WHERE username=$1",
            [u.username],
          )
        ).rows[0].id,
      );
    }
    const current = today();
    const tomorrow = today(
      new Date(new Date(`${current}T12:00:00-04:00`).getTime() + 86_400_000),
    );
    const services = [
      {
        key: `${current}:laura`,
        name: "Laura Martínez",
        phone: "+1 809 555 0101",
        pickup: "Aeropuerto de Punta Cana · Terminal A",
        day: current,
        time: "10:30",
        driver: ids[1],
        vehicle: vehicleIds[0],
      },
      {
        key: `${current}:andres`,
        name: "Andrés Castillo",
        phone: "+1 809 555 0102",
        pickup: "Hotel Costa Serena · Lobby principal",
        day: current,
        time: "14:00",
        driver: ids[1],
        vehicle: vehicleIds[0],
      },
      {
        key: `${current}:sofia`,
        name: "Sofía Pérez",
        phone: "+1 809 555 0103",
        pickup: "Aeropuerto Las Américas · Llegadas",
        day: current,
        time: "11:45",
        driver: ids[2],
        vehicle: vehicleIds[1],
      },
      {
        key: `${tomorrow}:daniel`,
        name: "Daniel Ruiz",
        phone: "+1 809 555 0104",
        pickup: "Hotel Brisa del Este · Recepción",
        day: tomorrow,
        time: "09:00",
        driver: ids[1],
        vehicle: vehicleIds[0],
      },
    ];
    for (const s of services) {
      await client.query(
        `INSERT INTO services (id,client_name,phone,pickup,scheduled_at,driver_id,vehicle_id,public_token,seed_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (seed_key) DO NOTHING`,
        [
          randomUUID(),
          s.name,
          s.phone,
          s.pickup,
          new Date(`${s.day}T${s.time}:00-04:00`),
          s.driver,
          s.vehicle,
          randomBytes(24).toString("hex"),
          s.key,
        ],
      );
    }
    await client.query("COMMIT");
    console.log(
      "Demo ready. Users: despacho, carlos, miguel. Existing records preserved.",
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
