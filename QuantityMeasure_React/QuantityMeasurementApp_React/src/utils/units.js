// =============================================
// utils/units.js — Unit definitions & conversion
// =============================================

export const CATEGORIES = {
  length: {
    label: "Length", icon: "📏",
    units: ["millimeter","centimeter","meter","kilometer","inch","foot","yard","mile"],
    toBase: {
      millimeter: 0.001, centimeter: 0.01, meter: 1, kilometer: 1000,
      inch: 0.0254, foot: 0.3048, yard: 0.9144, mile: 1609.344
    }
  },
  weight: {
    label: "Weight", icon: "⚖️",
    units: ["milligram","gram","kilogram","metric ton","ounce","pound","stone"],
    toBase: {
      milligram: 0.000001, gram: 0.001, kilogram: 1, "metric ton": 1000,
      ounce: 0.0283495, pound: 0.453592, stone: 6.35029
    }
  },
  volume: {
    label: "Volume", icon: "🧪",
    units: ["milliliter","liter","cubic meter","teaspoon","tablespoon","cup","fluid ounce","pint","quart","gallon"],
    toBase: {
      milliliter: 0.001, liter: 1, "cubic meter": 1000,
      teaspoon: 0.00492892, tablespoon: 0.0147868, cup: 0.236588,
      "fluid ounce": 0.0295735, pint: 0.473176, quart: 0.946353, gallon: 3.78541
    }
  },
  temperature: {
    label: "Temperature", icon: "🌡️",
    units: ["celsius","fahrenheit","kelvin"],
    toBase: null
  }
};

export const UNIT_SYMBOLS = {
  millimeter:"mm", centimeter:"cm", meter:"m", kilometer:"km",
  inch:"in", foot:"ft", yard:"yd", mile:"mi",
  milligram:"mg", gram:"g", kilogram:"kg", "metric ton":"t",
  ounce:"oz", pound:"lb", stone:"st",
  milliliter:"mL", liter:"L", "cubic meter":"m³",
  teaspoon:"tsp", tablespoon:"tbsp", cup:"cup",
  "fluid ounce":"fl oz", pint:"pt", quart:"qt", gallon:"gal",
  celsius:"°C", fahrenheit:"°F", kelvin:"K"
};

// Backend unit name map
const FRONTEND_TO_API_UNIT = {
  millimeter:"CENTIMETERS", centimeter:"CENTIMETERS", meter:"YARDS",
  kilometer:"YARDS", inch:"INCHES", foot:"FEET", yard:"YARDS", mile:"YARDS",
  milligram:"GRAM", gram:"GRAM", kilogram:"KILOGRAM", "metric ton":"KILOGRAM",
  ounce:"POUND", pound:"POUND", stone:"POUND",
  milliliter:"MILLILITRE", liter:"LITRE", "cubic meter":"LITRE",
  teaspoon:"MILLILITRE", tablespoon:"MILLILITRE", cup:"LITRE",
  "fluid ounce":"MILLILITRE", pint:"LITRE", quart:"LITRE", gallon:"GALLON",
  celsius:"CELSIUS", fahrenheit:"FAHRENHEIT", kelvin:"KELVIN"
};

export const CATEGORY_TO_MTYPE = {
  length:"LengthUnit", weight:"WeightUnit", volume:"VolumeUnit", temperature:"TemperatureUnit"
};

export function toApiUnitName(unitName) {
  const key = (unitName || "").trim().toLowerCase();
  return FRONTEND_TO_API_UNIT[key] || unitName.trim().toUpperCase().replace(/\s+/g, "_");
}

export function convert(value, fromUnit, toUnit, category) {
  if (value === "" || value === null || value === undefined) return "";
  const v = parseFloat(value);
  if (isNaN(v)) return "";
  if (fromUnit === toUnit) return v;
  if (category === "temperature") {
    let c;
    if (fromUnit === "celsius")         c = v;
    else if (fromUnit === "fahrenheit") c = (v - 32) * 5 / 9;
    else                                c = v - 273.15;
    if (toUnit === "celsius")    return c;
    if (toUnit === "fahrenheit") return c * 9 / 5 + 32;
    return c + 273.15;
  }
  const cat    = CATEGORIES[category];
  const inBase = v * cat.toBase[fromUnit];
  return inBase / cat.toBase[toUnit];
}

export function formatResult(val) {
  if (val === "" || val === null || val === undefined) return "—";
  const n = parseFloat(val);
  if (isNaN(n)) return "—";
  if (Math.abs(n) >= 1e10 || (Math.abs(n) < 1e-6 && n !== 0)) return n.toExponential(4);
  if (Math.abs(n) >= 1000) return parseFloat(n.toPrecision(8)).toLocaleString();
  return parseFloat(n.toPrecision(8)).toString();
}