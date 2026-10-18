import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePnr, normTime, parsePassenger, paxFromPassengers } from "../js/pnr.js";

const REF = new Date(2026, 9, 18); // 18 Oct 2026

test("times in 24h and 12h formats", () => {
  assert.equal(normTime("0820"), "08:20");
  assert.equal(normTime("820A"), "08:20");
  assert.equal(normTime("125P"), "13:25");
  assert.equal(normTime("1200N"), "12:00");
  assert.equal(normTime("1215A"), "00:15");
  assert.equal(normTime("2560"), "");
});

test("*I display with return trip, connection, next-day arrival", () => {
  const txt = `
 1 KU 101Y 15NOV 7 KWILHR HK2  0820  1325  /DCKU*K7XQ2M /E
 2 KU 102Y 29NOV 7 LHRKWI HK2  2140  0640  /DCKU*K7XQ2M /E
 3 EK 856J 03DEC 4 KWIDXB HK1  1615  1845  /DCEK*ZP4L9Q /E
 4 EK 201J 03DEC 4 DXBJFK HK1  2105  0405+1  /DCEK*ZP4L9Q /E`;
  const r = parsePnr(txt, REF);
  assert.equal(r.flights.length, 4);
  const [a, b, c, d] = r.flights;
  assert.deepEqual([a.carrier, a.number, a.cabin, a.date, a.from, a.to, a.dep, a.arr, a.status, a.airlineRef],
    ["KU", "101", "Y", "2026-11-15", "KWI", "LHR", "08:20", "13:25", "HK", "K7XQ2M"]);
  assert.equal(a.arrOffset, 0);
  assert.equal(b.arrOffset, 1, "arrival earlier than departure means next day");
  assert.equal(d.arrOffset, 1, "+1 marker");
  assert.equal(c.statusKind, "confirmed");
  assert.equal(r.warnings.length, 0);
});

test("*IA style: 12h times, spaced class, no weekday, waitlist, operated-by line", () => {
  const txt = `
  1 J9 121 Y 22DEC KWITBS HK3 245A 610A /DCJ9*QW8E7R /E
  2 TK 773 C 28DEC TBSIST HL2 1150A 105P
     OPERATED BY ANADOLUJET
  3 ARNK
  4 TK 774C 30DEC ISTKWI KK2 1250P 525P`;
  const r = parsePnr(txt, REF);
  assert.equal(r.flights.length, 3);
  assert.equal(r.flights[0].dep, "02:45");
  assert.equal(r.flights[0].seats, 3);
  assert.equal(r.flights[1].statusKind, "waitlisted");
  assert.equal(r.flights[1].operatedBy, "Anadolujet");
  assert.equal(r.flights[2].arr, "17:25");
  assert.equal(r.warnings.length, 0);
});

test("dates roll into next year and stay in order", () => {
  const r = parsePnr(` 1 KU 117Y 28DEC 1 KWIBKK HK1 2230 0950\n 2 KU 118Y 08JAN 4 BKKKWI HK1 1105 1450`, REF);
  assert.equal(r.flights[0].date, "2026-12-28");
  assert.equal(r.flights[1].date, "2027-01-08");
});

test("full *R with names, child, infant and record locator", () => {
  const txt = `
 1.2KHADEMI/ESMAELMR/SARA MRS  2.1KHADEMI/ALI MSTR*C08
 3.1I/KHADEMI/LAYLA MISS*15JAN25
 1 KU 541Y 12NOV 4 KWIIST HK3  0230  0615  /DCKU*TT5RW2 /E
 2 KU 542Y 19NOV 4 ISTKWI HK3  1015  1410  /DCKU*TT5RW2 /E
TKT/TIME LIMIT
  1.TAW15OCT/
PHONES
  1.KWI90000000-M
RECEIVED FROM - EZ
9QDE.9QDE*AEK 1047/18OCT26 BXYTQA H`;
  const r = parsePnr(txt, REF);
  assert.equal(r.locator, "BXYTQA");
  assert.equal(r.flights.length, 2);
  assert.deepEqual(r.passengers, [
    { name: "Mr Esmael Khademi", type: "adult" },
    { name: "Mrs Sara Khademi", type: "adult" },
    { name: "Mstr Ali Khademi", type: "child" },
    { name: "Miss Layla Khademi", type: "infant" },
  ]);
  assert.deepEqual(paxFromPassengers(r.passengers), { adults: 2, children: 1, infants: 1 });
});

test("single passenger tokens", () => {
  assert.deepEqual(parsePassenger("1.1KHADEMI/ESMAELMR"), { name: "Mr Esmael Khademi", type: "adult" });
  assert.deepEqual(parsePassenger("2.1AL-SABAH/NOURA MRS"), { name: "Mrs Noura Al-Sabah", type: "adult" });
  assert.equal(parsePassenger("3.1I/KHADEMI/LAYLA MISS*15JAN25").type, "infant");
  assert.deepEqual(paxFromPassengers([{ type: "adult" }, { type: "child" }, { type: "infant" }, { type: "adult" }]), { adults: 2, children: 1, infants: 1 });
});

// Real Sabre *R layout (names, phone and payment details replaced) with no air segments left.
test("real *R with no segments: reads name and locator, ignores SSR/OSI/remarks", () => {
  const txt = `*R
OUEBZI
 1.1SAMPLE/MOHAMMAD REZA MR
TKT/TIME LIMIT
  1.T-25SEP-WU1K*AAA
PHONES
  1.KWI50000000 SAMPLE TRAVEL AND TOURISM - REF AR
AA FACTS
  1.SSR ADTK 1S TO KU BY 27JUL 1809 KWI TIME ZONE OTHERWISE WIL
    L BE XLD
  6.OSI 1S *** PREV TIME FOR KU 420K 30AUG CANKWI  700A 1130A
GENERAL FACTS
  1.SSR CTCM KU HK1/0096550000000
REMARKS
  1.Z¥ID-NF
 10.H-  AUTH-APV/T00000/00/KWD10.000
 14.5
RECEIVED FROM - T
OD4H.OD4H*ARD 0809/27JUL26 OUEBZI H`;
  const r = parsePnr(txt, REF);
  assert.equal(r.locator, "OUEBZI");
  assert.deepEqual(r.passengers, [{ name: "Mr Mohammad Reza Sample", type: "adult" }]);
  assert.equal(r.flights.length, 0);
  assert.match(r.warnings[0], /no active flight segments/);
});

// Real Sabre *R layout (name and phone replaced): letter weekdays, 12-hour times, /DCKU with no locator.
test("real *R with KU segments", () => {
  const txt = `*R
OGFYAF
 1.1SAMPLE/ESMAEL MR
 1 KU 671T 20DEC S KWIDXB HK1   935A 1220P /DCKU /E
 2 KU 672V 25DEC F DXBKWI HK1   120P  210P /DCKU /E
TKT/TIME LIMIT
  1.TAWOD4HGD/
PHONES
  1.KWI90000000 SAMPLE AGENCY REF A
GENERAL FACTS
  1.OSI YY PAX CTC
RECEIVED FROM - A
OD4H.OD4H*AGD 0500/18OCT26 OGFYAF H`;
  const r = parsePnr(txt, REF);
  assert.equal(r.locator, "OGFYAF");
  assert.deepEqual(r.passengers, [{ name: "Mr Esmael Sample", type: "adult" }]);
  assert.deepEqual(r.flights.map((f) => [f.carrier, f.number, f.cabin, f.date, f.from, f.to, f.dep, f.arr, f.arrOffset, f.statusKind, f.airlineRef]), [
    ["KU", "671", "T", "2026-12-20", "KWI", "DXB", "09:35", "12:20", 0, "confirmed", ""],
    ["KU", "672", "V", "2026-12-25", "DXB", "KWI", "13:20", "14:10", 0, "confirmed", ""],
  ]);
  assert.equal(r.warnings.length, 0);
});

// Real Sabre *R layout (names and phone replaced): waitlist, unable-to-confirm, codeshare, airline advisory lines.
test("real *R with waitlist, UC, codeshare and advisory text", () => {
  const txt = `*R
OGFYAF
 1.1SAMPLE/ESMAEL MR  2.1TEST/ABBAS MR
 1 TK 773N 15DEC T KWIIST LL1   210A  625A /DCTK /E
UNABLE 00 AVAILABLE-REQUEST HAS BEEN WAITLISTED
 2 BA 681N 15DEC T ISTLHR UC1   740A  905A /DCBA
NOT AUTHORIZED
 3 LH4193W 29DEC T LHRMUC SS1   845A 1135A /DCLH /E
OPERATED BY LUFTHANSA CITY AIRLINES
LUFTHANSA CITY AIRLINES
 4 KU 174H 29DEC T MUCKWI SS1   115P  835P /DCKU /E
PASSPORT DETAILS MANDATORY BEFORE TICKETING
CHECK IN COUNTER CLOSES 60 MIN BEFORE DEPARTURE
KU OPERATES FROM TERMINAL 4 IN KUWAIT
LI.WS.LS.IL CTZNS RQR KW ENTRY TRANST VISA
TKT/TIME LIMIT
  1.TAWOD4HGD/
AA FACTS
  1.SSR OTHS 1S MISSING SSR CTCM MOBILE OR SSR CTCE EMAIL OR SS
    R CTCR NON-CONSENT FOR KU
RECEIVED FROM - A
OD4H.OD4H*AGD 0500/18OCT26 OGFYAF H`;
  const r = parsePnr(txt, REF);
  assert.equal(r.locator, "OGFYAF");
  assert.deepEqual(r.passengers.map((p) => p.name), ["Mr Esmael Sample", "Mr Abbas Test"]);
  assert.deepEqual(r.flights.map((f) => [f.carrier + f.number, f.cabin, f.date, f.from + f.to, f.dep, f.arr, f.statusKind]), [
    ["TK773", "N", "2026-12-15", "KWIIST", "02:10", "06:25", "waitlisted"],
    ["BA681", "N", "2026-12-15", "ISTLHR", "07:40", "09:05", "unconfirmed"],
    ["LH4193", "W", "2026-12-29", "LHRMUC", "08:45", "11:35", "confirmed"],
    ["KU174", "H", "2026-12-29", "MUCKWI", "13:15", "20:35", "confirmed"],
  ]);
  assert.equal(r.flights[2].operatedBy, "Lufthansa City Airlines");
  assert.equal(r.warnings.length, 0);
});

test("garbage input gives a clear warning, not a guess", () => {
  const r = parsePnr("hello world", REF);
  assert.equal(r.flights.length, 0);
  assert.match(r.warnings[0], /No flight segments/);
});
