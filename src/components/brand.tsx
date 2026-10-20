import Image from "next/image";
export function Brand({ large = false }: { large?: boolean }) {
  return (
    <Image
      src="/logo-transekur.png"
      width={754}
      height={154}
      alt="Transekur"
      priority
      className={large ? "brand brand-large" : "brand"}
    />
  );
}
