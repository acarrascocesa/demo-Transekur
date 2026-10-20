"use client";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Driver, Service } from "@/lib/types";
import { fetcher, polling } from "@/lib/client";
import { dayLabel, timeLabel, today } from "@/lib/time";
import { CreateService } from "./create-service";
import { Icon } from "./icon";

export function Status({ sentAt }: { sentAt?: string }) {
  return sentAt ? (
    <span className="status status-sent">
      <Icon name="check" />
      Enviado · {timeLabel(sentAt)}
    </span>
  ) : (
    <span className="status status-pending">
      <span className="status-dot" />
      Sin aviso
    </span>
  );
}

export function DispatchBoard({
  initial,
  day,
  drivers,
}: {
  initial: Service[];
  day: string;
  drivers: Driver[];
}) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState("");
  const { data, error, mutate } = useSWR<{ services: Service[]; day: string }>(
    `/api/services?date=${day}`,
    fetcher,
    { ...polling, fallbackData: { services: initial, day } },
  );
  const rows = data?.services ?? initial;
  const expired = error?.status === 401;
  const sent = rows.filter((s) => s.notice).length;
  return (
    <>
      <section className="page-heading">
        <div>
          <p className="context-label">Operaciones</p>
          <h1>Despacho</h1>
          <p className="muted">Cada recogida, bajo control.</p>
        </div>
        <CreateService
          drivers={drivers}
          day={day}
          onCreated={(date) => {
            if (date !== day) router.push(`/despacho?date=${date}`);
            else {
              setConfirmation("Servicio creado y asignado.");
              void mutate();
            }
          }}
        />
      </section>
      {confirmation && (
        <p className="success-box" role="status">
          {confirmation}
        </p>
      )}
      {error && (
        <p className="error-box" role="alert">
          {error.message}{" "}
          {expired ? (
            <a href="/login">Iniciar sesión</a>
          ) : (
            <button className="text-button" onClick={() => void mutate()}>
              Reintentar
            </button>
          )}
        </p>
      )}
      {!expired && (
        <section className="agenda" aria-label="Agenda de servicios">
          <div className="agenda-toolbar">
            <div className="date-controls">
              <label className="date-label">
                Fecha
                <input
                  aria-label="Fecha de servicios"
                  type="date"
                  value={day}
                  onChange={(e) => {
                    if (e.target.value)
                      router.push(`/despacho?date=${e.target.value}`);
                  }}
                />
              </label>
              <button
                className="button button-secondary"
                onClick={() => router.push(`/despacho?date=${today()}`)}
              >
                Hoy
              </button>
            </div>
            <span className="sync-label">
              <span className={error ? "sync-dot stale" : "sync-dot"} />
              {error
                ? "Actualización interrumpida"
                : "Actualización automática"}
            </span>
          </div>
          <div className="agenda-caption">
            <h2>{dayLabel(day)}</h2>
            <span>
              {rows.length} {rows.length === 1 ? "servicio" : "servicios"}
              <span className="caption-divider">/</span>
              {sent} {sent === 1 ? "aviso enviado" : "avisos enviados"}
            </span>
          </div>
          {rows.length ? (
            <div className="table-wrap">
              <table className="service-table">
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Cliente</th>
                    <th>Recogida</th>
                    <th>Chofer / vehículo</th>
                    <th>Aviso</th>
                    <th>
                      <span className="sr-only">Vista del cliente</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id}>
                      <td data-label="Hora">
                        <time className="table-time" dateTime={s.scheduledAt}>
                          {timeLabel(s.scheduledAt)}
                        </time>
                      </td>
                      <td data-label="Cliente">
                        <strong>{s.clientName}</strong>
                        <span className="cell-secondary">{s.phone}</span>
                      </td>
                      <td data-label="Recogida">
                        <span className="pickup-cell">{s.pickup}</span>
                      </td>
                      <td data-label="Chofer / vehículo">
                        <strong>{s.driver.name}</strong>
                        <span className="cell-secondary">
                          {s.vehicle.brand} {s.vehicle.model}
                        </span>
                        <span className="cell-secondary plate-small">
                          {s.vehicle.plate}
                        </span>
                      </td>
                      <td data-label="Aviso">
                        <Status sentAt={s.notice?.sentAt} />
                      </td>
                      <td>
                        <a
                          className="customer-link"
                          href={`/aviso/${s.publicToken}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Ver aviso de ${s.clientName} (nueva pestaña)`}
                        >
                          <Icon name="link" />
                          <span>Ver aviso</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <Icon name="car" />
              </div>
              <h3>La agenda está libre</h3>
              <p>Crea un servicio para asignar la próxima recogida.</p>
            </div>
          )}
          <div className="agenda-bottom">
            <Icon name="clock" />
            <span>Horarios de República Dominicana · UTC−4</span>
          </div>
        </section>
      )}
    </>
  );
}
