// =============================================
// components/CategoryTabs.jsx
// =============================================
import { CATEGORIES } from "../utils/units";

export default function CategoryTabs({ active, onChange }) {
  return (
    <div className="cat-row">
      {Object.entries(CATEGORIES).map(([key, cat]) => (
        <button
          key={key}
          className={`cat-btn${active === key ? " active" : ""}`}
          onClick={() => onChange(key)}
        >
          <span className="cat-icon">{cat.icon}</span>
          {cat.label}
        </button>
      ))}
    </div>
  );
}