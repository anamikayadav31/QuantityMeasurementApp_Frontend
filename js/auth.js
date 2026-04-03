// =============================================
// js/auth.js  —  Shared auth helpers
// Used by both index.html and pages/home.html
// Handles: Google GSI, email login/signup, session
// =============================================

const AUTH_API    = "http://localhost:3000/users";
const AUTH_GOOGLE = "673667107810-41a2oa9a6gor1nmk1u17q7cdeh3ti8ck.apps.googleusercontent.com";

// ── GOOGLE INIT ───────────────────────────────
window.addEventListener("load", () => {
  if (typeof google === "undefined" || !google.accounts) return;
  google.accounts.id.initialize({ client_id: AUTH_GOOGLE, callback: handleGoogleCredential });
  renderGoogleButtons();
});

function renderGoogleButtons() {
  if (typeof google === "undefined" || !google.accounts) return;
  const btns = ["googleBtnLogin","googleBtnSignup","googleBtnHome","googleBtnHome2"];
  btns.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.innerHTML = "";
      google.accounts.id.renderButton(el, {
        type:"standard", theme:"outline", size:"large",
        text: id.includes("Signup") || id.includes("Home2") ? "signup_with" : "continue_with",
        shape:"rectangular", width: 370
      });
    }
  });
}

// ── GOOGLE CREDENTIAL HANDLER ─────────────────
async function handleGoogleCredential(response) {
  // Find which message div is visible
  const signupForms = ["formSignup","hFormSignup"];
  const activeSignup = signupForms.some(id => {
    const el = document.getElementById(id);
    return el && el.classList.contains("active");
  });
  const msgId = activeSignup
    ? (document.getElementById("signupMsg") ? "signupMsg" : "hSignupMsg")
    : (document.getElementById("loginMsg") ? "loginMsg" : "hLoginMsg");

  try {
    const base64  = response.credential.split(".")[1].replace(/-/g,"+").replace(/_/g,"/");
    const payload = JSON.parse(atob(base64));
    const { name, email, picture } = payload;

    setMsg(msgId, "Signing in with Google…", "");

    let user;
    try {
      const chk = await fetch(`${AUTH_API}?email=${encodeURIComponent(email)}`);
      const ex  = await chk.json();
      if (ex.length > 0) {
        user = ex[0];
      } else {
        const cr = await fetch(AUTH_API, {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ name, email, password:"", avatar:picture, provider:"google" })
        });
        user = await cr.json();
      }
    } catch (_) {
      user = { name, email, avatar: picture };
    }

    saveSession(user.name||name, user.email||email, user.avatar||picture||"");
    setMsg(msgId, `✓ Welcome, ${user.name||name}!`, "success");
    updateAllHeaders();
    setTimeout(() => {
      closeAnyModal();
      if (typeof onAuthSuccess === "function") onAuthSuccess();
    }, 800);

  } catch(err) {
    console.error("Google auth:", err);
    setMsg(msgId, "⚠ Google sign-in failed. Try again.", "error");
  }
}

// ── SESSION ───────────────────────────────────
function saveSession(name, email, avatar) {
  sessionStorage.setItem("loggedIn", "true");
  sessionStorage.setItem("userName", name);
  sessionStorage.setItem("userEmail", email);
  sessionStorage.setItem("userAvatar", avatar);
}
function isLoggedIn() { return !!sessionStorage.getItem("loggedIn"); }
function getUsername() { return sessionStorage.getItem("userName") || "User"; }

function doLogout() {
  sessionStorage.clear();
  updateAllHeaders();
  if (typeof onLogout === "function") onLogout();
}

// ── MODAL HELPERS ─────────────────────────────
function openModal(tab) {
  const overlay = document.getElementById("modalOverlay") || document.getElementById("historyModal");
  if (overlay) overlay.classList.add("open");
  switchTab(tab || "login");
}
function closeModal() {
  const overlay = document.getElementById("modalOverlay") || document.getElementById("historyModal");
  if (overlay) overlay.classList.remove("open");
  clearAllMsgs();
}
function closeAnyModal() {
  ["modalOverlay","historyModal"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("open");
  });
  clearAllMsgs();
}
function closeModalOutside(e) {
  const ids = ["modalOverlay","historyModal"];
  ids.forEach(id => { if (e.target === document.getElementById(id)) closeModal(); });
}

function switchTab(tab) {
  // Works for both landing modal (tabLogin/tabSignup) and home modal (hTabLogin/hTabSignup)
  [["tabLogin","tabSignup"],["hTabLogin","hTabSignup"]].forEach(([l,s]) => {
    const lt = document.getElementById(l), st = document.getElementById(s);
    if (!lt) return;
    lt.classList.toggle("active", tab==="login");
    st.classList.toggle("active", tab==="signup");
  });
  [["formLogin","formSignup"],["hFormLogin","hFormSignup"]].forEach(([l,s]) => {
    const lf = document.getElementById(l), sf = document.getElementById(s);
    if (!lf) return;
    lf.classList.toggle("active", tab==="login");
    sf.classList.toggle("active", tab==="signup");
  });
  clearAllMsgs();
  setTimeout(renderGoogleButtons, 60);
}

// ── FORM UTILS ────────────────────────────────
function clearAllMsgs() {
  ["lEmail","lPw","sName","sEmail","sPw",
   "hlEmail","hlPw","hsName","hsEmail","hsPw"].forEach(id => setErr(id,""));
  ["loginMsg","signupMsg","hLoginMsg","hSignupMsg"].forEach(id => setMsg(id,"",""));
}

function setErr(id, msg) {
  const el = document.getElementById(id);
  const er = document.getElementById(id+"Err");
  if (!el) return;
  if (msg) { el.classList.add("invalid"); if(er){er.textContent=msg;er.classList.add("show");} }
  else     { el.classList.remove("invalid"); if(er) er.classList.remove("show"); }
}
function setMsg(id, text, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = "m-msg " + type;
}
function togglePw(id, eye) {
  const inp = document.getElementById(id);
  if (!inp) return;
  inp.type = inp.type==="password" ? "text" : "password";
  eye.style.opacity = inp.type==="text" ? "0.85" : "0.35";
}

// ── EMAIL LOGIN ───────────────────────────────
async function doLogin() {
  setErr("lEmail",""); setErr("lPw",""); setMsg("loginMsg","","");
  const email = document.getElementById("lEmail").value.trim();
  const pass  = document.getElementById("lPw").value.trim();
  let err=false;
  if(!email){setErr("lEmail","Email is required.");err=true;}
  if(!pass) {setErr("lPw","Password is required.");err=true;}
  if(err) return;

  const btn=document.getElementById("loginBtn");
  btn.disabled=true; btn.textContent="Signing in…";
  try {
    const res   = await fetch(`${AUTH_API}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`);
    const users = await res.json();
    if(users.length>0) {
      const u=users[0];
      if(u.provider==="google"){setMsg("loginMsg","This account uses Google Sign-In — use the Google button.","error");return;}
      saveSession(u.name,u.email,u.avatar||"");
      setMsg("loginMsg",`✓ Welcome back, ${u.name}!`,"success");
      updateAllHeaders();
      setTimeout(()=>{closeAnyModal();if(typeof onAuthSuccess==="function")onAuthSuccess();},900);
    } else {
      setMsg("loginMsg","Incorrect email or password.","error");
    }
  } catch { setMsg("loginMsg","⚠ Server not reachable. Is json-server running?","error"); }
  finally { btn.disabled=false; btn.textContent="Sign In"; }
}

// ── EMAIL SIGNUP ──────────────────────────────
async function doSignup() {
  setErr("sName",""); setErr("sEmail",""); setErr("sPw",""); setMsg("signupMsg","","");
  const name  = document.getElementById("sName").value.trim();
  const email = document.getElementById("sEmail").value.trim();
  const pass  = document.getElementById("sPw").value.trim();
  let err=false;
  if(!name||name.length<3){setErr("sName",name?"Min. 3 characters.":"Name required.");err=true;}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setErr("sEmail",email?"Invalid email.":"Email required.");err=true;}
  if(!pass||pass.length<6){setErr("sPw",pass?"Min. 6 characters.":"Password required.");err=true;}
  if(err) return;

  const btn=document.getElementById("signupBtn");
  btn.disabled=true; btn.textContent="Creating…";
  try {
    const chk=await fetch(`${AUTH_API}?email=${encodeURIComponent(email)}`);
    const ex=await chk.json();
    if(ex.length>0){setErr("sEmail","Email already registered. Sign in instead.");return;}
    const res=await fetch(AUTH_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password:pass,provider:"email"})});
    if(res.ok) {
      setMsg("signupMsg","✓ Account created!","success");
      ["sName","sEmail","sPw"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
      setTimeout(()=>{
        saveSession(name,email,"");
        updateAllHeaders();
        closeAnyModal();
        if(typeof onAuthSuccess==="function") onAuthSuccess();
      },900);
    } else { setMsg("signupMsg","Signup failed. Try again.","error"); }
  } catch { setMsg("signupMsg","⚠ Server not reachable. Is json-server running?","error"); }
  finally { btn.disabled=false; btn.textContent="Create Account"; }
}

// ── HOME PAGE EMAIL LOGIN ─────────────────────
async function doHomeLogin() {
  setErr("hlEmail",""); setErr("hlPw",""); setMsg("hLoginMsg","","");
  const email=document.getElementById("hlEmail").value.trim();
  const pass =document.getElementById("hlPw").value.trim();
  let err=false;
  if(!email){setErr("hlEmail","Email is required.");err=true;}
  if(!pass) {setErr("hlPw","Password is required.");err=true;}
  if(err) return;

  const btn=document.getElementById("hLoginBtn");
  btn.disabled=true; btn.textContent="Signing in…";
  try {
    const res=await fetch(`${AUTH_API}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(pass)}`);
    const users=await res.json();
    if(users.length>0){
      const u=users[0];
      if(u.provider==="google"){setMsg("hLoginMsg","Use the Google button below.","error");return;}
      saveSession(u.name,u.email,u.avatar||"");
      setMsg("hLoginMsg",`✓ Welcome back, ${u.name}!`,"success");
      updateAllHeaders();
      setTimeout(closeAnyModal,800);
    } else { setMsg("hLoginMsg","Incorrect email or password.","error"); }
  } catch { setMsg("hLoginMsg","⚠ Server not reachable.","error"); }
  finally { btn.disabled=false; btn.textContent="Sign In"; }
}

// ── HOME PAGE EMAIL SIGNUP ────────────────────
async function doHomeSignup() {
  setErr("hsName",""); setErr("hsEmail",""); setErr("hsPw",""); setMsg("hSignupMsg","","");
  const name =document.getElementById("hsName").value.trim();
  const email=document.getElementById("hsEmail").value.trim();
  const pass =document.getElementById("hsPw").value.trim();
  let err=false;
  if(!name||name.length<3){setErr("hsName",name?"Min. 3 characters.":"Name required.");err=true;}
  if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){setErr("hsEmail",email?"Invalid email.":"Email required.");err=true;}
  if(!pass||pass.length<6){setErr("hsPw",pass?"Min. 6 characters.":"Password required.");err=true;}
  if(err) return;

  const btn=document.getElementById("hSignupBtn");
  btn.disabled=true; btn.textContent="Creating…";
  try {
    const chk=await fetch(`${AUTH_API}?email=${encodeURIComponent(email)}`);
    const ex=await chk.json();
    if(ex.length>0){setErr("hsEmail","Email already registered.");return;}
    const res=await fetch(AUTH_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,password:pass,provider:"email"})});
    if(res.ok){
      setMsg("hSignupMsg","✓ Account created!","success");
      ["hsName","hsEmail","hsPw"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
      setTimeout(()=>{ saveSession(name,email,""); updateAllHeaders(); closeAnyModal(); },900);
    } else { setMsg("hSignupMsg","Signup failed.","error"); }
  } catch { setMsg("hSignupMsg","⚠ Server not reachable.","error"); }
  finally { btn.disabled=false; btn.textContent="Create Account"; }
}

// ── UPDATE HEADERS ─────────────────────────────
function updateAllHeaders() {
  // Landing page header
  updateHeaderRight("headerRight", "../pages/home.html");
  // Home page navbar right
  updateHeaderRight("navbarRight", "../index.html");
  updateHeaderRight("navbarRightInner", "../index.html");
}

function updateHeaderRight(containerId, homeUrl) {
  const box = document.getElementById(containerId);
  if (!box) return;
  if (isLoggedIn()) {
    const name = getUsername();
    const initials = name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
    box.innerHTML = `
      <div class="user-pill-wrap" id="pill_${containerId}">
        <div class="user-pill" onclick="togglePill('pill_${containerId}')">
          <div class="user-avatar">${initials}</div>
          <span class="user-name">${name}</span>
        </div>
        <div class="user-menu">
          <a class="umenu-item" href="${homeUrl.includes('pages') ? homeUrl : 'pages/home.html'}">⚡ Open Converter</a>
          <div class="umenu-sep"></div>
          <button class="umenu-item danger" onclick="doLogout()">🚪 Sign Out</button>
        </div>
      </div>
    `;
  } else {
    box.innerHTML = `
      <button class="btn-ghost-header" onclick="openModal('login')">Sign In</button>
      <button class="btn-solid-header" onclick="openModal('signup')">Sign Up</button>
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

document.addEventListener("keydown", e => { if(e.key==="Escape") closeAnyModal(); });