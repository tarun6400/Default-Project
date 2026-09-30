import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { WheatSprig } from "./icons";
import {
  Home,
  LayoutDashboard,
  MapPin,
  LogIn,
  LogOut,
  Shield,
  Bell,
  ChevronDown,
  Menu,
  X,
  Package,
} from "lucide-react";
import "./Navbar.css";

export default function Navbar() {
  const { lang, setLang, t, isLoggedIn, role, logout, notifications } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const langRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node))
        setLangOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const navItems = [
    { to: "/", label: t("nav.home"), icon: Home },
    ...(isLoggedIn && role === "officer"
      ? [{ to: "/admin", label: "🏢 " + t("nav.admin"), icon: Shield }]
      : isLoggedIn
        ? [
            { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
            { to: "/map", label: t("nav.map"), icon: MapPin },
            { to: "/tracker", label: t("nav.track"), icon: Package },
            { to: "/admin", label: t("nav.admin"), icon: Shield },
          ]
        : []),
  ];

  const langOptions: { code: "en" | "hi" | "te"; label: string }[] = [
    { code: "en", label: "English" },
    { code: "te", label: "తెలుగు" },
    { code: "hi", label: "हिन्दी" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar__inner container">
        <Link to="/" className="navbar__brand">
          <WheatSprig className="navbar__logo" />
          <span className="navbar__name">Kisan Setu</span>
        </Link>

        {/* Desktop */}
        <div className="navbar__links">
          {navItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`navbar__link ${location.pathname === to ? "active" : ""}`}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar__right">
          {isLoggedIn && (
            <Link to="/notifications" className="navbar__bell">
              <Bell size={20} />
              {unread > 0 && <span className="navbar__bell-badge">{unread}</span>}
            </Link>
          )}

          <div className="navbar__lang" ref={langRef}>
            <button
              className="navbar__lang-btn"
              onClick={() => setLangOpen(!langOpen)}
            >
              {langOptions.find((l) => l.code === lang)?.label}
              <ChevronDown size={14} />
            </button>
            {langOpen && (
              <div className="navbar__lang-menu">
                {langOptions.map((l) => (
                  <button
                    key={l.code}
                    className={`navbar__lang-item ${lang === l.code ? "active" : ""}`}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {isLoggedIn ? (
            <button className="navbar__auth btn btn-sm btn-outline" onClick={logout}>
              <LogOut size={16} />
              <span>{t("nav.logout")}</span>
            </button>
          ) : (
            <Link to="/login" className="navbar__auth btn btn-sm btn-primary">
              <LogIn size={16} />
              <span>{t("nav.login")}</span>
            </Link>
          )}

          <button
            className="navbar__hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={`navbar__mobile ${mobileOpen ? "open" : ""}`}>
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`navbar__mobile-link ${location.pathname === to ? "active" : ""}`}
          >
            <Icon size={20} />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}