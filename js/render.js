// Builds the A4 pages of the itinerary and splits long sections across pages.
import { t, cabinName, durationText, paxText, fmtDate } from "./i18n.js";
import { formatMoney, quoteTotals } from "./money.js";
import { airportName, airlineName } from "./codes.js";
import { findTemplate, templateVars } from "./themes.js";
import { lines } from "./model.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ---------- language helpers ----------
// lang: "en" | "ar" | "bi" (bilingual). In bilingual mode English leads and Arabic follows.
const AR = 'lang="ar" dir="rtl"';
function val(o, k, lg) { return lg === "ar" ? (o[k + "Ar"] || o[k] || "") : (o[k] || ""); }
function hasAr(o, k) { const a = (o[k + "Ar"] || "").trim(); return a && a !== (o[k] || "").trim(); }

function txt(c, o, k, tag = "span", cls = "") {
  if (c.lang !== "bi") { const v = val(o, k, c.lang); return v ? `<${tag} class="${cls}">${esc(v)}</${tag}>` : ""; }
  const en = o[k] ? `<${tag} class="${cls}">${esc(o[k])}</${tag}>` : "";
  const ar = hasAr(o, k) ? `<${tag} class="${cls} ar" ${AR}>${esc(o[k + "Ar"])}</${tag}>` : "";
  return en + ar;
}
function lab(c, key) {
  if (c.lang !== "bi") return esc(t(key, c.lang));
  return `${esc(t(key, "en"))}<span class="lab-ar" ${AR}>${esc(t(key, "ar"))}</span>`;
}
function para(c, o, k) {
  const one = (s, attrs = "") => s ? `<p ${attrs}>${esc(s).replace(/\n/g, "<br>")}</p>` : "";
  if (c.lang !== "bi") return one(val(o, k, c.lang));
  return one(o[k]) + (hasAr(o, k) ? one(o[k + "Ar"], `class="ar" ${AR}`) : "");
}
function list(c, o, k, cls = "") {
  const ul = (items, attrs = "") => items.length ? `<ul class="${cls}" ${attrs}>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
  if (c.lang !== "bi") return ul(lines(val(o, k, c.lang)));
  const en = ul(lines(o[k])), ar = hasAr(o, k) ? ul(lines(o[k + "Ar"]), AR) : "";
  return ar ? `<div class="bi-cols">${en}${ar}</div>` : en;
}
// For formats where bilingual pages use the English form (dates, money).
const L1 = (c) => (c.lang === "ar" ? "ar" : "en");

// ---------- page frame ----------
function heading(c, key, cont) {
  const more = (lg) => cont ? ` <small>${esc(t("continued", lg))}</small>` : "";
  if (c.lang !== "bi") return `<h2>${esc(t(key, c.lang))}${more(c.lang)}</h2>`;
  return `<div class="h-bi"><h2>${esc(t(key, "en"))}${more("en")}</h2><h2 class="ar" ${AR}>${esc(t(key, "ar"))}${more("ar")}</h2></div>`;
}
function brand(c) {
  const p = c.profile;
  const name = c.lang === "ar" ? (p.nameAr || p.name) : p.name;
  return p.logo
    ? `<img class="brand-logo" src="${esc(p.logo)}" alt="${esc(name)}">`
    : `<div class="brand-mark" aria-label="${esc(name)}">${esc((name || "T").trim().charAt(0))}</div>`;
}
function footer(c) {
  const p = c.profile;
  const bits = [c.lang === "ar" ? (p.nameAr || p.name) : p.name, p.phone, p.email, p.website].filter(Boolean).map((x) => `<span ${/^[+\d\s]+$/.test(x) ? 'dir="ltr"' : ""}>${esc(x)}</span>`);
  return `<footer class="s-foot"><div class="s-contact">${bits.join("")}</div><div class="pgno"></div></footer>`;
}
function sheetHtml(c, key, cont, body = "") {
  return `<section class="sheet" dir="${c.dir}" lang="${c.lang === "ar" ? "ar" : "en"}">
    <header class="s-head">${heading(c, key, cont)}${brand(c)}</header>
    <div class="s-body">${body}</div>${footer(c)}</section>`;
}

// ---------- cover ----------
function cover(c) {
  const { trip, profile: p } = c;
  const tpl = c.tpl;
  const lg = L1(c);
  const dest = val(trip, "destination", lg) || val(trip, "title", lg);
  const photo = trip.cover
    ? `<img class="cv-img" src="${esc(trip.cover)}" alt="${esc(dest)}">`
    : `<div class="cv-img cv-blank"><span>${esc(dest)}</span></div>`;
  const route = lines((val(trip, "route", lg) || "").replace(/[,،]/g, "\n"));
  const fact = (key, v) => v ? `<div class="fact"><span class="fact-k">${lab(c, key)}</span><span class="fact-v">${v}</span></div>` : "";
  const days = trip.days.length;
  const facts = `<div class="facts">
      ${fact("duration", esc(durationText(days, lg)) + (c.lang === "bi" ? `<span class="ar" ${AR}>${esc(durationText(days, "ar"))}</span>` : ""))}
      ${fact("destination", txt(c, trip, "destination"))}
      ${fact("travellers", esc(paxText(trip.pax, lg)) + (c.lang === "bi" ? `<span class="ar" ${AR}>${esc(paxText(trip.pax, "ar"))}</span>` : ""))}
      ${fact("startDate", esc(fmtDate(trip.start, lg)) + (c.lang === "bi" ? `<span class="ar" ${AR}>${esc(fmtDate(trip.start, "ar"))}</span>` : ""))}
    </div>`;
  const routeHtml = route.length > 1 ? `<ol class="route" aria-label="${esc(t("route", lg))}">${route.map((r) => `<li>${esc(r)}</li>`).join("")}</ol>` : "";
  const name = c.lang === "ar" ? (p.nameAr || p.name) : p.name;
  const tag = c.lang === "ar" ? (p.taglineAr || p.tagline) : p.tagline;
  const titleBlock = `<div class="cv-title">
      <div class="cv-kicker">${lab(c, "itinerary")}</div>
      ${txt(c, trip, "title", "h1")}
      ${trip.client || trip.clientAr ? `<p class="cv-for">${lab(c, "preparedFor")} ${c.lang === "bi" ? txt(c, trip, "client", "span", "cv-client") : `<span class="cv-client">${esc(val(trip, "client", lg))}</span>`}</p>` : ""}
    </div>`;
  const brandRow = `<div class="cv-brand">${brand(c)}<div><b>${esc(name)}</b>${tag ? `<span>${esc(tag)}</span>` : ""}</div></div>`;
  const sign = c.lang === "ar" ? (p.signNameAr || p.signName) : p.signName;
  const reach = [p.phone, p.whatsapp && p.whatsapp !== p.phone ? `WhatsApp ${p.whatsapp}` : "", p.email].filter(Boolean);
  const contact = (sign || reach.length) ? `<div class="cv-contact"><span class="cv-contact-k">${lab(c, "consultant")}</span>
      <b>${esc(sign || name)}</b><div class="cv-contact-l">${reach.map((x) => `<span dir="ltr">${esc(x)}</span>`).join("")}</div></div>` : "";
  return `<section class="sheet cover cover-${tpl.cover || "photo"}" dir="${c.dir}" lang="${c.lang === "ar" ? "ar" : "en"}">
    <div class="cv-visual">${photo}<div class="cv-shade"></div>${brandRow}${titleBlock}</div>
    <div class="cv-info">${facts}${routeHtml}${contact}</div>
    ${footer(c)}</section>`;
}

// ---------- sections (each returns { key, blocks }) ----------
function overview(c) {
  const { trip } = c;
  const lg = L1(c);
  const blocks = [];
  const intro = para(c, trip, "overview");
  const hl = list(c, trip, "highlights", "hl");
  if (intro || hl) blocks.push(`<div class="blk">${intro ? `<div class="lead">${intro}</div>` : ""}${hl ? `<h3>${lab(c, "highlights")}</h3>${hl}` : ""}</div>`);
  if (trip.show.hotels && trip.hotels.length) {
    blocks.push(`<div class="blk"><h3>${lab(c, "hotels")}</h3><table class="tbl"><thead><tr>
      <th>${lab(c, "city")}</th><th>${lab(c, "hotel")}</th><th>${lab(c, "room")}</th><th>${lab(c, "meals")}</th><th class="num">${lab(c, "nights")}</th></tr></thead><tbody>
      ${trip.hotels.map((h) => `<tr><td>${txt(c, h, "city")}</td><td><b>${esc(h.name)}</b></td><td>${txt(c, h, "room")}</td><td>${txt(c, h, "meals")}</td><td class="num">${esc(h.nights)}</td></tr>`).join("")}
      </tbody></table></div>`);
  }
  if (trip.days.length) {
    blocks.push(`<div class="blk"><h3>${lab(c, "dayPlan")}</h3><table class="tbl compact"><thead><tr><th>${lab(c, "day")}</th><th>${lab(c, "date")}</th><th>${lab(c, "plan")}</th><th>${lab(c, "overnight")}</th></tr></thead><tbody>
      ${trip.days.map((d, i) => `<tr><td class="num-l">${i + 1}</td><td class="nowrap">${esc(fmtDate(trip.start, lg, i))}</td><td>${txt(c, d, "title")}</td><td>${txt(c, d, "overnight") || "–"}</td></tr>`).join("")}
      </tbody></table></div>`);
  }
  return { key: "overview", blocks };
}

const PLANE = `<svg class="plane" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15.5v-1.8l-8-5V3.4a1.4 1.4 0 0 0-2.8 0v5.3l-8 5v1.8l8-2.4v5.1l-2 1.5v1.4l3.4-1 3.4 1v-1.4l-2-1.5v-5.1z"/></svg>`;

function boardingPass(c, f) {
  const lg = L1(c);
  const place = (code) => `<span class="bp-city">${esc(airportName(code, lg))}</span>${c.lang === "bi" && airportName(code, "ar") !== code ? `<span class="bp-city ar" ${AR}>${esc(airportName(code, "ar"))}</span>` : ""}`;
  const air = `${esc(airlineName(f.carrier, lg))}${c.lang === "bi" && airlineName(f.carrier, "ar") !== f.carrier ? `<span class="ar" ${AR}>${esc(airlineName(f.carrier, "ar"))}</span>` : ""}`;
  const kind = f.statusKind || "confirmed";
  const stub = (key, v) => v ? `<div class="bp-kv"><span>${lab(c, key)}</span><b>${v}</b></div>` : "";
  const cabin = cabinName(f.cabin, lg === "ar" ? 1 : 0, f.cabinType);
  const cabinCell = cabin ? `${esc(cabin)}${f.cabin ? ` <small dir="ltr">(${esc(f.cabin)})</small>` : ""}` : (f.cabin ? `<span dir="ltr">${esc(f.cabin)}</span>` : "");
  return `<article class="blk bp">
    <div class="bp-main">
      <div class="bp-top"><span class="bp-air">${air}</span><span class="bp-no" dir="ltr">${esc(f.carrier)} ${esc(f.number)}</span><span class="bp-date">${esc(fmtDate(f.date, lg, 0, true))}</span></div>
      <div class="bp-route">
        <div class="bp-pt"><b class="bp-code" dir="ltr">${esc(f.from)}</b>${place(f.from)}<time dir="ltr">${esc(f.dep)}</time></div>
        <div class="bp-line" aria-hidden="true">${PLANE}</div>
        <div class="bp-pt bp-end"><b class="bp-code" dir="ltr">${esc(f.to)}</b>${place(f.to)}<time dir="ltr">${esc(f.arr)}${+f.arrOffset ? `<sup>${f.arrOffset > 0 ? "+" : ""}${esc(f.arrOffset)}</sup>` : ""}</time></div>
      </div>
      ${f.operatedBy ? `<div class="bp-op">${lab(c, "operatedBy")}: ${esc(f.operatedBy)}</div>` : ""}
    </div>
    <div class="bp-stub">
      ${stub("cabin", cabinCell)}
      ${stub("status", `<span class="st st-${kind}">${lab(c, kind)}</span>`)}
      ${stub("airlineRef", f.airlineRef ? `<span dir="ltr">${esc(f.airlineRef)}</span>` : "")}
      ${stub("baggage", f.baggage ? `<span dir="ltr">${esc(f.baggage)}</span>` : "")}
    </div></article>`;
}

function flights(c) {
  const { trip } = c;
  if (!trip.show.flights || !trip.flights.length) return null;
  const blocks = [];
  const pax = trip.passengers || [];
  if (trip.locator || pax.length) {
    blocks.push(`<div class="blk fl-meta">
      ${trip.locator ? `<div class="fl-ref"><span>${lab(c, "bookingRef")}</span><b dir="ltr">${esc(trip.locator)}</b></div>` : ""}
      ${pax.length ? `<div class="fl-pax"><span>${lab(c, "passengers")}</span><ol>${pax.map((p) => `<li>${esc(p.name)}${p.type !== "adult" ? ` <small>(${esc(t(p.type, L1(c)))})</small>` : ""}</li>`).join("")}</ol></div>` : ""}
    </div>`);
  }
  for (const f of trip.flights) blocks.push(boardingPass(c, f));
  blocks.push(`<p class="blk note">${c.lang === "bi" ? `${esc(t("flightNote", "en"))}<span class="ar" ${AR}>${esc(t("flightNote", "ar"))}</span>` : esc(t("flightNote", c.lang))}</p>`);
  return { key: "flights", blocks };
}

function days(c) {
  const { trip } = c;
  const lg = L1(c);
  const mealName = (k) => c.lang === "bi" ? `${t(k, "en")} / ${t(k, "ar")}` : t(k, lg);
  return {
    key: "dayPlan",
    blocks: trip.days.map((d, i) => {
      const meals = [d.b && "breakfast", d.l && "lunch", d.d && "dinner"].filter(Boolean);
      const mealsHtml = meals.length ? meals.map((m) => `<span class="pill">${esc(mealName(m))}</span>`).join("") : `<span class="muted">${esc(c.lang === "bi" ? `${t("noMeals", "en")} / ${t("noMeals", "ar")}` : t("noMeals", lg))}</span>`;
      const over = txt(c, d, "overnight");
      return `<article class="blk day${d.img ? " has-img" : ""}">
        ${d.img ? `<img class="day-img" src="${esc(d.img)}" alt="">` : ""}
        <div class="day-body">
          <div class="day-k"><span class="day-n">${lab(c, "day")} ${i + 1}</span><span class="day-d">${esc(fmtDate(trip.start, lg, i, true))}</span></div>
          ${txt(c, d, "title", "h3")}
          ${para(c, d, "desc")}
          <div class="day-meta"><div><span class="mk">${lab(c, "meals")}</span>${mealsHtml}</div>${over ? `<div><span class="mk">${lab(c, "overnight")}</span>${over}</div>` : ""}</div>
        </div></article>`;
    }),
  };
}

function quotation(c) {
  const { trip, profile: p } = c;
  if (!trip.show.price) return null;
  const lg = L1(c);
  const cur = p.currency || "KWD";
  const T = quoteTotals(trip.price, trip.pax, cur);
  const m = (n) => `<span dir="ltr">${esc(formatMoney(n, cur, lg))}</span>`;
  const meta = (key, v) => v ? `<div><span>${lab(c, key)}</span><b>${v}</b></div>` : "";
  const blocks = [];
  blocks.push(`<div class="blk q-meta">
    ${meta("guest", txt(c, trip, "client"))}
    ${meta("travelDates", `${esc(fmtDate(trip.start, lg))} – ${esc(fmtDate(trip.start, lg, Math.max(0, trip.days.length - 1)))}`)}
    ${meta("travellers", esc(paxText(trip.pax, lg)))}
    ${meta("validity", txt(c, trip.price, "validity"))}
  </div>`);
  blocks.push(`<div class="blk"><table class="tbl q-items"><thead><tr><th>${lab(c, "description")}</th><th class="num">${lab(c, "qty")}</th><th class="num">${lab(c, "rate")}</th><th class="num">${lab(c, "amount")}</th></tr></thead><tbody>
    ${trip.price.items.filter((i) => i.desc || +i.rate).map((i) => `<tr><td>${txt(c, i, "desc")}</td><td class="num">${esc(i.qty)}</td><td class="num">${m(i.rate)}</td><td class="num">${m((+i.qty || 0) * (+i.rate || 0))}</td></tr>`).join("")}
    </tbody></table></div>`);
  const taxLabel = c.lang === "ar" ? (p.taxLabelAr || t("tax", "ar")) : (p.taxLabel || t("tax", "en"));
  blocks.push(`<div class="blk q-total"><div class="q-box">
    <div><span>${lab(c, "subtotal")}</span>${m(T.items)}</div>
    ${T.discount ? `<div><span>${lab(c, "discount")}</span><span dir="ltr">− ${esc(formatMoney(T.discount, cur, lg))}</span></div>` : ""}
    ${T.taxPct ? `<div><span>${esc(taxLabel)} ${esc(T.taxPct)}%</span>${m(T.tax)}</div>` : ""}
    <div class="q-grand"><span>${lab(c, "total")}</span>${m(T.total)}</div>
    ${T.people > 1 ? `<div class="q-pp"><span>${lab(c, "perPerson")}</span>${m(T.perPerson)}</div>` : ""}
  </div></div>`);
  const inc = list(c, trip, "inclusions", "yes"), exc = list(c, trip, "exclusions", "no");
  if (inc || exc) blocks.push(`<div class="blk two">${inc ? `<div><h3>${lab(c, "inclusions")}</h3>${inc}</div>` : ""}${exc ? `<div><h3>${lab(c, "exclusions")}</h3>${exc}</div>` : ""}</div>`);
  return { key: "quotation", blocks };
}

function policies(c) {
  const { trip, profile: p } = c;
  if (!trip.show.policies) return null;
  const lg = L1(c);
  const blocks = [];
  const pay = list(c, p, "payment", "yes");
  const b = p.bank || {};
  const bank = trip.show.bank && (b.bankName || b.iban) ? `<div class="bank"><h3>${lab(c, "bank")}</h3><dl>
      ${b.bankName ? `<dt>${lab(c, "bankName")}</dt><dd>${esc(b.bankName)}</dd>` : ""}
      ${b.accountName ? `<dt>${lab(c, "accountName")}</dt><dd>${esc(b.accountName)}</dd>` : ""}
      ${b.iban ? `<dt>${lab(c, "iban")}</dt><dd dir="ltr">${esc(b.iban)}</dd>` : ""}
      ${b.swift ? `<dt>${lab(c, "swift")}</dt><dd dir="ltr">${esc(b.swift)}</dd>` : ""}</dl></div>` : "";
  if (pay || bank) blocks.push(`<div class="blk two">${pay ? `<div><h3>${lab(c, "paymentTerms")}</h3>${pay}</div>` : "<div></div>"}${bank}</div>`);
  const rows = (p.cancellation || []).filter((r) => r.when || r.fee);
  if (rows.length) blocks.push(`<div class="blk"><h3>${lab(c, "cancellation")}</h3><table class="tbl"><tbody>
    ${rows.map((r) => `<tr><td>${txt(c, r, "when")}</td><td class="end"><b>${txt(c, r, "fee")}</b></td></tr>`).join("")}</tbody></table></div>`);
  const terms = c.lang === "bi" ? list(c, p, "terms", "terms") : (() => { const it = lines(val(p, "terms", lg)); return it.length ? `<ol class="terms">${it.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""; })();
  if (terms) blocks.push(`<div class="blk"><h3>${lab(c, "terms")}</h3>${terms}</div>`);
  const name = c.lang === "ar" ? (p.nameAr || p.name) : p.name;
  const sign = c.lang === "ar" ? (p.signNameAr || p.signName) : p.signName;
  const addr = txt(c, p, "address");
  blocks.push(`<div class="blk sign">
    <div class="sign-contact"><h3>${lab(c, "contact")}</h3>${addr ? `<p>${addr}</p>` : ""}
      <p>${[p.phone, p.whatsapp && p.whatsapp !== p.phone ? `WhatsApp ${p.whatsapp}` : "", p.email, p.website].filter(Boolean).map((x) => `<span dir="ltr">${esc(x)}</span>`).join("<br>")}</p>
      ${p.licence ? `<p class="muted">${lab(c, "licence")} <span dir="ltr">${esc(p.licence)}</span></p>` : ""}</div>
    <div class="sign-box"><div class="sign-line"></div><p>${lab(c, "signedFor")} <b>${esc(name)}</b></p>${sign ? `<p class="muted">${esc(sign)}</p>` : ""}</div>
  </div>`);
  return { key: "policies", blocks };
}

// ---------- assemble ----------
export function renderSheets(container, trip, profile) {
  const lang = trip.lang || "en";
  const tpl = findTemplate(trip.template, profile);
  const c = { trip, profile, lang, dir: lang === "ar" ? "rtl" : "ltr", tpl };
  const vars = templateVars(tpl);
  for (const [k, v] of Object.entries(vars)) container.style.setProperty(k, v);

  const measure = document.createElement("div");
  measure.className = "sheets measure";
  for (const [k, v] of Object.entries(vars)) measure.style.setProperty(k, v);
  document.body.appendChild(measure);

  const pages = [cover(c)];
  for (const sec of [overview(c), flights(c), days(c), quotation(c), policies(c)]) {
    if (!sec || !sec.blocks.length) continue;
    let cont = false;
    measure.innerHTML = sheetHtml(c, sec.key, cont);
    let body = measure.querySelector(".s-body");
    for (const blk of sec.blocks) {
      body.insertAdjacentHTML("beforeend", blk);
      if (body.scrollHeight > body.clientHeight + 1 && body.children.length > 1) {
        body.lastElementChild.remove();
        pages.push(measure.innerHTML);
        cont = true;
        measure.innerHTML = sheetHtml(c, sec.key, cont);
        body = measure.querySelector(".s-body");
        body.insertAdjacentHTML("beforeend", blk);
      }
    }
    pages.push(measure.innerHTML);
  }
  measure.remove();

  container.innerHTML = pages.join("");
  const sheets = container.querySelectorAll(".sheet");
  const lg = L1(c);
  sheets.forEach((s, i) => {
    const pg = s.querySelector(".pgno");
    if (pg) pg.textContent = `${t("page", lg)} ${i + 1} ${t("of", lg)} ${sheets.length}`;
  });
  return sheets.length;
}
