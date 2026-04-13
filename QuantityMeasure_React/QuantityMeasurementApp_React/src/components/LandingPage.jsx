// =============================================
// components/LandingPage.jsx
// =============================================
export default function LandingPage({ onOpenApp, onOpenAuth }) {

  return (
    <div className="landing-wrap">
      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-inner">
          <div className="lp-hero-badge">📐 Quantity Measurement App</div>
          <h1 className="lp-hero-h1">
            Measure, Convert<br />&amp; Calculate Units
          </h1>
          <div className="lp-hero-chips">
            <span>✓ Converter</span>
            <span>✓ Comparison</span>
            <span>✓ Arithmetic</span>
          </div>

        </div>
      </section>

      {/* STRIP */}
      <div className="lp-strip">
        <div className="lp-strip-item">⚡ Instant Results</div>
        <div className="lp-strip-item">📐 40+ Units</div>
        <div className="lp-strip-item">🔓 No Login Needed</div>
        <div className="lp-strip-item hi">📜 History on Sign In</div>
      </div>

      {/* CATEGORIES */}
      <section className="lp-section" id="categories">
        <div className="lp-sec-head">
          <h2>Categories</h2>
          <button className="lp-sec-link" onClick={onOpenApp}>Open App →</button>
        </div>
        <div className="lp-cat-grid">
          {[
            { icon:"📏", name:"Length",      desc:"mm · cm · m · km · inch · foot · yard · mile",         badge:"8 units"  },
            { icon:"⚖️", name:"Weight",      desc:"mg · g · kg · metric ton · oz · lb · stone",            badge:"7 units"  },
            { icon:"🧪", name:"Volume",      desc:"mL · L · cup · pint · quart · gallon & more",           badge:"10 units" },
            { icon:"🌡️",name:"Temperature", desc:"Celsius · Fahrenheit · Kelvin",                          badge:"3 units"  },
          ].map(cat => (
            <div className="lp-cat-card" key={cat.name} onClick={onOpenApp}>
              <div className="lp-cat-badge">{cat.badge}</div>
              <span className="lp-cat-emoji">{cat.icon}</span>
              <div className="lp-cat-name">{cat.name}</div>
              <div className="lp-cat-desc">{cat.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">📐 <strong>Quantity Measurement App</strong></div>
          <p>No sign-up required · © 2025</p>
        </div>
      </footer>
    </div>
  );
}