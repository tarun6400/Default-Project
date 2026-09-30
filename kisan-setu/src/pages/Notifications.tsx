import { CheckCircle2, IndianRupee, Info, MessageSquare, Sparkles, CalendarDays } from "lucide-react";
import { useApp } from "../context/AppContext";
import "./Notifications.css";

export default function Notifications() {
  const { t, lang, notifications, markAllRead } = useApp();
  const unread = notifications.filter((n) => !n.read).length;

  const iconMap = {
    slot: CalendarDays,
    schedule: Info,
    payment: IndianRupee,
    info: Sparkles,
  };

  const colorMap = {
    slot: "var(--grain-700)",
    schedule: "var(--gold-700)",
    payment: "var(--grain-600)",
    info: "var(--sky-500)",
  };

  const bgMap = {
    slot: "var(--grain-100)",
    schedule: "var(--gold-100)",
    payment: "var(--grain-100)",
    info: "#E4EFF4",
  };

  return (
    <div className="notifications page-enter">
      <div className="container">
        <div className="notif__head">
          <div>
            <span className="eyebrow">🔔 {t("notif.title")}</span>
            <h1>{t("notif.title")} {unread > 0 && <span className="notif__count">{unread}</span>}</h1>
            <p className="notif__sms">{t("notif.smsNote")}</p>
          </div>
          {unread > 0 && (
            <button className="btn btn-sm btn-outline" onClick={markAllRead}>
              <CheckCircle2 size={15} /> {t("notif.markAll")}
            </button>
          )}
        </div>

        <div className="notif__list">
          {notifications.map((n) => {
            const Icon = iconMap[n.type];
            return (
              <div
                key={n.id}
                className={`notif__item ${!n.read ? "unread" : ""}`}
              >
                <span className="notif__icon" style={{ background: bgMap[n.type], color: colorMap[n.type] }}>
                  <Icon size={18} />
                </span>
                <div className="notif__body">
                  <div className="notif__top">
                    <h3>{lang === "te" ? n.titleTe : lang === "hi" ? n.titleHi : n.title}</h3>
                    {!n.read && <span className="notif__unread-dot" />}
                  </div>
                  <p>{lang === "te" ? n.messageTe : lang === "hi" ? n.messageHi : n.message}</p>
                </div>
                <span className="notif__time">{n.time}</span>
              </div>
            );
          })}
        </div>

        {notifications.length === 0 && (
          <div className="notif__empty">
            <MessageSquare size={44} />
            <h2>{t("notif.empty")}</h2>
          </div>
        )}
      </div>
    </div>
  );
}