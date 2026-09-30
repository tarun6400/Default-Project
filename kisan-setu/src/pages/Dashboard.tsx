import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Flame, Gauge, MapPin, Navigation, Phone, Search, Snowflake, Sparkles, Timer, Wallet } from "lucide-react";
import { useApp } from "../context/AppContext";
import { pickLang } from "../i18n/translations";
import { centers, generateSlots, mspRates } from "../data/mockData";
import type { Center, Slot, Booking } from "../data/mockData";
import { Tractor, GrainBag } from "../components/icons";
import Modal from "../components/Modal";
import "./Dashboard.css";

export default function Dashboard() {
  const { t, lang, farmer, booking } = useApp();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Center | null>(null);
  const [walletOpen, setWalletOpen] = useState(false);

  const filtered = useMemo(
    () =>
      centers.filter((c) => {
        const hay = `${c.name} ${c.district} ${c.nameHi} ${c.address}`.toLowerCase();
        return hay.includes(q.toLowerCase().trim());
      }),
    [q]
  );

  const pendingAmount = booking ? Math.round(booking.qtyTonnes * (mspRates[booking.crop as keyof typeof mspRates] ?? 0) * 10) : 0;

  return (
    <div className="dash page-enter">
      <div className="container">
        {/* Header */}
        <div className="dash__head">
          <div>
            <h1 className="dash__title">
              {t("dash.welcome")} <span className="text-gradient">{pickLang(lang, farmer.name, farmer.nameHi, farmer.nameTe).split(" ")[0]}</span> 🌾
            </h1>
            <p className="dash__sub">{pickLang(lang, farmer.village, farmer.villageHi, farmer.villageTe)} · {farmer.crop} · {pickLang(lang, farmer.landSize, farmer.landSizeHi, farmer.landSizeTe)}</p>
          </div>
          <div className="dash__kisan">
            <span className="dash__kisan-id">KISAN ID · {farmer.aadhaar}</span>
            <span className="dash__kisan-chip">
              <Sparkles size={14} /> e-Kisan Verified
            </span>
          </div>
        </div>

        {/* top strip stats */}
        <div className="dash__strip">
          <div className="dash__strip-item">
            <span className="dash__strip-icon" style={{ background: "var(--grain-100)", color: "var(--grain-700)" }}><CalendarDays size={18} /></span>
            <div>
              <b>2</b>
              <small>{t("dash.slotsLeft")}</small>
            </div>
          </div>
          <div className="dash__strip-item">
            <span className="dash__strip-icon" style={{ background: "var(--gold-100)", color: "var(--gold-700)" }}><MapPin size={18} /></span>
            <div>
              <b>{centers.length}</b>
              <small>{t("dash.nearby")}</small>
            </div>
          </div>
          <div className="dash__strip-item">
            <span className="dash__strip-icon" style={{ background: "#E4EFF4", color: "var(--sky-500)" }}><Timer size={18} /></span>
            <div>
              <b>4.8 / 5</b>
              <small>Farmer rating</small>
            </div>
          </div>
        </div>

        {/* wallet / passbook */}
        <div className="wallet card card-static">
          <div className="wallet__main">
            <span className="wallet__icon"><Wallet size={20} /></span>
            <div className="wallet__balance">
              <small>Estimated payout · active booking</small>
              <b>₹{pendingAmount.toLocaleString("en-IN")}</b>
              <span className="wallet__status"><i /> Expected within 48h of delivery</span>
            </div>
          </div>
          <div className="wallet__aside">
            <div className="wallet__credits">
              <span className="wallet__credit"><b>₹48,400</b><small>This season</small></span>
              <span className="wallet__credit"><b>6</b><small>Deliveries</small></span>
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => setWalletOpen(!walletOpen)}>
              {walletOpen ? "Hide" : "View"} passbook
            </button>
          </div>
          {walletOpen && (
            <div className="passbook">
              <div className="passbook__row"><span className="passbook__tag passbook__tag--in">+</span><div><b>Paddy · 3.1 t</b><small>{booking ? booking.centerName : "Guntur Market Yard"} · Grade A · 12 Sep</small></div><b className="passbook__amt">+ ₹71,300</b></div>
              <div className="passbook__row"><span className="passbook__tag passbook__tag--in">+</span><div><b>Maize · 2.0 t</b><small>Tenali Agricultural Market · Grade B · 02 Sep</small></div><b className="passbook__amt">+ ₹42,560</b></div>
              <div className="passbook__row"><span className="passbook__tag passbook__tag--in">+</span><div><b>Paddy · 4.6 t</b><small>Vijayawada Procurement Center · Grade A · 24 Aug</small></div><b className="passbook__amt">+ ₹1,05,800</b></div>
            </div>
          )}
        </div>

        {/* search + centers */}
        <div className="dash__section-head">
          <h2>{t("dash.nearby")}</h2>
          <div className="dash__search">
            <Search size={17} />
            <input
              placeholder={lang === "te" ? "మార్కెట్ లేదా జిల్లా కనుగొనండి…" : lang === "hi" ? "मंडी या जिला खोजें…" : "Search mandi or district…"}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        <div className="dash__notice" role="note">
          <Flame size={17} />
          {t("dash.bookNotice")}
        </div>

        <div className="dash__grid">
          {filtered.map((c) => (
            <CenterCard key={c.id} center={c} onBook={() => setSelected(c)} />
          ))}
          {filtered.length === 0 && (
            <div className="dash__empty">
              🧭 No mandi found for “{q}” — try “Guntur” or “Vijayawada”.
            </div>
          )}
        </div>
      </div>

      {selected && <BookingModal center={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function CenterCard({ center: c, onBook }: { center: Center; onBook: () => void }) {
  const { t, lang } = useApp();
  const loadColor = c.currentLoad > 70 ? "red" : c.currentLoad > 50 ? "gold" : "green";
  const remaining = c.dailySlots - c.slotsBookedToday;

  return (
    <article className={`center-card card card-static center-load--${loadColor}`}>
      <div className="center-card__top">
        <div className="center-card__id">
          <span className="center-card__emoji"><GrainBag className="center-card__bag" /></span>
          <div>
            <h3>{pickLang(lang, c.name, c.nameHi, c.nameTe)}</h3>
            <p>
              <MapPin size={13} /> {c.address} · {lang === "te" ? c.districtTe : c.district}
            </p>
          </div>
        </div>
        <div className="center-card__badges">
          {c.tags.map((tag) => (
            <span className={`badge ${tag.includes("load") ? "badge-red" : tag.includes("Low") ? "badge-green" : tag.includes("High") ? "badge-red" : "badge-gold"}`} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="center-card__stats">
        <div className="center-card__stat">
          <Frame label={t("dash.queued")} value={`${c.queueLength}`} color="var(--clay-500)" />
        </div>
        <div className="center-card__stat">
          <Frame label={t("dash.estWait")} value={`${c.avgWaitMins} min`} color="var(--gold-700)" />
        </div>
        <div className="center-card__stat">
          <Frame label={t("dash.capacity")} value={`${c.currentLoad}%`} color="var(--grain-700)" />
        </div>
        <div className="center-card__stat">
          <Frame label="slots free" value={`${remaining}`} color={remaining <= 3 ? "var(--clay-500)" : "var(--sky-500)"} />
        </div>
      </div>

      <div className="center-card__loadbar">
        <div className="center-card__loadbar-track">
          <div className="center-card__loadbar-fill" style={{ width: `${c.currentLoad}%` }} />
        </div>
        <span>{c.currentLoad}% {t("dash.capacity")}</span>
      </div>

      <div className="center-card__foot">
        <div className="center-card__timings">
          <span><Snowflake size={13} className="center-card__timer" /> {t("dash.open")} {c.opensAt} {t("dash.to")} {c.closesAt}</span>
          <span><Gauge size={13} /> {c.crops.join(" · ")}</span>
        </div>
        <div className="center-card__actions">
          <button className="btn btn-sm btn-outline">
            <Navigation size={15} /> {t("dash.arrive")}
          </button>
          <button className="btn btn-sm btn-primary" onClick={onBook}>
            {t("dash.book")} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function Frame({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <>
      <b style={{ color }}>{value}</b>
      <small>{label}</small>
    </>
  );
}

function BookingModal({ center, onClose }: { center: Center; onClose: () => void }) {
  const { t, lang, bookSlot } = useApp();
  const slots = generateSlots(center.id);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [qty, setQty] = useState("2.0");
  const [crop, setCrop] = useState("Paddy");
  const [done, setDone] = useState<Booking | null>(null);

  const confirm = () => {
    if (!picked) return;
    const token = `${center.id.toUpperCase().replace("C", "").padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const b: Booking = {
      id: "b-" + Date.now(),
      farmerId: "f1",
      centerId: center.id,
      centerName: center.name,
      crop,
      qtyTonnes: parseFloat(qty) || 2,
      slotTime: picked.time,
      date: picked.date,
      token,
      status: "pending",
      qualityGrade: null,
      amount: null,
    };
    bookSlot(b);
    setDone(b);
  };

  return (
    <Modal open onClose={onClose} title={done ? undefined : t("book.title")} wide>
      {done ? (
        <div className="book__success">
          <div className="book__tick">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 12.5l5 5L20 6.5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2>{t("book.confirmed")}</h2>
          <p>{t("book.confirmedMsg")}</p>
          <div className="book__token">
            <span>{t("book.tokenNote")}</span>
            <b>{done.token}</b>
          </div>
          <div className="book__success-detail">
            <div><span>{pickLang(lang, center.name, center.nameHi, center.nameTe)}</span><small>{t("track.slot")}</small></div>
            <div><span>{done.slotTime}</span><small>Time</small></div>
            <div><span>#{done.qtyTonnes} t</span><small>{t("track.qty")}</small></div>
          </div>
          <button className="btn btn-gold btn-lg btn-block" onClick={onClose}>
            {t("book.done")}
          </button>
        </div>
      ) : (
        <div className="book">
          <div className="book__center">
            <span className="book__center-icon"><Tractor /></span>
            <div>
              <h4>{pickLang(lang, center.name, center.nameHi, center.nameTe)}</h4>
              <p>{center.address} · {center.opensAt}–{center.closesAt}</p>
            </div>
            <span className="badge badge-green">{center.queueLength} {t("dash.queued")}</span>
          </div>

          <div className="book__section">
            <span className="eyebrow">🕒 {t("book.choice")}</span>
            <div className="book__slots">
              {slots.map((s) => {
                const full = s.remaining === 0;
                const active = picked?.id === s.id;
                return (
                  <button
                    key={s.id}
                    className={`book__slot ${active ? "active" : ""} ${full ? "full" : ""}`}
                    disabled={full}
                    onClick={() => setPicked(s)}
                  >
                    <b>{s.label}</b>
                    <small>
                      {full ? `✕ ${t("book.fill")}` : `${s.remaining} ${t("book.remaining")}`}
                    </small>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="book__row">
            <div className="field">
              <label>{t("book.crop")}</label>
              <select className="select" value={crop} onChange={(e) => setCrop(e.target.value)}>
                <option>Paddy</option>
                <option>Cotton</option>
                <option>Groundnut</option>
                <option>Maize</option>
                <option>Tur</option>
                <option>Bengal Gram</option>
              </select>
            </div>
            <div className="field">
              <label>{t("book.qty")} <span className="req">*</span></label>
              <input className="input" type="number" step="0.1" min="0.5" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
          </div>

          <p className="book__note">
            <Phone size={14} /> {t("book.tokenNote")}
          </p>

          <button className="btn btn-primary btn-lg btn-block" disabled={!picked || !qty} onClick={confirm}>
            {t("book.confirm")} {picked && `· ${picked.label}`}
          </button>
        </div>
      )}
    </Modal>
  );
}