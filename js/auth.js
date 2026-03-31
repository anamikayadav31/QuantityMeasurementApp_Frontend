// =============================================
// js/auth.js
// Handles: Tab switching, Signup, Login
// API: JSON Server at http://localhost:3000
// =============================================

const API_URL = "http://localhost:3000/users";

// Shows/clears an inline error on a field; adds/removes .invalid on the input
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

// Clears all field errors for the given form prefix ("login" or "signup")
function clearAllErrors(prefix) {
  const ids = prefix === "login"
    ? ["loginEmail", "loginPassword"]
    : ["signupName", "signupEmail", "signupPassword", "signupMobile"];
  ids.forEach(id => setFieldError(id, ""));
}

// Sets the text and colour class (success/error) of a status message element
function showMsg(elemId, text, type) {
  const el = document.getElementById(elemId);
  if (!el) return;
  el.textContent = text;
  el.className = "msg " + type;
}

// Shows one form and hides the other; clears any lingering status messages
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

  // Clear messages when switching
  showMsg("loginMsg", "", "");
  showMsg("signupMsg", "", "");
}

// Toggles the password input between visible text and hidden; updates eye opacity
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

// Validates signup fields, checks for duplicate email, then POSTs new user to JSON Server
async function handleSignup() {
  clearAllErrors("signup");
  showMsg("signupMsg", "", "");

  const name     = document.getElementById("signupName").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const mobile   = document.getElementById("signupMobile").value.trim();

  // ── Field-level validation ──
  let hasError = false;

  if (!name) {
    setFieldError("signupName", "Full name is required.");
    hasError = true;
  } else if (name.length < 3) {
    setFieldError("signupName", "Name must be at least 3 characters.");
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

  if (!mobile) {
    setFieldError("signupMobile", "Mobile number is required.");
    hasError = true;
  } else if (!/^\d{10}$/.test(mobile)) {
    setFieldError("signupMobile", "Enter a valid 10-digit mobile number.");
    hasError = true;
  }

  if (hasError) return;

  // Disable button to prevent double-submit while request is in flight
  const btn = document.getElementById("signupBtn");
  btn.disabled = true;
  btn.textContent = "Please wait...";

  try {
    // Reject if email already exists in the database
    const checkRes = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
    const existing = await checkRes.json();

    if (existing.length > 0) {
      setFieldError("signupEmail", "Email already registered. Please login.");
      btn.disabled = false;
      btn.textContent = "Sign Up";
      return;
    }

    // POST new user
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, mobile })
    });

    if (res.ok) {
      showMsg("signupMsg", "✓ Account created! Redirecting to login...", "success");
      document.getElementById("signupName").value     = "";
      document.getElementById("signupEmail").value    = "";
      document.getElementById("signupPassword").value = "";
      document.getElementById("signupMobile").value   = "";
      setTimeout(() => showTab("login"), 1800);  // auto-switch to login after success
    } else {
      showMsg("signupMsg", "Signup failed. Please try again.", "error");
    }

  } catch (err) {
    console.error("Signup error:", err);
    showMsg("signupMsg", "⚠ Server not reachable. Is JSON Server running on port 3000?", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Sign Up";
  }
}

// Validates login fields, matches credentials via JSON Server, saves session and redirects
async function handleLogin() {
  clearAllErrors("login");
  showMsg("loginMsg", "", "");

  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  // ── Field-level validation ──
  let hasError = false;

  if (!email) {
    setFieldError("loginEmail", "Email is required.");
    hasError = true;
  }
  if (!password) {
    setFieldError("loginPassword", "Password is required.");
    hasError = true;
  }
  if (hasError) return;

  const btn = document.getElementById("loginBtn");
  btn.disabled = true;
  btn.textContent = "Logging in...";

  try {
    const res   = await fetch(`${API_URL}?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    const users = await res.json();

    if (users.length > 0) {
      const user = users[0];
      // Persist session so home.js auth guard allows access
      sessionStorage.setItem("loggedIn", "true");
      sessionStorage.setItem("userName", user.name);
      sessionStorage.setItem("userEmail", user.email);

      showMsg("loginMsg", `✓ Welcome back, ${user.name}!`, "success");
      setTimeout(() => {
        window.location.href = "pages/home.html";
      }, 1200);
    } else {
      showMsg("loginMsg", "Incorrect email or password.", "error");
    }

  } catch (err) {
    console.error("Login error:", err);
    showMsg("loginMsg", "⚠ Server not reachable. Is JSON Server running on port 3000?", "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Login";
  }
}

// Show the signup tab by default when the page first loads
window.addEventListener("DOMContentLoaded", () => {
  showTab("signup");
});