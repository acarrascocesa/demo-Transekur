import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Transekur · Tu próxima recogida",
    template: "%s · Transekur",
  },
  description: "Demo independiente del aviso de llegada del chofer.",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
