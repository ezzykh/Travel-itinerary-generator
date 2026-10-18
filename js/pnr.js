// Reads Sabre *I / *IA itinerary displays and full *R PNR displays pasted as text.
// Returns flight segments, passenger names and record locators. Anything it can't read is
// reported in `warnings` instead of being guessed.

const MONTHS = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };

// " 1 KU 101Y 15NOV 6 KWILHR HK2  0820  1325  /DCKU*ABC123 /E"
// Also accepts: "KU101Y", "KU 101 Y", "KWI LHR", "*SS2", "HK 2", 12-hour times "820A"/"125P", no weekday digit.
const SEG = new RegExp(
  "^\\s*(\\d{1,2})\\s*\\.?\\s*" +            // 1 segment number
  "([A-Z0-9]{2})\\*?\\s?" +                    // 2 carrier
  "(\\d{1,4})\\s?([A-Z])\\s+" +               // 3 flight number, 4 booking class
  "(\\d{1,2})([A-Z]{3})\\s+" +                // 5 day, 6 month
  "(?:([1-7A-Z])\\s+)?" +                      // 7 weekday (optional)
  "([A-Z]{3})\\s?([A-Z]{3})\\*?\\s*" +         // 8 from, 9 to
  "([A-Z]{2})\\s?(\\d{0,2})\\s+" +            // 10 status, 11 seats
  "(\\d{3,4}[APNM]?)\\s+" +                    // 12 departure
  "(\\d{3,4}[APNM]?)" +                        // 13 arrival
  "(.*)$"                                       // 14 rest of line
);

const CONFIRMED = new Set(["HK", "KK", "TK", "SS", "RR", "KL", "HS"]);
const WAITLIST = new Set(["HL", "LL", "HN", "DS", "PN"]);
const UNCONFIRMED = new Set(["UC", "UN", "NO", "US", "UU"]); // airline could not confirm
const CANCELLED = new Set(["HX", "XX", "XK", "XL", "XR"]);

export function statusKind(code) {
  if (CONFIRMED.has(code)) return "confirmed";
  if (WAITLIST.has(code)) return "waitlisted";
  if (UNCONFIRMED.has(code)) return "unconfirmed";
  if (CANCELLED.has(code)) return "cancelled";
  return "requested";
}

// "0820" -> "08:20"; "820A" -> "08:20"; "125P" -> "13:25"; "1200N" -> "12:00"; "1200M" -> "00:00"
export function normTime(s) {
  const m = /^(\d{1,2})(\d{2})([APNM]?)$/.exec(s || "");
  if (!m) return "";
  let h = +m[1];
  const mi = +m[2];
  if (m[3] === "P" && h < 12) h += 12;
  if (m[3] === "A" && h === 12) h = 0;
  if (m[3] === "M") h = 0;
  if (h > 23 || mi > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`;
}

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Sabre dates have no year. Pick the first occurrence that isn't well in the past
// (allowing 60 days back for trips already under way), and keep segments in order.
function datedFrom(day, mon, ref, prev) {
  const mo = MONTHS[mon];
  if (mo === undefined || day < 1 || day > 31) return null;
  const floor = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - 60);
  let d = new Date(ref.getFullYear() - 1, mo, day);
  while (d < floor || (prev && d < prev)) d = new Date(d.getFullYear() + 1, mo, day);
  if (d.getMonth() !== mo) return null; // e.g. 31 FEB
  return d;
}

const TITLES = ["MSTR", "MISS", "MRS", "MR", "MS", "DR"];
const cap = (s) => s.toLowerCase().replace(/(^|[\s'\-])([a-z])/g, (_, a, b) => a + b.toUpperCase());

function onePerson(surname, givenRaw, infant) {
  // givenRaw: "ESMAELMR", "ANNA MISS*C08", "ALI MSTR*15JAN25"
  const gm = /^([A-Z][A-Z' \-]*?)\s*(\*\S+)?\s*$/.exec(givenRaw.trim());
  if (!gm) return null;
  let given = gm[1].trim();
  let title = "";
  for (const tt of TITLES) {
    if (given.endsWith(" " + tt) || (given.endsWith(tt) && given.length > tt.length + 1)) {
      title = tt; given = given.slice(0, -tt.length).trim(); break;
    }
  }
  const extra = (gm[2] || "").toUpperCase();
  let type = "adult";
  if (infant || /INF/.test(extra) || /^\*\d{2}[A-Z]{3}\d{2}$/.test(extra)) type = "infant";
  else if (/^\*C\d{1,2}$/.test(extra) || /CHD|CNN/.test(extra) || title === "MSTR" || title === "MISS") type = "child";
  const tShow = { MR: "Mr", MRS: "Mrs", MS: "Ms", MISS: "Miss", MSTR: "Mstr", DR: "Dr" }[title] || "";
  return { name: [tShow, cap(given), cap(surname)].filter(Boolean).join(" "), type };
}

// One Sabre name item. "1.2KHADEMI/ESMAELMR/SARA MRS" holds two people with the same surname.
export function parsePassengers(token) {
  const m = /^\d{1,2}\.\d{1,2}(I\/)?([A-Z][A-Z' \-]*)\/(.+)$/.exec(token.trim());
  if (!m) return [];
  return m[3].split("/").map((g) => onePerson(m[2].trim(), g, !!m[1])).filter(Boolean);
}
export function parsePassenger(token) { return parsePassengers(token)[0] || null; }

export function parsePnr(text, ref = new Date()) {
  const out = { locator: "", passengers: [], flights: [], warnings: [] };
  if (!text || !text.trim()) return out;
  // Sabre shows some characters differently depending on the terminal; normalise them.
  const lines = text.replace(/\r/g, "").replace(/\u00A5/g, " ").toUpperCase().split("\n");
  let prev = null;
  let lastSeg = null;

  for (const raw of lines) {
    const line = raw.replace(/\t/g, " ");

    // Passenger names: lines that start with "1.1SURNAME/..."
    if (/^\s*\d{1,2}\.\d{1,2}(I\/)?[A-Z]/.test(line)) {
      for (const tok of line.trim().split(/\s+(?=\d{1,2}\.\d{1,2}(?:I\/)?[A-Z])/)) {
        out.passengers.push(...parsePassengers(tok.replace(/[\u2021+]+$/, "")));
      }
      continue;
    }

    const m = SEG.exec(line);
    if (m) {
      const [, seg, carrier, num, cls, dd, mon, , from, to, status, seats, dep, arr, rest] = m;
      const d = datedFrom(+dd, mon, ref, prev);
      if (!d) { out.warnings.push(`Segment ${seg}: could not read the date "${dd}${mon}".`); continue; }
      prev = d;
      const depT = normTime(dep), arrT = normTime(arr);
      let offset = 0;
      const om = /^\s*(?:\+|#|\u2021)\s*(\d)/.exec(rest) || /^\s*(-1)\b/.exec(rest);
      if (om) offset = +om[1];
      else if (depT && arrT && arrT < depT) offset = 1; // arrives after midnight
      const dc = /\/DC([A-Z0-9]{2})\*([A-Z0-9]{5,8})/.exec(rest);
      lastSeg = {
        seg: +seg, carrier, number: String(+num), cabin: cls, date: iso(d), from, to,
        dep: depT, arr: arrT, arrOffset: offset, status, statusKind: statusKind(status),
        seats: seats ? +seats : 0, airlineRef: dc ? dc[2] : "", operatedBy: "", baggage: "",
      };
      if (!depT || !arrT) out.warnings.push(`Segment ${seg} (${carrier}${num}): check the times.`);
      out.flights.push(lastSeg);
      continue;
    }

    const op = /OPERATED BY\s+(.+)$/.exec(line);
    if (op && lastSeg) { lastSeg.operatedBy = cap(op[1].replace(/^[\/\s]+|[\/\s]+$/g, "").replace(/\s{2,}.*$/, "")); continue; }

    // Lines that look like segments but didn't match (other than ARNK / non-air segments).
    if (/^\s*\d{1,2}\s+[A-Z0-9]{2}\s?\d{1,4}/.test(line) && !/ARNK|OTH|HHL|HTL|CAR|TUR|SURFACE/.test(line)) {
      out.warnings.push(`Could not read: "${line.trim().slice(0, 60)}"`);
    }
  }

  // Record locator: Sabre's last PNR line ends "... 1047/18OCT26 ABCDEF H", or the locator sits on a line alone.
  const all = lines.join("\n");
  const loc = /\b\d{3,4}\/\d{1,2}[A-Z]{3}\d{2}\s+([A-Z]{6})\b/.exec(all) || /^\s*([A-Z]{6})\s*$/m.exec(all) || /(?:RLOC|RECORD LOCATOR|PNR)[\s:\-]+([A-Z0-9]{6})\b/.exec(all);
  if (loc) out.locator = loc[1];
  if (!out.flights.length) {
    out.warnings.push(out.passengers.length || out.locator
      ? "This PNR has no active flight segments (they may be cancelled or already flown). The names and booking reference were imported."
      : "No flight segments found. Paste the *I, *IA or *R display from Sabre Red 360.");
  }
  return out;
}

// Count travellers by type from parsed passengers.
export function paxFromPassengers(list) {
  const c = { adults: 0, children: 0, infants: 0 };
  for (const p of list) c[p.type === "infant" ? "infants" : p.type === "child" ? "children" : "adults"]++;
  return c;
}
