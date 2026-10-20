"use client";
import useSWR from "swr";
import type { PublicNotice } from "@/lib/types";
import { fetcher, polling } from "@/lib/client";
import { timeLabel } from "@/lib/time";
import { Icon } from "./icon";
export function CustomerNotice({
  initial,
  token,
}: {
  initial: PublicNotice;
  token: string;
}) {
  const { data, error, mutate } = useSWR<PublicNotice>(
    `/api/notices/${token}`,
    fetcher,
    { ...polling, fallbackData: initial },
  );
  const info = data ?? initial;
  return (
    <main className="customer-main">
      <span className="demo-badge">Aviso simulado</span>
      <p className="context-label">
        {info.notice ? "Tu recogida" : "Preparando tu recogida"}
      </p>
      <h1>
        {info.notice
          ? "Tu chofer está\nen camino."
          : "Todo listo para\ntu recogida."}
      </h1>
      <div aria-live="polite" aria-atomic="true" className="customer-message">
        {info.notice ? (
          <>
            <p>{info.notice.message}</p>
            <span className="notice-time">
              <Icon name="check" />
              Aviso emitido a las {timeLabel(info.notice.sentAt)}
            </span>
          </>
        ) : (
          <p>
            Tu chofer te avisará cuando esté a unos 10 minutos. Puedes dejar
            esta página abierta.
          </p>
        )}
      </div>
      <section className="customer-driver" aria-label="Tu chofer y vehículo">
        <span className="muted">Tu chofer</span>
        <h2>{info.driver.name}</h2>
        <div className="customer-vehicle">
          <Icon name="car" />
          <div>
            <strong>
              {info.vehicle.brand} {info.vehicle.model}
            </strong>
            <span>
              {info.vehicle.color} · {info.vehicle.plate}
            </span>
          </div>
        </div>
      </section>
      {error && (
        <p role="alert" className="error-box">
          {error.message}{" "}
          <button className="text-button" onClick={() => void mutate()}>
            Reintentar
          </button>
        </p>
      )}
      <p className="customer-footnote">
        La llegada es una estimación del chofer.
        <br />
        Esta demo no envía SMS ni mensajes de WhatsApp.
      </p>
    </main>
  );
}
