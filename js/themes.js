// PDF templates. Each one is a few colours plus two style choices; agencies can save their own.
export const PRESETS = [
  { id: "gulf-navy",   name: "Gulf Navy",   primary: "#12304F", accent: "#B8892E", paper: "#FFFFFF", heading: "serif", cover: "photo" },
  { id: "sea-glass",   name: "Sea Glass",   primary: "#0E5A63", accent: "#E2A63B", paper: "#FFFFFF", heading: "sans",  cover: "split" },
  { id: "desert-rose", name: "Desert Rose", primary: "#6E2C32", accent: "#C98B5A", paper: "#FFFFFF", heading: "serif", cover: "band" },
  { id: "palm-oasis",  name: "Palm Oasis",  primary: "#234B3A", accent: "#C4A253", paper: "#FFFFFF", heading: "serif", cover: "photo" },
  { id: "graphite",    name: "Graphite",    primary: "#23272E", accent: "#E4572E", paper: "#FFFFFF", heading: "sans",  cover: "split" },
];

export const COVER_STYLES = [
  ["photo", "Full photo"], ["split", "Colour panel and photo"], ["band", "Colour band on top"],
];

const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;
export function normHex(v, fallback = "#000000") {
  const m = HEX.exec((v || "").trim());
  if (!m) return fallback;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return "#" + h.toUpperCase();
}
const rgb = (h) => { const n = parseInt(normHex(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (r, g, b) => "#" + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("").toUpperCase();
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function lum(h) { const c = rgb(h).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
export function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
export const onColour = (bg) => (contrast(bg, "#FFFFFF") >= contrast(bg, "#16202B") ? "#FFFFFF" : "#16202B");

export function findTemplate(id, profile) {
  return (profile.templates || []).find((t) => t.id === id) || PRESETS.find((t) => t.id === id) || PRESETS[0];
}

// CSS variables for a template. Derived tints keep custom colours looking intentional.
export function templateVars(tpl) {
  const p = normHex(tpl.primary, "#12304F"), a = normHex(tpl.accent, "#B8892E"), paper = normHex(tpl.paper, "#FFFFFF");
  const ink = contrast(paper, "#16202B") >= 4.5 ? "#16202B" : "#FFFFFF";
  // Use the primary for headings only if it is readable on the paper; otherwise fall back to the ink colour.
  const head = contrast(p, paper) >= 4.5 ? p : ink;
  const accentText = contrast(a, paper) >= 3 ? a : head;
  return {
    "--p": p, "--on-p": onColour(p), "--a": a, "--on-a": onColour(a), "--paper": paper, "--ink": ink,
    "--head": head, "--a-text": accentText,
    "--muted": mix(ink, paper, 0.42), "--line": mix(p, paper, 0.84), "--soft": mix(p, paper, 0.94), "--soft2": mix(a, paper, 0.88),
    "--fd": tpl.heading === "sans" ? "var(--sans)" : "var(--serif)",
    "--fd-ar": tpl.heading === "sans" ? "var(--sans-ar)" : "var(--serif-ar)",
  };
}

// Readability warnings shown in the template editor.
export function templateWarnings(tpl) {
  const w = [];
  const p = normHex(tpl.primary), a = normHex(tpl.accent), paper = normHex(tpl.paper, "#FFFFFF");
  if (contrast(p, paper) < 3) w.push("The main colour is too light against the page colour, so headings will use dark text instead.");
  if (contrast(a, paper) < 2) w.push("The accent colour is hard to see on the page colour.");
  if (contrast(p, a) < 1.5) w.push("The main and accent colours are very similar; the accent won't stand out.");
  return w;
}
