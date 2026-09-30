import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock3, IndianRupee, Loader2, MapPin, MessageSquare, Package, RefreshCw, Scale, Send, Warehouse, Zap, XCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { pickLang } from "../i18n/translations";
import { statusSteps, stepsIndex, centers, mspRates } from "../data/mockData";
import type { Booking } from "../data/mockData";
import "./Tracker.css";

function stepTime(slotTime: string, i: number): string {
  const m = slotTime.match(/(\d{1,2}):(\d{2})/);
  if (!m) return "";
  const start = Number(m[1]) * 60 + Number(m[2]) + i * 18;
  const h = Math.floor(start / 60) % 24;
  const mm = String(start % 60).padStart(2, "0");
  return `${h}:${mm}`;
}

export default function Tracker() {
  const { t, booking, lang, sendSms, smsLog, refresh } = useApp();
  const [smsSent, setSmsSent] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const view: Booking["status"] = booking?.status ?? "inspection";

  useEffect(() => {
    const id = setInterval(refresh, 10000);
    return () => clearInterval(id);
  }, [refresh]);

  if (!booking) {
    return (
      <div className="tracker container page-enter" style={{ paddingTop: 60 }}>
        <div className="tracker__none">
          <Package size={44} />
          <h2>{t("track.noBooking")}</h2>
          <a className="btn btn-primary" href="#/dashboard">{t("dash.book")}</a>
        </div>
      </div>
    );
  }

  const cropTe: Record<string, string> = { Paddy: "వరి", Cotton: "పత్తి", Groundnut: "వేరుశనగ", Maize: "మొక్కజొన్న", Tur: "పెసర", "Bengal Gram": "శనగ" };
  const cropHi: Record<string, string> = { Paddy: "धान", Cotton: "कपास", Groundnut: "मूंगफली", Maize: "मक्का", Tur: "अरहर", "Bengal Gram": "चना" };

  const center = centers.find((c) => c.id === booking.centerId);
  const rejected = view === "rejected";
  const activeIdx = rejected ? -1 : stepsIndex[view];
  const isDone = view === "payment" || view === "completed";
  const msp = mspRates[booking.crop as keyof typeof mspRates] ?? 0;
  const estAmount = booking.amount ?? booking.qtyTonnes * msp * 10;
  const grade = booking.qualityGrade ?? (view === "approved" ? "A" : "B");

  const fireSms = () => {
    sendSms(`Kisan Setu: Update for ${booking.token} — your load is being processed at ${booking.centerName}. Live status on the app.`);
    setSmsSent(true);
    setTimeout(() => setSmsSent(false), 2600);
  };

  const manualRefresh = () => {
    setSpinning(true);
    refresh();
    setTimeout(() => setSpinning(false), 900);
  };

  return (
    <div className="tracker container page-enter" style={{ paddingTop: 36 }}>
      <div className="tracker__head">
        <div>
          <span className="eyebrow">🛰 {t("track.updated")}</span>
          <h1>{t("track.title")}</h1>
        </div>
        <div className="tracker__headbtns">
          <button className="btn btn-outline btn-sm" onClick={manualRefresh}>
            <RefreshCw size={16} className={spinning ? "spin" : ""} />
            {t("track.refresh")}
          </button>
          <a className="btn btn-sm btn-primary" href="tel:+919848011223">
            <Send size={15} /> {t("track.sms")}
          </a>
        </div>
      </div>

      <div className="tracker__grid">
        {/* Status stepper card */}
        <div className="tracker__status card card-static">
          <div className="tracker__ids">
            <div className="tracker__id">
              <span className="tracker__id-label">{t("track.token")}</span>
              <b>{booking.token}</b>
            </div>
            <div className="tracker__id">
              <span className="tracker__id-label">{t("track.crop")}</span>
              <b>{lang === "te" ? (cropTe[booking.crop] ?? booking.crop) : lang === "hi" ? (cropHi[booking.crop] ?? booking.crop) : booking.crop}</b>
            </div>
            <div className="tracker__id">
              <span className="tracker__id-label">{t("track.qty")}</span>
              <b>{booking.qtyTonnes} t</b>
            </div>
            <div className="tracker__id">
              <span className="tracker__id-label">{t("track.slot")}</span>
              <b>{booking.slotTime}</b>
            </div>
          </div>

          <div className="tracker__center">
            <span className="tracker__center-icon">
              <Warehouse size={22} />
            </span>
            <div>
              <b>{pickLang(lang, center?.name ?? "", center?.nameHi ?? "", center?.nameTe ?? "")}</b>
              <small>
                <MapPin size={12} /> {center?.address}
              </small>
            </div>
            <span className="badge badge-green" style={{ marginLeft: "auto" }}>{center?.queueLength} {t("dash.queued")}</span>
          </div>

          {rejected ? (
            <motion.div className="tracker__rejected" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <span className="tracker__rejected-icon"><XCircle size={26} /></span>
              <div>
                <h3>{lang === "te" ? "నాణ్యత తిరస్కరించబడింది" : lang === "hi" ? "गुणवत्ता अस्वीकृत" : "Quality rejected"}</h3>
                <p>
                  {lang === "te"
                    ? "మీ ధాన్యపు నాణ్యత తక్కువగా ఉన్నందున మార్కెట్ అధికారి లాట్‌ను ఆమోదించలేదు. ఎండబెట్టి/శుభ్రం చేసి మళ్లీ డెలివరీ చేయండి."
                    : lang === "hi"
                      ? "आपके आटे की गुणवत्ता कम होने के कारण मंडी अधिकारी ने लॉट स्वीकार नहीं की। कृपया सुखाकर/साफ करके फिर से डिलीवरी करें।"
                      : "The mandi officer did not accept your lot due to low quality. Dry/clean the produce and re-deliver to keep your slot."}
                </p>
                <div className="tracker__rejected-actions">
                  <a className="btn btn-sm btn-primary" href="#/dashboard">{t("track.rebook")}</a>
                  <button className="btn btn-sm btn-outline" onClick={() => window.open("tel:+919848011223")}>📞 {t("track.sms")}</button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Animated stepper */}
              <div className="stepper">
                {statusSteps.map((s, i) => {
                  const reached = i <= activeIdx;
                  const isCurrent = i === activeIdx && !isDone;
                  return (
                    <div key={s.key} className={`stepper__row ${reached ? "reached" : ""}`}>
                      <div className="stepper__rail">
                        <span className={`stepper__dot ${isCurrent ? "current" : ""} ${reached && !isCurrent ? "reached" : ""}`}>
                          {reached && !isCurrent ? <CheckCircle2 size={17} /> : isCurrent ? <Loader2 size={17} className="spin" /> : <i />}
                        </span>
                        {i < statusSteps.length - 1 && <span className="stepper__line" style={reached && i < activeIdx ? { background: "linear-gradient(90deg, var(--grain-500), var(--gold-500))" } : {}} />}
                      </div>
                      <div className={`stepper__body ${isCurrent ? "current" : ""}`}>
                        <h4>{lang === "hi" ? s.labelHi : lang === "te" ? s.labelTe : s.label}</h4>
                        <p>{lang === "hi" ? s.descHi : lang === "te" ? s.descTe : s.desc}</p>
                        {isCurrent && (
                          <div className="stepper__eta">
                            <Clock3 size={13} /> {t("track.estWhen")}: ~{12 + activeIdx * 14} min
                          </div>
                        )}
                        {reached && !isCurrent && <span className="stepper__time">✓ Done · {stepTime(booking.slotTime, i)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right column: queue + payout */}
        <div className="tracker__side">
          {!rejected && (
            <div className="tracker__queue card card-static">
              <div className="tracker__side-head">
                <h3>{t("track.queuePos")}</h3>
                <span className="badge badge-gold">🟡 Live</span>
              </div>
              <div className="tracker__queue-num">{7 - activeIdx * 2}</div>
              <div className="tracker__queue-bar">
                <div className="tracker__queue-fill" style={{ height: `${Math.max((7 - activeIdx * 2) * 10, 6)}%` }} />
              </div>
              <p className="tracker__queue-note">
                Ahead of you: <b>{6 - activeIdx}</b> farmers · next clearance ~{8 + activeIdx * 6} min
              </p>
            </div>
          )}

          <div className={`tracker__payout card card-static ${isDone ? "paid" : ""} ${rejected ? "rejected" : ""}`}>
            <div className="tracker__side-head">
              <h3>{isDone ? "Payment" : t("track.estPay")}</h3>
              <span className="badge badge-ink">MSP {booking.crop} ₹{msp}/qtl</span>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
                className="tracker__amount"
              >
                {rejected ? (
                  <>
                    <span className="tracker__amount-prefix">₹ 0</span>
                    <small><XCircle size={12} /> Not accepted — retry required</small>
                  </>
                ) : isDone ? (
                  <>
                    <span className="tracker__amount-prefix">+₹ {estAmount.toLocaleString("en-IN")}</span>
                    <small><CheckCircle2 size={12} /> Credited to SBI ••••2410 · {booking.qualityGrade ?? "A"} grade</small>
                  </>
                ) : (
                  <>
                    <span className="tracker__amount-prefix">₹ {(estAmount * (activeIdx >= 3 ? 1 : 0.86)).toLocaleString("en-IN")}</span>
                    <small>Est. at grade {grade} · ₹{msp}/qtl · {booking.qtyTonnes} t</small>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="tracker__facts card card-static">
            <div className="tracker__fact">
              <span className="tracker__fact-icon" style={{ background: "var(--grain-100)", color: "var(--grain-700)" }}><Scale size={18} /></span>
              <div>
                <b>Weighbridge #2</b>
                <small>Auto-linked to your token</small>
              </div>
            </div>
            <div className="tracker__fact">
              <span className="tracker__fact-icon" style={{ background: "var(--gold-100)", color: "var(--gold-700)" }}><Zap size={18} /></span>
              <div>
                <b>70 min faster</b>
                <small>vs. non-booked farmers</small>
              </div>
            </div>
            <div className="tracker__fact">
              <span className="tracker__fact-icon" style={{ background: "#E4EFF4", color: "var(--sky-500)" }}><IndianRupee size={18} /></span>
              <div>
                <b>2026 MSP</b>
                <small>{booking.crop} ₹{msp}/quintal</small>
              </div>
            </div>
          </div>

          <div className="tracker__sms card card-static">
            <div className="tracker__side-head">
              <h3>📲 {t("track.sms")}</h3>
              <button className="btn btn-sm btn-gold" onClick={fireSms} disabled={smsSent}>
                {smsSent ? "✓ SMS Sent" : "Send update"}
              </button>
            </div>
            <div className="tracker__sms-list">
              {smsLog.slice(0, 4).map((s) => (
                <div className="tracker__sms-row" key={s.id}>
                  <MessageSquare size={15} />
                  <div>
                    <p>{s.text}</p>
                    <small>{s.time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}