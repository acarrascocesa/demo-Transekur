import { notFound } from "next/navigation";
import { publicNotice } from "@/lib/services";
import { Brand } from "@/components/brand";
import { CustomerNotice } from "@/components/customer-notice";
export const metadata = { title: "Tu recogida" };
export const dynamic = "force-dynamic";
export default async function NoticePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await publicNotice(token);
  if (!data) notFound();
  return (
    <div className="customer-page">
      <header className="customer-header">
        <Brand />
      </header>
      <CustomerNotice initial={data} token={token} />
    </div>
  );
}
