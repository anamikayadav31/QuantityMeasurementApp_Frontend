// =============================================
// components/HistoryModal.jsx
// =============================================
import { useState, useEffect } from "react";
import { fetchHistory } from "../utils/api";

const OPS = ["all","CONVERT","COMPARE","ADD","SUBTRACT","DIVIDE"];

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export default function HistoryModal({ isOpen, onClose }) {
  const [data,   setData]   = useState([]);
  const [filter, setFilter] = useState("all");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [errMsg, setErrMsg] = useState("");

  function loadData() {
    setStatus("loading");
    setErrMsg("");
    fetchHistory()
      .then(d => { setData(Array.isArray(d) ? d : []); setStatus("idle"); })
      .catch(e => {
        const msg = e.message || "Unknown error";
        const isNetwork = msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network");
        setErrMsg(isNetwork
          ? "API server is not running. Please start it:\n→ Run your ASP.NET project on port 5271"
          : msg
        );
        setStatus("error");
      });
  }

  useEffect(() => {
    if (!isOpen) return;
    setFilter("all");
    loadData();
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filter === "all"
    ? data
    : data.filter(i => (i.operation || i.Operation) === filter);

  return (
    <div className="modal-overlay open" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal hist-modal">

        {/* Header */}
        <div className="modal-hd">
          <span className="modal-hd-title">
            🗂️ All Operations{" "}
            <span style={{ fontWeight:400, fontSize:13, color:"rgba(255,255,255,0.7)" }}>
              from Database
            </span>
          </span>
          <button className="modal-x" onClick={onClose}>✕</button>
        </div>

        {/* Filter bar — fixed, never scrolls */}
        <div className="hist-filter-bar">
          {OPS.map(op => (
            <button
              key={op}
              className={`hist-filter-btn${filter === op ? " active" : ""}`}
              onClick={() => setFilter(op)}
            >
              {op === "all" ? "All" : cap(op.toLowerCase())}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="hist-content">

          {/* Loading */}
          {status === "loading" && (
            <div className="hist-empty">
              <div className="hist-spinner">⏳</div>
              Loading from database…
            </div>
          )}

          {/* Error — with retry */}
          {status === "error" && (
            <div className="hist-error-box">
              <div className="hist-error-icon">⚠️</div>
              <div className="hist-error-title">Could not connect to database</div>
              <div className="hist-error-msg">
                {errMsg.split("\n").map((line, i) => (
                  <span key={i}>{line}{i < errMsg.split("\n").length - 1 && <br/>}</span>
                ))}
              </div>
              <button className="hist-retry-btn" onClick={loadData}>
                🔄 Retry
              </button>
            </div>
          )}

          {/* Empty */}
          {status === "idle" && filtered.length === 0 && (
            <div className="hist-empty">📭 No operations found.</div>
          )}

          {/* Rows */}
          {status === "idle" && filtered.map((item, idx) => {
            const op     = item.operation    || item.Operation    || "OPERATION";
            const op1    = item.operand1     || item.Operand1     || "—";
            const op2    = item.operand2     || item.Operand2     || "";
            const result = item.result       || item.Result       || "";
            const hasErr = item.hasError     ?? item.HasError     ?? false;
            const eMsg   = item.errorMessage || item.ErrorMessage || "";
            const rawTs  = item.timestamp || item.Timestamp;
            const ts     = rawTs
              ? new Date(rawTs).toLocaleDateString(undefined, {
                  day: "2-digit", month: "short", year: "numeric"
                })
              : "";

            let expr = op1;
            if (op2)               expr += ` → ${op2}`;
            if (result && !hasErr)  expr += ` = ${result}`;

            return (
              <div className="hist-row" key={idx}>
                <span className={`hist-op-badge${hasErr ? " err" : ""}`}>{op}</span>
                <div className="hist-expr">
                  {expr}
                  {hasErr && <span className="hist-err-msg">⚠ {eMsg}</span>}
                </div>
                <span className="hist-time">{ts}</span>
              </div>
            );
          })}

        </div>
      </div>
    </div>
  );
}