// =============================================
// context/AuthContext.jsx  — with Google OAuth
// =============================================
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { apiLogout, apiSignup, apiSignin } from "../utils/api";

const AuthContext = createContext(null);

const SESSION_KEYS = [
  "qma_loggedIn","qma_userName","qma_userEmail","qma_authToken","qma_userRole"
];

export const GOOGLE_CLIENT_ID = "673667107810-41a2oa9a6gor1nmk1u17q7cdeh3ti8ck.apps.googleusercontent.com";

function loadSession() {
  return {
    loggedIn: localStorage.getItem("qma_loggedIn") === "true",
    username: localStorage.getItem("qma_userName")  || "",
    email:    localStorage.getItem("qma_userEmail") || "",
    token:    localStorage.getItem("qma_authToken") || "",
    role:     localStorage.getItem("qma_userRole")  || "User",
  };
}

function toUsername(name) {
  return (name || "user")
    .toLowerCase().trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";
}

// ── Toast helper (standalone, no React state) ──
function showToast(message, type = "success") {
  const existing = document.getElementById("qma-toast");
  if (existing) existing.remove();

  if (!document.getElementById("qma-toast-style")) {
    const style = document.createElement("style");
    style.id = "qma-toast-style";
    style.textContent = `
      @keyframes toastIn {
        from { opacity:0; transform:translateX(-50%) translateY(-12px); }
        to   { opacity:1; transform:translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const toast = document.createElement("div");
  toast.id = "qma-toast";
  Object.assign(toast.style, {
    position:   "fixed",
    top:        "72px",
    left:       "50%",
    transform:  "translateX(-50%)",
    zIndex:     "9999",
    padding:    "12px 28px",
    borderRadius: "10px",
    fontFamily: "'Outfit', sans-serif",
    fontSize:   "14px",
    fontWeight: "700",
    boxShadow:  "0 8px 24px rgba(0,0,0,0.18)",
    animation:  "toastIn 0.3s ease",
    background: type === "success" ? "#16a34a" : "#e74c3c",
    color:      "#fff",
    transition: "opacity 0.4s",
    whiteSpace: "nowrap",
  });
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; }, 2200);
  setTimeout(() => toast.remove(), 2700);
}

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(loadSession);
  const [googleReady, setGoogleReady] = useState(false);

  // Ref to store a close-modal callback registered by AuthModal
  const onGoogleSuccessRef = useRef(null);

  // AuthModal calls this to register its close handler
  const registerGoogleSuccessHandler = useCallback((fn) => {
    onGoogleSuccessRef.current = fn;
  }, []);

  const saveSession = useCallback((username, email, token, role) => {
    localStorage.setItem("qma_loggedIn",  "true");
    localStorage.setItem("qma_userName",  username);
    localStorage.setItem("qma_userEmail", email);
    localStorage.setItem("qma_authToken", token  || "");
    localStorage.setItem("qma_userRole",  role   || "User");
    setSession({ loggedIn: true, username, email, token: token||"", role: role||"User" });
  }, []);

  const logout = useCallback(() => {
    if (session.token) apiLogout(session.token);
    SESSION_KEYS.forEach(k => localStorage.removeItem(k));
    setSession({ loggedIn: false, username: "", email: "", token: "", role: "User" });
  }, [session.token]);

  // ── Google credential handler ───────────────
  const handleGoogleCredential = useCallback(async (response) => {
    try {
      const base64  = response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
      const payload = JSON.parse(atob(base64));
      const { name, email } = payload;
      const username = toUsername(name) + "_g";
      const googlePw = "Goog_" + btoa(email).replace(/[^a-zA-Z0-9]/g,"").slice(0,10) + "!1";

      let userData = null;
      try {
        userData = await apiSignup(username, email, googlePw);
      } catch (_) {
        try { userData = await apiSignin(username, googlePw); } catch (__) {}
      }

      const displayName = userData?.username || username;
      saveSession(
        displayName,
        userData?.email || email,
        userData?.token || "",
        userData?.role  || "User"
      );

      // Close modal if registered handler exists
      if (onGoogleSuccessRef.current) {
        onGoogleSuccessRef.current();
        onGoogleSuccessRef.current = null;
      }

      showToast(`✓ Welcome, ${displayName}!`, "success");
    } catch (err) {
      console.error("Google auth:", err);
      showToast("⚠ Google sign-in failed. Try again.", "error");
    }
  }, [saveSession]);

  // ── Load GSI script once on mount ──────────
  useEffect(() => {
    function initGSI() {
      if (!window.google?.accounts) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback:  handleGoogleCredential,
      });
      setGoogleReady(true);
    }

    if (window.google?.accounts) { initGSI(); return; }

    if (!document.getElementById("google-gsi-script")) {
      const s = document.createElement("script");
      s.id    = "google-gsi-script";
      s.src   = "https://accounts.google.com/gsi/client";
      s.async = true; s.defer = true;
      s.onload = initGSI;
      document.head.appendChild(s);
    } else {
      const timer = setInterval(() => {
        if (window.google?.accounts) { clearInterval(timer); initGSI(); }
      }, 200);
    }
  }, [handleGoogleCredential]);

  // ── Render a Google button into a DOM element ─
  const renderGoogleButton = useCallback((elementId, text = "continue_with") => {
    if (!googleReady || !window.google?.accounts) return;
    const el = document.getElementById(elementId);
    if (!el) return;
    el.innerHTML = "";
    window.google.accounts.id.renderButton(el, {
      type: "standard", theme: "outline", size: "large",
      text, shape: "rectangular", width: 370,
    });
  }, [googleReady]);

  return (
    <AuthContext.Provider value={{
      session,
      saveSession,
      logout,
      googleReady,
      renderGoogleButton,
      registerGoogleSuccessHandler,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}