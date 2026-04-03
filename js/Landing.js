// js/landing.js — Landing page init only
// All auth logic is in js/auth.js

// Called after successful auth on landing page
function onAuthSuccess() {
  window.location.href = "pages/home.html";
}

// Init header on page load
updateAllHeaders();
switchTab("login");