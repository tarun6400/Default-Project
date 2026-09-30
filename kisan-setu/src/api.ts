const BASE = "";

async function api<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { "Content-Type": "application/json" }, ...init });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface ServerBooking { booking: import("./data/mockData").Booking | null; notifications: import("./data/mockData").AppNotification[]; smsLog: SmsEntry[]; queue: QueueRow[] }
export interface SmsEntry { id: string; text: string; time: string }
export interface QueueRow { id: string; name: string; nameHi: string; nameTe: string; crop: string; cropHi: string; cropTe: string; qty: number; pos: number; state: string; lot: string; centerId: string; rejected?: boolean; rejectReason?: string }

export const fetchState = () => api<ServerBooking>("/api/booking");
export const postBook = (b: Record<string, unknown>) => api<ServerBooking>("/api/book", { method: "POST", body: JSON.stringify(b) });
export const postAdvance = (id: string) => api<ServerBooking>("/api/admin/advance", { method: "POST", body: JSON.stringify({ id }) });
export const postReject = (id: string, reason: string) => api<ServerBooking>("/api/admin/reject", { method: "POST", body: JSON.stringify({ id, reason }) });
export const sendSms = (text: string) => api<SmsEntry>("/api/sms/send", { method: "POST", body: JSON.stringify({ text }) });
export const fetchSmsLog = () => api<SmsEntry[]>("/api/sms");
