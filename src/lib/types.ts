export type Vehicle = {
  brand: string;
  model: string;
  color: string;
  plate: string;
};
export type Notice = { message: string; sentAt: string };
export type Service = {
  id: string;
  clientName: string;
  phone: string;
  pickup: string;
  scheduledAt: string;
  publicToken?: string;
  driver: { name: string };
  vehicle: Vehicle;
  notice: Notice | null;
};
export type Driver = {
  id: string;
  name: string;
  vehicle: { brand: string; model: string; plate: string } | null;
};
export type PublicNotice = {
  driver: { name: string };
  vehicle: Vehicle;
  notice: Notice | null;
};
