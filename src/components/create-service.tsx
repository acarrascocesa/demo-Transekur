"use client";
import { useRef, useState } from "react";
import type { Driver } from "@/lib/types";
import { today } from "@/lib/time";
import { errorMessage, post } from "@/lib/client";
import { Icon } from "./icon";

export function CreateService({
  drivers,
  day,
  onCreated,
}: {
  drivers: Driver[];
  day: string;
  onCreated: (date: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function open() {
    formRef.current?.reset();
    setError("");
    dialog.current?.showModal();
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await post("/api/services", data);
      dialog.current?.close();
      onCreated(data.date as string);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="button button-primary" onClick={open}>
        <Icon name="plus" />
        Crear servicio
      </button>
      <dialog
        ref={dialog}
        className="service-dialog"
        aria-labelledby="create-title"
        onCancel={(e) => {
          if (busy) e.preventDefault();
        }}
      >
        <div className="dialog-heading">
          <div>
            <h2 id="create-title">Nuevo servicio</h2>
            <p className="muted">Todo listo antes de salir.</p>
          </div>
          <button
            className="button button-icon"
            aria-label="Cerrar formulario"
            disabled={busy}
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <form ref={formRef} onSubmit={submit}>
          <div className="form-grid">
            <label>
              Cliente
              <input
                name="clientName"
                required
                minLength={2}
                maxLength={100}
                placeholder="Nombre del cliente"
                autoComplete="off"
              />
            </label>
            <label>
              Teléfono
              <input
                name="phone"
                required
                type="tel"
                maxLength={25}
                placeholder="+1 809 555 0100"
                autoComplete="off"
              />
            </label>
            <label>
              Fecha
              <input
                name="date"
                type="date"
                required
                min={today()}
                defaultValue={day < today() ? today() : day}
              />
            </label>
            <label>
              Hora de recogida
              <input name="time" type="time" required defaultValue="14:00" />
              <span className="field-hint">Hora de República Dominicana</span>
            </label>
            <label className="span-2">
              Punto de recogida
              <input
                name="pickup"
                required
                minLength={3}
                maxLength={250}
                placeholder="Hotel, aeropuerto o dirección"
              />
            </label>
            <label className="span-2">
              Chofer y vehículo
              <select name="driverId" required defaultValue="">
                <option value="" disabled>
                  Selecciona un chofer
                </option>
                {drivers.map((d) => (
                  <option value={d.id} key={d.id}>
                    {d.name} · {d.vehicle?.brand} {d.vehicle?.model} ·{" "}
                    {d.vehicle?.plate}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {error && (
            <p role="alert" className="error-box">
              {error}
            </p>
          )}
          <div className="dialog-footer">
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => dialog.current?.close()}
            >
              Cancelar
            </button>
            <button
              className="button button-primary"
              disabled={busy || !drivers.length}
            >
              {busy ? "Guardando…" : "Crear servicio"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
