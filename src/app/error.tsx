"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-message">
      <h1>No pudimos cargar esta página</h1>
      <p>Comprueba la conexión e intenta de nuevo.</p>
      <button className="button button-primary" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
