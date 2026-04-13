// =============================================
// App.jsx — Root with landing page + app shell
// =============================================
import { useState, useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import Navbar          from "./components/Navbar";
import LandingPage     from "./components/LandingPage";
import AuthModal       from "./components/AuthModal";
import HistoryModal    from "./components/HistoryModal";
import ConverterPanel  from "./components/ConverterPanel";
import ComparisonPanel from "./components/ComparisonPanel";
import ArithmeticPanel from "./components/ArithmeticPanel";

// "page" = "landing" | "app"
function AppInner() {
  const [page,        setPage]        = useState("landing");
  const [mode,        setMode]        = useState("converter");
  const [authOpen,    setAuthOpen]    = useState(false);
  const [authTab,     setAuthTab]     = useState("login");
  const [historyOpen, setHistoryOpen] = useState(false);

  // Close pill dropdown on outside click
  useEffect(() => {
    function handler(e) {
      const pill = document.getElementById("navPill");
      if (pill && !pill.contains(e.target)) {
        pill.classList.remove("open");
      }
    }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  function openAuth(tab = "login") { setAuthTab(tab); setAuthOpen(true); }

  // Toggle body overflow so landing page scrolls, app page doesn't
  useEffect(() => {
    const root = document.getElementById("root");
    const html = document.documentElement;
    if (page === "app") {
      html.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      if (root) root.style.overflow = "hidden";
    } else {
      html.style.overflow = "";
      document.body.style.overflow = "";
      if (root) root.style.overflow = "";
    }
  }, [page]);
  function goHome()  { setPage("landing"); }
  function openApp() { setPage("app"); }

  const isLanding = page === "landing";

  return (
    <>
      {/* Shared Navbar — logo click always goes home */}
      <Navbar
        activeMode={mode}
        onSwitchMode={(m) => { setMode(m); setPage("app"); }}
        onOpenAuth={openAuth}
        onOpenHistory={() => setHistoryOpen(true)}
        onLogoClick={goHome}
        showAppNav={!isLanding}
      />

      {/* Landing page */}
      {isLanding && (
        <LandingPage
          onOpenApp={openApp}
          onOpenAuth={openAuth}
        />
      )}

      {/* App shell */}
      {!isLanding && (
        <div className="app-shell">
          <div className="mode-bar">
            {[
              { key: "converter",  icon: "🔢", label: "Converter"  },
              { key: "comparison", icon: "📊", label: "Comparison" },
              { key: "arithmetic", icon: "➗", label: "Arithmetic" },
            ].map(m => (
              <button
                key={m.key}
                className={`mode-btn${mode === m.key ? " active" : ""}`}
                onClick={() => setMode(m.key)}
              >
                <span className="mode-icon">{m.icon}</span>
                <span>{m.label}</span>
              </button>
            ))}
          </div>
          <div className="content-area">
            {mode === "converter"  && <ConverterPanel />}
            {mode === "comparison" && <ComparisonPanel />}
            {mode === "arithmetic" && <ArithmeticPanel />}
          </div>
        </div>
      )}

      {/* Modals */}
      <AuthModal
        isOpen={authOpen}
        defaultTab={authTab}
        onClose={() => setAuthOpen(false)}
      />
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}