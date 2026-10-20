"use client";
import { useState } from "react";
import { post, errorMessage } from "@/lib/client";
import { Icon } from "./icon";
export function Logout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    setError("");
    try {
      await post("/api/logout");
      window.location.assign("/login");
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }
  return (
    <div className="logout-wrap">
      <button
        className="button button-quiet"
        onClick={logout}
        disabled={busy}
        aria-label="Cerrar sesión"
      >
        <Icon name="logout" />
        <span>{busy ? "Saliendo…" : "Salir"}</span>
      </button>
      {error && (
        <span role="alert" className="error-inline">
          {error}
        </span>
      )}
    </div>
  );
}
