// Currency handling. KWD, BHD, OMR and JOD use 3 decimals (fils / baisa), most others 2.
export const CURRENCIES = {
  KWD: { label: "KWD", labelAr: "د.ك", decimals: 3 },
  SAR: { label: "SAR", labelAr: "ر.س", decimals: 2 },
  AED: { label: "AED", labelAr: "د.إ", decimals: 2 },
  QAR: { label: "QAR", labelAr: "ر.ق", decimals: 2 },
  BHD: { label: "BHD", labelAr: "د.ب", decimals: 3 },
  OMR: { label: "OMR", labelAr: "ر.ع", decimals: 3 },
  USD: { label: "USD", labelAr: "دولار", decimals: 2 },
  EUR: { label: "EUR", labelAr: "يورو", decimals: 2 },
  GBP: { label: "GBP", labelAr: "جنيه", decimals: 2 },
};

export function currencyInfo(code) {
  return CURRENCIES[code] || { label: code || "", labelAr: code || "", decimals: 2 };
}

// Round to the currency's smallest unit without floating-point drift.
export function roundMoney(n, code) {
  const d = currencyInfo(code).decimals;
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f + Number.EPSILON) / f;
}

// "KWD 1,234.500" in English, "1,234.500 د.ك" in Arabic (Western digits, as commonly used in Kuwait).
export function formatMoney(n, code, lang = "en") {
  const c = currencyInfo(code);
  const v = roundMoney(n, code);
  const neg = v < 0;
  const s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals });
  const body = lang === "ar" ? `${s} ${c.labelAr}` : `${c.label} ${s}`;
  return neg ? `− ${body}` : body;
}

// Quotation totals. Tax is optional (Kuwait has no VAT, so it defaults to 0 and is hidden).
export function quoteTotals(price, pax, code) {
  const items = (price.items || []).reduce((a, i) => a + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
  const discount = Math.min(items, Math.max(0, Number(price.discount) || 0));
  const afterDiscount = items - discount;
  const taxPct = Number(price.taxPct) || 0;
  const tax = roundMoney(afterDiscount * taxPct / 100, code);
  const total = roundMoney(afterDiscount + tax, code);
  const people = (Number(pax?.adults) || 0) + (Number(pax?.children) || 0);
  return {
    items: roundMoney(items, code), discount: roundMoney(discount, code), taxPct, tax, total,
    perPerson: people > 0 ? roundMoney(total / people, code) : 0, people,
  };
}
