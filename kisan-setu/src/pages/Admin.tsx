import { useState } from "react";
import { CheckCircle2, ClipboardList, Factory, Filter, Phone, Scale, Truck, UserCheck, Users, Warehouse, XCircle } from "lucide-react";
import { useApp } from "../context/AppContext";
import { pickLang } from "../i18n/translations";
import { centers } from "../data/mockData";
import { MandiIcon } from "../components/icons";
import "./Admin.css";

interface QueueRow {
  id: string;
  name: string;
  nameHi: string;
  nameTe: string;
  crop: string;
  cropHi: string;
  cropTe: string;
  qty: number;
  pos: number;
  state: "scheduled" | "arrived" | "inspection" | "weighing" | "graded" | "paid";
  lot: string;
  rejected?: boolean;
  rejectReason?: string;
}

const seedRows: QueueRow[] = [
  { id: "q1", name: "Venkat Rao", nameHi: "वेंकट राव", nameTe: "వెంకట్ రావు", crop: "Paddy", cropHi: "धान", cropTe: "వరి", qty: 3.1, pos: 1, state: "inspection", lot: "GNT-1102" },
  { id: "q2", name: "Lakshmi Devi", nameHi: "लक्ष्मी देवी", nameTe: "లక్ష్మీ దేవి", crop: "Cotton", cropHi: "कपास", cropTe: "పత్తి", qty: 4.6, pos: 2, state: "arrived", lot: "GNT-1103" },
  { id: "q3", name: "Srinivas Reddy", nameHi: "श्रीनिवास रेड्डी", nameTe: "శ్రీనివాస్ రెడ్డి", crop: "Paddy", cropHi: "धान", cropTe: "వరి", qty: 2.2, pos: 3, state: "arrived", lot: "GNT-1105" },
  { id: "q4", name: "Nagaraju", nameHi: "नागराजू", nameTe: "నాగరాజు", crop: "Groundnut", cropHi: "मूंगफली", cropTe: "వేరుశనగ", qty: 1.8, pos: 4, state: "scheduled", lot: "GNT-1108" },
  { id: "q5", name: "Padmavathi", nameHi: "पद्मावती", nameTe: "పద్మావతి", crop: "Maize", cropHi: "मक्का", cropTe: "మొక్కజొన్న", qty: 5.0, pos: 5, state: "scheduled", lot: "GNT-1110" },
];

const stateMeta: Record<QueueRow["state"], { label: string; labelHi: string; labelTe: string; icon: string }> = {
  scheduled: { label: "Scheduled", labelHi: "निर्धारित", labelTe: "షెడ్యూల్ చేయబడింది", icon: "🕐" },
  arrived: { label: "Arrived", labelHi: "पहुंचे", labelTe: "చేరుకున్నారు", icon: "🟢" },
  inspection: { label: "In inspection", labelHi: "निरीक्षण में", labelTe: "తనిఖీలో ఉంది", icon: "🔍" },
  weighing: { label: "Weighing", labelHi: "तौल", labelTe: "బరువు", icon: "⚖️" },
  graded: { label: "Graded · A", labelHi: "ग्रेडेड · ए", labelTe: "గ్రేడ్ · ఎ", icon: "✅" },
  paid: { label: "Paid", labelHi: "भुगतान", labelTe: "చెల్లింపు", icon: "💸" },
};

const nextState: Record<QueueRow["state"], QueueRow["state"]> = {
  scheduled: "arrived",
  arrived: "inspection",
  inspection: "weighing",
  weighing: "graded",
  graded: "paid",
  paid: "paid",
};

export default function Admin() {
  const { t, lang, addNotification, advanceBooking, rejectBooking } = useApp();
  const [centerId, setCenterId] = useState(centers[0].id);
  const [rows, setRows] = useState<QueueRow[]>(seedRows);
  const [capInput, setCapInput] = useState(String(centers[0].capacity));
  const [savedToast, setSavedToast] = useState(false);

  const capNum = Number(capInput) || 260;
  const receivedPct = Math.min(100, (142 / capNum) * 100);

  const center = centers.find((c) => c.id === centerId)!;

  const advance = (id: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id && !r.rejected ? { ...r, state: nextState[r.state] } : r))
    );
    const row = rows.find((r) => r.id === id);
    if (row?.state === "graded") {
      addNotification({
        type: "payment",
        title: "Payment processed",
        titleHi: "भुगतान संसाधित",
        titleTe: "చెల్లింపు జరిగింది",
        message: `₹${(row.qty * 10 * 2300).toLocaleString("en-IN")} for your ${row.crop} (${row.qty} t) has been credited.`,
        messageHi: `आपकी ${row.cropHi} (${row.qty} टन) के ₹${(row.qty * 10 * 2300).toLocaleString("en-IN")} आपके खाते में जमा हो गए।`,
        messageTe: `మీ ${row.cropTe} (${row.qty} టన్నుల) కోసం ₹${(row.qty * 10 * 2300).toLocaleString("en-IN")} మీ ఖాతాలో జమ అయింది.`,
        time: "Just now",
      });
    }
    advanceBooking(id);
  };

  const reject = (id: string) => {
    const reason =
      window.prompt("Rejection reason (shown to the farmer + SMS):", "Moisture above 17% limit") ??
      "Quality not acceptable";
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, rejected: true, rejectReason: reason } : r))
    );
    rejectBooking(id, reason);
  };

  const saveCapacity = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 1800);
  };

  const arrivedCount = rows.filter((r) => r.state !== "scheduled" && r.state !== "paid").length;
  const waiting = rows.filter((r) => r.state === "scheduled" || r.state === "arrived").length;

  return (
    <div className="admin page-enter">
      <div className="container">
        <div className="admin__head">
          <div>
            <span className="eyebrow">🏢 Procurement Staff</span>
            <h1>{t("admin.title")}</h1>
            <p className="admin__sub">{pickLang(lang, center.name, center.nameHi, center.nameTe)} · {lang === "te" ? center.districtTe : center.district}</p>
          </div>
          <div className="admin__shift">
            <span className="admin__live"><i /> Shift live</span>
            <span>Ramesh · Staff #A-214</span>
          </div>
        </div>

        <div className="admin__centerbar">
          <div className="admin__center">
            <span className="admin__center-icon"><MandiIcon /></span>
            <div>
              <b>{center.name}</b>
              <small><Warehouse size={13} /> {center.dailySlots} slots daily · {center.currentLoad}% load</small>
            </div>
          </div>
          <select className="select admin__select" value={centerId} onChange={(e) => { setCenterId(e.target.value); setCapInput(String(centers.find((c) => c.id === e.target.value)?.capacity ?? 0)); }}>
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="admin__kpis">
          <div className="admin__kpi card card-static">
            <span className="admin__kpi-icon" style={{ background: "var(--grain-100)", color: "var(--grain-700)" }}><Users size={20} /></span>
            <div>
              <b>{waiting}</b>
              <small>{t("admin.waiting")}</small>
            </div>
          </div>
          <div className="admin__kpi card card-static">
            <span className="admin__kpi-icon" style={{ background: "var(--gold-100)", color: "var(--gold-700)" }}><Truck size={20} /></span>
            <div>
              <b>{arrivedCount}</b>
              <small>{t("admin.arrived")}</small>
            </div>
          </div>
          <div className="admin__kpi card card-static">
            <span className="admin__kpi-icon" style={{ background: "#E4EFF4", color: "var(--sky-500)" }}><FactFactoryIcon /></span>
            <div>
              <b>{center.currentLoad}%</b>
              <small>{t("dash.capacity")}</small>
            </div>
          </div>
          <div className="admin__kpi card card-static">
            <span className="admin__kpi-icon" style={{ background: "#F5E7E0", color: "var(--clay-500)" }}><ClipboardList size={20} /></span>
            <div>
              <b>{rows.filter((r) => r.state === "graded").length}</b>
              <small>Graded A</small>
            </div>
          </div>
        </div>

        <div className="admin__cols">
          {/* Capacity */}
          <div className="admin__panel card card-static">
            <div className="admin__panel-head">
              <span className="admin__panel-icon" style={{ background: "var(--gold-100)", color: "var(--gold-700)" }}><Factory size={20} /></span>
              <div>
                <h3>{t("admin.capacityTitle")}</h3>
                <p>{t("admin.capacityHelp")}</p>
              </div>
            </div>
            <div className="admin__capacity">
              <div className="admin__capacity-ring" style={{ "--p": `${center.currentLoad}%` } as React.CSSProperties}>
                <span>{center.currentLoad}%</span>
              </div>
              <div className="admin__capacity-fields">
                <label>{t("admin.todayCapacity")} (tonnes)</label>
                <div className="admin__caprow">
                  <input className="input" type="number" value={capInput} onChange={(e) => setCapInput(e.target.value)} />
                  <button className="btn btn-primary btn-sm" onClick={saveCapacity}>
                    {t("admin.saveCapacity")}
                  </button>
                </div>
                <div className="admin__progress">
                  <div className="admin__progress-bar">
                    <div className="admin__progress-fill" style={{ width: `${receivedPct}%` }} />
                  </div>
                  <span>142 t received of {capInput || "—"} t target</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grading */}
          <div className="admin__panel card card-static">
            <div className="admin__panel-head">
              <span className="admin__panel-icon" style={{ background: "var(--grain-100)", color: "var(--grain-700)" }}><Scale size={20} /></span>
              <div>
                <h3>{t("admin.gradeTitle")}</h3>
                <p>{t("admin.gradeHelp")}</p>
              </div>
            </div>
            <div className="admin__grades">
              {["A", "B", "C"].map((g) => (
                <div key={g} className={`admin__grade admin__grade--${g.toLowerCase()}`}>
                  <b>{g}</b>
                  <span>₹{(g === "A" ? 2300 : g === "B" ? 2200 : 2050).toLocaleString("en-IN")}/qtl</span>
                  <small>{g === "A" ? "Premium" : g === "B" ? "Standard" : "Below std."}</small>
                </div>
              ))}
            </div>
            <div className="admin__scan">
              <Filter size={15} /> 3 lots waiting for grading scan
            </div>
          </div>
        </div>

        {/* Queue table */}
        <div className="admin__panel card card-static admin__queue">
          <div className="admin__panel-head">
            <span className="admin__panel-icon" style={{ background: "#E4EFF4", color: "var(--sky-500)" }}><UserCheck size={20} /></span>
            <div>
              <h3>{t("admin.queueTitle")}</h3>
              <p>{center.name} · {t("admin.incoming")}</p>
            </div>
            <span className="badge badge-gold">{rows.length} {t("dash.queued")}</span>
          </div>

          <div className="admin__tablewrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th>{t("admin.queuePos")}</th>
                  <th>{t("admin.farmer")}</th>
                  <th>{t("track.crop")}</th>
                  <th>{t("track.qty")}</th>
                  <th>{t("admin.lot")}</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const meta = stateMeta[r.state];
                  return (
                    <tr key={r.id} className={`admin__row admin__row--${r.state}`}>
                      <td className="admin__pos">{r.pos}</td>
                      <td>
                        <div className="admin__farmer">
                          <span className="admin__avatar">{r.name.split(" ").map((w) => w[0]).join("")}</span>
                          <div>
                            <b>{lang === "te" ? r.nameTe : lang === "hi" ? r.nameHi : r.name}</b>
                            <small><Phone size={11} /> +91 98••• ••{String(r.id.length * 7).padStart(2, "0")}</small>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-ink">{lang === "te" ? r.cropTe : lang === "hi" ? r.cropHi : r.crop}</span></td>
                      <td className="admin__qty">{r.qty} t</td>
                      <td className="admin__lot">{r.lot}</td>
                      <td>
                        {r.rejected ? (
                          <span className="admin__state admin__state--rejected">
                            <XCircle size={13} /> Rejected · {r.rejectReason}
                          </span>
                        ) : (
                          <span className={`admin__state admin__state--${r.state}`}>
                            {meta.icon} {lang === "te" ? meta.labelTe : lang === "hi" ? meta.labelHi : meta.label}
                          </span>
                        )}
                      </td>
                      <td>
                        {r.state !== "paid" ? (
                          <div className="admin__actions">
                            {r.state === "arrived" || r.state === "inspection" ? (
                              <button className="btn btn-sm btn-danger" onClick={() => reject(r.id)} disabled={r.rejected}>
                                {r.rejected ? "Rejected" : "Reject"}
                              </button>
                            ) : null}
                            <button className="btn btn-sm btn-primary" onClick={() => advance(r.id)} disabled={r.rejected}>
                              {r.state === "scheduled" ? t("admin.markArrived") : r.state === "graded" ? "Mark paid" : r.state === "arrived" ? "Start check" : t("admin.markDone")}
                            </button>
                          </div>
                        ) : (
                          <span className="admin__paid"><CheckCircle2 size={16} /> Paid</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {savedToast && (
          <div className="admin__toast">
            <CheckCircle2 size={18} /> {t("admin.saveCapacity")} ✓
          </div>
        )}
      </div>
    </div>
  );
}

function FactFactoryIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 21V9l6 4V9l6 4V5h-2V3h8v2h-2v16" />
    </svg>
  );
}