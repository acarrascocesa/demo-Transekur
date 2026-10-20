import { pageUser } from "@/lib/auth";
import { listDrivers, listServices } from "@/lib/services";
import { today, validDay } from "@/lib/time";
import { Header } from "@/components/header";
import { DispatchBoard } from "@/components/dispatch-board";
export const metadata = { title: "Despacho" };
export default async function DispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const user = await pageUser("DISPATCHER");
  const { date } = await searchParams;
  const day = date && validDay(date) ? date : today();
  const [services, drivers] = await Promise.all([
    listServices(day),
    listDrivers(),
  ]);
  return (
    <>
      <Header name={user.name} role="Despacho" />
      <main className="dispatch-main">
        <DispatchBoard
          key={day}
          initial={services}
          drivers={drivers}
          day={day}
        />
        <p className="demo-note">
          Demo independiente · Datos ficticios · Avisos simulados
        </p>
      </main>
    </>
  );
}
