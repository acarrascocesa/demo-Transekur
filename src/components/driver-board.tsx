"use client";
import { useState } from "react";
import useSWR from "swr";
import type { Service } from "@/lib/types";
import { errorMessage, fetcher, polling, post } from "@/lib/client";
import { dayLabel, timeLabel } from "@/lib/time";
import { Icon } from "./icon";

function DriverCard({
  service: s,
  refresh,
}: {
  service: Service;
  refresh: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentAt, setSentAt] = useState(s.notice?.sentAt);
  const confirmedAt = s.notice?.sentAt ?? sentAt;
  async function send() {
    setBusy(true);
    setError("");
    try {
      const result = await post<{ notice: { sentAt: string } }>(
        `/api/services/${s.id}/notice`,
      );
      setSentAt(result.notice.sentAt);
      void refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={`driver-card${confirmedAt ? " driver-card-sent" : ""}`}>
      <div className="driver-card-top">
        <time dateTime={s.scheduledAt}>{timeLabel(s.scheduledAt)}</time>
        <span>{confirmedAt ? "Cliente avisado" : "Recogida programada"}</span>
      </div>
      <div className="driver-card-body">
        <div className="pickup-line">
          <Icon name="pin" />
          <h2>{s.pickup}</h2>
        </div>
        <p className="passenger">{s.clientName}</p>
        <a
          className="phone-link"
          href={`tel:${s.phone.replace(/[^\d+]/g, "")}`}
        >
          {s.phone}
        </a>
        <div className="vehicle-line">
          <Icon name="car" />
          <span>
            {s.vehicle.brand} {s.vehicle.model}
            <small>
              {s.vehicle.color} · {s.vehicle.plate}
            </small>
          </span>
        </div>
      </div>
      <div className="driver-card-action">
        {confirmedAt ? (
          <div className="sent-confirmation" role="status">
            <Icon name="check" />
            <span>
              Aviso enviado<strong>A las {timeLabel(confirmedAt)}</strong>
            </span>
          </div>
        ) : (
          <>
            <button
              className="button button-primary full"
              disabled={busy}
              onClick={send}
            >
              <Icon name="bell" />
              {busy ? "Enviando aviso…" : "Llego en 10"}
            </button>
            <p className="action-hint">Avisa cuando estés a unos 10 minutos.</p>
          </>
        )}
        {error && (
          <p className="error-box" role="alert">
            {error}
          </p>
        )}
      </div>
    </article>
  );
}

export function DriverBoard({
  initial,
  day,
  name,
}: {
  initial: Service[];
  day: string;
  name: string;
}) {
  const { data, error, mutate } = useSWR<{ services: Service[]; day: string }>(
    "/api/services",
    fetcher,
    {
      ...polling,
      fallbackData: { services: initial, day },
    },
  );
  const expired = error?.status === 401;
  const rows = data?.services ?? initial;
  return (
    <>
      <section className="driver-heading">
        <p className="context-label">Jornada</p>
        <h1>{name.split(" ")[0]}</h1>
        <p className="muted">{dayLabel(data?.day ?? day)}</p>
      </section>
      <div className="driver-summary">
        <span>
          {rows.length}{" "}
          {rows.length === 1 ? "servicio para hoy" : "servicios para hoy"}
        </span>
        <span className="sync-label">
          <span className={error ? "sync-dot stale" : "sync-dot"} />
          {error ? "Sin actualizar" : "Al día"}
        </span>
      </div>
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
      {!expired &&
        (rows.length ? (
          <div className="driver-grid">
            {rows.map((s) => (
              <DriverCard key={s.id} service={s} refresh={() => mutate()} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="car" />
            </div>
            <h2>No tienes servicios para hoy</h2>
            <p>Cuando despacho te asigne una recogida, aparecerá aquí.</p>
          </div>
        ))}
      <p className="demo-note">
        Demo con datos ficticios. Los avisos se muestran en pantalla.
      </p>
    </>
  );
}
