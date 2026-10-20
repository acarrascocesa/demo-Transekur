"use client";
import { useState } from "react";
import { errorMessage, post } from "@/lib/client";
import { Icon } from "./icon";
export function LoginForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const result = await post<{ destination: string }>(
        "/api/login",
        Object.fromEntries(form),
      );
      window.location.assign(result.destination);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="login-form">
      <h2>Inicia sesión</h2>
      <p className="muted">Entra con tu cuenta de despacho o chofer.</p>
      <label>
        Usuario
        <input
          name="username"
          autoComplete="username"
          required
          maxLength={80}
          placeholder="Tu usuario"
          autoCapitalize="none"
          spellCheck={false}
        />
      </label>
      <label>
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="Tu contraseña"
        />
      </label>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      <button className="button button-primary full" disabled={busy}>
        {busy ? "Ingresando…" : "Entrar"}
        <Icon name="arrow" />
      </button>
      <p className="form-footnote">Acceso exclusivo para cuentas de prueba.</p>
    </form>
  );
}
