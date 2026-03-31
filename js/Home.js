// =============================================
// js/home.js — Converter + Comparison + Arithmetic
// Depends on: js/units.js (CATEGORIES, UNIT_SYMBOLS, convert(), formatResult())
// Auth guard: redirects to index.html if not logged in
// =============================================

// Immediately redirect unauthenticated users before the page renders
(function authGuard() {
  if (!sessionStorage.getItem("loggedIn")) {
    window.location.href = "../index.html";
  }
})();

// Active state for each panel's selected category and current operation
let activeCategory      = "length";
let activeCmpCategory   = "length";
let activeArithCategory = "length";
let activeMode          = "converter";
let activeOp            = "add";
let convHistory         = [];  // stores up to 12 recent converter entries

// Converter DOM refs — assigned on DOMContentLoaded
let fromInput, fromUnitSelect, toUnitSelect, resultValue, resultUnitEl, resultFormula;

// On load: set greeting, wire up DOM refs, and initialise all three panels
window.addEventListener("DOMContentLoaded", () => {
  const name = sessionStorage.getItem("userName") || "User";
  const greet = document.getElementById("userGreeting");
  if (greet) greet.innerHTML = `Welcome, <strong>${name}</strong>`;

  fromInput      = document.getElementById("fromValue");
  fromUnitSelect = document.getElementById("fromUnit");
  toUnitSelect   = document.getElementById("toUnit");
  resultValue    = document.getElementById("resultValue");
  resultUnitEl   = document.getElementById("resultUnit");
  resultFormula  = document.getElementById("resultFormula");

  buildConverterCategoryTabs();
  loadCategory("length");
  fromInput.addEventListener("input", runConversion);  // live conversion on typing

  buildCmpCategoryTabs();
  loadCmpCategory("length");

  buildArithCategoryTabs();
  loadArithCategory("length");
});

// ─── MODE SWITCHING ───────────────────────────
// Toggles .active on the mode button and its corresponding panel
function switchMode(mode) {
  activeMode = mode;
  ["converter","comparison","arithmetic"].forEach(m => {
    document.getElementById("mode" + cap(m)).classList.toggle("active", m === mode);
    document.getElementById("panel" + cap(m)).classList.toggle("active", m === mode);
  });
}

// Capitalises first letter — used to build element IDs like "modeConverter"
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ══════════════════════════════════════════════
// CONVERTER
// ══════════════════════════════════════════════

// Builds the category tab buttons (Length / Weight / Volume / Temperature)
function buildConverterCategoryTabs() {
  const c = document.getElementById("categoryTabs");
  c.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (key === activeCategory ? " active" : "");
    btn.id = "tab-" + key;
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
    btn.onclick = () => loadCategory(key);
    c.appendChild(btn);
  });
}

// Switches active category: updates tab, heading, unit selects, and quick ref
function loadCategory(catKey) {
  activeCategory = catKey;
  document.querySelectorAll("#categoryTabs .cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("tab-" + catKey);
  if (btn) btn.classList.add("active");

  const cat = CATEGORIES[catKey];
  const heading = document.getElementById("converterHeading");
  if (heading) heading.innerHTML = `<span>${cat.icon}</span> ${cat.label} Converter`;

  populateSelect(fromUnitSelect, cat.units, 0);
  populateSelect(toUnitSelect,   cat.units, 1);
  fromInput.value = "1";
  runConversion();
  buildQuickRef(catKey);
}

// Fills a <select> with unit options; marks defaultIndex as selected
function populateSelect(selectEl, units, defaultIndex) {
  selectEl.innerHTML = "";
  units.forEach((u, i) => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = `${UNIT_SYMBOLS[u]} — ${u}`;
    if (i === defaultIndex) opt.selected = true;
    selectEl.appendChild(opt);
  });
}

// Reads inputs, calls convert(), updates result display, debounces history push
function runConversion() {
  const val   = fromInput.value;
  const fromU = fromUnitSelect.value;
  const toU   = toUnitSelect.value;
  const res   = convert(val, fromU, toU, activeCategory);
  const fmt   = formatResult(res);
  const symF  = UNIT_SYMBOLS[fromU];
  const symT  = UNIT_SYMBOLS[toU];

  resultValue.textContent  = fmt;
  resultUnitEl.textContent = symT;
  if (resultFormula) resultFormula.textContent = `${val || "0"} ${symF} = ${fmt} ${symT}`;

  // Save to history 600ms after the user stops typing
  clearTimeout(window._histTimer);
  window._histTimer = setTimeout(() => {
    if (val !== "" && res !== "" && res !== null) {
      pushHistory({ expr: `${val} ${symF}`, result: `${fmt} ${symT}`, category: activeCategory });
    }
  }, 600);
}

// Swaps from/to units and uses the current result as the new input value
function swapUnits() {
  const prevFrom   = fromUnitSelect.value;
  const prevTo     = toUnitSelect.value;
  const prevResult = resultValue.textContent;
  fromUnitSelect.value = prevTo;
  toUnitSelect.value   = prevFrom;
  if (prevResult && prevResult !== "—") fromInput.value = prevResult.replace(/,/g, "");
  runConversion();
}

// Renders clickable preset conversion items for the active category
function buildQuickRef(catKey) {
  const grid = document.getElementById("quickRefGrid");
  grid.innerHTML = "";
  CATEGORIES[catKey].quickRef.forEach(item => {
    const div = document.createElement("div");
    div.className = "ref-item";
    div.innerHTML = `<span class="ref-from">${item.from}</span><span class="ref-arrow">→</span><span class="ref-to">${item.to}</span>`;
    // Clicking a preset loads it directly into the converter inputs
    div.onclick = () => { fromUnitSelect.value = item.fu; toUnitSelect.value = item.tu; fromInput.value = String(item.fv); runConversion(); };
    grid.appendChild(div);
  });
}

// Adds entry to convHistory (max 12), skipping consecutive duplicates
function pushHistory(entry) {
  if (convHistory.length > 0) {
    const last = convHistory[0];
    if (last.expr === entry.expr && last.result === entry.result) return;
  }
  convHistory.unshift({ id: Date.now(), ...entry });
  if (convHistory.length > 12) convHistory.pop();
  renderHistory();
}

// Re-renders the history list; hides the card when empty
function renderHistory() {
  const section = document.getElementById("historySection");
  const list    = document.getElementById("historyList");
  if (convHistory.length === 0) { section.style.display = "none"; return; }
  section.style.display = "block";
  document.getElementById("historyEmpty").style.display = "none";
  list.innerHTML = "";
  convHistory.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<span class="h-expr">${item.expr}</span><span class="h-result">= ${item.result}</span>`;
    list.appendChild(div);
  });
}

// Clears all history entries and hides the history card
function clearHistory() {
  convHistory = [];
  document.getElementById("historySection").style.display = "none";
}

// ══════════════════════════════════════════════
// COMPARISON
// ══════════════════════════════════════════════

// Builds category tab buttons for the comparison panel
function buildCmpCategoryTabs() {
  const c = document.getElementById("cmpCategoryTabs");
  c.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (key === activeCmpCategory ? " active" : "");
    btn.id = "cmptab-" + key;
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
    btn.onclick = () => loadCmpCategory(key);
    c.appendChild(btn);
  });
}

// Switches comparison category and resets both input sides
function loadCmpCategory(catKey) {
  activeCmpCategory = catKey;
  document.querySelectorAll("#cmpCategoryTabs .cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("cmptab-" + catKey);
  if (btn) btn.classList.add("active");

  const cat = CATEGORIES[catKey];
  populateSelect(document.getElementById("cmpUnitA"), cat.units, 0);
  populateSelect(document.getElementById("cmpUnitB"), cat.units, 1);
  document.getElementById("cmpValueA").value = "1";
  document.getElementById("cmpValueB").value = "5";
  runComparison();
}

// Converts A and B to a common base unit, updates bar widths and verdict text
function runComparison() {
  const valA  = parseFloat(document.getElementById("cmpValueA").value);
  const valB  = parseFloat(document.getElementById("cmpValueB").value);
  const unitA = document.getElementById("cmpUnitA").value;
  const unitB = document.getElementById("cmpUnitB").value;
  const cat   = activeCmpCategory;

  if (isNaN(valA) || isNaN(valB)) {
    setComparisonNA("Enter valid numbers in both fields.");
    return;
  }

  // Normalise both values to a common base unit for a fair comparison
  let baseA, baseB, baseSymbol;
  if (cat === "temperature") {
    // Use Celsius as the neutral base for temperature comparisons
    baseA = convert(valA, unitA, "celsius", cat);
    baseB = convert(valB, unitB, "celsius", cat);
    baseSymbol = "°C";
  } else {
    const baseUnit = CATEGORIES[cat].units[0];  // first unit in the array is the base
    baseA = convert(valA, unitA, baseUnit, cat);
    baseB = convert(valB, unitB, baseUnit, cat);
    baseSymbol = UNIT_SYMBOLS[baseUnit];
  }

  const fmtA = formatResult(baseA);
  const fmtB = formatResult(baseB);
  const symA = UNIT_SYMBOLS[unitA];
  const symB = UNIT_SYMBOLS[unitB];

  // Scale bar widths proportionally to the larger value
  const maxVal = Math.max(Math.abs(baseA), Math.abs(baseB));
  const pctA = maxVal === 0 ? 50 : Math.round((Math.abs(baseA) / maxVal) * 100);
  const pctB = maxVal === 0 ? 50 : Math.round((Math.abs(baseB) / maxVal) * 100);

  document.getElementById("barA").style.width = pctA + "%";
  document.getElementById("barB").style.width = pctB + "%";
  document.getElementById("barLabelA").textContent = `${valA} ${symA} = ${fmtA} ${baseSymbol}`;
  document.getElementById("barLabelB").textContent = `${valB} ${symB} = ${fmtB} ${baseSymbol}`;

  // Determine and display verdict (equal / A larger / B larger)
  const verdict = document.getElementById("cmpVerdict");
  const diff = parseFloat(baseA) - parseFloat(baseB);
  const tol  = Math.max(Math.abs(baseA), Math.abs(baseB)) * 1e-9;  // floating-point tolerance

  if (Math.abs(diff) <= tol) {
    verdict.className = "cmp-verdict verdict-eq";
    verdict.textContent = `✓ A and B are equal (${fmtA} ${baseSymbol})`;
  } else if (diff > 0) {
    const times = Math.abs(baseA / baseB);
    const timesStr = isFinite(times) && times > 0 ? ` (${formatResult(times)}×)` : "";
    verdict.className = "cmp-verdict verdict-a";
    verdict.textContent = `A is larger than B by ${formatResult(Math.abs(diff))} ${baseSymbol}${timesStr}`;
  } else {
    const times = Math.abs(baseB / baseA);
    const timesStr = isFinite(times) && times > 0 ? ` (${formatResult(times)}×)` : "";
    verdict.className = "cmp-verdict verdict-b";
    verdict.textContent = `B is larger than A by ${formatResult(Math.abs(diff))} ${baseSymbol}${timesStr}`;
  }
}

// Resets bars to 50/50 and shows a neutral message (used on invalid input)
function setComparisonNA(msg) {
  document.getElementById("barA").style.width = "50%";
  document.getElementById("barB").style.width = "50%";
  document.getElementById("barLabelA").textContent = "—";
  document.getElementById("barLabelB").textContent = "—";
  const verdict = document.getElementById("cmpVerdict");
  verdict.className = "cmp-verdict verdict-na";
  verdict.textContent = msg;
}

// ══════════════════════════════════════════════
// ARITHMETIC
// ══════════════════════════════════════════════

// Builds category tab buttons for the arithmetic panel
function buildArithCategoryTabs() {
  const c = document.getElementById("arithCategoryTabs");
  c.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn" + (key === activeArithCategory ? " active" : "");
    btn.id = "arithtab-" + key;
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
    btn.onclick = () => loadArithCategory(key);
    c.appendChild(btn);
  });
}

// Switches arithmetic category and resets inputs to default values
function loadArithCategory(catKey) {
  activeArithCategory = catKey;
  document.querySelectorAll("#arithCategoryTabs .cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("arithtab-" + catKey);
  if (btn) btn.classList.add("active");

  const cat = CATEGORIES[catKey];
  populateSelect(document.getElementById("arithUnitA"), cat.units, 0);
  populateSelect(document.getElementById("arithUnitB"), cat.units, 0);
  document.getElementById("arithValueA").value = "10";
  document.getElementById("arithValueB").value = "5";
  runArithmetic();
}

// Updates the active operation, operator symbol display, and recalculates
function setOp(op) {
  activeOp = op;
  ["add","subtract","divide"].forEach(o => {
    document.getElementById("op" + cap(o)).classList.toggle("active", o === op);
  });
  const symbols = { add: "＋", subtract: "－", divide: "÷" };
  document.getElementById("opSymbol").textContent = symbols[op];
  runArithmetic();
}

// Core arithmetic: add/subtract converts B to A's unit; divide gives a dimensionless ratio
function runArithmetic() {
  const valA  = parseFloat(document.getElementById("arithValueA").value);
  const valB  = parseFloat(document.getElementById("arithValueB").value);
  const unitA = document.getElementById("arithUnitA").value;
  const unitB = document.getElementById("arithUnitB").value;
  const cat   = activeArithCategory;
  const symA  = UNIT_SYMBOLS[unitA];
  const symB  = UNIT_SYMBOLS[unitB];

  const noteEl = document.getElementById("arithNote");
  noteEl.style.display = "none";

  if (isNaN(valA) || isNaN(valB)) {
    setArithResult("—", "", "Enter valid numbers.");
    clearSteps();
    return;
  }

  // Warn that temperature add/subtract is numeric only (scales aren't linear)
  if (cat === "temperature" && (activeOp === "add" || activeOp === "subtract")) {
    noteEl.style.display = "block";
    noteEl.textContent = "⚠ Temperature addition/subtraction works on raw numeric values only — temperature scales are not linearly addable in the usual sense. Showing numeric result.";
  }

  let resultNum, resultSym, steps = [];

  if (activeOp === "divide") {
    // Divide: convert both to base unit first, result is a dimensionless ratio
    let baseA, baseB, baseSym;
    if (cat === "temperature") {
      baseA = convert(valA, unitA, "celsius", cat);
      baseB = convert(valB, unitB, "celsius", cat);
      baseSym = "°C";
    } else {
      const baseUnit = CATEGORIES[cat].units[0];
      baseSym = UNIT_SYMBOLS[baseUnit];
      baseA = convert(valA, unitA, baseUnit, cat);
      baseB = convert(valB, unitB, baseUnit, cat);
    }

    if (baseB === 0) {
      setArithResult("∞", "", "Cannot divide by zero.");
      clearSteps();
      return;
    }

    resultNum = baseA / baseB;
    resultSym = "× (ratio)";

    steps = [
      { text: `Convert A: <strong>${valA} ${symA}</strong> → <strong>${formatResult(baseA)} ${baseSym}</strong>` },
      { text: `Convert B: <strong>${valB} ${symB}</strong> → <strong>${formatResult(baseB)} ${baseSym}</strong>` },
      { text: `Divide: ${formatResult(baseA)} ÷ ${formatResult(baseB)} = <strong>${formatResult(resultNum)}</strong>` },
      { text: `A is <strong>${formatResult(resultNum)}×</strong> the size of B` }
    ];

    setArithResult(formatResult(resultNum), resultSym, `${valA} ${symA} ÷ ${valB} ${symB} = ${formatResult(resultNum)}`);

  } else {
    // Add / Subtract: convert B into A's unit so both share the same unit
    const baseB_inA = convert(valB, unitB, unitA, cat);
    const opSym = activeOp === "add" ? "+" : "−";
    resultNum = activeOp === "add" ? valA + baseB_inA : valA - baseB_inA;
    resultSym = symA;

    steps = [
      { text: `Start with A: <strong>${valA} ${symA}</strong>` },
      { text: `Convert B to ${unitA}: <strong>${valB} ${symB}</strong> → <strong>${formatResult(baseB_inA)} ${symA}</strong>` },
      { text: `${activeOp === "add" ? "Add" : "Subtract"}: ${valA} ${opSym} ${formatResult(baseB_inA)} = <strong>${formatResult(resultNum)} ${symA}</strong>` },
      { text: `Result: <strong>${formatResult(resultNum)} ${symA}</strong>` }
    ];

    setArithResult(formatResult(resultNum), symA, `${valA} ${symA} ${opSym} ${valB} ${symB} = ${formatResult(resultNum)} ${symA}`);
  }

  renderSteps(steps);
}

// Writes value, unit, and expression string into the arithmetic result box
function setArithResult(value, unit, expr) {
  document.getElementById("arithResultValue").textContent = value;
  document.getElementById("arithResultUnit").textContent  = unit;
  document.getElementById("arithResultExpr").textContent  = expr;
}

// Resets the steps panel to its default placeholder text
function clearSteps() {
  document.getElementById("stepsList").innerHTML = `<p class="steps-empty">Enter values to see calculation steps.</p>`;
}

// Renders numbered step items into the steps panel
function renderSteps(steps) {
  const list = document.getElementById("stepsList");
  list.innerHTML = "";
  steps.forEach((s, i) => {
    const div = document.createElement("div");
    div.className = "step-item";
    div.innerHTML = `<div class="step-num">${i + 1}</div><div class="step-text">${s.text}</div>`;
    list.appendChild(div);
  });
}

// Clears session and redirects to the login page
function logout() {
  sessionStorage.clear();
  window.location.href = "../index.html";
}