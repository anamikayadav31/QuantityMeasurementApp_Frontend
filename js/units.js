// =============================================
// js/units.js
// Unit definitions, symbols, quick references
// and conversion functions
// =============================================

// CATEGORIES: all unit data grouped by type.
// Each entry holds: label, icon, units array, toBase multipliers, and quickRef presets.
// Temperature uses toBase: null because its conversion is non-linear (handled separately).
const CATEGORIES = {
  length: {
    label: "Length",
    icon:  "📏",
    units: ["millimeter","centimeter","meter","kilometer","inch","foot","yard","mile"],
    // toBase: multiply by this value to convert the unit to meters
    toBase: {
      millimeter: 0.001, centimeter: 0.01,  meter: 1,       kilometer: 1000,
      inch: 0.0254,      foot: 0.3048,       yard: 0.9144,   mile: 1609.344
    },
    quickRef: [
      { from:"1 inch",  to:"2.54 cm",   fv:1,   fu:"inch",       tu:"centimeter" },
      { from:"1 foot",  to:"30.48 cm",  fv:1,   fu:"foot",       tu:"centimeter" },
      { from:"1 mile",  to:"1.609 km",  fv:1,   fu:"mile",       tu:"kilometer"  },
      { from:"1 yard",  to:"0.914 m",   fv:1,   fu:"yard",       tu:"meter"      },
      { from:"1 km",    to:"0.621 mi",  fv:1,   fu:"kilometer",  tu:"mile"       },
      { from:"100 cm",  to:"1 m",       fv:100, fu:"centimeter", tu:"meter"      }
    ]
  },
  weight: {
    label: "Weight",
    icon:  "⚖️",
    units: ["milligram","gram","kilogram","metric ton","ounce","pound","stone"],
    // toBase: multiply by this value to convert the unit to kilograms
    toBase: {
      milligram: 0.000001, gram: 0.001,    kilogram: 1,     "metric ton": 1000,
      ounce: 0.0283495,    pound: 0.453592, stone: 6.35029
    },
    quickRef: [
      { from:"1 kg",    to:"2.205 lb",  fv:1, fu:"kilogram",   tu:"pound"     },
      { from:"1 lb",    to:"453.6 g",   fv:1, fu:"pound",      tu:"gram"      },
      { from:"1 oz",    to:"28.35 g",   fv:1, fu:"ounce",      tu:"gram"      },
      { from:"1 stone", to:"6.35 kg",   fv:1, fu:"stone",      tu:"kilogram"  },
      { from:"1 t",     to:"1000 kg",   fv:1, fu:"metric ton", tu:"kilogram"  },
      { from:"1 g",     to:"1000 mg",   fv:1, fu:"gram",       tu:"milligram" }
    ]
  },
  volume: {
    label: "Volume",
    icon:  "🧪",
    units: ["milliliter","liter","cubic meter","teaspoon","tablespoon","cup","fluid ounce","pint","quart","gallon"],
    // toBase: multiply by this value to convert the unit to liters
    toBase: {
      milliliter: 0.001,      liter: 1,           "cubic meter": 1000,
      teaspoon: 0.00492892,   tablespoon: 0.0147868, cup: 0.236588,
      "fluid ounce": 0.0295735, pint: 0.473176,   quart: 0.946353, gallon: 3.78541
    },
    quickRef: [
      { from:"1 gallon", to:"3.785 L",   fv:1, fu:"gallon",     tu:"liter"       },
      { from:"1 L",      to:"4.227 cups",fv:1, fu:"liter",      tu:"cup"         },
      { from:"1 cup",    to:"8 fl oz",   fv:1, fu:"cup",        tu:"fluid ounce" },
      { from:"1 pint",   to:"473.2 mL",  fv:1, fu:"pint",       tu:"milliliter"  },
      { from:"1 quart",  to:"2 pints",   fv:1, fu:"quart",      tu:"pint"        },
      { from:"1 tbsp",   to:"3 tsp",     fv:1, fu:"tablespoon", tu:"teaspoon"    }
    ]
  },
  temperature: {
    label: "Temperature",
    icon:  "🌡️",
    units: ["celsius","fahrenheit","kelvin"],
    toBase: null, // non-linear; handled directly in convert()
    quickRef: [
      { from:"0°C",      to:"32°F",      fv:0,      fu:"celsius",    tu:"fahrenheit" },
      { from:"100°C",    to:"212°F",     fv:100,    fu:"celsius",    tu:"fahrenheit" },
      { from:"37°C",     to:"98.6°F",    fv:37,     fu:"celsius",    tu:"fahrenheit" },
      { from:"0 K",      to:"-273.15°C", fv:0,      fu:"kelvin",     tu:"celsius"    },
      { from:"212°F",    to:"100°C",     fv:212,    fu:"fahrenheit", tu:"celsius"    },
      { from:"273.15 K", to:"0°C",       fv:273.15, fu:"kelvin",     tu:"celsius"    }
    ]
  }
};

// UNIT_SYMBOLS: maps full unit name to its display abbreviation (e.g. "kilogram" → "kg")
const UNIT_SYMBOLS = {
  millimeter:"mm",  centimeter:"cm",   meter:"m",      kilometer:"km",
  inch:"in",        foot:"ft",         yard:"yd",       mile:"mi",
  milligram:"mg",   gram:"g",          kilogram:"kg",   "metric ton":"t",
  ounce:"oz",       pound:"lb",        stone:"st",
  milliliter:"mL",  liter:"L",         "cubic meter":"m³",
  teaspoon:"tsp",   tablespoon:"tbsp", cup:"cup",
  "fluid ounce":"fl oz", pint:"pt",    quart:"qt",      gallon:"gal",
  celsius:"°C",     fahrenheit:"°F",   kelvin:"K"
};

/**
 * Converts a value from one unit to another within the same category.
 * For non-temperature: value → base unit → target unit via toBase multipliers.
 * For temperature: converts through Celsius as an intermediate step.
 * Returns "" for empty/invalid input, or the numeric result.
 */
function convert(value, fromUnit, toUnit, category) {
  if (value === "" || value === null || value === undefined) return "";
  const v = parseFloat(value);
  if (isNaN(v)) return "";
  if (fromUnit === toUnit) return v;

  if (category === "temperature") {
    // Step 1: convert any temperature to Celsius
    let c;
    if (fromUnit === "celsius")         c = v;
    else if (fromUnit === "fahrenheit") c = (v - 32) * 5 / 9;
    else                                c = v - 273.15;  // kelvin → celsius

    // Step 2: convert Celsius to target unit
    if (toUnit === "celsius")     return c;
    if (toUnit === "fahrenheit")  return c * 9 / 5 + 32;
    return c + 273.15;  // celsius → kelvin
  }

  // Non-temperature: convert to base unit, then to target unit
  const cat    = CATEGORIES[category];
  const inBase = v * cat.toBase[fromUnit];
  return inBase / cat.toBase[toUnit];
}

/**
 * Formats a numeric result for clean display:
 * - Returns "—" for empty/invalid values
 * - Uses exponential notation for very large (≥1e10) or very small (<1e-6) numbers
 * - Adds locale-formatted commas for numbers ≥ 1000
 * - Strips trailing zeros via toPrecision(8)
 */
function formatResult(val) {
  if (val === "" || val === null || val === undefined) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  if (Math.abs(n) >= 1e10 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(4);
  if (Math.abs(n) >= 1000) return parseFloat(n.toPrecision(8)).toLocaleString();
  return parseFloat(n.toPrecision(8)).toString();
}