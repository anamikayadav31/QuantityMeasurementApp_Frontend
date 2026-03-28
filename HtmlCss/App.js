// =============================================
// app.js — Quantity Measurement App
// Handles: Tab switching, Login, Signup
// Uses JSON Server at http://localhost:3000
// =============================================

// JSON Server API endpoint (users stored in db.json)
const API_URL = "http://localhost:3000/users";

// -----------------------------------------------
// TAB SWITCHING — Show login or signup form
// -----------------------------------------------
function showTab(tab) {
  // Hide both forms
  document.getElementById("loginForm").classList.remove("show");
  document.getElementById("signupForm").classList.remove("show");

  // Remove active from both tab buttons
  document.getElementById("loginTab").classList.remove("active");
  document.getElementById("signupTab").classList.remove("active");

  // Show the selected form and highlight its tab
  if (tab === "login") {
    document.getElementById("loginForm").classList.add("show");
    document.getElementById("loginTab").classList.add("active");
  } else {
    document.getElementById("signupForm").classList.add("show");
    document.getElementById("signupTab").classList.add("active");
  }
}

// Show SIGNUP form by default on page load
window.onload = function () {
  showTab("signup");
};

// -----------------------------------------------
// TOGGLE PASSWORD — Show/hide password text
// -----------------------------------------------
function togglePassword(inputId, iconElem) {
  const input = document.getElementById(inputId);

  if (input.type === "password") {
    input.type = "text";          // Show password
    iconElem.style.opacity = "1";
  } else {
    input.type = "password";      // Hide password
    iconElem.style.opacity = "0.5";
  }
}

// -----------------------------------------------
// SHOW MESSAGE — Display success or error text
// -----------------------------------------------
function showMsg(elemId, text, type) {
  const elem = document.getElementById(elemId);
  elem.textContent = text;
  elem.className = "msg " + type;  // Adds "success" or "error" class
}

// -----------------------------------------------
// SIGNUP — Save new user to db.json via POST
// -----------------------------------------------
async function handleSignup() {
  // Read all input values
  const name     = document.getElementById("signupName").value.trim();
  const email    = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const mobile   = document.getElementById("signupMobile").value.trim();

  // --- Validation checks ---
  if (!name || !email || !password || !mobile) {
    showMsg("signupMsg", "Please fill in all fields.", "error");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    showMsg("signupMsg", "Please enter a valid email address.", "error");
    return;
  }

  if (password.length < 6) {
    showMsg("signupMsg", "Password must be at least 6 characters.", "error");
    return;
  }

  if (mobile.length !== 10 || isNaN(mobile)) {
    showMsg("signupMsg", "Mobile number must be exactly 10 digits.", "error");
    return;
  }

  try {
    // --- Check if email already registered ---
    const checkRes = await fetch(`${API_URL}?email=${email}`);
    const existing = await checkRes.json();

    if (existing.length > 0) {
      showMsg("signupMsg", "Email already registered. Please login.", "error");
      return;
    }

    // --- POST: Add new user to db.json ---
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, mobile })
    });

    if (res.ok) {
      showMsg("signupMsg", "Signup successful! You can now login.", "success");

      // Clear form fields after successful signup
      document.getElementById("signupName").value     = "";
      document.getElementById("signupEmail").value    = "";
      document.getElementById("signupPassword").value = "";
      document.getElementById("signupMobile").value   = "";
    } else {
      showMsg("signupMsg", "Signup failed. Please try again.", "error");
    }

  } catch (err) {
    console.error("Signup error:", err);
    showMsg("signupMsg", "Server not reachable. Is JSON Server running?", "error");
  }
}

// -----------------------------------------------
// LOGIN — Check credentials from db.json via GET
// -----------------------------------------------
async function handleLogin() {
  const email    = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  // --- Validation ---
  if (!email || !password) {
    showMsg("loginMsg", "Please enter your email and password.", "error");
    return;
  }

  try {
    // GET users matching both email AND password
    const res   = await fetch(`${API_URL}?email=${email}&password=${password}`);
    const users = await res.json();

    if (users.length > 0) {
      // Login success — user found in db.json
      const user = users[0];
      showMsg("loginMsg", `Welcome, ${user.name}!`, "success");

      // Redirect to main app page after 1.2 seconds
      setTimeout(() => {
        window.location.href = "home.html";
      }, 1200);

    } else {
      // No matching user found
      showMsg("loginMsg", "Incorrect email or password.", "error");
    }

  } catch (err) {
    console.error("Login error:", err);
    showMsg("loginMsg", "Server not reachable. Is JSON Server running?", "error");
  }
}