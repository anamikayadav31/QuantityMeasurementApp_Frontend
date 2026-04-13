// =============================================
// components/ComparisonPanel.jsx
// =============================================
import { useState } from "react";
import CategoryTabs from "./CategoryTabs";
import { CATEGORIES, UNIT_SYMBOLS, convert, formatResult } from "../utils/units";
import { saveOperation } from "../utils/api";

function UnitSelect({ value, onChange, units }) {
  return (
    <select className="unit-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Select Unit --</option>
      {units.map(u => <option key={u} value={u}>{UNIT_SYMBOLS[u]} — {u}</option>)}
    </select>
  );
}

export default function ComparisonPanel() {
  const [category, setCategory] = useState("length");
  const [vA, setVA] = useState(""); const [uA, setUA] = useState("");
  const [vB, setVB] = useState(""); const [uB, setUB] = useState("");
  const [verdict, setVerdict] = useState({ type: "na", text: "Enter values and click Compare." });

  function handleCategoryChange(cat) {
    setCategory(cat); setVA(""); setUA(""); setVB(""); setUB("");
    setVerdict({ type: "na", text: "Enter values and click Compare." });
  }

  function handleCompare() {
    const numA = parseFloat(vA), numB = parseFloat(vB);
    if (isNaN(numA) || isNaN(numB) || !uA || !uB) {
      setVerdict({ type: "na", text: "Please enter valid numbers and select both units." });
      return;
    }
    let bA, bB, bSym;
    if (category === "temperature") {
      bA = convert(numA, uA, "celsius", category);
      bB = convert(numB, uB, "celsius", category);
      bSym = "°C";
    } else {
      const bu = CATEGORIES[category].units[0];
      bA = convert(numA, uA, bu, category);
      bB = convert(numB, uB, bu, category);
      bSym = UNIT_SYMBOLS[bu];
    }
    const fA = formatResult(bA), fB = formatResult(bB);
    const sA = UNIT_SYMBOLS[uA], sB = UNIT_SYMBOLS[uB];
    const diff = parseFloat(bA) - parseFloat(bB);
    const tol  = Math.max(Math.abs(bA), Math.abs(bB)) * 1e-9;
    if (Math.abs(diff) <= tol) {
      setVerdict({ type: "eq", text: `✅ Both are EQUAL — ${fA} ${bSym}` });
    } else if (diff > 0) {
      setVerdict({ type: "a", text: `❌ NOT equal — A (${vA} ${sA} = ${fA} ${bSym}) is GREATER than B (${vB} ${sB} = ${fB} ${bSym})` });
    } else {
      setVerdict({ type: "b", text: `❌ NOT equal — B (${vB} ${sB} = ${fB} ${bSym}) is GREATER than A (${vA} ${sA} = ${fA} ${bSym})` });
    }
    saveOperation("compare", category, numA, uA, numB, uB);
  }

  const cat = CATEGORIES[category];
  const verdictClass = { na:"verdict-na", eq:"verdict-eq", a:"verdict-a", b:"verdict-b" }[verdict.type];

  return (
    <div className="mode-panel active">
      <div className="panel-body">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
        <div className="card card-top">
          <div className="card-title">📊 Compare Two Values</div>
          <div className="cmp-grid">
            <div className="cmp-side">
              <div className="cmp-side-label"><span className="cmp-badge badge-a">A</span> Value A</div>
              <div className="field-pair">
                <input type="number" className="num-input" placeholder="Enter value"
                  value={vA} onChange={e => setVA(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCompare()} />
                <UnitSelect value={uA} onChange={setUA} units={cat.units} />
              </div>
            </div>
            <div className="cmp-side">
              <div className="cmp-side-label"><span className="cmp-badge badge-b">B</span> Value B</div>
              <div className="field-pair">
                <input type="number" className="num-input" placeholder="Enter value"
                  value={vB} onChange={e => setVB(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCompare()} />
                <UnitSelect value={uB} onChange={setUB} units={cat.units} />
              </div>
            </div>
          </div>
          <div className="btn-row">
            <button className="action-btn" onClick={handleCompare}>📊 Compare</button>
          </div>
          <div className={`cmp-verdict ${verdictClass}`}>{verdict.text}</div>
        </div>
      </div>
    </div>
  );
}