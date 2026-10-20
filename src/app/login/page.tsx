import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { Icon } from "@/components/icon";
export const metadata = { title: "Iniciar sesión" };
export default async function LoginPage() {
  const user = await currentUser();
  if (user) redirect(user.role === "DISPATCHER" ? "/despacho" : "/chofer");
  return (
    <div className="login-page">
      <header className="login-header">
        <Brand large />
        <span className="demo-badge">Demo de operaciones</span>
      </header>
      <main className="login-main">
        <section className="login-intro">
          <span className="intro-line" />
          <h1>
            Un buen viaje
            <br /> empieza antes
            <br /> de subir.
          </h1>
          <p>
            Coordina cada recogida y mantén al cliente informado. Un aviso,
            justo a tiempo.
          </p>
          <div className="intro-detail">
            <Icon name="clock" />
            <span>Despacho y choferes, conectados.</span>
          </div>
        </section>
        <LoginForm />
      </main>
      <footer className="login-footer">
        <span>Transekur · República Dominicana</span>
        <span>Entorno de prueba con datos ficticios</span>
      </footer>
    </div>
  );
}
