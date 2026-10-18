// Labels printed on the PDF, in English and Arabic.
export const L = {
  itinerary:      ["Travel itinerary", "برنامج الرحلة"],
  preparedFor:    ["Prepared for", "أُعدّ خصيصاً لـ"],
  duration:       ["Duration", "المدة"],
  destination:    ["Destination", "الوجهة"],
  travellers:     ["Travellers", "المسافرون"],
  startDate:      ["Start date", "تاريخ البدء"],
  route:          ["Route", "خط السير"],
  overview:       ["Trip overview", "نظرة عامة على الرحلة"],
  highlights:     ["Highlights", "أبرز المحطات"],
  hotels:         ["Hotels", "الفنادق"],
  city:           ["City", "المدينة"],
  hotel:          ["Hotel", "الفندق"],
  room:           ["Room", "الغرفة"],
  meals:          ["Meals", "الوجبات"],
  nights:         ["Nights", "الليالي"],
  flights:        ["Flights", "الرحلات الجوية"],
  flight:         ["Flight", "الرحلة"],
  from:           ["From", "من"],
  to:             ["To", "إلى"],
  departs:        ["Departs", "المغادرة"],
  arrives:        ["Arrives", "الوصول"],
  cabin:          ["Class", "الدرجة"],
  status:         ["Status", "الحالة"],
  bookingRef:     ["Booking ref.", "رقم الحجز"],
  airlineRef:     ["Airline ref.", "مرجع شركة الطيران"],
  operatedBy:     ["Operated by", "تشغيل"],
  baggage:        ["Baggage", "الأمتعة"],
  passengers:     ["Passengers", "الركاب"],
  confirmed:      ["Confirmed", "مؤكد"],
  waitlisted:     ["Waitlisted", "قائمة الانتظار"],
  requested:      ["Requested", "قيد الطلب"],
  cancelled:      ["Cancelled", "ملغى"],
  unconfirmed:    ["Not confirmed", "غير مؤكد"],
  nextDay:        ["next day", "اليوم التالي"],
  flightNote:     ["Times are local. Please check in at least 3 hours before international departures.", "جميع الأوقات بالتوقيت المحلي. يرجى الحضور للمطار قبل 3 ساعات على الأقل من موعد الرحلات الدولية."],
  dayPlan:        ["Day-by-day plan", "البرنامج اليومي"],
  day:            ["Day", "اليوم"],
  date:           ["Date", "التاريخ"],
  plan:           ["Plan", "البرنامج"],
  breakfast:      ["Breakfast", "إفطار"],
  lunch:          ["Lunch", "غداء"],
  dinner:         ["Dinner", "عشاء"],
  noMeals:        ["No meals included", "لا تشمل وجبات"],
  overnight:      ["Overnight", "المبيت"],
  quotation:      ["Package price", "سعر الباقة"],
  guest:          ["Guest", "الضيف"],
  travelDates:    ["Travel dates", "تواريخ السفر"],
  validity:       ["Quote valid for", "صلاحية العرض"],
  description:    ["Description", "البيان"],
  qty:            ["Qty", "العدد"],
  rate:           ["Rate", "السعر"],
  amount:         ["Amount", "المبلغ"],
  subtotal:       ["Subtotal", "المجموع الفرعي"],
  discount:       ["Discount", "الخصم"],
  tax:            ["Tax", "الضريبة"],
  total:          ["Total payable", "الإجمالي المستحق"],
  perPerson:      ["Approx. per person", "تقريباً للشخص"],
  inclusions:     ["Included", "يشمل"],
  exclusions:     ["Not included", "لا يشمل"],
  policies:       ["Payment and policies", "الدفع والشروط"],
  paymentTerms:   ["Payment terms", "شروط الدفع"],
  cancellation:   ["Cancellation policy", "سياسة الإلغاء"],
  terms:          ["Terms and conditions", "الشروط والأحكام"],
  bank:           ["Bank details", "بيانات الحساب البنكي"],
  bankName:       ["Bank", "البنك"],
  accountName:    ["Account name", "اسم الحساب"],
  iban:           ["IBAN", "رقم الآيبان"],
  swift:          ["SWIFT", "رمز السويفت"],
  contact:        ["Contact us", "تواصل معنا"],
  consultant:     ["Your travel consultant", "مستشار السفر الخاص بك"],
  licence:        ["Licence no.", "رقم الترخيص"],
  signedFor:      ["For", "عن"],
  page:           ["Page", "صفحة"],
  of:             ["of", "من"],
  continued:      ["continued", "تابع"],
  adult:          ["adult", "بالغ"],
  adults:         ["adults", "بالغين"],
  child:          ["child", "طفل"],
  children:       ["children", "أطفال"],
  infant:         ["infant", "رضيع"],
  infants:        ["infants", "رضّع"],
};

export const CABIN_NAMES = {
  economy: ["Economy", "السياحية"], premium: ["Premium economy", "السياحية الممتازة"],
  business: ["Business", "رجال الأعمال"], first: ["First", "الأولى"],
};
// Booking-class letters differ between airlines, so only letters that mean the same cabin
// almost everywhere are named automatically. Agents can set the cabin on each flight.
const AUTO_CABIN = { F: "first", J: "business", C: "business", D: "business", Z: "business", Y: "economy" };
export function cabinName(code, i, chosen) {
  const key = chosen && chosen !== "auto" ? chosen : AUTO_CABIN[(code || "").toUpperCase()];
  return key ? CABIN_NAMES[key][i] : "";
}

// t("flights", "en") -> "Flights"; t("flights", "ar") -> "الرحلات الجوية"
export function t(key, lang) {
  const v = L[key];
  if (!v) return key;
  return lang === "ar" ? v[1] : v[0];
}

// Duration like "5 nights / 6 days" in either language, with correct Arabic number forms.
export function durationText(days, lang) {
  const n = Math.max(0, days - 1);
  if (lang !== "ar") return `${n} ${n === 1 ? "night" : "nights"} / ${days} ${days === 1 ? "day" : "days"}`;
  const ar = (k, one, two, few, many) => k === 1 ? one : k === 2 ? two : (k >= 3 && k <= 10) ? `${k} ${few}` : `${k} ${many}`;
  return `${ar(n, "ليلة واحدة", "ليلتان", "ليالٍ", "ليلة")} / ${ar(days, "يوم واحد", "يومان", "أيام", "يوماً")}`;
}

export function paxText(pax, lang) {
  const i = lang === "ar" ? 1 : 0;
  const part = (n, one, many) => n > 0 ? `${n} ${n === 1 ? L[one][i] : L[many][i]}` : "";
  const parts = [part(+pax.adults || 0, "adult", "adults"), part(+pax.children || 0, "child", "children"), part(+pax.infants || 0, "infant", "infants")].filter(Boolean);
  return parts.join(lang === "ar" ? " و" : ", ");
}

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const DAYS_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

// ISO date string -> "17 Nov 2026" / "17 نوفمبر 2026". `add` shifts by days.
export function fmtDate(iso, lang, add = 0, withWeekday = false) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "";
  d.setDate(d.getDate() + add);
  if (lang === "ar") return `${withWeekday ? DAYS_AR[d.getDay()] + " " : ""}${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
  const s = d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  return withWeekday ? `${d.toLocaleDateString("en-GB", { weekday: "short" })} ${s}` : s;
}
