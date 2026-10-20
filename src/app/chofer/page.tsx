import { pageUser } from "@/lib/auth";
import { listServices } from "@/lib/services";
import { today } from "@/lib/time";
import { Header } from "@/components/header";
import { DriverBoard } from "@/components/driver-board";
export const metadata = { title: "Mis servicios" };
export default async function DriverPage() {
  const user = await pageUser("DRIVER");
  const day = today();
  const services = await listServices(day, user.id);
  return (
    <>
      <Header name={user.name} role="Chofer" />
      <main className="driver-main">
        <DriverBoard initial={services} day={day} name={user.name} />
      </main>
    </>
  );
}
