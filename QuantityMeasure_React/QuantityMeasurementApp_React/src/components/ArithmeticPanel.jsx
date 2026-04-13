// =============================================
// components/ArithmeticPanel.jsx
// =============================================
import { useState } from "react";
import CategoryTabs from "./CategoryTabs";
import { CATEGORIES, UNIT_SYMBOLS, convert, formatResult } from "../utils/units";
import { saveOperation } from "../utils/api";

const OPS = [
  { key: "add",      label: "＋ Add",      sym: "＋" },
  { key: "subtract", label: "－ Subtract", sym: "－" },
  { key: "divide",   label: "÷ Divide",   sym: "÷"  },
];

function UnitSelect({ value, onChange, units }) {
  return (
    <select className="arith-unit-sel" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Select Unit --</option>
      {units.map(u => <option key={u} value={u}>{UNIT_SYMBOLS[u]} — {u}</option>)}
    </select>
  );
}

export default function ArithmeticPanel() {
  const [category, setCategory] = useState("length");
  const [op, setOp]             = useState("add");
  const [vA, setVA] = useState(""); const [uA, setUA] = useState("");
  const [vB, setVB] = useState(""); const [uB, setUB] = useState("");
  const [result, setResult]     = useState({ value: "—", unit: "", expr: "" });
  const [note,   setNote]       = useState("");

  function handleCategoryChange(cat) {
    setCategory(cat); setVA(""); setUA(""); setVB(""); setUB("");
    setResult({ value: "—", unit: "", expr: "" }); setNote("");
  }

  function handleCalculate() {
    const numA = parseFloat(vA), numB = parseFloat(vB);
    if (isNaN(numA) || isNaN(numB) || !uA || !uB) {
      setResult({ value: "—", unit: "", expr: "Please enter valid numbers and select both units." });
      return;
    }
    setNote("");
    const sA = UNIT_SYMBOLS[uA], sB = UNIT_SYMBOLS[uB];

    if (category === "temperature" && (op === "add" || op === "subtract")) {
      setNote("⚠ Temperature add/subtract shows raw numeric values only.");
    }

    if (op === "divide") {
      let bA, bB, bSym;
      if (category === "temperature") {
        bA = convert(numA, uA, "celsius", category);
        bB = convert(numB, uB, "celsius", category);
        bSym = "°C";
      } else {
        const bu = CATEGORIES[category].units[0];
        bSym = UNIT_SYMBOLS[bu];
        bA = convert(numA, uA, bu, category);
        bB = convert(numB, uB, bu, category);
      }
      if (bB === 0) { setResult({ value: "∞", unit: "", expr: "Cannot divide by zero." }); return; }
      const r = bA / bB;
      setResult({ value: formatResult(r), unit: "× (ratio)", expr: `${vA} ${sA} ÷ ${vB} ${sB} = ${formatResult(r)}` });
      saveOperation("divide", category, numA, uA, numB, uB);
    } else {
      const bBinA = convert(numB, uB, uA, category);
      const opSym = op === "add" ? "+" : "−";
      const r     = op === "add" ? numA + bBinA : numA - bBinA;
      setResult({
        value: formatResult(r),
        unit: sA,
        expr: `${vA} ${sA} ${opSym} ${formatResult(bBinA)} ${sA} = ${formatResult(r)} ${sA}`
      });
      saveOperation(op, category, numA, uA, numB, uB);
    }
  }

  const cat    = CATEGORIES[category];
  const opSym  = OPS.find(o => o.key === op)?.sym || "＋";

  return (
    <div className="mode-panel active">
      <div className="panel-body">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
        <div className="card card-top arith-full-card">
          <div className="card-title">➗ Arithmetic</div>
          <div className="op-tabs">
            {OPS.map(o => (
              <button
                key={o.key}
                className={`op-btn${op === o.key ? " active" : ""}`}
                onClick={() => setOp(o.key)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <div className="arith-inputs-row">
            <div>
              <div className="arith-side-label"><span className="arith-badge">A</span> Value A</div>
              <div className="arith-field-pair">
                <input type="number" className="arith-num-input" placeholder="Enter value"
                  value={vA} onChange={e => setVA(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCalculate()} />
                <UnitSelect value={uA} onChange={setUA} units={cat.units} />
              </div>
            </div>
            <div className="arith-op-col">
              <div className="op-sym-big">{opSym}</div>
            </div>
            <div>
              <div className="arith-side-label"><span className="arith-badge">B</span> Value B</div>
              <div className="arith-field-pair">
                <input type="number" className="arith-num-input" placeholder="Enter value"
                  value={vB} onChange={e => setVB(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleCalculate()} />
                <UnitSelect value={uB} onChange={setUB} units={cat.units} />
              </div>
            </div>
          </div>
          <div className="btn-row">
            <button className="action-btn" onClick={handleCalculate}>🧮 Calculate</button>
          </div>
          {note && <div className="arith-note">{note}</div>}
          <div className="arith-result-full">
            <div className="arf-label">Result</div>
            <div>
              <span className="arf-value">{result.value}</span>
              {result.unit && <span className="arf-unit">{result.unit}</span>}
            </div>
            <div className="arf-expr">{result.expr}</div>
          </div>
        </div>
      </div>
    </div>
  );
}  