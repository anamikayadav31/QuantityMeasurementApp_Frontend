// =============================================
// js/home.js — Converter App Logic
// =============================================

const ASP_API_QTY = "http://localhost:5271/api/v1/quantities";
// Backend validator requires exactly: LengthUnit | WeightUnit | VolumeUnit | TemperatureUnit
const CATEGORY_TO_MTYPE_MAP = {
  length:"LengthUnit", weight:"WeightUnit", volume:"VolumeUnit", temperature:"TemperatureUnit"
};

// ── UNIT NAME MAP ────────────────────────────
// The backend enum only accepts these 13 values:
// FEET, INCHES, YARDS, CENTIMETERS, KILOGRAM, GRAM,
// POUND, LITRE, MILLILITRE, GALLON, CELSIUS, FAHRENHEIT, KELVIN
//
// Every frontend unit is mapped to the nearest accepted backend name.
const FRONTEND_TO_API_UNIT = {
  // Length
  "millimeter":   "CENTIMETERS",
  "centimeter":   "CENTIMETERS",
  "meter":        "YARDS",        // 1 m ≈ 1.094 yd — closest supported unit
  "kilometer":    "YARDS",
  "inch":         "INCHES",
  "foot":         "FEET",
  "yard":         "YARDS",
  "mile":         "YARDS",
  // Weight
  "milligram":    "GRAM",
  "gram":         "GRAM",
  "kilogram":     "KILOGRAM",
  "metric ton":   "KILOGRAM",
  "ounce":        "POUND",
  "pound":        "POUND",
  "stone":        "POUND",
  // Volume
  "milliliter":   "MILLILITRE",
  "liter":        "LITRE",
  "cubic meter":  "LITRE",
  "teaspoon":     "MILLILITRE",
  "tablespoon":   "MILLILITRE",
  "cup":          "LITRE",
  "fluid ounce":  "MILLILITRE",
  "pint":         "LITRE",
  "quart":        "LITRE",
  "gallon":       "GALLON",
  // Temperature
  "celsius":      "CELSIUS",
  "fahrenheit":   "FAHRENHEIT",
  "kelvin":       "KELVIN"
};

function toApiUnitName(unitName) {
  const key = unitName.trim().toLowerCase();
  return FRONTEND_TO_API_UNIT[key]
    || unitName.trim().toUpperCase().replace(/\s+/g, "_");
}

async function saveToDatabase(operation, category, value1, unit1, value2, unit2) {
  try {
    const mType = CATEGORY_TO_MTYPE_MAP[category] || "LENGTH";
    const payload = {
      thisQuantityDTO: { value: parseFloat(value1), unit: toApiUnitName(unit1), measurementType: mType },
      thatQuantityDTO: { value: parseFloat(value2), unit: toApiUnitName(unit2), measurementType: mType }
    };
    const res = await fetch(`${ASP_API_QTY}/${operation}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) console.log(`[DB] ✓ ${operation} saved`);
    else console.warn(`[DB] ✗ ${operation} failed ${res.status}`);
  } catch (err) {
    console.warn(`[DB] ✗ ${operation} network error:`, err.message);
  }
}

let activeCategory      = "length";
let activeCmpCategory   = "length";
let activeArithCategory = "length";
let activeMode          = "converter";
let activeOp            = "add";
let convHistory         = [];

let fromInput, fromUnitSel, toUnitSel, resultVal, resultUnitEl, resultFormula;

window.addEventListener("DOMContentLoaded", () => {
  updateAllHeaders();

  fromInput     = document.getElementById("fromValue");
  fromUnitSel   = document.getElementById("fromUnit");
  toUnitSel     = document.getElementById("toUnit");
  resultVal     = document.getElementById("resultValue");
  resultUnitEl  = document.getElementById("resultUnit");
  resultFormula = document.getElementById("resultFormula");

  buildCatTabs("categoryTabs",     activeCategory,      loadCategory);
  loadCategory("length");
  buildCatTabs("cmpCategoryTabs",  activeCmpCategory,   loadCmpCategory);
  loadCmpCategory("length");
  buildCatTabs("arithCategoryTabs",activeArithCategory, loadArithCategory);
  loadArithCategory("length");

  try {
    const saved = sessionStorage.getItem("qma_history");
    if (saved) convHistory = JSON.parse(saved);
  } catch(e) { convHistory = []; }
});

function onAuthSuccess() { updateAllHeaders(); }
function onLogout()      { updateAllHeaders(); }

function saveHistoryToSession() {
  try { sessionStorage.setItem("qma_history", JSON.stringify(convHistory)); } catch(e){}
}

// ── MODE SWITCH ───────────────────────────────
function switchMode(mode) {
  activeMode = mode;
  ["converter","comparison","arithmetic"].forEach(m => {
    const modeBtn   = document.getElementById("mode" + cap(m));
    const panel     = document.getElementById("panel" + cap(m));
    const headerBtn = document.getElementById("hn" + cap(m));
    if (modeBtn)   modeBtn.classList.toggle("active",   m === mode);
    if (panel)     panel.classList.toggle("active",     m === mode);
    if (headerBtn) headerBtn.classList.toggle("active", m === mode);
  });
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── CAT TABS ──────────────────────────────────
function buildCatTabs(containerId, currentCat, loadFn) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key,cat]) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (key === currentCat ? " active" : "");
    btn.id = containerId + "-" + key;
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
    btn.onclick = () => loadFn(key);
    c.appendChild(btn);
  });
}
function setActiveCatTab(containerId, catKey) {
  document.querySelectorAll("#" + containerId + " .cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(containerId + "-" + catKey);
  if (btn) btn.classList.add("active");
}

// ── CONVERTER ─────────────────────────────────
function loadCategory(catKey) {
  activeCategory = catKey;
  setActiveCatTab("categoryTabs", catKey);
  const cat = CATEGORIES[catKey];
  const h = document.getElementById("converterHeading");
  if (h) h.innerHTML = `<span>${cat.icon}</span> ${cat.label} Converter`;
  populateSelect(fromUnitSel, cat.units);
  populateSelect(toUnitSel,   cat.units);
  if (fromInput) fromInput.value = "";
  clearConvResult();
}

function populateSelect(sel, units) {
  if (!sel) return;
  sel.innerHTML = `<option value="">-- Select Unit --</option>`;
  units.forEach(u => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = `${UNIT_SYMBOLS[u]} — ${u}`;
    sel.appendChild(opt);
  });
}

function clearConvResult() {
  const box = document.getElementById("resultBox");
  if (box) box.classList.remove("has-result");
  if (resultVal)     resultVal.textContent    = "—";
  if (resultUnitEl)  resultUnitEl.textContent = "";
  if (resultFormula) resultFormula.textContent = "";
}

function runConversion() {
  const val   = fromInput ? fromInput.value : "";
  const fromU = fromUnitSel ? fromUnitSel.value : "";
  const toU   = toUnitSel ? toUnitSel.value : "";

  if (val === "" || fromU === "" || toU === "") {
    showConvError("Please enter a value and select both units.");
    return;
  }
  hideConvError();

  const res = convert(val, fromU, toU, activeCategory);
  const fmt = formatResult(res);
  const sF  = UNIT_SYMBOLS[fromU], sT = UNIT_SYMBOLS[toU];

  resultVal.textContent    = fmt;
  resultUnitEl.textContent = sT;
  if (resultFormula) resultFormula.textContent = `${val} ${sF} = ${fmt} ${sT}`;

  const box = document.getElementById("resultBox");
  if (box) box.classList.add("has-result");

  pushHistory({ expr:`${val} ${sF}`, result:`${fmt} ${sT}`, category: activeCategory, time: Date.now() });

  const numVal = parseFloat(val), numRes = parseFloat(res);
  if (!isNaN(numVal) && !isNaN(numRes))
    saveToDatabase("convert", activeCategory, numVal, fromU, numRes, toU);
}

function showConvError(msg) {
  const el = document.getElementById("convError");
  if (el) { el.textContent = msg; el.style.display = "block"; }
}
function hideConvError() {
  const el = document.getElementById("convError");
  if (el) el.style.display = "none";
}
function swapUnits() {
  if (!fromUnitSel || !toUnitSel) return;
  const pf = fromUnitSel.value, pt = toUnitSel.value;
  fromUnitSel.value = pt; toUnitSel.value = pf;
  clearConvResult();
}

// ── HISTORY ───────────────────────────────────
function pushHistory(entry) {
  if (convHistory.length > 0) {
    const l = convHistory[0];
    if (l.expr === entry.expr && l.result === entry.result) return;
  }
  convHistory.unshift(entry);
  if (convHistory.length > 20) convHistory.pop();
  saveHistoryToSession();
}

// ── COMPARISON ────────────────────────────────
function loadCmpCategory(catKey) {
  activeCmpCategory = catKey;
  setActiveCatTab("cmpCategoryTabs", catKey);
  const cat = CATEGORIES[catKey];
  populateSelect(document.getElementById("cmpUnitA"), cat.units);
  populateSelect(document.getElementById("cmpUnitB"), cat.units);
  const va = document.getElementById("cmpValueA");
  const vb = document.getElementById("cmpValueB");
  if (va) va.value = "";
  if (vb) vb.value = "";
  clearCmpResult();
}

function clearCmpResult() {
  const v = document.getElementById("cmpVerdict");
  if (v) { v.className = "cmp-verdict verdict-na"; v.textContent = "Enter values and click Compare."; }
}

function runComparison() {
  const vA  = parseFloat(document.getElementById("cmpValueA").value);
  const vB  = parseFloat(document.getElementById("cmpValueB").value);
  const uA  = document.getElementById("cmpUnitA").value;
  const uB  = document.getElementById("cmpUnitB").value;
  const cat = activeCmpCategory;

  if (isNaN(vA) || isNaN(vB) || !uA || !uB) {
    const v = document.getElementById("cmpVerdict");
    v.className = "cmp-verdict verdict-na";
    v.textContent = "Please enter valid numbers and select both units.";
    return;
  }

  let bA, bB, bSym;
  if (cat === "temperature") {
    bA = convert(vA, uA, "celsius", cat); bB = convert(vB, uB, "celsius", cat); bSym = "°C";
  } else {
    const bu = CATEGORIES[cat].units[0];
    bA = convert(vA, uA, bu, cat); bB = convert(vB, uB, bu, cat); bSym = UNIT_SYMBOLS[bu];
  }

  const fA = formatResult(bA), fB = formatResult(bB);
  const sA = UNIT_SYMBOLS[uA], sB = UNIT_SYMBOLS[uB];
  const v  = document.getElementById("cmpVerdict");
  const diff = parseFloat(bA) - parseFloat(bB);
  const tol  = Math.max(Math.abs(bA), Math.abs(bB)) * 1e-9;

  if (Math.abs(diff) <= tol) {
    v.className   = "cmp-verdict verdict-eq";
    v.textContent = `Both are EQUAL — ${fA} ${bSym}`;
  } else if (diff > 0) {
    v.className   = "cmp-verdict verdict-a";
    v.textContent = `NOT equal — A (${vA} ${sA} = ${fA} ${bSym}) is GREATER than B (${vB} ${sB} = ${fB} ${bSym})`;
  } else {
    v.className   = "cmp-verdict verdict-b";
    v.textContent = `NOT equal — B (${vB} ${sB} = ${fB} ${bSym}) is GREATER than A (${vA} ${sA} = ${fA} ${bSym})`;
  }

  saveToDatabase("compare", cat, vA, uA, vB, uB);
}

// ── ARITHMETIC ────────────────────────────────
function loadArithCategory(catKey) {
  activeArithCategory = catKey;
  setActiveCatTab("arithCategoryTabs", catKey);
  const cat = CATEGORIES[catKey];
  populateSelect(document.getElementById("arithUnitA"), cat.units);
  populateSelect(document.getElementById("arithUnitB"), cat.units);
  const va = document.getElementById("arithValueA");
  const vb = document.getElementById("arithValueB");
  if (va) va.value = "";
  if (vb) vb.value = "";
  clearArithResult();
}

function clearArithResult() {
  document.getElementById("arithResultValue").textContent = "—";
  document.getElementById("arithResultUnit").textContent  = "";
  document.getElementById("arithResultExpr").textContent  = "";
  const noteEl = document.getElementById("arithNote");
  if (noteEl) noteEl.style.display = "none";
}

function setOp(op) {
  activeOp = op;
  ["add","subtract","divide"].forEach(o =>
    document.getElementById("op" + cap(o)).classList.toggle("active", o === op));
  document.getElementById("opSymbol").textContent = { add:"＋", subtract:"－", divide:"÷" }[op];
}

function runArithmetic() {
  const vA  = parseFloat(document.getElementById("arithValueA").value);
  const vB  = parseFloat(document.getElementById("arithValueB").value);
  const uA  = document.getElementById("arithUnitA").value;
  const uB  = document.getElementById("arithUnitB").value;
  const cat = activeArithCategory;
  const noteEl = document.getElementById("arithNote");
  if (noteEl) noteEl.style.display = "none";

  if (isNaN(vA) || isNaN(vB) || !uA || !uB) {
    setArithRes("—", "", "Please enter valid numbers and select both units.");
    return;
  }

  const sA = UNIT_SYMBOLS[uA], sB = UNIT_SYMBOLS[uB];

  if (cat === "temperature" && (activeOp === "add" || activeOp === "subtract")) {
    if (noteEl) { noteEl.style.display = "block"; noteEl.textContent = "⚠ Temperature add/subtract shows raw numeric values only."; }
  }

  let rNum, rSym, exprStr;

  if (activeOp === "divide") {
    let bA, bB, bSym;
    if (cat === "temperature") {
      bA = convert(vA, uA, "celsius", cat); bB = convert(vB, uB, "celsius", cat); bSym = "°C";
    } else {
      const bu = CATEGORIES[cat].units[0]; bSym = UNIT_SYMBOLS[bu];
      bA = convert(vA, uA, bu, cat); bB = convert(vB, uB, bu, cat);
    }
    if (bB === 0) { setArithRes("∞", "", "Cannot divide by zero."); return; }
    rNum    = bA / bB; rSym = "× (ratio)";
    exprStr = `${vA} ${sA} ÷ ${vB} ${sB} = ${formatResult(rNum)}`;
    saveToDatabase("divide", cat, vA, uA, vB, uB);
  } else {
    const bB_inA = convert(vB, uB, uA, cat);
    const opSym  = activeOp === "add" ? "+" : "−";
    rNum    = activeOp === "add" ? vA + bB_inA : vA - bB_inA;
    rSym    = sA;
    exprStr = `${vA} ${sA} ${opSym} ${formatResult(bB_inA)} ${sA} = ${formatResult(rNum)} ${sA}`;
    saveToDatabase(activeOp, cat, vA, uA, vB, uB);
  }

  setArithRes(formatResult(rNum), rSym, exprStr);
}

function setArithRes(v, u, e) {
  document.getElementById("arithResultValue").textContent = v;
  document.getElementById("arithResultUnit").textContent  = u;
  document.getElementById("arithResultExpr").textContent  = e;
}

// ── ALL HISTORY MODAL ─────────────────────────
let allHistoryData   = [];
let allHistoryFilter = "all";

async function showAllHistoryModal() {
  const modal = document.getElementById("allHistoryModal");
  if (!modal) return;
  modal.classList.add("open");
  allHistoryFilter = "all";
  await fetchAllHistoryFromDB();
}

function closeAllHistoryModal() {
  const modal = document.getElementById("allHistoryModal");
  if (modal) modal.classList.remove("open");
}

function closeAllHistoryModalOutside(e) {
  if (e.target.id === "allHistoryModal") closeAllHistoryModal();
}

async function fetchAllHistoryFromDB() {
  const content = document.getElementById("allHistoryContent");
  if (!content) return;
  content.innerHTML = '<div class="hist-empty">⏳ Loading from database…</div>';
  // Render filter bar immediately so it appears during load
  const fb = document.getElementById("histFilterBar");
  if (fb) {
    const ops2 = ["all","CONVERT","COMPARE","ADD","SUBTRACT","DIVIDE"];
    fb.innerHTML = ops2.map(op => {
      const label = op === "all" ? "All" : cap(op.toLowerCase());
      return `<button onclick="setAllHistoryFilter('${op}')" class="${allHistoryFilter===op?'active':''}">${label}</button>`;
    }).join("");
  }
  try {
    const res = await fetch(`${ASP_API_QTY}/history`, {
      method: "GET", headers: { "Content-Type": "application/json" }
    });
    if (!res.ok) {
      content.innerHTML = `<div class="all-hist-empty">⚠ Could not load from database (${res.status}).<br><small>Make sure the API server is running on port 5271.</small></div>`;
      return;
    }
    const data = await res.json();
    allHistoryData = Array.isArray(data) ? data : [];
    renderAllHistory();
  } catch (err) {
    content.innerHTML = `<div class="all-hist-empty">⚠ Could not connect to database.<br><small style="color:var(--text-light)">${err.message}</small></div>`;
  }
}

function renderAllHistory() {
  const filterBar = document.getElementById("histFilterBar");
  const content   = document.getElementById("allHistoryContent");
  if (!content) return;

  const ops = ["all","CONVERT","COMPARE","ADD","SUBTRACT","DIVIDE"];
  const filtered = allHistoryFilter === "all"
    ? allHistoryData
    : allHistoryData.filter(i => (i.operation || i.Operation) === allHistoryFilter);

  // ── Render filter buttons (separate fixed bar, never scrolls) ──
  if (filterBar) {
    filterBar.innerHTML = ops.map(op => {
      const label    = op === "all" ? "All" : cap(op.toLowerCase());
      const isActive = allHistoryFilter === op;
      return `<button onclick="setAllHistoryFilter('${op}')"
        class="${isActive ? 'active' : ''}">${label}</button>`;
    }).join("");
  }

  // ── Render rows (scrollable area) ──
  if (filtered.length === 0) {
    content.innerHTML = `<div class="hist-empty">📭 No operations found in database.</div>`;
    return;
  }

  content.innerHTML = filtered.map(item => {
    const op     = item.operation     || item.Operation     || "OPERATION";
    const op1    = item.operand1      || item.Operand1      || "—";
    const op2    = item.operand2      || item.Operand2      || "";
    const result = item.result        || item.Result        || "";
    const hasErr = item.hasError      ?? item.HasError      ?? false;
    const errMsg = item.errorMessage  || item.ErrorMessage  || "";
    const ts     = (item.timestamp    || item.Timestamp)
                     ? new Date(item.timestamp || item.Timestamp).toLocaleString() : "";

    let expr = op1;
    if (op2)             expr += ` → ${op2}`;
    if (result && !hasErr) expr += ` = ${result}`;

    return `
      <div class="hist-row">
        <span class="hist-op-badge ${hasErr ? 'err' : ''}">${op}</span>
        <div class="hist-expr">
          ${expr}
          ${hasErr ? `<span class="hist-err-msg">⚠ ${errMsg}</span>` : ""}
        </div>
        <span class="hist-time">${ts}</span>
      </div>`;
  }).join("");
}

function setAllHistoryFilter(op) {
  allHistoryFilter = op;
  renderAllHistory();
}