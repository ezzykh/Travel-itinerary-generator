// Default agency profile, a sample trip, and helpers for trip data.
// Text fields that can be printed in Arabic have a twin ending in "Ar" (title / titleAr).

export const uid = () => { try { return crypto.randomUUID(); } catch { return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); } };
export const clone = (o) => JSON.parse(JSON.stringify(o));
export const lines = (s) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);
export const todayIso = () => new Date().toISOString().slice(0, 10);

export const DEFAULT_PROFILE = {
  name: "Your Travel Company", nameAr: "شركتك للسياحة والسفر",
  tagline: "Journeys planned with care", taglineAr: "رحلات مخططة بعناية",
  logo: "",
  phone: "+965 2200 0000", whatsapp: "+965 9000 0000", email: "bookings@yourtravel.com", website: "www.yourtravel.com",
  address: "Office 12, Al Hamra Tower, Sharq, Kuwait City", addressAr: "مكتب 12، برج الحمراء، شرق، مدينة الكويت",
  licence: "", signName: "Travel Consultant", signNameAr: "مستشار السفر",
  currency: "KWD", taxLabel: "Tax", taxLabelAr: "الضريبة", taxPct: 0,
  bank: { bankName: "National Bank of Kuwait", accountName: "Your Travel Company", iban: "KW00 NBOK 0000 0000 0000 0000 0000 00", swift: "NBOKKWKW" },
  payment: "50% advance to confirm the booking\nBalance 15 days before travel\nPayment by KNET, bank transfer or link",
  paymentAr: "دفعة مقدمة 50% لتأكيد الحجز\nالمبلغ المتبقي قبل السفر بـ 15 يوماً\nالدفع عن طريق كي نت أو تحويل بنكي أو رابط دفع",
  cancellation: [
    { when: "30 days or more before travel", whenAr: "30 يوماً أو أكثر قبل السفر", fee: "10% of the package price", feeAr: "10% من سعر الباقة" },
    { when: "15 to 29 days before travel", whenAr: "من 15 إلى 29 يوماً قبل السفر", fee: "25% of the package price", feeAr: "25% من سعر الباقة" },
    { when: "7 to 14 days before travel", whenAr: "من 7 إلى 14 يوماً قبل السفر", fee: "50% of the package price", feeAr: "50% من سعر الباقة" },
    { when: "Less than 7 days, or no show", whenAr: "أقل من 7 أيام أو عدم الحضور", fee: "100% of the package price", feeAr: "100% من سعر الباقة" },
  ],
  terms: "Air fares are subject to availability and may change until tickets are issued.\nHotel check-in is usually 3 PM and check-out 12 noon.\nA passport valid for at least 6 months is required.\nVisa approval is decided by the embassy and fees are not refundable.\nThe itinerary may change due to weather or local conditions.",
  termsAr: "أسعار تذاكر الطيران حسب التوفر وقابلة للتغيير حتى إصدار التذاكر.\nموعد تسجيل الدخول في الفنادق عادة الساعة 3 عصراً والمغادرة 12 ظهراً.\nيجب أن يكون جواز السفر صالحاً لمدة 6 أشهر على الأقل.\nالموافقة على التأشيرة من صلاحيات السفارة والرسوم غير مستردة.\nقد يتغير البرنامج بسبب الطقس أو الظروف المحلية.",
  inclusions: "Return economy class air tickets\nHotel accommodation with daily breakfast\nAirport transfers by private car\nSightseeing as per the itinerary",
  inclusionsAr: "تذاكر طيران ذهاب وعودة على الدرجة السياحية\nالإقامة في الفنادق مع الإفطار اليومي\nالاستقبال والتوديع من وإلى المطار بسيارة خاصة\nالجولات السياحية حسب البرنامج",
  exclusions: "Visa fees unless mentioned\nLunch and dinner unless mentioned\nPersonal expenses and tips\nTravel insurance",
  exclusionsAr: "رسوم التأشيرة ما لم يذكر خلاف ذلك\nالغداء والعشاء ما لم يذكر خلاف ذلك\nالمصاريف الشخصية والإكراميات\nالتأمين الصحي للسفر",
  defaultLang: "en",
  defaultTemplate: "gulf-navy",
  templates: [], // custom colour templates saved by the agency
};

export function sampleTrip(profile) {
  return {
    id: uid(), lang: profile.defaultLang || "en", template: profile.defaultTemplate || "gulf-navy",
    title: "Georgia Family Escape", titleAr: "رحلة جورجيا العائلية",
    destination: "Georgia", destinationAr: "جورجيا",
    client: "Mr Esmael Khademi & Family", clientAr: "السيد إسماعيل خادمي والعائلة",
    start: "2026-11-12", pax: { adults: 2, children: 1, infants: 0 },
    route: "Tbilisi, Kazbegi, Tbilisi, Batumi", routeAr: "تبليسي، كازبيجي، تبليسي، باتومي",
    cover: "", locator: "BXYTQA",
    overview: "A relaxed week for the family: Tbilisi's old town and sulphur baths, a mountain day in Kazbegi, and three easy days by the sea in Batumi. Short drives, private car throughout.",
    overviewAr: "أسبوع مريح للعائلة: البلدة القديمة في تبليسي وحماماتها الكبريتية، ويوم في جبال كازبيجي، وثلاثة أيام هادئة على البحر في باتومي. مسافات قصيرة وسيارة خاصة طوال الرحلة.",
    highlights: "Cable car to Narikala Fortress\nGergeti Trinity Church by 4x4\nAnanuri Fortress and Zhinvali lake\nBatumi Boulevard and botanical garden",
    highlightsAr: "التلفريك إلى قلعة ناريكالا\nكنيسة جيرجيتي بسيارات الدفع الرباعي\nقلعة أنانوري وبحيرة جينفالي\nكورنيش باتومي والحديقة النباتية",
    passengers: [],
    flights: [
      { carrier: "J9", number: "121", cabin: "Y", date: "2026-11-12", from: "KWI", to: "TBS", dep: "02:45", arr: "06:10", arrOffset: 0, status: "HK", statusKind: "confirmed", airlineRef: "QW8E7R", operatedBy: "", baggage: "30 kg" },
      { carrier: "J9", number: "124", cabin: "Y", date: "2026-11-18", from: "BUS", to: "KWI", dep: "11:30", arr: "14:20", arrOffset: 0, status: "HK", statusKind: "confirmed", airlineRef: "QW8E7R", operatedBy: "", baggage: "30 kg" },
    ],
    hotels: [
      { city: "Tbilisi", cityAr: "تبليسي", name: "Rooms Hotel Tbilisi", room: "Family room", roomAr: "غرفة عائلية", meals: "Breakfast", mealsAr: "إفطار", nights: 3 },
      { city: "Batumi", cityAr: "باتومي", name: "Hilton Batumi", room: "Sea view room", roomAr: "غرفة بإطلالة بحرية", meals: "Breakfast", mealsAr: "إفطار", nights: 3 },
    ],
    days: [
      { title: "Arrive in Tbilisi", titleAr: "الوصول إلى تبليسي", desc: "Our driver meets you at the airport. Rest at the hotel, then an easy evening walk through the old town and dinner by the Mtkvari river.", descAr: "يستقبلكم السائق في المطار. استراحة في الفندق ثم جولة مسائية سهلة في البلدة القديمة وعشاء على ضفاف نهر متكفاري.", img: "", b: false, l: false, d: false, overnight: "Tbilisi", overnightAr: "تبليسي" },
      { title: "Tbilisi city tour", titleAr: "جولة في مدينة تبليسي", desc: "Cable car to Narikala Fortress, the sulphur bath district and the Bridge of Peace. Afternoon free for shopping on Rustaveli Avenue.", descAr: "التلفريك إلى قلعة ناريكالا، وحي الحمامات الكبريتية، وجسر السلام. بعد الظهر وقت حر للتسوق في شارع روستافيلي.", img: "", b: true, l: false, d: false, overnight: "Tbilisi", overnightAr: "تبليسي" },
      { title: "Kazbegi mountain day", titleAr: "يوم في جبال كازبيجي", desc: "Drive the Georgian Military Road past Ananuri Fortress and the Zhinvali lake, then a 4x4 ride up to Gergeti Trinity Church.", descAr: "الطريق العسكري الجورجي مروراً بقلعة أنانوري وبحيرة جينفالي، ثم الصعود بسيارات الدفع الرباعي إلى كنيسة جيرجيتي.", img: "", b: true, l: true, d: false, overnight: "Tbilisi", overnightAr: "تبليسي" },
      { title: "Fly or drive to Batumi", titleAr: "الانتقال إلى باتومي", desc: "Transfer to Batumi on the Black Sea. Evening on Batumi Boulevard and the dancing fountains.", descAr: "الانتقال إلى باتومي على البحر الأسود. أمسية على كورنيش باتومي والنوافير الراقصة.", img: "", b: true, l: false, d: false, overnight: "Batumi", overnightAr: "باتومي" },
      { title: "Batumi at leisure", titleAr: "يوم حر في باتومي", desc: "Botanical garden in the morning, then a free afternoon at the beach or the aquarium.", descAr: "زيارة الحديقة النباتية صباحاً، ثم وقت حر على الشاطئ أو في الأكواريوم.", img: "", b: true, l: false, d: false, overnight: "Batumi", overnightAr: "باتومي" },
      { title: "Free day", titleAr: "يوم حر", desc: "A slow day for the family. Optional trip to the Makhuntseti waterfall.", descAr: "يوم هادئ للعائلة. رحلة اختيارية إلى شلال ماخونتسيتي.", img: "", b: true, l: false, d: false, overnight: "Batumi", overnightAr: "باتومي" },
      { title: "Fly home", titleAr: "العودة إلى الكويت", desc: "Check out and transfer to Batumi airport for the flight to Kuwait.", descAr: "تسجيل المغادرة والتوجه إلى مطار باتومي للعودة إلى الكويت.", img: "", b: true, l: false, d: false, overnight: "", overnightAr: "" },
    ],
    price: {
      items: [
        { desc: "Package per adult (sharing)", descAr: "سعر الباقة للبالغ (غرفة مشتركة)", qty: 2, rate: 385 },
        { desc: "Child with extra bed (2 to 11 years)", descAr: "طفل مع سرير إضافي (من 2 إلى 11 سنة)", qty: 1, rate: 245 },
        { desc: "Air tickets KWI–TBS / BUS–KWI", descAr: "تذاكر الطيران الكويت–تبليسي / باتومي–الكويت", qty: 3, rate: 112.75 },
      ],
      discount: 15, taxPct: 0, validity: "7 days", validityAr: "7 أيام",
    },
    inclusions: profile.inclusions, inclusionsAr: profile.inclusionsAr,
    exclusions: profile.exclusions, exclusionsAr: profile.exclusionsAr,
    show: { flights: true, hotels: true, price: true, policies: true, bank: true },
    updatedAt: new Date().toISOString(),
  };
}

export function blankTrip(profile) {
  const t = sampleTrip(profile);
  return Object.assign(t, {
    id: uid(), title: "New trip", titleAr: "", destination: "", destinationAr: "", client: "", clientAr: "",
    start: todayIso(), pax: { adults: 2, children: 0, infants: 0 }, route: "", routeAr: "", cover: "", locator: "",
    overview: "", overviewAr: "", highlights: "", highlightsAr: "", passengers: [], flights: [], hotels: [],
    days: [{ title: "Arrival", titleAr: "الوصول", desc: "", descAr: "", img: "", b: false, l: false, d: false, overnight: "", overnightAr: "" }],
    price: { items: [{ desc: "Package per adult", descAr: "سعر الباقة للبالغ", qty: 2, rate: 0 }], discount: 0, taxPct: profile.taxPct || 0, validity: "7 days", validityAr: "7 أيام" },
  });
}

// Make sure old or partial trips have every field the app expects.
export function normaliseTrip(t, profile) {
  const base = blankTrip(profile);
  const out = Object.assign(base, t || {});
  out.pax = Object.assign({ adults: 0, children: 0, infants: 0 }, out.pax || {});
  out.price = Object.assign(base.price, (t || {}).price || {});
  out.show = Object.assign({ flights: true, hotels: true, price: true, policies: true, bank: true }, (t || {}).show || {});
  for (const k of ["flights", "hotels", "days", "passengers"]) if (!Array.isArray(out[k])) out[k] = [];
  if (!out.days.length) out.days = base.days;
  return out;
}

export function normaliseProfile(p) {
  const out = Object.assign(clone(DEFAULT_PROFILE), p || {});
  out.bank = Object.assign(clone(DEFAULT_PROFILE.bank), (p || {}).bank || {});
  if (!Array.isArray(out.cancellation)) out.cancellation = clone(DEFAULT_PROFILE.cancellation);
  if (!Array.isArray(out.templates)) out.templates = [];
  return out;
}
