// =============================================
// js/home.js — Converter App Logic
// No auth guard — open access.
// Sign in only for history persistence.
// Depends: js/units.js, js/auth.js
// =============================================

let activeCategory      = "length";
let activeCmpCategory   = "length";
let activeArithCategory = "length";
let activeMode          = "converter";
let activeOp            = "add";
let convHistory         = [];
let nudgeDismissed      = false;

let fromInput, fromUnitSel, toUnitSel, resultVal, resultUnitEl, resultFormula;

// ── INIT ──────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  // Update header with current session state
  updateAllHeaders();

  fromInput     = document.getElementById("fromValue");
  fromUnitSel   = document.getElementById("fromUnit");
  toUnitSel     = document.getElementById("toUnit");
  resultVal     = document.getElementById("resultValue");
  resultUnitEl  = document.getElementById("resultUnit");
  resultFormula = document.getElementById("resultFormula");

  buildCatTabs("categoryTabs", activeCategory, loadCategory);
  loadCategory("length");
  fromInput.addEventListener("input", runConversion);

  buildCatTabs("cmpCategoryTabs", activeCmpCategory, loadCmpCategory);
  loadCmpCategory("length");

  buildCatTabs("arithCategoryTabs", activeArithCategory, loadArithCategory);
  loadArithCategory("length");
});

// Called by auth.js after logout
function onLogout() {
  convHistory = [];
  renderHistory();
  dismissNudge();
}

// ── MODAL HELPERS (home page) ─────────────────
function openHistoryModal() {
  document.getElementById("historyModal").classList.add("open");
  switchHTab("login");
  setTimeout(renderGoogleButtons, 60);
}
function switchHTab(tab) {
  ["hTabLogin","hTabSignup"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", id.includes(tab==="login"?"Login":"Signup"));
  });
  ["hFormLogin","hFormSignup"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("active", id.includes(tab==="login"?"Login":"Signup"));
  });
  // clear msgs
  ["hlEmail","hlPw","hsName","hsEmail","hsPw"].forEach(id => setErr(id,""));
  ["hLoginMsg","hSignupMsg"].forEach(id => setMsg(id,"",""));
  setTimeout(renderGoogleButtons, 60);
}

// ── NUDGE ─────────────────────────────────────
function showNudge() {
  if (nudgeDismissed || isLoggedIn()) return;
  const el = document.getElementById("historyNudge");
  const shell = document.getElementById("appShell");
  if (el) el.classList.add("show");
  if (shell) shell.classList.add("nudge-open");
}
function dismissNudge() {
  nudgeDismissed = true;
  const el = document.getElementById("historyNudge");
  const shell = document.getElementById("appShell");
  if (el) el.classList.remove("show");
  if (shell) shell.classList.remove("nudge-open");
}

// ── MODE SWITCH ───────────────────────────────
function switchMode(mode) {
  activeMode = mode;
  ["converter","comparison","arithmetic"].forEach(m => {
    // Mode bar buttons
    const modeBtn  = document.getElementById("mode" + cap(m));
    const panel    = document.getElementById("panel" + cap(m));
    // Header nav buttons (new <button> elements, not <a> tags)
    const headerBtn = document.getElementById("hn" + cap(m));

    if (modeBtn)   modeBtn.classList.toggle("active",   m === mode);
    if (panel)     panel.classList.toggle("active",     m === mode);
    if (headerBtn) headerBtn.classList.toggle("active", m === mode);
  });
}
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── CAT TABS (generic) ────────────────────────
function buildCatTabs(containerId, currentCat, loadFn) {
  const c = document.getElementById(containerId);
  if (!c) return;
  c.innerHTML = "";
  Object.entries(CATEGORIES).forEach(([key,cat]) => {
    const btn = document.createElement("button");
    btn.className = "cat-btn"+(key===currentCat?" active":"");
    btn.id = containerId+"-"+key;
    btn.innerHTML = `<span class="cat-icon">${cat.icon}</span>${cat.label}`;
    btn.onclick = () => loadFn(key);
    c.appendChild(btn);
  });
}
function setActiveCatTab(containerId, catKey) {
  document.querySelectorAll("#"+containerId+" .cat-btn").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById(containerId+"-"+catKey);
  if (btn) btn.classList.add("active");
}

// ── CONVERTER ─────────────────────────────────
function loadCategory(catKey) {
  activeCategory = catKey;
  setActiveCatTab("categoryTabs", catKey);
  const cat = CATEGORIES[catKey];
  const h = document.getElementById("converterHeading");
  if (h) h.innerHTML = `<span>${cat.icon}</span> ${cat.label} Converter`;
  populateSelect(fromUnitSel, cat.units, 0);
  populateSelect(toUnitSel,   cat.units, 1);
  fromInput.value = "1";
  runConversion();
  buildQuickRef(catKey);
}

function populateSelect(sel, units, def) {
  if (!sel) return;
  sel.innerHTML = "";
  units.forEach((u,i) => {
    const opt = document.createElement("option");
    opt.value = u;
    opt.textContent = `${UNIT_SYMBOLS[u]} — ${u}`;
    if (i===def) opt.selected = true;
    sel.appendChild(opt);
  });
}

function runConversion() {
  const val  = fromInput.value;
  const fromU = fromUnitSel.value;
  const toU   = toUnitSel.value;
  const res   = convert(val, fromU, toU, activeCategory);
  const fmt   = formatResult(res);
  const sF    = UNIT_SYMBOLS[fromU], sT = UNIT_SYMBOLS[toU];
  resultVal.textContent     = fmt;
  resultUnitEl.textContent  = sT;
  if (resultFormula) resultFormula.textContent = `${val||"0"} ${sF} = ${fmt} ${sT}`;
  clearTimeout(window._ht);
  window._ht = setTimeout(() => {
    if (val!==""&&res!==""&&res!==null)
      pushHistory({ expr:`${val} ${sF}`, result:`${fmt} ${sT}`, category:activeCategory });
  }, 600);
}

function swapUnits() {
  const pf = fromUnitSel.value, pt = toUnitSel.value, pr = resultVal.textContent;
  fromUnitSel.value = pt; toUnitSel.value = pf;
  if (pr && pr!=="—") fromInput.value = pr.replace(/,/g,"");
  runConversion();
}

function buildQuickRef(catKey) {
  const grid = document.getElementById("quickRefGrid");
  if (!grid) return;
  grid.innerHTML = "";
  CATEGORIES[catKey].quickRef.forEach(item => {
    const div = document.createElement("div");
    div.className = "ref-item";
    div.innerHTML = `<span class="ref-from">${item.from}</span><span class="ref-arrow">→</span><span class="ref-to">${item.to}</span>`;
    div.onclick = () => { fromUnitSel.value=item.fu; toUnitSel.value=item.tu; fromInput.value=String(item.fv); runConversion(); };
    grid.appendChild(div);
  });
}

// ── HISTORY ───────────────────────────────────
function pushHistory(entry) {
  if (convHistory.length>0) {
    const l = convHistory[0];
    if (l.expr===entry.expr && l.result===entry.result) return;
  }
  convHistory.unshift({ id:Date.now(), ...entry });
  if (convHistory.length>12) convHistory.pop();
  renderHistory();
  // Show nudge after 3 conversions for guests
  if (!isLoggedIn() && convHistory.length===3 && !nudgeDismissed) showNudge();
}

function renderHistory() {
  const section = document.getElementById("historySection");
  const list    = document.getElementById("historyList");
  const nudge   = document.getElementById("historySigninNudge");
  if (!section || !list) return;
  if (convHistory.length===0) { section.style.display="none"; return; }
  section.style.display = "block";
  list.innerHTML = "";
  convHistory.forEach(item => {
    const div = document.createElement("div");
    div.className = "history-item";
    div.innerHTML = `<span class="h-expr">${item.expr}</span><span class="h-result">= ${item.result}</span>`;
    list.appendChild(div);
  });
  if (nudge) nudge.style.display = isLoggedIn() ? "none" : "flex";
}

function clearHistory() {
  convHistory = [];
  const section = document.getElementById("historySection");
  if (section) section.style.display = "none";
}

// ── COMPARISON ────────────────────────────────
function loadCmpCategory(catKey) {
  activeCmpCategory = catKey;
  setActiveCatTab("cmpCategoryTabs", catKey);
  const cat = CATEGORIES[catKey];
  populateSelect(document.getElementById("cmpUnitA"), cat.units, 0);
  populateSelect(document.getElementById("cmpUnitB"), cat.units, 1);
  document.getElementById("cmpValueA").value = "1";
  document.getElementById("cmpValueB").value = "5";
  runComparison();
}
function runComparison() {
  const vA=parseFloat(document.getElementById("cmpValueA").value);
  const vB=parseFloat(document.getElementById("cmpValueB").value);
  const uA=document.getElementById("cmpUnitA").value;
  const uB=document.getElementById("cmpUnitB").value;
  const cat=activeCmpCategory;
  if(isNaN(vA)||isNaN(vB)){setCmpNA("Enter valid numbers.");return;}
  let bA,bB,bSym;
  if(cat==="temperature"){bA=convert(vA,uA,"celsius",cat);bB=convert(vB,uB,"celsius",cat);bSym="°C";}
  else{const bu=CATEGORIES[cat].units[0];bA=convert(vA,uA,bu,cat);bB=convert(vB,uB,bu,cat);bSym=UNIT_SYMBOLS[bu];}
  const fA=formatResult(bA),fB=formatResult(bB);
  const sA=UNIT_SYMBOLS[uA],sB=UNIT_SYMBOLS[uB];
  const mx=Math.max(Math.abs(bA),Math.abs(bB));
  const pA=mx===0?50:Math.round((Math.abs(bA)/mx)*100);
  const pB=mx===0?50:Math.round((Math.abs(bB)/mx)*100);
  document.getElementById("barA").style.width=pA+"%";
  document.getElementById("barB").style.width=pB+"%";
  document.getElementById("barLabelA").textContent=`${vA} ${sA} = ${fA} ${bSym}`;
  document.getElementById("barLabelB").textContent=`${vB} ${sB} = ${fB} ${bSym}`;
  const v=document.getElementById("cmpVerdict");
  const diff=parseFloat(bA)-parseFloat(bB);
  const tol=Math.max(Math.abs(bA),Math.abs(bB))*1e-9;
  if(Math.abs(diff)<=tol){v.className="cmp-verdict verdict-eq";v.textContent=`✓ Equal (${fA} ${bSym})`;}
  else if(diff>0){const t=Math.abs(bA/bB);const ts=isFinite(t)&&t>0?` (${formatResult(t)}×)`:"";v.className="cmp-verdict verdict-a";v.textContent=`A is larger by ${formatResult(Math.abs(diff))} ${bSym}${ts}`;}
  else{const t=Math.abs(bB/bA);const ts=isFinite(t)&&t>0?` (${formatResult(t)}×)`:"";v.className="cmp-verdict verdict-b";v.textContent=`B is larger by ${formatResult(Math.abs(diff))} ${bSym}${ts}`;}
}
function setCmpNA(msg){
  ["barA","barB"].forEach(id=>document.getElementById(id).style.width="50%");
  ["barLabelA","barLabelB"].forEach(id=>document.getElementById(id).textContent="—");
  const v=document.getElementById("cmpVerdict");v.className="cmp-verdict verdict-na";v.textContent=msg;
}

// ── ARITHMETIC ────────────────────────────────
function loadArithCategory(catKey) {
  activeArithCategory = catKey;
  setActiveCatTab("arithCategoryTabs", catKey);
  const cat = CATEGORIES[catKey];
  populateSelect(document.getElementById("arithUnitA"), cat.units, 0);
  populateSelect(document.getElementById("arithUnitB"), cat.units, 0);
  document.getElementById("arithValueA").value = "10";
  document.getElementById("arithValueB").value = "5";
  runArithmetic();
}
function setOp(op) {
  activeOp = op;
  ["add","subtract","divide"].forEach(o => document.getElementById("op"+cap(o)).classList.toggle("active",o===op));
  document.getElementById("opSymbol").textContent = {add:"＋",subtract:"－",divide:"÷"}[op];
  runArithmetic();
}
function runArithmetic() {
  const vA=parseFloat(document.getElementById("arithValueA").value);
  const vB=parseFloat(document.getElementById("arithValueB").value);
  const uA=document.getElementById("arithUnitA").value;
  const uB=document.getElementById("arithUnitB").value;
  const cat=activeArithCategory;
  const sA=UNIT_SYMBOLS[uA],sB=UNIT_SYMBOLS[uB];
  const noteEl=document.getElementById("arithNote"); noteEl.style.display="none";
  if(isNaN(vA)||isNaN(vB)){setArithRes("—","","Enter valid numbers.");clearSteps();return;}
  if(cat==="temperature"&&(activeOp==="add"||activeOp==="subtract")){noteEl.style.display="block";noteEl.textContent="⚠ Temperature add/subtract shows raw numeric values only.";}
  let rNum,rSym,steps=[];
  if(activeOp==="divide"){
    let bA,bB,bSym;
    if(cat==="temperature"){bA=convert(vA,uA,"celsius",cat);bB=convert(vB,uB,"celsius",cat);bSym="°C";}
    else{const bu=CATEGORIES[cat].units[0];bSym=UNIT_SYMBOLS[bu];bA=convert(vA,uA,bu,cat);bB=convert(vB,uB,bu,cat);}
    if(bB===0){setArithRes("∞","","Cannot divide by zero.");clearSteps();return;}
    rNum=bA/bB; rSym="× (ratio)";
    steps=[
      {text:`Convert A: <strong>${vA} ${sA}</strong> → <strong>${formatResult(bA)} ${bSym}</strong>`},
      {text:`Convert B: <strong>${vB} ${sB}</strong> → <strong>${formatResult(bB)} ${bSym}</strong>`},
      {text:`Divide: ${formatResult(bA)} ÷ ${formatResult(bB)} = <strong>${formatResult(rNum)}</strong>`},
      {text:`A is <strong>${formatResult(rNum)}×</strong> the size of B`}
    ];
    setArithRes(formatResult(rNum),rSym,`${vA} ${sA} ÷ ${vB} ${sB} = ${formatResult(rNum)}`);
  } else {
    const bB_inA=convert(vB,uB,uA,cat);
    const opS=activeOp==="add"?"+":" −";
    rNum=activeOp==="add"?vA+bB_inA:vA-bB_inA; rSym=sA;
    steps=[
      {text:`Start with A: <strong>${vA} ${sA}</strong>`},
      {text:`Convert B to ${uA}: <strong>${vB} ${sB}</strong> → <strong>${formatResult(bB_inA)} ${sA}</strong>`},
      {text:`${activeOp==="add"?"Add":"Subtract"}: ${vA} ${opS} ${formatResult(bB_inA)} = <strong>${formatResult(rNum)} ${sA}</strong>`},
      {text:`Result: <strong>${formatResult(rNum)} ${sA}</strong>`}
    ];
    setArithRes(formatResult(rNum),sA,`${vA} ${sA} ${opS} ${vB} ${sB} = ${formatResult(rNum)} ${sA}`);
  }
  renderSteps(steps);
}
function setArithRes(v,u,e){
  document.getElementById("arithResultValue").textContent=v;
  document.getElementById("arithResultUnit").textContent=u;
  document.getElementById("arithResultExpr").textContent=e;
}
function clearSteps(){document.getElementById("stepsList").innerHTML=`<p class="steps-empty">Enter values to see steps.</p>`;}
function renderSteps(steps){
  const list=document.getElementById("stepsList"); list.innerHTML="";
  steps.forEach((s,i)=>{
    const div=document.createElement("div");
    div.className="step-item";
    div.innerHTML=`<div class="step-num">${i+1}</div><div class="step-text">${s.text}</div>`;
    list.appendChild(div);
  });
}