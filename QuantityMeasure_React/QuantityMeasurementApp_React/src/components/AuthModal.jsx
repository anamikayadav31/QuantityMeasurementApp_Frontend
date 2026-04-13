// =============================================
// components/AuthModal.jsx
// =============================================
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { apiSignin, apiSignup } from "../utils/api";

function toUsername(name) {
  return (name || "user")
    .toLowerCase().trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";
}

export default function AuthModal({ isOpen, defaultTab, onClose }) {
  const { saveSession, renderGoogleButton, googleReady, registerGoogleSuccessHandler } = useAuth();
  const [tab, setTab] = useState(defaultTab || "login");
  const closeTimerRef = useRef(null);
  const isMountedRef  = useRef(true);

  // ── Login state ──────────────────────────
  const [lUser,    setLUser]    = useState("");
  const [lPw,      setLPw]      = useState("");
  const [lErr,     setLErr]     = useState({});
  const [lMsg,     setLMsg]     = useState({ text: "", type: "" });
  const [lLoading, setLLoading] = useState(false);
  const [lShowPw,  setLShowPw]  = useState(false);

  // ── Signup state ─────────────────────────
  const [sDuplicate, setSDuplicate] = useState(false); // true when account already exists
  const [sName,    setSName]    = useState("");
  const [sEmail,   setSEmail]   = useState("");
  const [sPw,      setSPw]      = useState("");
  const [sErr,     setSErr]     = useState({});
  const [sMsg,     setSMsg]     = useState({ text: "", type: "" });
  const [sLoading, setSLoading] = useState(false);
  const [sShowPw,  setSShowPw]  = useState(false);

  // Track mount status to avoid setState after unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(closeTimerRef.current);
    };
  }, []);

  // When modal opens: sync tab, clear fields, register Google close handler.
  // When modal closes: cancel timer, unregister Google handler.
  useEffect(() => {
    if (isOpen) {
      setTab(defaultTab || "login");
      clearFields();
      // Tell AuthContext: when Google auth succeeds, close this modal
      registerGoogleSuccessHandler(() => {
        clearTimeout(closeTimerRef.current);
        onClose();
      });
    } else {
      clearTimeout(closeTimerRef.current);
      // Unregister on close
      registerGoogleSuccessHandler(null);
    }
  }, [isOpen, defaultTab]); // eslint-disable-line

  // Render Google buttons on open / tab change
  useEffect(() => {
    if (!isOpen || !googleReady) return;
    const t = setTimeout(() => {
      renderGoogleButton("gBtnLogin",  "continue_with");
      renderGoogleButton("gBtnSignup", "signup_with");
    }, 80);
    return () => clearTimeout(t);
  }, [isOpen, tab, googleReady, renderGoogleButton]);

  function clearFields() {
    setLUser(""); setLPw(""); setLErr({}); setLMsg({ text:"", type:"" }); setLShowPw(false);
    setSName(""); setSEmail(""); setSPw(""); setSErr({}); setSMsg({ text:"", type:"" }); setSShowPw(false); setSDuplicate(false);
  }

  function switchTab(t) {
    clearTimeout(closeTimerRef.current);
    setTab(t);
    clearFields();
  }

  // Show success message, then close after delay
  function autoClose(ms = 1500) {
    clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        onClose();          // close modal (sets authOpen=false in parent)
        clearFields();      // reset fields after close
      }
    }, ms);
  }

  // ── Login ────────────────────────────────
  async function handleLogin(e) {
    e?.preventDefault();
    const errs = {};
    if (!lUser.trim()) errs.user = "Username / Email is required.";
    if (!lPw.trim())   errs.pw   = "Password is required.";
    if (Object.keys(errs).length) { setLErr(errs); return; }
    setLErr({}); setLLoading(true);
    try {
      const data = await apiSignin(lUser.trim(), lPw.trim());
      if (!isMountedRef.current) return;
      saveSession(data.username, data.email, data.token, data.role);
      setLMsg({ text: `✓ Welcome back, ${data.username}!`, type: "success" });
      autoClose(1500);   // ← auto-close after 1.5 s
    } catch (err) {
      if (!isMountedRef.current) return;
      setLMsg({ text: err.message, type: "error" });
    } finally {
      if (isMountedRef.current) setLLoading(false);
    }
  }

  // ── Signup ───────────────────────────────
  async function handleSignup(e) {
    e?.preventDefault();
    const errs = {};
    if (!sName.trim()  || sName.trim().length  < 3) errs.name  = sName.trim()  ? "Min. 3 chars." : "Name required.";
    if (!sEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sEmail.trim())) errs.email = sEmail.trim() ? "Invalid email." : "Email required.";
    if (!sPw.trim()    || sPw.trim().length    < 6) errs.pw    = sPw.trim()    ? "Min. 6 chars." : "Password required.";
    if (Object.keys(errs).length) { setSErr(errs); return; }
    setSErr({}); setSLoading(true);
    try {
      const username = toUsername(sName.trim());
      const data     = await apiSignup(username, sEmail.trim(), sPw.trim());
      if (!isMountedRef.current) return;
      saveSession(data.username || username, data.email || sEmail.trim(), data.token, data.role);
      setSMsg({ text: `✓ Account created! Welcome, ${data.username || username}!`, type: "success" });
      autoClose(1500);   // ← auto-close after 1.5 s
    } catch (err) {
      if (!isMountedRef.current) return;
      const isDup = err.message.toLowerCase().includes("already have an account");
      setSDuplicate(isDup);
      setSMsg({ text: err.message, type: "error" });
    } finally {
      if (isMountedRef.current) setSLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal auth-modal">

        {/* Header */}
        <div className="modal-hd">
          <span className="modal-hd-title">Quantity<span>Measure</span></span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button className={`m-tab${tab==="login"  ? " active":""}`} onClick={() => switchTab("login")}>Sign In</button>
          <button className={`m-tab${tab==="signup" ? " active":""}`} onClick={() => switchTab("signup")}>Create Account</button>
        </div>

        <div className="auth-modal-bd">

          {/* ══ SIGN IN ══ */}
          {tab === "login" && (
            <div className="m-form active">
              {/* Spacer pushes content to vertical center within fixed modal height */}
              <div style={{ flex: 1 }} />
              <div className="google-btn-wrap" id="gBtnLogin"></div>
              <div className="or-divider">or</div>

              <div className="m-group">
                <label>Username / Email</label>
                <input type="text" placeholder="your username or email"
                  value={lUser} onChange={e => setLUser(e.target.value)}
                  className={lErr.user ? "invalid" : ""}
                  autoComplete="username"
                  onKeyDown={e => e.key === "Enter" && handleLogin(e)} />
                {lErr.user && <div className="m-err show">{lErr.user}</div>}
              </div>

              <div className="m-group">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={lShowPw ? "text" : "password"} placeholder="Your password"
                    value={lPw} onChange={e => setLPw(e.target.value)}
                    className={lErr.pw ? "invalid" : ""}
                    autoComplete="current-password"
                    onKeyDown={e => e.key === "Enter" && handleLogin(e)} />
                  <span className="pw-eye" onClick={() => setLShowPw(p=>!p)}
                    style={{ opacity: lShowPw ? 0.85 : 0.35 }}>👁</span>
                </div>
                {lErr.pw && <div className="m-err show">{lErr.pw}</div>}
              </div>

              <button className="m-submit" onClick={handleLogin} disabled={lLoading}>
                {lLoading ? "Signing in…" : "Sign In"}
              </button>

              <div className={`auth-msg${lMsg.text ? ` ${lMsg.type}` : ""}`}>{lMsg.text || " "}</div>

              <div className="m-switch">No account? <a onClick={() => switchTab("signup")}>Create one free</a></div>
              <div style={{ flex: 1 }} />
            </div>
          )}

          {/* ══ CREATE ACCOUNT ══ */}
          {tab === "signup" && (
            <div className="m-form active">
              <div className="google-btn-wrap" id="gBtnSignup"></div>
              <div className="or-divider">or</div>

              <div className="m-group">
                <label>Full Name</label>
                <input type="text" placeholder="Your name"
                  value={sName} onChange={e => setSName(e.target.value)}
                  className={sErr.name ? "invalid" : ""}
                  onKeyDown={e => e.key === "Enter" && handleSignup(e)} />
                {sErr.name && <div className="m-err show">{sErr.name}</div>}
              </div>

              <div className="m-group">
                <label>Email</label>
                <input type="email" placeholder="you@example.com"
                  value={sEmail} onChange={e => setSEmail(e.target.value)}
                  className={sErr.email ? "invalid" : ""}
                  onKeyDown={e => e.key === "Enter" && handleSignup(e)} />
                {sErr.email && <div className="m-err show">{sErr.email}</div>}
              </div>

              <div className="m-group">
                <label>Password</label>
                <div className="pw-wrap">
                  <input type={sShowPw ? "text" : "password"} placeholder="Min. 6 characters"
                    value={sPw} onChange={e => setSPw(e.target.value)}
                    className={sErr.pw ? "invalid" : ""}
                    autoComplete="new-password"
                    onKeyDown={e => e.key === "Enter" && handleSignup(e)} />
                  <span className="pw-eye" onClick={() => setSShowPw(p=>!p)}
                    style={{ opacity: sShowPw ? 0.85 : 0.35 }}>👁</span>
                </div>
                {sErr.pw && <div className="m-err show">{sErr.pw}</div>}
              </div>

              <button className="m-submit" onClick={handleSignup} disabled={sLoading}>
                {sLoading ? "Creating…" : "Create Account"}
              </button>

              {/* Error message — if duplicate, show inline sign-in prompt */}
              {sDuplicate ? (
                <div className="auth-duplicate-msg">
                  <span className="auth-duplicate-icon">ℹ️</span>
                  <div>
                    <div className="auth-duplicate-title">You already have an account!</div>
                    <div className="auth-duplicate-sub">
                      <a onClick={() => switchTab("login")}>Click here to Sign In →</a>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`auth-msg${sMsg.text ? ` ${sMsg.type}` : ""}`}>{sMsg.text || " "}</div>
              )}

              <div className="m-switch">Have an account? <a onClick={() => switchTab("login")}>Sign in</a></div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}