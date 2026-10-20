export const TIME_ZONE = "America/Santo_Domingo";

export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function validDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00-04:00`);
  return Number.isFinite(date.getTime()) && today(date) === value;
}

export function dayRange(day: string) {
  if (!validDay(day)) throw new Error("Fecha inválida.");
  // Dominican Republic uses UTC-4 year-round.
  const gte = new Date(`${day}T00:00:00-04:00`);
  return { gte, lt: new Date(gte.getTime() + 86_400_000) };
}

export function timeLabel(value: string | Date) {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export function dayLabel(day: string) {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${day}T12:00:00-04:00`));
}
