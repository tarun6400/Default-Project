import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { translations } from "../i18n/translations";
import type { Lang } from "../i18n/translations";
import { demoBooking, demoFarmer, notes as seedNotes } from "../data/mockData";
import type { Booking, AppNotification } from "../data/mockData";
import { fetchState, postBook, postAdvance, postReject, sendSms as apiSendSms, fetchSmsLog } from "../api";
import type { SmsEntry } from "../api";

export type Role = "farmer" | "officer";

interface AppState {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isLoggedIn: boolean;
  role: Role;
  login: (role?: Role) => void;
  logout: () => void;
  farmer: typeof demoFarmer;
  booking: Booking | null;
  setBooking: (b: Booking | null) => void;
  bookSlot: (b: Booking) => void;
  advanceBooking: (id: string) => void;
  rejectBooking: (id: string, reason: string) => void;
  smsLog: SmsEntry[];
  sendSms: (text: string) => void;
  refresh: () => void;
  notifications: AppNotification[];
  markAllRead: () => void;
  addNotification: (n: Omit<AppNotification, "id" | "read">) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("te");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState<Role>("farmer");
  const [booking, setBooking] = useState<Booking | null>(demoBooking);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotes);
  const [smsLog, setSmsLog] = useState<SmsEntry[]>([
    { id: "sms0", text: "Kisan Setu: Slot confirmed 09:00–10:00 at Guntur Market Yard. Token GNT-3412.", time: "Today 6:42 AM" },
    { id: "sms1", text: "Kisan Setu: Your queue position is #12. Estimated wait 20 min.", time: "Today 8:51 AM" },
    { id: "sms2", text: "Kisan Setu: ₹ 55,200 pending. Payment arrives within 48h of grading.", time: "Yesterday 5:04 PM" },
  ]);

  useEffect(() => {
    fetchState().then((state) => {
      if (state) {
        if (state.booking) setBooking(state.booking);
        if (state.notifications?.length) setNotifications(state.notifications);
        if (state.smsLog?.length) setSmsLog(state.smsLog);
      }
    });
    fetchSmsLog().then((log) => { if (log?.length) setSmsLog(log); });
  }, []);

  const t = (key: string): string => {
    const row = translations[key];
    if (!row) return key;
    return row[lang] ?? row.en;
  };

  const login = (r: Role = "farmer") => { setRole(r); setIsLoggedIn(true); };
  const logout = () => { setRole("farmer"); setIsLoggedIn(false); };

  const markAllRead = () =>
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));

  const addNotification = (n: Omit<AppNotification, "id" | "read">) =>
    setNotifications((prev) => [
      { ...n, id: `n-${Date.now()}`, read: false },
      ...prev,
    ]);

  // setBooking re-exported as context bookSlot service
  const bookSlot = (b: Booking) => {
    setBooking(b);
    postBook({
      farmerId: b.farmerId,
      centerId: b.centerId,
      centerName: b.centerName,
      crop: b.crop,
      qtyTonnes: b.qtyTonnes,
      slotTime: b.slotTime,
      date: b.date,
      token: b.token,
    }).then((s) => {
      if (s) {
        if (s.booking) setBooking(s.booking);
        if (s.notifications?.length) setNotifications(s.notifications);
        if (s.smsLog?.length) setSmsLog(s.smsLog);
      } else {
        addNotification({
          type: "slot",
          title: "Slot confirmed",
          titleHi: "स्लॉट की पुष्टि हुई",
          titleTe: "స్లాట్ నిర్ధారణ అయింది",
          message: `Your delivery slot ${b.slotTime} at ${b.centerName} is confirmed. Token ${b.token}.`,
          messageHi: `${b.centerName} पर आपका ${b.slotTime} डिलीवरी स्लॉट पक्का है। टोकन ${b.token}।`,
          messageTe: `${b.centerName}లో మీ ${b.slotTime} డెలివరీ స్లాట్ నిర్ధారణ అయింది. టోకెన్ ${b.token}.`,
          time: "Just now",
        });
      }
    });
  };

  const statusMapLocal: Record<string, string> = {
    arrived: "inspection",
    inspection: "weighing",
    weighing: "approved",
    approved: "payment",
    payment: "completed",
  };

  const advanceBooking = (id: string) => {
    postAdvance(id).then((s) => {
      if (s) {
        if (s.booking) setBooking(s.booking);
        if (s.notifications?.length) setNotifications(s.notifications);
        if (s.smsLog?.length) setSmsLog(s.smsLog);
      } else {
        setBooking((b) => (b && b.status !== "completed" ? { ...b, status: (statusMapLocal[b.status] as Booking["status"]) ?? b.status } : b));
      }
    });
  };

  const rejectBooking = (id: string, reason: string) => {
    postReject(id, reason).then((s) => {
      if (s) {
        if (s.booking) setBooking(s.booking);
        if (s.notifications?.length) setNotifications(s.notifications);
        if (s.smsLog?.length) setSmsLog(s.smsLog);
      } else {
        setBooking((b) => (b ? { ...b, status: "rejected" as Booking["status"] } : b));
      }
      addNotification({
        type: "info",
        title: "Quality rejected",
        titleHi: "गुणवत्ता अस्वीकृत",
        titleTe: "నాణ్యత తిరస్కరించబడింది",
        message: `Your lot was not accepted. Reason: ${reason}. Please re-deliver after preparation.`,
        messageHi: `आपकी लॉट स्वीकार नहीं की गई। कारण: ${reason}। कृपया तैयारी के बाद दोबारा लाएं।`,
        messageTe: `మీ లాట్ ఆమోదించబడలేదు. కారణం: ${reason}. దయచేసి సిద్ధమైన తర్వాత మళ్ళీ రండి.`,
        time: "Just now",
      });
    });
  };

  const sendSms = (text: string) => {
    setSmsLog((prev) => [{ id: `sms-${Date.now()}`, text, time: "Just now" }, ...prev]);
    apiSendSms(text).then((sms) => {
      if (sms) setSmsLog((prev) => [{ ...sms, time: "Just now" }, ...prev.filter((s) => s.id !== sms.id)]);
    });
  };

  const refresh = () => {
    fetchState().then((s) => {
      if (!s) return;
      if (s.booking) setBooking(s.booking);
      if (s.notifications?.length) setNotifications(s.notifications);
      if (s.smsLog?.length) setSmsLog(s.smsLog);
    });
  };

  const value: AppState = {
    lang,
    setLang,
    t,
    isLoggedIn,
    role,
    login,
    logout,
    farmer: demoFarmer,
    booking,
    setBooking,
    bookSlot,
    advanceBooking,
    rejectBooking,
    smsLog,
    sendSms,
    refresh,
    notifications,
    markAllRead,
    addNotification,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}