import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Bell, CalendarDays, CheckCircle2, Clock3, Globe2, LineChart, MapPin, Navigation, ShieldCheck, Sparkles, Truck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { centers, mspRates, statusSteps } from "../../data/mockData";
import { WheatSprig } from "../icons";
import "./Home.css";

function useCountUp(end: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let anim: number;
    let start: number | null;
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const step = (ts: number) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / duration, 1);
          setVal(Math.floor(p * end));
          if (p < 1) anim = requestAnimationFrame(step);
        };
        anim = requestAnimationFrame(step);
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => { cancelAnimationFrame(anim); observer.disconnect(); };
  }, [end, duration]);
  return { val, ref } as const;
}

const tickerData = [
  { crop: "Paddy", price: 2300 },
  { crop: "Cotton", price: 7020 },
  { crop: "Groundnut", price: 6783 },
  { crop: "Tur", price: 7550 },
  { crop: "Bengal Gram", price: 5650 },
  { crop: "Maize", price: 2225 },
];

export function PriceTicker() {
  const items = [...tickerData, ...tickerData, ...tickerData];
  return (
    <div className="ticker">
      <div className="ticker__track">
        {items.map((t, i) => (
          <span key={i} className="ticker__item">
            <span className="ticker__crop">{t.crop}</span>
            <span className="ticker__price">₹{t.price.toLocaleString("en-IN")}/qtl</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function HeroStat({ end, suffix = "", label }: { end: number; suffix?: string; label: string }) {
  const { val, ref } = useCountUp(end);
  const display = end >= 10000 ? val.toLocaleString("en-IN") : String(val);
  return (
    <div className="hero__stat" ref={ref}>
      <span className="hero__stat-num">{display}{suffix}</span>
      <span className="hero__stat-label">{label}</span>
    </div>
  );
}

function HeroStats() {
  const { t } = useApp();
  return (
    <div className="hero__stats">
      <HeroStat end={240000} suffix="+" label={t("hero.stat1k")} />
      <div className="hero__stat-divider" />
      <HeroStat end={1180} label={t("hero.stat2k")} />
      <div className="hero__stat-divider" />
      <HeroStat end={62} suffix="%" label={t("hero.stat3k")} />
    </div>
  );
}

function PhoneMock() {
  const { lang, farmer, booking } = useApp();
  const currentIdx = statusSteps.findIndex((s) => s.key === booking?.status) ?? 0;
  const center = centers.find((c) => c.id === booking?.centerId);
  const name = lang === "hi" ? farmer.nameHi : lang === "te" ? farmer.nameTe : farmer.name;
  const greeting = lang === "te" ? "నమస్తే 🙏" : lang === "hi" ? "नमस्ते 🙏" : "Namaste 🙏";
  const centerName = lang === "te" ? "గుంటూరు మార్కెట్ యార్డ్" : lang === "hi" ? "गुंटूर मार्केट यार्ड" : "Guntur Market Yard";
  const statusLabel = statusSteps[Math.max(currentIdx, 0)];
  return (
    <div className="phone">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div className="phone__statusbar">
          <span>09:41</span>
          <span>5G · 📶 · 🔋</span>
        </div>
        <div className="phone__app">
          <div className="phone__apphead">
            <div>
              <p className="phone__greet">{greeting}</p>
              <h4>{name}</h4>
            </div>
            <span className="phone__avatar">{name.charAt(0)}</span>
          </div>
          <div className="phone__card">
            <div className="phone__card-row">
              <span className="phone__chip">Token · {booking?.token}</span>
              <span className="phone__live"><span className="phone__dot" /> Live</span>
            </div>
            <p className="phone__card-title">{centerName}</p>
            <div className="phone__status-tags">
              {statusSteps.map((s, i) => (
                <span key={s.key} className={i <= currentIdx ? "on" : ""} />
              ))}
            </div>
            <div className="phone__progress">
              <div
                className="phone__progress-fill"
                style={{ width: `${((currentIdx + 1) / statusSteps.length) * 100}%` }}
              />
            </div>
            <div className="phone__card-meta">
              <span>{lang === "hi" ? statusLabel.labelHi : lang === "te" ? statusLabel.labelTe : statusLabel.label}</span>
              <span className="phone__eta">~{booking ? 15 + currentIdx * 12 : 15} min</span>
            </div>
          </div>
          <div className="phone__mini-stats">
            <div className="phone__mini">
              <span className="phone__mini-icon" style={{ background: "var(--grain-100)", color: "var(--grain-700)" }}><Users size={14} /></span>
              <div><b>{center?.queueLength}</b><small>queue</small></div>
            </div>
            <div className="phone__mini">
              <span className="phone__mini-icon" style={{ background: "var(--gold-100)", color: "var(--gold-700)" }}><Clock3 size={14} /></span>
              <div><b>{center?.avgWaitMins}m</b><small>wait</small></div>
            </div>
            <div className="phone__mini">
              <span className="phone__mini-icon" style={{ background: "#E4EFF4", color: "var(--sky-500)" }}><Navigation size={14} /></span>
              <div><b>3.2 km</b><small>away</small></div>
            </div>
          </div>
          <div className="phone__msp">
            <div className="phone__msp-head">
              <span>MSP today</span>
              <span className="phone__msp-chip">₹/qtl</span>
            </div>
            <div className="phone__msp-list">
              {Object.entries(mspRates).slice(0, 3).map(([crop, v]) => (
                <div key={crop} className="phone__msp-row">
                  <span>{crop}</span>
                  <b>₹{v.toLocaleString("en-IN")}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const { t } = useApp();
  return (
    <section className="hero">
      <div className="hero__orb hero__orb--one" />
      <div className="hero__orb hero__orb--two" />
      <div className="hero__orb hero__orb--three" />

      <div className="container hero__grid">
        <div className="hero__content">
          <span className="hero__badge">
            <Sparkles size={15} />
            {t("hero.badge")}
          </span>
          <p className="hero__tag">{t("hero.tag")}</p>
          <h1 className="hero__title">
            {t("hero.title1")}
            <br />
            <span className="text-gradient">{t("hero.title2")}</span>
          </h1>
          <p className="hero__sub">{t("hero.sub")}</p>
          <div className="hero__ctas">
            <Link to="/register" className="btn btn-gold btn-lg">
              {t("hero.cta1")}
            </Link>
            <Link to="/dashboard" className="btn btn-white btn-lg">
              {t("hero.cta2")}
            </Link>
          </div>
          <HeroStats />
        </div>

        <div className="hero__visual">
          <div className="hero__glow" />
          <PhoneMock />
          <div className="hero__float hero__float--wheat">
            <WheatSprig className="hero__wheat-icon" />
          </div>
          <div className="hero__float hero__float--check">
            <CheckCircle2 size={20} />
          </div>
        </div>
      </div>

      <div className="hero__marquee">
        <div className="hero__marquee-track">
          {[...Array(2)].map((_, k) => (
            <div className="hero__marquee-group" key={k}>
              {Object.entries(mspRates).map(([crop, v]) => (
                <span key={`${k}-${crop}`} className="hero__marquee-item">
                  {crop} · ₹{v.toLocaleString("en-IN")}/qtl · MSP 2026
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const howSteps = ["how.s1", "how.s2", "how.s3", "how.s4"];

export function HowItWorks() {
  const { t } = useApp();
  const icons = [Users, CalendarDays, Truck, LineChart];
  return (
    <section className="section how" id="how">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">How it works</span>
          <h2 className="section-title">{t("home.how.title")}</h2>
          <p className="section-sub">{t("home.how.sub")}</p>
        </div>
        <div className="how__grid">
          {howSteps.map((step, i) => {
            const Icon = icons[i];
            return (
              <div className="how__card card card-static" key={step}>
                <span className="how__num">{String(i + 1).padStart(2, "0")}</span>
                <div className="how__icon">
                  <Icon size={26} />
                </div>
                <h3>{t(step)}</h3>
                <p>{t(`${step}d`)}</p>
                {i < howSteps.length - 1 && <span className="how__arrow">→</span>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const featKeys = [
  ["feat.slot", "feat.slotd"],
  ["feat.live", "feat.lived"],
  ["feat.notif", "feat.notifd"],
  ["feat.map", "feat.mapd"],
  ["feat.admin", "feat.admind"],
] as const;

export function Features() {
  const { t } = useApp();
  const iconMap = [CalendarDays, LineChart, Bell, MapPin, ShieldCheck];
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Platform</span>
          <h2 className="section-title">{t("home.features.title")}</h2>
          <p className="section-sub">{t("home.features.sub")}</p>
        </div>
        <div className="features__grid">
          {featKeys.map(([title, desc], i) => {
            const Icon = iconMap[i];
            return (
              <div className="feature__card card" key={title}>
                <div className={`feature__icon feature__icon--${(i % 5) + 1}`}>
                  <Icon size={24} />
                </div>
                <h3>{t(title)}</h3>
                <p>{t(desc)}</p>
              </div>
            );
          })}
          <div className="feature__cta card">
            <span className="eyebrow">Smart India Hackathon 2026</span>
            <h3>Ready to demo the magic?</h3>
            <Link to="/login" className="btn btn-gold">
              Open the app <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LiveBand() {
  const { t } = useApp();
  return (
    <section className="liveband">
      <div className="container">
        <div className="liveband__inner">
          <div className="liveband__icon">
            <Globe2 size={30} />
          </div>
          <div className="liveband__text">
            <h3>Live right now — {centers.length} mandis across {new Set(centers.map(c => c.district)).size} districts</h3>
            <p>{t("map.intro")}</p>
          </div>
          <div className="liveband__dots">
            {centers.map((c) => (
              <span
                key={c.id}
                className={`liveband__dot ${
                  c.currentLoad > 70 ? "hot" : c.currentLoad > 50 ? "med" : "cool"
                }`}
                title={`${c.name} · ${c.currentLoad}%`}
              />
            ))}
            <span className="liveband__count">1180 total</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Multilingual() {
  return (
    <section className="section lang">
      <div className="container lang__grid">
        <div className="lang__visual">
          <div className="lang__cards">
            <div className="lang__card lang__card--en">
              <span className="lang__flag">🇮🇳</span>
              <span>English — "Book your slot"</span>
            </div>
            <div className="lang__card lang__card--hi">
              <span className="lang__flag">తె</span>
              <span>"మీ స్లాట్ బుక్ చేయండి"</span>
            </div>
            <div className="lang__card lang__card--pa">
              <span className="lang__flag">हिं</span>
              <span>"स्लॉट बुक करें"</span>
            </div>
          </div>
          <div className="lang__globe">
            <Globe2 size={40} />
          </div>
        </div>
        <div className="lang__content">
          <span className="eyebrow">భాషలు · भाषाएँ · Languages</span>
          <h2>Every farmer deserves the mandi in their mother tongue.</h2>
          <p>
            One tap switches the entire platform between English, తెలుగు and हिन्दी —
            built first for the farmers of Andhra Pradesh, with more regional languages
            ready for deployment. Voice-guided flows support low-literacy users.
          </p>
          <ul className="lang__list">
            <li><CheckCircle2 size={18} /> One-tap language switch, remembers your choice</li>
            <li><CheckCircle2 size={18} /> SMS alerts delivered in your language</li>
            <li><CheckCircle2 size={18} /> Icon-first navigation for any literacy level</li>
          </ul>
<div className="lang__chips">
            {["తెలుగు", "English", "हिन्दी", "বাংলা", "मराठी", "ಕನ್ನಡ", "தமிழ்", "ગુજરાતી"].map((l) => (
              <span key={l} className="btn btn-sm btn-outline lang__chip">{l}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function MSPCalculator() {
  const [crop, setCrop] = useState("Paddy");
  const [grade, setGrade] = useState("A");
  const [qty, setQty] = useState(5);
  const base = mspRates[crop as keyof typeof mspRates] ?? 0;
  const multiplier = grade === "A" ? 1 : grade === "B" ? 0.957 : 0.893;
  const total = Math.round(qty * base * multiplier * 10);
  return (
    <section className="section mspcalc">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Fair price calculator</span>
          <h2 className="section-title">Know your estimated payout before you leave home.</h2>
        </div>
        <div className="mspcalc__box card card-static">
          <div className="mspcalc__form">
            <div className="field">
              <label>Crop</label>
              <select className="select" value={crop} onChange={(e) => setCrop(e.target.value)}>
                {Object.keys(mspRates).map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Grade</label>
              <div className="mspcalc__grades">
                {(["A", "B", "C"] as const).map((g) => (
                  <button key={g} className={`mspcalc__grade ${grade === g ? "active" : ""}`} onClick={() => setGrade(g)}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Quantity (quintals)</label>
              <input className="input" type="number" min={1} max={200} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} />
            </div>
          </div>
          <div className="mspcalc__summary">
            <div className="mspcalc__ring" style={{ "--pct": `${Math.min((base / 8000) * 100, 100)}%` } as CSSProperties}>
              <span>₹{base.toLocaleString("en-IN")}</span>
              <small>MSP/qtl</small>
            </div>
            <div className="mspcalc__details">
              <span>{crop} · Grade {grade} × {qty} qtl</span>
              <b className="mspcalc__total">₹{total.toLocaleString("en-IN")}</b>
              <small className="mspcalc__note">Estimated payout · {grade === "A" ? "Full MSP" : grade === "B" ? "Standard deduction" : "Below-grade rate"}</small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Testimonials() {
  const quotes = [
    {
      name: "Venkateswarlu Garu",
      village: "Kaza, Guntur",
      text: "Earlier we used to sleep in tractors outside the yard. Now I book a slot from home and my paddy is graded by lunch.",
      crop: "Paddy",
    },
    {
      name: "Meena Kumari",
      village: "Bapatla, Guntur",
      text: "The SMS said my payment was done before I even reached home. Transparent and fast — this is real change.",
      crop: "Chilli",
    },
    {
      name: "Srinivas Reddy",
      village: "Kurnool",
      text: "First try, my cotton got an A-grade rate. The app showed me exactly which yard to go to and when.",
      crop: "Cotton",
    },
  ];
  return (
    <section className="section quotes">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Voices from the farm</span>
          <h2 className="section-title">Trusted across the fields</h2>
        </div>
        <div className="quotes__grid">
          {quotes.map((q) => (
            <figure className="quote card card-static" key={q.name}>
              <div className="quote__stars">★★★★★</div>
              <blockquote>“{q.text}”</blockquote>
              <figcaption>
                <span className="quote__avatar">{q.name.split(" ").map((w) => w[0]).join("")}</span>
                <div>
                  <b>{q.name}</b>
                  <small>{q.village}</small>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}