// =============================================
// components/ConverterPanel.jsx
// =============================================
import { useState } from "react";
import CategoryTabs from "./CategoryTabs";
import { CATEGORIES, UNIT_SYMBOLS, convert, formatResult } from "../utils/units";
import { saveOperation } from "../utils/api";

function UnitSelect({ value, onChange, units }) {
  return (
    <select className="unit-select" value={value} onChange={e => onChange(e.target.value)}>
      <option value="">-- Select Unit --</option>
      {units.map(u => (
        <option key={u} value={u}>{UNIT_SYMBOLS[u]} — {u}</option>
      ))}
    </select>
  );
}

export default function ConverterPanel() {
  const [category, setCategory] = useState("length");
  const [fromVal,  setFromVal]  = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit,   setToUnit]   = useState("");
  const [result,   setResult]   = useState(null);
  const [error,    setError]    = useState("");

  function handleCategoryChange(cat) {
    setCategory(cat);
    setFromVal(""); setFromUnit(""); setToUnit(""); setResult(null); setError("");
  }

  function handleSwap() {
    setFromUnit(toUnit); setToUnit(fromUnit); setResult(null);
  }

  function handleConvert() {
    if (!fromVal || !fromUnit || !toUnit) {
      setError("Please enter a value and select both units."); return;
    }
    setError("");
    const res = convert(fromVal, fromUnit, toUnit, category);
    const fmt = formatResult(res);
    setResult({ value: fmt, unit: toUnit, formula: `${fromVal} ${UNIT_SYMBOLS[fromUnit]} = ${fmt} ${UNIT_SYMBOLS[toUnit]}` });
    const numVal = parseFloat(fromVal), numRes = parseFloat(res);
    if (!isNaN(numVal) && !isNaN(numRes))
      saveOperation("convert", category, numVal, fromUnit, numRes, toUnit);
  }

  const cat = CATEGORIES[category];

  return (
    <div className="mode-panel active">
      <div className="panel-body">
        <CategoryTabs active={category} onChange={handleCategoryChange} />
        <div className="card card-top">
          <div className="card-title">
            <span>{cat.icon}</span> {cat.label} Converter
          </div>
          <div className="converter-row">
            <div>
              <label className="inp-label">From</label>
              <div className="field-pair">
                <input
                  type="number" className="num-input" placeholder="Enter value"
                  value={fromVal}
                  onChange={e => { setFromVal(e.target.value); setResult(null); }}
                  onKeyDown={e => e.key === "Enter" && handleConvert()}
                />
                <UnitSelect value={fromUnit} onChange={setFromUnit} units={cat.units} />
              </div>
            </div>
            <div className="swap-wrap">
              <button className="swap-btn" onClick={handleSwap} title="Swap">⇄</button>
            </div>
            <div>
              <label className="inp-label">To</label>
              <div className="field-pair">
                <UnitSelect value={toUnit} onChange={setToUnit} units={cat.units} />
              </div>
            </div>
          </div>
          <div className="btn-row">
            <button className="action-btn" onClick={handleConvert}>🔄 Convert</button>
          </div>
          {error && <div className="conv-error" style={{ display: "block" }}>{error}</div>}
          {result && (
            <div className="result-box has-result">
              <span className="result-label">Result</span>
              <span className="result-value">{result.value}</span>
              <span className="result-unit">{UNIT_SYMBOLS[result.unit]}</span>
              <span className="result-formula">{result.formula}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}