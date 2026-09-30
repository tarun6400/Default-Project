import { Link } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { WheatSprig, SunFields } from "./icons";
import { Phone, MessageCircle, HelpCircle, IndianRupee, MapPin } from "lucide-react";
import "./Footer.css";

const socials = [
  { label: "f", name: "Facebook" },
  { label: "𝕏", name: "X / Twitter" },
  { label: "▶", name: "YouTube" },
];

export default function Footer() {
  const { t } = useApp();
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <SunFields className="footer__fields" />
      <div className="container">
        <div className="footer__grid">
          <div className="footer__brand">
            <div className="footer__brand-row">
              <WheatSprig className="footer__logo" />
              <span className="footer__title">Kisan Setu</span>
            </div>
            <p className="footer__sub">{t("ft.sub")}</p>
            <div className="footer__koshish">
              <span className="footer__shloka">🌾 మన రైతే మన గర్వం</span>
            </div>
          </div>

          <div className="footer__col">
            <h4>{t("ft.links")}</h4>
            <Link to="/">{t("nav.home")}</Link>
            <Link to="/login">{t("nav.login")}</Link>
            <Link to="/map">{t("nav.map")}</Link>
            <Link to="/admin">{t("nav.admin")}</Link>
          </div>

          <div className="footer__col">
            <h4>{t("ft.help")}</h4>
            <a href="#"><HelpCircle size={14} /> {t("ft.faq")}</a>
            <a href="#"><IndianRupee size={14} /> {t("ft.msp")}</a>
          </div>

          <div className="footer__col">
            <h4>Contact</h4>
            <a href="tel:1967"><Phone size={14} /> 1967 — {t("ft.helpline")}</a>
            <a href="#"><MessageCircle size={14} /> WhatsApp Kiosk</a>
            <a href="#"><MapPin size={14} /> Krishi Bhawan, New Delhi</a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>© {year} Kisan Setu · {t("ft.rights")}</p>
          <div className="footer__social">
            {socials.map((s) => (
              <a href="#" aria-label={s.name} key={s.name}>{s.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}