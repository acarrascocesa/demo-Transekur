import type { CSSProperties } from "react";
type Name =
  | "clock"
  | "pin"
  | "car"
  | "check"
  | "arrow"
  | "plus"
  | "logout"
  | "close"
  | "bell"
  | "link";
const paths: Record<Name, React.ReactNode> = {
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  pin: (
    <>
      <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  car: (
    <>
      <path d="m5 8 2-4h10l2 4 2 3v7H3v-7l2-3Zm0 0h14M3 12h18M6 18v2m12-2v2M6 15h2m8 0h2" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  logout: (
    <>
      <path d="M10 4H4v16h6m5-13 5 5-5 5m-7-5h12" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  bell: (
    <>
      <path d="M5 16h14l-2-3V9a5 5 0 0 0-10 0v4l-2 3Zm5 4h4" />
    </>
  ),
  link: (
    <>
      <path
        d="m10 13 4-4m-5 7-2 2a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 0 2-2a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0"
        transform="translate(1 -1)"
      />
    </>
  ),
};
export function Icon({ name, style }: { name: Name; style?: CSSProperties }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
