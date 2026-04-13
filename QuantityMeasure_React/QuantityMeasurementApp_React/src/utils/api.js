// =============================================
// utils/api.js — API helpers
// =============================================

export const AUTH_API = "http://localhost:5271/api/v1/users";
export const QTY_API  = "http://localhost:5271/api/v1/quantities";

export async function apiSignup(username, email, password) {
  const res  = await fetch(`${AUTH_API}/signup`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.message || "Signup failed.";
    // Username already exists
    if (msg.toLowerCase().includes("already taken"))
      throw new Error("You already have an account with this username. Please sign in.");
    // Email already exists
    if (msg.toLowerCase().includes("already registered"))
      throw new Error("You already have an account with this email. Please sign in.");
    throw new Error(msg);
  }
  return data;
}

export async function apiSignin(username, password) {
  const res  = await fetch(`${AUTH_API}/signin`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Incorrect credentials. Please try again.");
  return data;
}

export async function apiLogout(token) {
  try {
    await fetch(`${AUTH_API}/logout`, {
      method: "POST", headers: { Authorization: `Bearer ${token}` }
    });
  } catch (_) {}
}

export async function saveOperation(operation, category, value1, unit1, value2, unit2) {
  const { toApiUnitName, CATEGORY_TO_MTYPE } = await import("./units.js");
  try {
    const mType   = CATEGORY_TO_MTYPE[category] || "LengthUnit";
    const payload = {
      thisQuantityDTO: { value: parseFloat(value1), unit: toApiUnitName(unit1), measurementType: mType },
      thatQuantityDTO: { value: parseFloat(value2), unit: toApiUnitName(unit2), measurementType: mType }
    };
    const res = await fetch(`${QTY_API}/${operation}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) console.log(`[DB] ✓ ${operation} saved`);
    else        console.warn(`[DB] ✗ ${operation} failed ${res.status}`);
  } catch (err) {
    console.warn(`[DB] ✗ ${operation} network error:`, err.message);
  }
}

export async function fetchHistory() {
  const res  = await fetch(`${QTY_API}/history`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}