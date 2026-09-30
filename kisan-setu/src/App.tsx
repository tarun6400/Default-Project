import { lazy, Suspense, useEffect } from "react";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AiChat from "./components/AiChat";
import Home from "./pages/Home";
import { LoginPage, RegisterPage } from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import Notifications from "./pages/Notifications";
import Admin from "./pages/Admin";
import { FlaskConical, Loader2 } from "lucide-react";

const MapPage = lazy(() => import("./pages/Map"));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);
  return null;
}

function DemoBanner() {
  const { isLoggedIn, t } = useApp();
  if (isLoggedIn) return null;
  return (
    <div className="demo-banner">
      <FlaskConical size={16} />
      <span>{t("gen.demoNote")} — you can explore every screen freely.</span>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="page-loader">
      <Loader2 className="spin" size={26} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <div className="app grain">
          <Navbar />
          <DemoBanner />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tracker" element={<Tracker />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/admin" element={<Admin />} />
              <Route
                path="/map"
                element={
                  <Suspense fallback={<PageLoader />}>
                    <MapPage />
                  </Suspense>
                }
              />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
          <AiChat />
        </div>
      </HashRouter>
    </AppProvider>
  );
}