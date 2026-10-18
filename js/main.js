import { CONFIG } from "./config.js";
import { openStore, draft } from "./store.js";
import { sampleTrip, blankTrip, normaliseTrip, normaliseProfile, clone, uid } from "./model.js";
import { renderSheets, esc } from "./render.js";
import { parsePnr, paxFromPassengers, statusKind } from "./pnr.js";
import { PRESETS, COVER_STYLES, findTemplate, normHex, templateWarnings } from "./themes.js";
import { CURRENCIES, quoteTotals, formatMoney } from "./money.js";
import { readImage } from "./images.js";
import { airportName } from "./codes.js";

let store, user, agencyCode = "";
let profile, trip, tripsMeta = [];
let tab = "trip", profileDirty = false, tripDirty = false, editingTpl = null, lastImport = null, authMode = "login";

const $ = (s, r = document) => r.querySelector(s);
const sheetsEl = () => $("#sheets");

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), 2600);
}

// ---------- reading and writing fields by path, e.g. "trip.flights.0.from" ----------
function rootOf(name) { return name === "profile" ? profile : name === "trip" ? trip : name === "tpl" ? editingTpl : null; }
function getPath(path) {
  const [r, ...ks] = path.split(".");
  return ks.reduce((o, k) => (o == null ? o : o[k]), rootOf(r));
}
function setPath(path, v) {
  const [r, ...ks] = path.split(".");
  const last = ks.pop();
  const o = ks.reduce((a, k) => a[k], rootOf(r));
  o[last] = v;
  if (r === "profile") profileDirty = true;
  if (r === "trip") tripDirty = true;
}

// ---------- field builders ----------
const idOf = (p) => "f_" + p.replace(/\./g, "_");
function F(label, path, o = {}) {
  const v = getPath(path) ?? "";
  const id = idOf(path);
  const dir = o.dir ? ` dir="${o.dir}" lang="${o.dir === "rtl" ? "ar" : "en"}"` : "";
  const common = `id="${id}" data-bind="${path}" data-type="${o.type === "number" ? "number" : "text"}"${dir}${o.ph ? ` placeholder="${esc(o.ph)}"` : ""}`;
  let input;
  if (o.type === "area") input = `<textarea ${common} rows="${o.rows || 3}">${esc(v)}</textarea>`;
  else if (o.type === "select") input = `<select ${common}>${o.options.map(([val, txt]) => `<option value="${esc(val)}"${String(val) === String(v) ? " selected" : ""}>${esc(txt)}</option>`).join("")}</select>`;
  else input = `<input ${common} type="${o.type || "text"}" value="${esc(v)}"${o.step ? ` step="${o.step}"` : ""}${o.min != null ? ` min="${o.min}"` : ""}${o.type === "number" ? ' inputmode="decimal"' : ""}>`;
  return `<label class="f" for="${id}"><span>${esc(label)}${o.note ? ` <em>${esc(o.note)}</em>` : ""}</span>${input}</label>`;
}
// English and/or Arabic version of a text field, following the trip's PDF language.
function BI(label, path, o = {}) {
  const mode = o.always ? "bi" : trip.lang;
  const en = F(label, path, o), ar = F(label, path + "Ar", { ...o, dir: "rtl", note: "Arabic", ph: o.phAr });
  return mode === "en" ? en : mode === "ar" ? ar : en + ar;
}
function CHECK(label, path) {
  return `<label class="check"><input type="checkbox" data-bind="${path}" data-type="check"${getPath(path) ? " checked" : ""}>${esc(label)}</label>`;
}
function IMG(label, path, o = {}) {
  const v = getPath(path);
  return `<div class="f"><span>${esc(label)}</span><div class="imgpick"><div class="thumb${o.logo ? " logo" : ""}" style="${v ? `background-image:url('${v}')` : ""}"></div>
    <input type="file" accept="image/*" data-img="${path}"${o.logo ? ' data-logo="1"' : ""} aria-label="${esc(label)}">
    ${v ? `<button type="button" class="btn small" data-act="clearImg" data-path="${path}">Remove</button>` : ""}</div></div>`;
}
const del = (act, i, what) => `<button type="button" class="iconbtn" data-act="${act}" data-i="${i}" aria-label="Remove ${what}" title="Remove">×</button>`;

// ---------- tabs ----------
const TABS = [["agency", "Agency"], ["trip", "Trip"], ["flights", "Flights"], ["hotels", "Hotels"], ["days", "Day plan"], ["price", "Price"], ["policies", "Policies"], ["template", "Template"], ["saved", "Saved trips"]];
function renderTabs() {
  $("#tabs").innerHTML = TABS.map(([k, l]) => `<button type="button" role="tab" class="tab" data-tab="${k}" aria-selected="${k === tab}">${l}</button>`).join("");
}

const PANES = {
  agency() {
    const cur = Object.entries(CURRENCIES).map(([k]) => [k, k]);
    return `<p class="hint">Your agency details print on every itinerary. They're saved when you press Save.${agencyCode && agencyCode !== "LOCAL" ? ` Agency ID: <b>${esc(agencyCode)}</b>` : ""}</p>
      <h4>Branding</h4>
      ${IMG("Logo", "profile.logo", { logo: true })}
      ${BI("Agency name", "profile.name", { always: true })}
      ${BI("Tagline", "profile.tagline", { always: true })}
      <h4>Contact</h4>
      <div class="g2">${F("Phone", "profile.phone")}${F("WhatsApp", "profile.whatsapp")}</div>
      <div class="g2">${F("Email", "profile.email", { type: "email" })}${F("Website", "profile.website")}</div>
      ${BI("Office address", "profile.address", { always: true })}
      <div class="g2">${F("Licence no.", "profile.licence", { note: "optional" })}${F("Signed by", "profile.signName")}</div>
      ${F("Signed by", "profile.signNameAr", { dir: "rtl", note: "Arabic" })}
      <h4>Money</h4>
      <div class="g3">${F("Currency", "profile.currency", { type: "select", options: cur })}${F("Tax name", "profile.taxLabel", { note: "if any" })}${F("Default tax %", "profile.taxPct", { type: "number", step: "0.01", min: 0 })}</div>
      <h4>Bank details</h4>
      <div class="g2">${F("Bank", "profile.bank.bankName")}${F("Account name", "profile.bank.accountName")}</div>
      <div class="g2">${F("IBAN", "profile.bank.iban")}${F("SWIFT", "profile.bank.swift")}</div>
      <h4>New trips</h4>
      ${F("Default PDF language", "profile.defaultLang", { type: "select", options: [["en", "English"], ["ar", "Arabic"], ["bi", "English and Arabic"]] })}`;
  },

  trip() {
    return `${BI("Trip title", "trip.title")}
      <div class="g2">${BI("Destination", "trip.destination")}${BI("Guest name", "trip.client")}</div>
      <div class="g4">${F("Start date", "trip.start", { type: "date" })}${F("Adults", "trip.pax.adults", { type: "number", min: 0 })}${F("Children", "trip.pax.children", { type: "number", min: 0 })}${F("Infants", "trip.pax.infants", { type: "number", min: 0 })}</div>
      ${BI("Route", "trip.route", { ph: "Tbilisi, Kazbegi, Batumi", note: "comma separated" })}
      ${IMG("Cover photo", "trip.cover")}
      ${BI("Trip overview", "trip.overview", { type: "area", rows: 4 })}
      ${BI("Highlights", "trip.highlights", { type: "area", rows: 4, note: "one per line" })}
      <h4>Show on the PDF</h4>
      <div>${CHECK("Flights", "trip.show.flights")}${CHECK("Hotels", "trip.show.hotels")}${CHECK("Price", "trip.show.price")}${CHECK("Policies", "trip.show.policies")}${CHECK("Bank details", "trip.show.bank")}</div>`;
  },

  flights() {
    const res = lastImport ? `<div class="result${lastImport.warnings.length ? " warn" : ""}">
        ${lastImport.summary}${lastImport.warnings.length ? `<ul>${lastImport.warnings.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>` : ""}</div>` : "";
    const cabinOpts = [["auto", "From booking class"], ["economy", "Economy"], ["premium", "Premium economy"], ["business", "Business"], ["first", "First"]];
    const statusOpts = [["confirmed", "Confirmed"], ["waitlisted", "Waitlisted"], ["requested", "Requested"], ["unconfirmed", "Not confirmed"], ["cancelled", "Cancelled"]];
    return `<div class="pnr"><h4>Import from Sabre</h4>
      <p class="hint">Paste the <b>*I</b>, <b>*IA</b> or full <b>*R</b> display from Sabre Red 360. Flights, names and the booking reference are filled in for you.</p>
      <label class="f" for="pnrText"><span>PNR display</span><textarea id="pnrText" spellcheck="false" placeholder=" 1 KU 101Y 15NOV 7 KWILHR HK2  0820  1325  /DCKU*K7XQ2M /E"></textarea></label>
      <div>${["Replace current flights", "Update travellers from names", "Start trip on first flight date"].map((l, i) => `<label class="check"><input type="checkbox" id="pnrOpt${i}" checked>${l}</label>`).join("")}</div>
      <div class="row" style="margin-top:10px"><button type="button" class="btn dark" data-act="importPnr">Import from PNR</button></div>
      ${res}</div>
      <h4>Booking</h4>
      ${F("Booking reference (PNR)", "trip.locator")}
      <h4>Passengers</h4>
      ${trip.passengers.map((p, i) => `<div class="item"><div class="g2">${F("Name", `trip.passengers.${i}.name`)}<div class="row" style="align-items:flex-end">${F("Type", `trip.passengers.${i}.type`, { type: "select", options: [["adult", "Adult"], ["child", "Child"], ["infant", "Infant"]] })}${del("delPax", i, "passenger")}</div></div></div>`).join("") || `<p class="hint">No passengers listed. They're optional; names come from the PNR.</p>`}
      <button type="button" class="add" data-act="addPax">Add passenger</button>
      <h4>Flight segments</h4>
      ${trip.flights.map((f, i) => `<div class="item"><div class="item-head"><span class="seg-title">${esc(f.carrier)} ${esc(f.number)}<span class="meta">${esc(f.from)}–${esc(f.to)} ${esc(airportName(f.to, "en") !== f.to ? airportName(f.to, "en") : "")}</span></span>${del("delFlight", i, "flight")}</div>
        <div class="g4">${F("Date", `trip.flights.${i}.date`, { type: "date" })}${F("Airline", `trip.flights.${i}.carrier`)}${F("Flight no.", `trip.flights.${i}.number`)}${F("Booking class", `trip.flights.${i}.cabin`)}</div>
        <div class="g4">${F("From", `trip.flights.${i}.from`)}${F("To", `trip.flights.${i}.to`)}${F("Departs", `trip.flights.${i}.dep`, { type: "time" })}${F("Arrives", `trip.flights.${i}.arr`, { type: "time" })}</div>
        <div class="g4">${F("Arrival +days", `trip.flights.${i}.arrOffset`, { type: "number", min: -1 })}${F("Status", `trip.flights.${i}.statusKind`, { type: "select", options: statusOpts })}${F("Airline ref.", `trip.flights.${i}.airlineRef`)}${F("Baggage", `trip.flights.${i}.baggage`, { ph: "30 kg" })}</div>
        <div class="g2">${F("Cabin on PDF", `trip.flights.${i}.cabinType`, { type: "select", options: cabinOpts })}${F("Operated by", `trip.flights.${i}.operatedBy`, { note: "optional" })}</div></div>`).join("") || `<p class="hint">No flights yet. Import a PNR above or add them by hand.</p>`}
      <button type="button" class="add" data-act="addFlight">Add flight</button>`;
  },

  hotels() {
    return `${trip.hotels.map((h, i) => `<div class="item"><div class="item-head"><span>Hotel ${i + 1}</span>${del("delHotel", i, "hotel")}</div>
        <div class="g2">${BI("City", `trip.hotels.${i}.city`)}${F("Hotel name", `trip.hotels.${i}.name`)}</div>
        <div class="g2">${BI("Room", `trip.hotels.${i}.room`)}${BI("Meals", `trip.hotels.${i}.meals`)}</div>
        <div class="g3">${F("Nights", `trip.hotels.${i}.nights`, { type: "number", min: 0 })}</div></div>`).join("") || `<p class="hint">No hotels yet.</p>`}
      <button type="button" class="add" data-act="addHotel">Add hotel</button>`;
  },

  days() {
    return `<p class="hint">Dates follow the trip's start date. Up to three days fit on a page; longer trips get more pages.</p>
      ${trip.days.map((d, i) => `<div class="item"><div class="item-head"><span>Day ${i + 1}</span>${trip.days.length > 1 ? del("delDay", i, `day ${i + 1}`) : ""}</div>
        ${BI("Title", `trip.days.${i}.title`)}
        ${BI("What happens", `trip.days.${i}.desc`, { type: "area", rows: 3 })}
        ${IMG("Photo", `trip.days.${i}.img`)}
        <div style="margin-bottom:10px">${CHECK("Breakfast", `trip.days.${i}.b`)}${CHECK("Lunch", `trip.days.${i}.l`)}${CHECK("Dinner", `trip.days.${i}.d`)}</div>
        ${BI("Overnight in", `trip.days.${i}.overnight`)}</div>`).join("")}
      <button type="button" class="add" data-act="addDay">Add day</button>`;
  },

  price() {
    const cur = profile.currency || "KWD";
    const step = (CURRENCIES[cur]?.decimals || 2) === 3 ? "0.001" : "0.01";
    return `<p class="hint">Amounts are in ${esc(cur)}. Change the currency on the Agency tab.</p>
      ${trip.price.items.map((it, i) => `<div class="item"><div class="item-head"><span>Line ${i + 1}</span>${del("delItem", i, "price line")}</div>
        ${BI("Description", `trip.price.items.${i}.desc`)}
        <div class="g2">${F("Quantity", `trip.price.items.${i}.qty`, { type: "number", min: 0 })}${F(`Rate (${cur})`, `trip.price.items.${i}.rate`, { type: "number", step, min: 0 })}</div></div>`).join("")}
      <button type="button" class="add" data-act="addItem">Add price line</button>
      <div class="g3" style="margin-top:14px">${F(`Discount (${cur})`, "trip.price.discount", { type: "number", step, min: 0 })}${F("Tax %", "trip.price.taxPct", { type: "number", step: "0.01", min: 0 })}${F("Valid for", "trip.price.validity")}</div>
      ${trip.lang !== "en" ? F("Valid for", "trip.price.validityAr", { dir: "rtl", note: "Arabic" }) : ""}
      <div class="item" id="sumbox"></div>
      <h4>What's included</h4>
      ${BI("Included", "trip.inclusions", { type: "area", rows: 4, note: "one per line" })}
      ${BI("Not included", "trip.exclusions", { type: "area", rows: 4, note: "one per line" })}`;
  },

  policies() {
    return `<p class="hint">Policies belong to your agency and print on every trip. They're saved when you press Save.</p>
      ${BI("Payment terms", "profile.payment", { type: "area", rows: 3, always: true, note: "one per line" })}
      <h4>Cancellation policy</h4>
      ${profile.cancellation.map((r, i) => `<div class="item"><div class="item-head"><span>Rule ${i + 1}</span>${del("delCancel", i, "rule")}</div>
        <div class="g2">${F("When", `profile.cancellation.${i}.when`)}${F("Charge", `profile.cancellation.${i}.fee`)}</div>
        <div class="g2">${F("When", `profile.cancellation.${i}.whenAr`, { dir: "rtl", note: "Arabic" })}${F("Charge", `profile.cancellation.${i}.feeAr`, { dir: "rtl", note: "Arabic" })}</div></div>`).join("")}
      <button type="button" class="add" data-act="addCancel">Add rule</button>
      <h4>Terms and conditions</h4>
      ${BI("Terms", "profile.terms", { type: "area", rows: 6, always: true, note: "one per line" })}
      <h4>Defaults for new trips</h4>
      ${BI("Included", "profile.inclusions", { type: "area", rows: 4, always: true })}
      ${BI("Not included", "profile.exclusions", { type: "area", rows: 4, always: true })}`;
  },

  template() {
    const current = editingTpl ? editingTpl.id : trip.template;
    const card = (tp, custom) => `<button type="button" class="tpl" data-tpl="${esc(tp.id)}" aria-pressed="${tp.id === current}">
        <span class="tpl-sw"><i style="background:${esc(tp.primary)}"></i><i style="background:${esc(tp.accent)}"></i><i style="background:${esc(tp.paper)}"></i></span>
        <b>${esc(tp.name)}</b><span>${esc((COVER_STYLES.find((c) => c[0] === tp.cover) || COVER_STYLES[0])[1])}, ${tp.heading === "sans" ? "modern headings" : "classic headings"}${tp.id === profile.defaultTemplate ? ". Default" : ""}</span>
      </button>${custom ? `<div class="row" style="margin:-4px 0 4px"><button type="button" class="linkbtn" data-act="editTpl" data-id="${esc(tp.id)}">Edit ${esc(tp.name)}</button></div>` : ""}`;
    const editor = editingTpl ? tplEditor() : "";
    return `<h4>Ready-made</h4><div class="tpls">${PRESETS.map((p) => card(p)).join("")}</div>
      <h4>Your templates</h4>
      ${profile.templates.length ? `<div class="tpls">${profile.templates.map((p) => `<div>${card(p, true)}</div>`).join("")}</div>` : `<p class="hint">Make a template with your agency's colours. Enter the colour codes from your brand guide.</p>`}
      ${editor || `<div class="row" style="margin-top:12px"><button type="button" class="btn dark" data-act="newTpl">New template from colour codes</button>
        <button type="button" class="btn" data-act="defaultTpl">Use current for new trips</button></div>`}`;
  },

  saved() {
    return `<div class="row" style="margin-bottom:12px"><button type="button" class="btn" data-act="exportTrip">Download this trip as a file</button>
        <label class="btn" style="cursor:pointer">Open a trip file<input type="file" accept="application/json,.json" data-act-file="importTrip" hidden></label></div>
      ${store.mode === "local" ? `<p class="hint">Local mode: trips are saved in this browser only. Connect Supabase in js/config.js to save them to your account.</p>` : ""}
      ${tripsMeta.length ? `<ul class="trips">${tripsMeta.map((m) => `<li><div><b>${esc(m.title || "Untitled trip")}</b><span>${esc(m.client || "")}${m.start ? `, starts ${esc(m.start)}` : ""}</span></div>
        <button type="button" class="btn small" data-act="openTrip" data-id="${esc(m.id)}">Open</button>
        <button type="button" class="btn small" data-act="dupTrip" data-id="${esc(m.id)}">Duplicate</button>
        <button type="button" class="btn small danger" data-act="delTrip" data-id="${esc(m.id)}">Delete</button></li>`).join("")}</ul>`
        : `<p class="empty">No saved trips yet. Press Save to keep the one you're working on.</p>`}`;
  },
};

function tplEditor() {
  const e = editingTpl;
  const color = (label, key) => `<div class="f"><span>${label}</span><div class="colorrow">
      <input type="color" value="${esc(normHex(e[key]))}" data-color="${key}" aria-label="${label} picker">
      <input type="text" class="plain" maxlength="7" value="${esc(e[key])}" data-bind="tpl.${key}" data-hex="${key}" aria-label="${label} code" placeholder="#12304F"></div></div>`;
  const exists = profile.templates.some((x) => x.id === e.id);
  return `<div class="item" style="margin-top:14px;padding-bottom:12px"><div class="item-head"><span>${exists ? "Edit template" : "New template"}</span></div>
    ${F("Template name", "tpl.name")}
    <div class="colors">${color("Main colour", "primary")}${color("Accent", "accent")}${color("Page colour", "paper")}</div>
    <div class="g2">${F("Headings", "tpl.heading", { type: "select", options: [["serif", "Classic (serif)"], ["sans", "Modern (sans)"]] })}${F("Cover", "tpl.cover", { type: "select", options: COVER_STYLES })}</div>
    <div id="tplWarn"></div>
    <div class="row"><button type="button" class="btn signal" data-act="saveTpl">Save template</button><button type="button" class="btn" data-act="cancelTpl">Cancel</button>
    ${exists ? `<button type="button" class="btn danger" data-act="deleteTpl">Delete</button>` : ""}</div></div>`;
}

function updateTplWarnings() {
  const box = $("#tplWarn");
  if (!box || !editingTpl) return;
  const w = templateWarnings(editingTpl);
  box.innerHTML = w.length ? `<div class="warnbox">${w.map(esc).join("<br>")}</div>` : "";
}
function updateSum() {
  const b = $("#sumbox");
  if (!b) return;
  const cur = profile.currency || "KWD";
  const T = quoteTotals(trip.price, trip.pax, cur);
  const row = (l, v) => `<div class="item-head" style="margin-bottom:6px"><span style="font-weight:500">${l}</span><span>${esc(formatMoney(v, cur))}</span></div>`;
  b.innerHTML = row("Items", T.items) + (T.discount ? row("Discount", -T.discount) : "") + (T.taxPct ? row(`Tax ${T.taxPct}%`, T.tax) : "") + row("<b>Total</b>", T.total) + (T.people > 1 ? row("Per person", T.perPerson) : "");
}

function renderPane() {
  $("#pane").innerHTML = PANES[tab]();
  if (tab === "price") updateSum();
  if (tab === "template") updateTplWarnings();
}

// ---------- preview ----------
let rt = null;
function refreshSoon() { clearTimeout(rt); rt = setTimeout(refresh, 220); }
function refresh() {
  if (!trip) return;
  let p = profile, tr = trip;
  if (editingTpl) { // preview the template being edited
    p = { ...profile, templates: [...profile.templates.filter((x) => x.id !== editingTpl.id), editingTpl] };
    tr = { ...trip, template: editingTpl.id };
  }
  const n = renderSheets(sheetsEl(), tr, p);
  $("#pageCount").textContent = `${n} ${n === 1 ? "page" : "pages"}, A4`;
  document.querySelectorAll("[data-lang]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.lang === trip.lang));
  fitPreview();
  if (user) draft.save(user.id, trip);
}
function fitPreview() {
  const pv = $(".preview");
  const w = pv.clientWidth - 48;
  const pageW = 210 * 96 / 25.4;
  sheetsEl().style.zoom = Math.min(1, Math.max(0.3, w / pageW)).toFixed(3);
}
window.addEventListener("resize", () => { clearTimeout(fitPreview.t); fitPreview.t = setTimeout(fitPreview, 120); });

// ---------- events in the editor ----------
const pane = () => $("#pane");
function onInput(e) {
  const el = e.target;
  if (el.dataset.color) { // colour picker -> hex text
    editingTpl[el.dataset.color] = el.value.toUpperCase();
    const txt = pane().querySelector(`[data-hex="${el.dataset.color}"]`);
    if (txt) txt.value = el.value.toUpperCase();
    updateTplWarnings(); refreshSoon(); return;
  }
  const path = el.dataset.bind;
  if (!path) return;
  let v = el.dataset.type === "check" ? el.checked : el.value;
  if (el.dataset.type === "number") v = el.value === "" ? "" : Number(el.value);
  setPath(path, v);
  if (el.dataset.hex) {
    const ok = /^#?[0-9a-f]{6}$/i.test(el.value.trim());
    if (ok) { editingTpl[el.dataset.hex] = normHex(el.value); const pick = pane().querySelector(`[data-color="${el.dataset.hex}"]`); if (pick) pick.value = normHex(el.value); }
    updateTplWarnings();
  }
  if (/^trip\.flights\.\d+\.statusKind$/.test(path)) {
    const f = getPath(path.replace(/\.statusKind$/, ""));
    f.status = { confirmed: "HK", waitlisted: "HL", requested: "NN", unconfirmed: "UC", cancelled: "HX" }[v] || f.status;
  }
  if (tab === "price" || path.startsWith("trip.pax") || path === "profile.currency") updateSum();
  refreshSoon();
}

async function onFile(e) {
  const el = e.target;
  if (el.dataset.img) {
    try {
      const data = await readImage(el.files[0], el.dataset.logo ? { max: 700, keepAlpha: true } : { max: 1800 });
      setPath(el.dataset.img, data);
      renderPane(); refresh();
    } catch (err) { toast(err.message); }
  }
  if (el.dataset.actFile === "importTrip") {
    try {
      const data = JSON.parse(await el.files[0].text());
      trip = normaliseTrip({ ...data, id: uid() }, profile); tripDirty = true;
      toast("Trip opened from file. Press Save to keep it."); tab = "trip"; renderTabs(); renderPane(); refresh();
    } catch { toast("That file isn't a trip file from this app."); }
  }
}

function importPnr() {
  const text = $("#pnrText").value;
  const r = parsePnr(text);
  const [replace, updPax, setStart] = [0, 1, 2].map((i) => $("#pnrOpt" + i).checked);
  if (r.flights.length) {
    const segs = r.flights.map((f) => ({ ...f, baggage: "" }));
    trip.flights = replace ? segs : [...trip.flights, ...segs];
    if (setStart) trip.start = r.flights[0].date;
  }
  if (r.passengers.length) {
    trip.passengers = r.passengers;
    if (updPax) trip.pax = paxFromPassengers(r.passengers);
  }
  if (r.locator) trip.locator = r.locator;
  tripDirty = true;
  const bits = [];
  if (r.flights.length) bits.push(`${r.flights.length} ${r.flights.length === 1 ? "flight" : "flights"}`);
  if (r.passengers.length) bits.push(`${r.passengers.length} ${r.passengers.length === 1 ? "passenger" : "passengers"}`);
  if (r.locator) bits.push(`booking ref. <b>${esc(r.locator)}</b>`);
  lastImport = { summary: bits.length ? `Imported ${bits.join(", ")}.` : "Nothing was imported.", warnings: r.warnings };
  renderPane(); refresh();
  if (r.flights.length) toast(`Imported ${r.flights.length} ${r.flights.length === 1 ? "flight" : "flights"}`);
}

const ACTIONS = {
  importPnr,
  addPax() { trip.passengers.push({ name: "", type: "adult" }); },
  delPax(i) { trip.passengers.splice(i, 1); },
  addFlight() { const last = trip.flights[trip.flights.length - 1]; trip.flights.push({ carrier: last?.carrier || "KU", number: "", cabin: "Y", date: last?.date || trip.start, from: last?.to || "KWI", to: "", dep: "", arr: "", arrOffset: 0, status: "HK", statusKind: "confirmed", airlineRef: last?.airlineRef || "", operatedBy: "", baggage: last?.baggage || "" }); },
  delFlight(i) { trip.flights.splice(i, 1); },
  addHotel() { trip.hotels.push({ city: "", cityAr: "", name: "", room: "", roomAr: "", meals: "Breakfast", mealsAr: "إفطار", nights: 1 }); },
  delHotel(i) { trip.hotels.splice(i, 1); },
  addDay() { const prev = trip.days[trip.days.length - 1]; trip.days.push({ title: "", titleAr: "", desc: "", descAr: "", img: "", b: true, l: false, d: false, overnight: prev?.overnight || "", overnightAr: prev?.overnightAr || "" }); },
  delDay(i) { trip.days.splice(i, 1); },
  addItem() { trip.price.items.push({ desc: "", descAr: "", qty: 1, rate: 0 }); },
  delItem(i) { trip.price.items.splice(i, 1); },
  addCancel() { profile.cancellation.push({ when: "", whenAr: "", fee: "", feeAr: "" }); profileDirty = true; },
  delCancel(i) { profile.cancellation.splice(i, 1); profileDirty = true; },
  clearImg(_, el) { setPath(el.dataset.path, ""); },
  newTpl() { const base = findTemplate(trip.template, profile); editingTpl = { ...clone(base), id: "c-" + uid().slice(0, 8), name: "My template" }; },
  editTpl(_, el) { editingTpl = clone(profile.templates.find((x) => x.id === el.dataset.id)); },
  cancelTpl() { editingTpl = null; },
  saveTpl() {
    const tp = { ...editingTpl, primary: normHex(editingTpl.primary), accent: normHex(editingTpl.accent), paper: normHex(editingTpl.paper, "#FFFFFF"), name: (editingTpl.name || "My template").trim() };
    profile.templates = [...profile.templates.filter((x) => x.id !== tp.id), tp];
    trip.template = tp.id; editingTpl = null; profileDirty = true; tripDirty = true;
    toast(`Template "${tp.name}" saved. Press Save to keep it in your account.`);
  },
  deleteTpl() {
    const id = editingTpl.id;
    profile.templates = profile.templates.filter((x) => x.id !== id);
    if (trip.template === id) trip.template = PRESETS[0].id;
    if (profile.defaultTemplate === id) profile.defaultTemplate = PRESETS[0].id;
    editingTpl = null; profileDirty = true;
  },
  defaultTpl() { profile.defaultTemplate = trip.template; profileDirty = true; toast("New trips will use this template."); },
  exportTrip() {
    const blob = new Blob([JSON.stringify(trip, null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = fileName() + ".json"; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
};
const ASYNC_ACTIONS = {
  async openTrip(_, el) {
    if (tripDirty && !confirm("Open another trip? Unsaved changes to this one will be lost.")) return;
    const t = await store.getTrip(el.dataset.id);
    if (!t) return toast("That trip could not be found.");
    trip = normaliseTrip(t, profile); tripDirty = false; tab = "trip"; lastImport = null; renderTabs();
  },
  async dupTrip(_, el) {
    const t = await store.getTrip(el.dataset.id);
    if (!t) return;
    trip = normaliseTrip({ ...t, id: uid(), title: (t.title || "Trip") + " (copy)" }, profile); tripDirty = true; tab = "trip"; renderTabs();
    toast("Copy opened. Press Save to keep it.");
  },
  async delTrip(_, el) {
    if (!confirm("Delete this trip? This can't be undone.")) return;
    await store.deleteTrip(el.dataset.id);
    tripsMeta = await store.listTrips(); toast("Trip deleted");
  },
};

function onClick(e) {
  const tabBtn = e.target.closest("[data-tab]");
  if (tabBtn) { tab = tabBtn.dataset.tab; renderTabs(); renderPane(); $("#pane").scrollTop = 0; return; }
  const tplBtn = e.target.closest("[data-tpl]");
  if (tplBtn) { if (editingTpl) editingTpl = null; trip.template = tplBtn.dataset.tpl; tripDirty = true; renderPane(); refresh(); return; }
  const b = e.target.closest("[data-act]");
  if (!b || !pane().contains(b)) return;
  const act = b.dataset.act, i = +b.dataset.i;
  if (ACTIONS[act]) {
    ACTIONS[act](i, b);
    if (act !== "exportTrip") { tripDirty = true; renderPane(); refresh(); }
  } else if (ASYNC_ACTIONS[act]) {
    b.disabled = true;
    ASYNC_ACTIONS[act](i, b).then(() => { renderPane(); refresh(); }).catch((err) => toast("Something went wrong: " + err.message)).finally(() => (b.disabled = false));
  }
}

// ---------- top bar ----------
function fileName() {
  return [trip.title, trip.client].filter(Boolean).join(" - ").replace(/[\\/:*?"<>|]+/g, "").slice(0, 80) || "Itinerary";
}
async function saveAll(btn) {
  btn.disabled = true;
  try {
    if (profileDirty) { await store.saveProfile(profile); profileDirty = false; }
    await store.saveTrip(trip); tripDirty = false;
    tripsMeta = await store.listTrips();
    if (tab === "saved") renderPane();
    toast("Saved");
  } catch (err) { toast("Not saved: " + err.message); } finally { btn.disabled = false; }
}
function bindBar() {
  document.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => { trip.lang = b.dataset.lang; tripDirty = true; renderPane(); refresh(); }));
  document.querySelectorAll("[data-view]").forEach((b) => b.addEventListener("click", () => {
    document.body.dataset.view = b.dataset.view;
    document.querySelectorAll("[data-view]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    window.scrollTo(0, 0); fitPreview();
  }));
  $(".bar").addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "saveTrip") saveAll(b);
    if (act === "newTrip") {
      if (tripDirty && !confirm("Start a new trip? Unsaved changes to this one will be lost.")) return;
      trip = blankTrip(profile); trip.template = profile.defaultTemplate || trip.template; trip.lang = profile.defaultLang || "en";
      tripDirty = false; lastImport = null; tab = "trip"; renderTabs(); renderPane(); refresh(); toast("New trip started");
    }
    if (act === "pdf") {
      const before = document.title; document.title = fileName();
      setTimeout(() => { window.print(); document.title = before; }, 50);
    }
    if (act === "logout") store.logout().then(() => { user = null; showAuth("login"); });
  });
  window.addEventListener("beforeunload", (e) => { if ((tripDirty || profileDirty) && store.mode === "cloud") { e.preventDefault(); e.returnValue = ""; } });
}

// ---------- sign in ----------
function showAuth(mode, msg, ok) {
  authMode = mode || authMode;
  $("#app").hidden = true; $("#auth").hidden = false;
  const m = msg ? `<p class="msg ${ok ? "ok" : "err"}" role="status">${esc(msg)}</p>` : "";
  const tabs = authMode === "login" || authMode === "register"
    ? `<div class="auth-tabs" role="tablist"><button type="button" role="tab" data-auth="login" aria-selected="${authMode === "login"}">Log in</button><button type="button" role="tab" data-auth="register" aria-selected="${authMode === "register"}">Create account</button></div>` : "";
  const field = (label, name, type = "text", extra = "") => `<label class="f"><span>${label}</span><input name="${name}" type="${type}" required ${extra}></label>`;
  const forms = {
    login: `${field("Email", "email", "email", 'autocomplete="email"')}${field("Password", "password", "password", 'autocomplete="current-password"')}<button class="btn signal" type="submit">Log in</button><button type="button" class="linkbtn" data-auth="forgot">Forgot your password?</button>`,
    register: `${field("Your name", "name", "text", 'autocomplete="name"')}${field("Agency name", "company", "text", 'autocomplete="organization"')}${field("Mobile", "phone", "tel", 'autocomplete="tel"')}${field("Email", "email", "email", 'autocomplete="email"')}${field("Password", "password", "password", 'minlength="8" autocomplete="new-password"')}<p class="hint">At least 8 characters.</p><button class="btn signal" type="submit">Create account</button>`,
    forgot: `<p class="hint">We'll email you a link to set a new password.</p>${field("Email", "email", "email")}<button class="btn signal" type="submit">Send reset link</button><button type="button" class="linkbtn" data-auth="login">Back to log in</button>`,
    newpass: `${field("New password", "password", "password", 'minlength="8" autocomplete="new-password"')}<button class="btn signal" type="submit">Save new password</button>`,
  };
  $("#authCard").innerHTML = `<h1>${esc(CONFIG.appName)}</h1><p class="by">${authMode === "register" ? "Set up your agency's account." : "Log in to build and save itineraries."}</p>${tabs}${m}<form id="authForm" data-kind="${authMode}">${forms[authMode]}</form>`;
}
function bindAuth() {
  $("#auth").addEventListener("click", (e) => { const b = e.target.closest("[data-auth]"); if (b) showAuth(b.dataset.auth); });
  $("#auth").addEventListener("submit", async (e) => {
    e.preventDefault();
    const fm = e.target, d = Object.fromEntries(new FormData(fm)), btn = fm.querySelector("[type=submit]");
    btn.disabled = true;
    try {
      const k = fm.dataset.kind;
      if (k === "login") await enterApp(await store.login(d.email.trim(), d.password));
      if (k === "register") {
        const u = await store.register({ ...d, email: d.email.trim() });
        if (u) await enterApp(u); else showAuth("login", "Account created. Open the confirmation link we emailed you, then log in.", true);
      }
      if (k === "forgot") { await store.resetPassword(d.email.trim()); showAuth("login", "Reset link sent. Check your email.", true); }
      if (k === "newpass") { await store.updatePassword(d.password); await enterApp(await store.current()); toast("Password updated"); }
    } catch (err) {
      showAuth(authMode, /invalid login/i.test(err.message) ? "The email or password is wrong." : err.message);
    } finally { btn.disabled = false; }
  });
}

// ---------- start ----------
async function enterApp(u) {
  user = u;
  const a = await store.getAgency();
  agencyCode = a.code || "";
  const meta = u.user_metadata || {};
  const seed = { name: meta.company, signName: meta.name, phone: meta.phone, email: u.email, ...Object.fromEntries(Object.entries(a.seed || {}).filter(([, v]) => v)) };
  profile = normaliseProfile(a.profile || (store.mode === "cloud" ? seed : null));
  if (!a.profile && store.mode === "cloud") profileDirty = true; // first save stores the full profile
  const saved = draft.load(u.id);
  trip = normaliseTrip(saved || sampleTrip(profile), profile);
  tripsMeta = await store.listTrips();
  $("#who").innerHTML = `<b>${esc(profile.name)}</b>${agencyCode && agencyCode !== "LOCAL" ? `Agency ID ${esc(agencyCode)}` : "Saved in this browser"}`;
  $("#btnLogout").hidden = store.mode === "local";
  $("#modeNote").textContent = store.mode === "local" ? "Local mode: nothing leaves this browser" : "";
  $("#auth").hidden = true; $("#app").hidden = false;
  document.body.dataset.view = "edit";
  renderTabs(); renderPane(); refresh();
  if (document.fonts?.ready) document.fonts.ready.then(refresh); // re-measure pages once fonts arrive
}

(async function boot() {
  document.title = CONFIG.appName;
  $("#appName").textContent = CONFIG.appName;
  pane().addEventListener("input", onInput);
  pane().addEventListener("change", (e) => { if (e.target.type === "file") onFile(e); else if (e.target.tagName === "SELECT" || e.target.type === "checkbox" || e.target.type === "date") onInput(e); });
  pane().addEventListener("click", onClick);
  $("#tabs").addEventListener("click", onClick);
  bindBar(); bindAuth();
  try {
    store = await openStore();
    if (store.mode === "local") return enterApp(await store.current());
    store.onRecovery(() => showAuth("newpass", "Choose a new password.", true));
    const u = await store.current();
    if (u && !location.hash.includes("type=recovery")) await enterApp(u); else showAuth("login");
  } catch (err) {
    document.body.innerHTML = `<p style="padding:24px;font:16px system-ui">The app couldn't start: ${esc(err.message)}</p>`;
  }
})();
