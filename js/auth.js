// =============================================
// js/auth.js  —  Shared auth helpers
// =============================================

const AUTH_API    = "http://localhost:5271/api/v1/users";
const GOOGLE_CLIENT_ID = "673667107810-41a2oa9a6gor1nmk1u17q7cdeh3ti8ck.apps.googleusercontent.com";

// ── GOOGLE INIT ──────────────────────────────
function initGoogle() {
  if (typeof google !== "undefined" && google.accounts) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  handleGoogleCredential
    });
    renderGoogleButtons();
  }
}

(function waitForGoogle() {
  if (typeof google !== "undefined" && google.accounts) {
    initGoogle();
  } else {
    setTimeout(waitForGoogle, 200);
  }
})();

window.addEventListener("load", initGoogle);

function renderGoogleButtons() {
  if (typeof google === "undefined" || !google.accounts) return;
  const btnConfigs = [
    { id: "googleBtnLogin",  text: "continue_with" },
    { id: "googleBtnSignup", text: "signup_with"   },
    { id: "googleBtnHLogin", text: "continue_with" },
    { id: "googleBtnHSignup",text: "signup_with"   },
  ];
  btnConfigs.forEach(({ id, text }) => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = "";
      google.accounts.id.renderButton(el, {
        type: "standard", theme: "outline", size: "large",
        text, shape: "rectangular", width: 370
      });
    }
  });
}

// ── GOOGLE CREDENTIAL HANDLER ─────────────────
async function handleGoogleCredential(response) {
  const msgId = _getVisibleMsgId();
  try {
    const base64  = response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
    const payload = JSON.parse(atob(base64));
    const { name, email } = payload;
    setMsg(msgId, "Signing in with Google…", "");

    const username = toUsername(name) + "_g";
    const googlePw = "Goog_" + btoa(email).replace(/[^a-zA-Z0-9]/g,"").slice(0,10) + "!1";

    let userData = null;
    try {
      const r1 = await fetch(`${AUTH_API}/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password: googlePw })
      });
      if (r1.ok || r1.status === 201) {
        userData = await r1.json();
      } else {
        const r2 = await fetch(`${AUTH_API}/signin`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password: googlePw })
        });
        if (r2.ok) userData = await r2.json();
      }
    } catch (_) {}

    const displayName = userData?.username || toUsername(name);
    saveSession(displayName, email, "", userData?.token || "", userData?.role || "User");
    setMsg(msgId, `✓ Welcome, ${displayName}!`, "success");
    updateAllHeaders();
    setTimeout(() => {
      closeAnyModal();
      if (typeof onAuthSuccess === "function") onAuthSuccess();
    }, 800);
  } catch (err) {
    console.error("Google auth:", err);
    setMsg(msgId, "⚠ Google sign-in failed. Try again.", "error");
  }
}

function _getVisibleMsgId() {
  const ids = ["loginMsg","hLoginMsg","signupMsg","hSignupMsg"];
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return id;
  }
  return "loginMsg";
}

// ── SESSION ───────────────────────────────────
function saveSession(name, email, avatar, token, role) {
  localStorage.setItem("qma_loggedIn",  "true");
  localStorage.setItem("qma_userName",  name);
  localStorage.setItem("qma_userEmail", email);
  localStorage.setItem("qma_authToken", token  || "");
  localStorage.setItem("qma_userRole",  role   || "User");
}
function isLoggedIn()   { return localStorage.getItem("qma_loggedIn") === "true"; }
function getUsername()  { return localStorage.getItem("qma_userName") || "User"; }
function getAuthToken() { return localStorage.getItem("qma_authToken") || ""; }

function doLogout() {
  const token = getAuthToken();
  if (token) {
    fetch(`${AUTH_API}/logout`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    }).catch(() => {});
  }
  ["qma_loggedIn","qma_userName","qma_userEmail","qma_authToken","qma_userRole"]
    .forEach(k => localStorage.removeItem(k));
  updateAllHeaders();
  if (typeof onLogout === "function") onLogout();
}

// ── MODAL HELPERS ─────────────────────────────
function openModal(tab) {
  const overlay = document.getElementById("modalOverlay") || document.getElementById("historyModal");
  if (overlay) overlay.classList.add("open");
  switchTab(tab || "login");
  setTimeout(renderGoogleButtons, 80);
}
function closeModal() {
  const overlay = document.getElementById("modalOverlay") || document.getElementById("historyModal");
  if (overlay) overlay.classList.remove("open");
  clearAllMsgs();
}
function closeAnyModal() {
  ["modalOverlay","historyModal","allHistoryModal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  });
  clearAllMsgs();
}
function closeModalOutside(e) {
  ["modalOverlay","historyModal"].forEach(id => {
    if (e.target === document.getElementById(id)) closeModal();
  });
}

function switchTab(tab) {
  const isLogin = tab === "login";
  [["tabLogin","tabSignup"],["hTabLogin","hTabSignup"]].forEach(([l,s]) => {
    const lt = document.getElementById(l), st = document.getElementById(s);
    if (!lt) return;
    lt.classList.toggle("active", isLogin);
    st.classList.toggle("active", !isLogin);
  });
  [["formLogin","formSignup"],["hFormLogin","hFormSignup"]].forEach(([l,s]) => {
    const lf = document.getElementById(l), sf = document.getElementById(s);
    if (!lf) return;
    lf.classList.toggle("active", isLogin);
    sf.classList.toggle("active", !isLogin);
  });
  clearAllMsgs();
  setTimeout(renderGoogleButtons, 80);
}

// ── FORM UTILS ────────────────────────────────
function clearAllMsgs() {
  ["lEmail","lPw","sName","sEmail","sPw",
   "hlEmail","hlPw","hsName","hsEmail","hsPw"].forEach(id => setErr(id, ""));
  ["loginMsg","signupMsg","hLoginMsg","hSignupMsg"].forEach(id => setMsg(id, "", ""));
}
function setErr(id, msg) {
  const el = document.getElementById(id);
  const er = document.getElementById(id + "Err");
  if (!el) return;
  if (msg) { el.classList.add("invalid"); if (er) { er.textContent = msg; er.classList.add("show"); } }
  else     { el.classList.remove("invalid"); if (er) er.classList.remove("show"); }
}
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className   = "m-msg " + type;
}
function togglePw(id, eye) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type === "password" ? "text" : "password";
  eye.style.opacity = inp.type === "text" ? "0.85" : "0.35";
}
function toUsername(name) {
  return (name || "user")
    .toLowerCase().trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20) || "user";
}

// ── EMAIL SIGNUP ───────────────────────────────
async function doSignup() {
  setErr("sName",""); setErr("sEmail",""); setErr("sPw",""); setMsg("signupMsg","","");
  const name  = document.getElementById("sName")?.value.trim()  || "";
  const email = document.getElementById("sEmail")?.value.trim() || "";
  const pass  = document.getElementById("sPw")?.value.trim()    || "";
  let err = false;
  if (!name  || name.length < 3)  { setErr("sName",  name  ? "Min. 3 characters." : "Name required.");     err = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("sEmail", email ? "Invalid email." : "Email required."); err = true; }
  if (!pass  || pass.length < 6)  { setErr("sPw",    pass  ? "Min. 6 characters." : "Password required."); err = true; }
  if (err) return;

  const username = toUsername(name);
  const btn = document.getElementById("signupBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Creating…"; }
  try {
    const res  = await fetch(`${AUTH_API}/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password: pass })
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("signupMsg", "✓ Account created!", "success");
      ["sName","sEmail","sPw"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
      setTimeout(() => {
        saveSession(data.username || username, data.email || email, "", data.token || "", data.role || "User");
        updateAllHeaders();
        closeAnyModal();
        if (typeof onAuthSuccess === "function") onAuthSuccess();
      }, 900);
    } else {
      setMsg("signupMsg", data.message || "Signup failed. Please try again.", "error");
    }
  } catch {
    setMsg("signupMsg", "⚠ Cannot reach server. Make sure the API is running on port 5271.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
  }
}

// ── EMAIL LOGIN ────────────────────────────────
async function doLogin() {
  setErr("lEmail",""); setErr("lPw",""); setMsg("loginMsg","","");
  const emailOrUser = document.getElementById("lEmail")?.value.trim() || "";
  const pass        = document.getElementById("lPw")?.value.trim()    || "";
  let err = false;
  if (!emailOrUser) { setErr("lEmail", "Username / Email is required."); err = true; }
  if (!pass)        { setErr("lPw",    "Password is required.");         err = true; }
  if (err) return;

  const btn = document.getElementById("loginBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }
  try {
    const res  = await fetch(`${AUTH_API}/signin`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: emailOrUser, password: pass })
    });
    const data = await res.json();
    if (res.ok) {
      saveSession(data.username, data.email, "", data.token, data.role);
      setMsg("loginMsg", `✓ Welcome back, ${data.username}!`, "success");
      updateAllHeaders();
      setTimeout(() => { closeAnyModal(); if (typeof onAuthSuccess === "function") onAuthSuccess(); }, 900);
    } else {
      setMsg("loginMsg", data.message || "Incorrect credentials.", "error");
    }
  } catch {
    setMsg("loginMsg", "⚠ Cannot reach server. Make sure the API is running on port 5271.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
  }
}

// ── HOME PAGE SIGNUP ───────────────────────────
async function doHomeSignup() {
  setErr("hsName",""); setErr("hsEmail",""); setErr("hsPw",""); setMsg("hSignupMsg","","");
  const name  = document.getElementById("hsName")?.value.trim()  || "";
  const email = document.getElementById("hsEmail")?.value.trim() || "";
  const pass  = document.getElementById("hsPw")?.value.trim()    || "";
  let err = false;
  if (!name  || name.length < 3)  { setErr("hsName",  name  ? "Min. 3 characters." : "Name required.");     err = true; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("hsEmail", email ? "Invalid email." : "Email required."); err = true; }
  if (!pass  || pass.length < 6)  { setErr("hsPw",    pass  ? "Min. 6 characters." : "Password required."); err = true; }
  if (err) return;

  const username = toUsername(name);
  const btn = document.getElementById("hSignupBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Creating…"; }
  try {
    const res  = await fetch(`${AUTH_API}/signup`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password: pass })
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("hSignupMsg", "✓ Account created!", "success");
      ["hsName","hsEmail","hsPw"].forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
      setTimeout(() => {
        saveSession(data.username || username, data.email || email, "", data.token || "", data.role || "User");
        updateAllHeaders();
        closeAnyModal();
        if (typeof onAuthSuccess === "function") onAuthSuccess();
      }, 900);
    } else {
      setMsg("hSignupMsg", data.message || "Signup failed. Please try again.", "error");
    }
  } catch {
    setMsg("hSignupMsg", "⚠ Cannot reach server. Make sure the API is running on port 5271.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
  }
}

// ── HOME PAGE LOGIN ────────────────────────────
async function doHomeLogin() {
  setErr("hlEmail",""); setErr("hlPw",""); setMsg("hLoginMsg","","");
  const emailOrUser = document.getElementById("hlEmail")?.value.trim() || "";
  const pass        = document.getElementById("hlPw")?.value.trim()    || "";
  let err = false;
  if (!emailOrUser) { setErr("hlEmail", "Username / Email is required."); err = true; }
  if (!pass)        { setErr("hlPw",    "Password is required.");         err = true; }
  if (err) return;

  const btn = document.getElementById("hLoginBtn");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }
  try {
    const res  = await fetch(`${AUTH_API}/signin`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: emailOrUser, password: pass })
    });
    const data = await res.json();
    if (res.ok) {
      saveSession(data.username, data.email, "", data.token, data.role);
      setMsg("hLoginMsg", `✓ Welcome back, ${data.username}!`, "success");
      updateAllHeaders();
      setTimeout(() => { closeAnyModal(); if (typeof onAuthSuccess === "function") onAuthSuccess(); }, 900);
    } else {
      setMsg("hLoginMsg", data.message || "Incorrect credentials.", "error");
    }
  } catch {
    setMsg("hLoginMsg", "⚠ Cannot reach server. Make sure the API is running on port 5271.", "error");
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
  }
}

// ── UPDATE HEADERS (Open App button REMOVED) ──────────────────────────────────────
function updateAllHeaders() {
  const inPages = window.location.pathname.includes("/pages/");
  if (inPages) {
    _renderHeader("navbarRightInner");
  } else {
    _renderHeader("headerRight");
  }
}

function _renderHeader(containerId) {
  const box = document.getElementById(containerId);
  if (!box) return;

  if (isLoggedIn()) {
    const name     = getUsername();
    const initials = name.split(/[_\s]/).map(w => w[0] || "").join("").toUpperCase().slice(0, 2) || "U";
    box.innerHTML = `
      <div class="user-pill-wrap" id="pill_${containerId}">
        <div class="user-pill" onclick="togglePill('pill_${containerId}')">
          <div class="user-avatar">${initials}</div>
          <span class="user-name">${name}</span>
        </div>
        <div class="user-menu">
          <button class="umenu-item danger" onclick="doLogout()">🚪 Sign Out</button>
        </div>
      </div>
    `;
  } else {
    box.innerHTML = `
      <button class="btn-ghost-header" onclick="openModal('login')">Sign In</button>
      <button class="btn-solid-header"  onclick="openModal('signup')">Sign Up</button>
    `;
  }
}

function togglePill(id) {
  const w = document.getElementById(id);
  if (w) w.classList.toggle("open");
}
document.addEventListener("click", e => {
  document.querySelectorAll(".user-pill-wrap.open").forEach(w => {
    if (!w.contains(e.target)) w.classList.remove("open");
  });
});
document.addEventListener("keydown", e => { if (e.key === "Escape") closeAnyModal(); });