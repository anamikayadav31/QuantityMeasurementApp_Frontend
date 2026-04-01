// =============================================
// js/auth.js
// Handles: Tab switching, Signup, Login, Google Auth
// API: JSON Server at http://localhost:3000
// Google: GSI (Google Identity Services)
// =============================================

const API_URL = "http://localhost:3000/users";

// Replace with your actual Google OAuth 2.0 Client ID
const GOOGLE_CLIENT_ID = "673667107810-41a2oa9a6gor1nmk1u17q7cdeh3ti8ck.apps.googleusercontent.com";

// ─── GOOGLE INIT ──────────────────────────────
// Runs after the GSI script loads; initialises the library and renders both buttons
window.addEventListener("load", () => {
  if (typeof google === "undefined") return;

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback:  handleGoogleCredential,
  });

  renderGoogleButtons();
});

// Renders the "Sign in/up with Google" button into both form containers
function renderGoogleButtons() {
  google.accounts.id.renderButton(
    document.getElementById("googleBtnLogin"),
    { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular" }
  );
  google.accounts.id.renderButton(
    document.getElementById("googleBtnSignup"),
    { type: "standard", theme: "outline", size: "large", text: "signup_with", shape: "rectangular" }
  );
}

// ─── GOOGLE CREDENTIAL HANDLER ────────────────
// Fired after user picks a Google account.
// Decodes the JWT to get name/email/picture, then saves to JSON Server (if running)
// or falls back to session-only login so Google auth works without the server too.
async function handleGoogleCredential(response) {
  // Detect which form is visible so messages appear in the right place
  const activeForm = document.querySelector(".form-section.show");
  const msgId = activeForm?.id === "signupForm" ? "signupMsg" : "loginMsg";

  try {
    // Decode the JWT payload (middle base64url segment) to get Google profile
    const base64  = response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    const { name, email, picture } = payload;

    showMsg(msgId, "Signing in with Google...", "");

    let user;

    try {
      // Try to save/find the user in JSON Server
      const checkRes = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
      const existing = await checkRes.json();

      if (existing.length > 0) {
        // Returning user — use existing record
        user = existing[0];
      } else {
        // New user — auto-create account (no password needed for Google accounts)
        const createRes = await fetch(API_URL, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password: "", avatar: picture, provider: "google" }),
        });
        user = await createRes.json();
      }
    } catch (_) {
      // JSON Server not running — use Google profile data directly (fallback for local dev)
      user = { name, email, avatar: picture };
    }

    // Save session and redirect to home
    sessionStorage.setItem("loggedIn",   "true");
    sessionStorage.setItem("userName",   user.name  || name);
    sessionStorage.setItem("userEmail",  user.email || email);
    sessionStorage.setItem("userAvatar", user.avatar || picture || "");

    showMsg(msgId, `✓ Welcome, ${user.name || name}!`, "success");
    setTimeout(() => { window.location.href = "pages/home.html"; }, 1000);

  } catch (err) {
    console.error("Google auth error:", err);
    showMsg(msgId, "⚠ Google sign-in failed. Please try again.", "error");
  }
}

// ─── UTILITY ──────────────────────────────────

// Shows/clears an inline error on a field; adds/removes .invalid styling
function setFieldError(inputId, message) {
  const input = document.getElementById(inputId);
  const errEl = document.getElementById(inputId + "Err");
  if (!input) return;
  if (message) {
    input.classList.add("invalid");
    if (errEl) { errEl.textContent = message; errEl.classList.add("show"); }
  } else {
    input.classList.remove("invalid");
    if (errEl) { errEl.classList.remove("show"); }
  }
}

// Clears all field errors for the given form ("login" or "signup")
function clearAllErrors(prefix) {
  const ids = prefix === "login"
    ? ["loginEmail", "loginPassword"]
    : ["signupName", "signupEmail", "signupPassword"];
  ids.forEach(id => setFieldError(id, ""));
}

// Sets text and colour class on a status message element
function showMsg(elemId, text, type) {
  const el = document.getElementById(elemId);
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + type;
}

// Shows one form tab and hides the other; clears any messages
function showTab(tab) {
  document.getElementById("loginForm").classList.remove("show");
  document.getElementById("signupForm").classList.remove("show");
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("signupTab").classList.remove("active");

  if (tab === "login") {
    document.getElementById("loginForm").classList.add("show");
    document.getElementById("loginTab").classList.add("active");
  } else {
    document.getElementById("signupForm").classList.add("show");
    document.getElementById("signupTab").classList.add("active");
  }
  showMsg("loginMsg", "", "");
  showMsg("signupMsg", "", "");
}

// Toggles password field visibility and updates the eye icon opacity
function togglePassword(inputId, iconElem) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    iconElem.style.opacity = "0.9";
  } else {
    input.type = "password";
    iconElem.style.opacity = "0.4";
  }
}

// ─── SIGNUP ───────────────────────────────────
// Validates all fields, checks duplicate email, POSTs new user to JSON Server
async function handleSignup() {
  clearAllErrors("signup");
  showMsg("signupMsg", "", "");

  const name     = document.getElementById("signupName").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  let hasError = false;

  if (!name || name.length < 3) {
    setFieldError("signupName", name ? "Name must be at least 3 characters." : "Full name is required.");
    hasError = true;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    setFieldError("signupEmail", "Email is required.");
    hasError = true;
  } else if (!emailRegex.test(email)) {
    setFieldError("signupEmail", "Enter a valid email address.");
    hasError = true;
  }

  if (!password) {
    setFieldError("signupPassword", "Password is required.");
    hasError = true;
  } else if (password.length < 6) {
    setFieldError("signupPassword", "Password must be at least 6 characters.");
    hasError = true;
  }

  if (hasError) return;

  const btn = document.getElementById("signupBtn");
  btn.disabled = true;
  btn.textContent = "Please wait...";

  try {
    // Check for duplicate email first
    const checkRes = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
    const existing = await checkRes.json();

    if (existing.length > 0) {
      setFieldError("signupEmail", "Email already registered. Please login.");
      return;
    }

    const res = await fetch(API_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ name, email, password, provider: "email" }),
    });

    if (res.ok) {
      showMsg("signupMsg", "✓ Account created! Redirecting to login...", "success");
      ["signupName","signupEmail","signupPassword"].forEach(id => {
        document.getElementById(id).value = "";
      });
      setTimeout(() => showTab("login"), 1800);
    } else {
      showMsg("signupMsg", "Signup failed. Please try again.", "error");
    }

  } catch (err) {
    console.error("Signup error:", err);
    // Clear the error message — tell user to start JSON Server
    showMsg("signupMsg", "⚠ JSON Server not running. Open a terminal and run:  json-server --watch db.json", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign Up";
  }
}

// ─── LOGIN ────────────────────────────────────
// Validates fields, matches credentials in JSON Server, saves session, redirects
async function handleLogin() {
  clearAllErrors("login");
  showMsg("loginMsg", "", "");

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  let hasError = false;
  if (!email)    { setFieldError("loginEmail",    "Email is required.");    hasError = true; }
  if (!password) { setFieldError("loginPassword", "Password is required."); hasError = true; }
  if (hasError) return;

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const res   = await fetch(`${API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    const users = await res.json();

    if (users.length > 0) {
      const user = users[0];

      // Prevent Google-only accounts from using password login
      if (user.provider === "google") {
        showMsg("loginMsg", "This account uses Google Sign-In. Please click 'Sign in with Google'.", "error");
        return;
      }

      sessionStorage.setItem("loggedIn",   "true");
      sessionStorage.setItem("userName",   user.name);
      sessionStorage.setItem("userEmail",  user.email);
      sessionStorage.setItem("userAvatar", user.avatar || "");

      showMsg("loginMsg", `✓ Welcome back, ${user.name}!`, "success");
      setTimeout(() => { window.location.href = "pages/home.html"; }, 1200);
    } else {
      showMsg("loginMsg", "Incorrect email or password.", "error");
    }

  } catch (err) {
    console.error("Login error:", err);
    showMsg("loginMsg", "⚠ JSON Server not running. Open a terminal and run:  json-server --watch db.json", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
}

// Show signup tab by default on page load
window.addEventListener("DOMContentLoaded", () => {
  showTab("signup");
});