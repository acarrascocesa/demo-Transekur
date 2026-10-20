import { Brand } from "@/components/brand";
export default function NotFound() {
  return (
    <main className="standalone-message">
      <Brand />
      <h1>Este enlace no está disponible</h1>
      <p>Comprueba el enlace que recibiste o solicita uno nuevo a despacho.</p>
      <a className="button button-secondary" href="/login">
        Ir al acceso
      </a>
    </main>
  );
}
