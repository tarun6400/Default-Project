import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Globe2, Lock, Phone, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { useApp } from "../context/AppContext";
import { WheatSprig } from "../components/icons";
import "./Auth.css";

export function LoginPage() {
  const { t, login } = useApp();
  const nav = useNavigate();
  const [phone, setPhone] = useState("9845511223");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [roleTab, setRoleTab] = useState<"farmer" | "officer">("farmer");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setBusy(true);
    setTimeout(() => {
      login(roleTab);
      nav(roleTab === "officer" ? "/admin" : "/dashboard");
    }, 900);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-visual">
        <div className="auth-visual__deco">
          <WheatSprig className="auth-visual__wheat" />
          <div className="auth-visual__pill">
            <Smartphone size={18} />
            Telegram-focused demo · OTP via SMS gateway
          </div>
        </div>
        <h2>Skip the queue.<br />Reach the <em className="text-gradient">mandi on time.</em></h2>
        <p>One platform for slot booking, live status and MSP payments under the FCI procurement network.</p>
        <div className="auth-visual__trust">
          <span><ShieldCheck size={15} /> Aadhaar-secured</span>
          <span><Lock size={15} /> Data protected</span>
          <span><Globe2 size={15} /> 8 languages</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-card__head">
          <span className="auth-card__logo">
            <WheatSprig className="auth-card__wheat" />
          </span>
          <h2>{t("auth.login.title")}</h2>
          <p>{t("auth.login.sub")}</p>
        </div>

        <div className="auth-roles">
          <button
            type="button"
            className={`auth-role-btn ${roleTab === "farmer" ? "active" : ""}`}
            onClick={() => setRoleTab("farmer")}
          >
            <span className="auth-role-ico">🌾</span>
            <span>
              <b>Farmer</b>
              <small>Book slots · track payout</small>
            </span>
          </button>
          <button
            type="button"
            className={`auth-role-btn ${roleTab === "officer" ? "active" : ""}`}
            onClick={() => setRoleTab("officer")}
          >
            <span className="auth-role-ico"><ShieldCheck size={18} /></span>
            <span>
              <b>Mandi Officer</b>
              <small>Inspect · grade · pay</small>
            </span>
          </button>
        </div>

        {!sent ? (
          <form onSubmit={handleSend} className="auth-form">
            <div className="field">
              <label htmlFor="phone">{t("auth.phone")} <span className="req">*</span></label>
              <div className="auth-input-group">
                <span className="auth-input-prefix">+91</span>
                <input
                  id="phone"
                  className="input auth-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  placeholder="10-digit mobile"
                  inputMode="numeric"
                />
              </div>
            </div>
            <button className="btn btn-primary btn-lg btn-block" type="submit">
              <Phone size={18} /> {t("auth.sendOtp")}
            </button>
            <p className="auth-hint">{t("auth.otpHint")}</p>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="field">
              <label htmlFor="otp">{t("auth.otp")} <span className="req">*</span></label>
              <div className="auth-otp-box">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className={`auth-otp-dot ${otp.length > i ? "filled" : ""} ${otp.length === i ? "cursor" : ""}`}
                  >
                    {otp[i] ?? ""}
                  </span>
                ))}
              </div>
              <input
                id="otp"
                className="visually-hidden"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoFocus
              />
            </div>
            <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={otp.length < 6}>
              {busy ? (
                <span className="auth-spinner" />
              ) : (
                <>
                  <Sparkles size={18} /> {t("auth.loginBtn")}
                </>
              )}
            </button>
            <button className="auth-back" type="button" onClick={() => setSent(false)}>
              ← Resend OTP / change number
            </button>
          </form>
        )}

        <p className="auth-switch">
          {t("auth.noAcc")}{" "}
          <Link to="/register">{t("auth.registerLink")} →</Link>
        </p>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { t, login } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [crop, setCrop] = useState("Paddy");
  const [land, setLand] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [village, setVillage] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !land) return;
    setBusy(true);
    setTimeout(() => {
      login();
      nav("/dashboard");
    }, 900);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-visual auth-visual--reg">
        <div className="auth-visual__deco">
          <WheatSprig className="auth-visual__wheat" />
        </div>
        <h2>Register once.<br /><em className="text-gradient">Sell every harvest.</em></h2>
        <p>Your kisan profile carries your land, crops and Aadhaar securely — so every mandi knows you instantly.</p>
        <div className="auth-visual__trust">
          <span><ShieldCheck size={15} /> Govt. integrated</span>
          <span><Lock size={15} /> Masked Aadhaar</span>
          <span><Globe2 size={15} /> 8 languages</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-card__head">
          <span className="auth-card__logo">
            <WheatSprig className="auth-card__wheat" />
          </span>
          <h2>{t("reg.title")}</h2>
          <p>{t("reg.sub")}</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="field">
            <label htmlFor="r-name">{t("reg.name")} <span className="req">*</span></label>
            <input id="r-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Venkat Rao" />
          </div>
          <div className="auth-row">
            <div className="field">
              <label htmlFor="r-phone">{t("auth.phone")} <span className="req">*</span></label>
              <input id="r-phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98455 11223" inputMode="numeric" maxLength={10} />
            </div>
            <div className="field">
              <label htmlFor="r-crop">{t("reg.crop")} <span className="req">*</span></label>
              <select id="r-crop" className="select" value={crop} onChange={(e) => setCrop(e.target.value)}>
                <option>Paddy</option>
                <option>Cotton</option>
                <option>Groundnut</option>
                <option>Maize</option>
                <option>Tur</option>
                <option>Bengal Gram</option>
              </select>
            </div>
          </div>
          <div className="auth-row">
            <div className="field">
              <label htmlFor="r-land">{t("reg.land")} <span className="req">*</span></label>
              <input id="r-land" className="input" value={land} onChange={(e) => setLand(e.target.value)} placeholder={t("reg.landPlaceholder")} />
            </div>
            <div className="field">
              <label htmlFor="r-aadhaar">{t("reg.aadhaar")} <span className="req">*</span></label>
              <input id="r-aadhaar" className="input" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} placeholder="XXXX-XXXX-XXXX" inputMode="numeric" maxLength={14} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="r-village">{t("reg.village")}</label>
            <input id="r-village" className="input" value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Kaza, Guntur" />
          </div>
          <p className="auth-hint auth-hint--left">{t("reg.otpHint")}</p>
          <button className="btn btn-gold btn-lg btn-block" type="submit" disabled={busy}>
            {busy ? <span className="auth-spinner" /> : t("reg.submit")}
          </button>
        </form>

        <p className="auth-switch">
          {t("reg.have")}{" "}
          <Link to="/login">{t("reg.loginLink")} →</Link>
        </p>
      </div>
    </div>
  );
}