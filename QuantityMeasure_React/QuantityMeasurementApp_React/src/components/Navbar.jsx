// =============================================
// components/Navbar.jsx — fully responsive
// =============================================
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar({ activeMode, onSwitchMode, onOpenAuth, onOpenHistory, onLogoClick, showAppNav }) {
  const { session, logout } = useAuth();
  const [pillOpen,   setPillOpen]   = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false); // hamburger
  const pillRef = useRef(null);
  const menuRef = useRef(null);

  const initials = session.username
    ? session.username.split(/[_\s]/).map(w => w[0]||"").join("").toUpperCase().slice(0,2) || "U"
    : "U";

  const modes = [
    { key: "converter",  label: "Converter"  },
    { key: "comparison", label: "Comparison" },
    { key: "arithmetic", label: "Arithmetic" },
  ];

  // Close pill / menu on outside click
  useEffect(() => {
    function handler(e) {
      if (pillRef.current && !pillRef.current.contains(e.target)) setPillOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [activeMode, showAppNav]);

  function handleModeClick(key) {
    onSwitchMode(key);
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <div className="site-header-inner">

        {/* Logo */}
        <button className="site-logo" onClick={onLogoClick}>
          <span className="site-logo-icon">📐</span>
          <span className="site-logo-text">Quantity<span>Measure</span></span>
        </button>

        {/* Desktop nav */}
        <nav className="header-nav desktop-nav">
          {showAppNav
            ? modes.map(m => (
                <button key={m.key}
                  className={`header-nav-btn${activeMode===m.key ? " active":""}`}
                  onClick={() => handleModeClick(m.key)}>
                  {m.label}
                </button>
              ))
            : <>
                {modes.map(m => (
                  <button key={m.key} className="header-nav-link-btn" onClick={() => handleModeClick(m.key)}>
                    {m.label}
                  </button>
                ))}
                <a className="header-nav-link-btn" href="#categories">Categories</a>
              </>
          }
        </nav>

        {/* Right side */}
        <div className="header-right">
          {showAppNav && (
            <button className="home-nav-btn" onClick={onOpenHistory}>🗂️ All History</button>
          )}

          {session.loggedIn ? (
            <div ref={pillRef} className={`user-pill-wrap${pillOpen ? " open":""}`}>
              <div className="user-pill" onClick={() => setPillOpen(p=>!p)}>
                <div className="user-avatar">{initials}</div>
                <span className="user-name">{session.username}</span>
              </div>
              <div className="user-menu">
                <button className="umenu-item danger" onClick={() => { logout(); setPillOpen(false); }}>
                  🚪 Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-btns-desktop">
              <button className="btn-ghost-header" onClick={() => onOpenAuth("login")}>Sign In</button>
              <button className="btn-solid-header"  onClick={() => onOpenAuth("signup")}>Sign Up</button>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <div ref={menuRef} className="hamburger-wrap">
            <button
              className={`hamburger-btn${menuOpen ? " open":""}`}
              onClick={() => setMenuOpen(p=>!p)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>

            {/* Mobile dropdown menu */}
            {menuOpen && (
              <div className="mobile-menu">
                <div className="mobile-menu-section">
                  {modes.map(m => (
                    <button key={m.key}
                      className={`mobile-menu-item${showAppNav && activeMode===m.key ? " active":""}`}
                      onClick={() => handleModeClick(m.key)}>
                      {m.key === "converter"  && "🔢 "}
                      {m.key === "comparison" && "📊 "}
                      {m.key === "arithmetic" && "➗ "}
                      {m.label}
                    </button>
                  ))}
                  {!showAppNav && (
                    <a className="mobile-menu-item" href="#categories" onClick={() => setMenuOpen(false)}>
                      📐 Categories
                    </a>
                  )}
                  {showAppNav && (
                    <button className="mobile-menu-item" onClick={() => { onOpenHistory(); setMenuOpen(false); }}>
                      🗂️ All History
                    </button>
                  )}
                </div>
                <div className="mobile-menu-divider" />
                <div className="mobile-menu-section">
                  {session.loggedIn ? (
                    <button className="mobile-menu-item danger" onClick={() => { logout(); setMenuOpen(false); }}>
                      🚪 Sign Out ({session.username})
                    </button>
                  ) : (
                    <>
                      <button className="mobile-menu-item" onClick={() => { onOpenAuth("login"); setMenuOpen(false); }}>
                        Sign In
                      </button>
                      <button className="mobile-menu-item primary" onClick={() => { onOpenAuth("signup"); setMenuOpen(false); }}>
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}