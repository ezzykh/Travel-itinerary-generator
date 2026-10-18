// Airport and airline names in English and Arabic, for codes common on Kuwait itineraries.
// Unknown codes still work: the PDF just shows the code. Add more here as needed.
export const AIRPORTS = {
  KWI: ["Kuwait", "الكويت"], DXB: ["Dubai", "دبي"], DWC: ["Dubai World Central", "دبي وورلد سنترال"],
  AUH: ["Abu Dhabi", "أبوظبي"], SHJ: ["Sharjah", "الشارقة"], DOH: ["Doha", "الدوحة"], BAH: ["Bahrain", "البحرين"],
  MCT: ["Muscat", "مسقط"], SLL: ["Salalah", "صلالة"], RUH: ["Riyadh", "الرياض"], JED: ["Jeddah", "جدة"],
  MED: ["Madinah", "المدينة المنورة"], DMM: ["Dammam", "الدمام"], TIF: ["Taif", "الطائف"], AHB: ["Abha", "أبها"],
  CAI: ["Cairo", "القاهرة"], HBE: ["Alexandria", "الإسكندرية"], SSH: ["Sharm El Sheikh", "شرم الشيخ"], HRG: ["Hurghada", "الغردقة"],
  AMM: ["Amman", "عمّان"], AQJ: ["Aqaba", "العقبة"], BEY: ["Beirut", "بيروت"], BGW: ["Baghdad", "بغداد"], NJF: ["Najaf", "النجف"],
  BSR: ["Basra", "البصرة"], EBL: ["Erbil", "أربيل"], MHD: ["Mashhad", "مشهد"], IKA: ["Tehran", "طهران"],
  IST: ["Istanbul", "إسطنبول"], SAW: ["Istanbul Sabiha Gökçen", "إسطنبول صبيحة"], TZX: ["Trabzon", "طرابزون"],
  AYT: ["Antalya", "أنطاليا"], ESB: ["Ankara", "أنقرة"], BJV: ["Bodrum", "بودروم"], ADB: ["Izmir", "إزمير"],
  TBS: ["Tbilisi", "تبليسي"], BUS: ["Batumi", "باتومي"], GYD: ["Baku", "باكو"], EVN: ["Yerevan", "يريفان"],
  SJJ: ["Sarajevo", "سراييفو"], TIA: ["Tirana", "تيرانا"], SKP: ["Skopje", "سكوبيه"], BEG: ["Belgrade", "بلغراد"],
  ALA: ["Almaty", "ألماتي"], TAS: ["Tashkent", "طشقند"],
  LHR: ["London Heathrow", "لندن هيثرو"], LGW: ["London Gatwick", "لندن جاتويك"], MAN: ["Manchester", "مانشستر"],
  CDG: ["Paris", "باريس"], NCE: ["Nice", "نيس"], FRA: ["Frankfurt", "فرانكفورت"], MUC: ["Munich", "ميونخ"],
  VIE: ["Vienna", "فيينا"], ZRH: ["Zurich", "زيورخ"], GVA: ["Geneva", "جنيف"], MXP: ["Milan", "ميلانو"],
  FCO: ["Rome", "روما"], BCN: ["Barcelona", "برشلونة"], MAD: ["Madrid", "مدريد"], AMS: ["Amsterdam", "أمستردام"],
  BRU: ["Brussels", "بروكسل"], PRG: ["Prague", "براغ"], ATH: ["Athens", "أثينا"], SZG: ["Salzburg", "سالزبورغ"],
  BKK: ["Bangkok", "بانكوك"], HKT: ["Phuket", "بوكيت"], KUL: ["Kuala Lumpur", "كوالالمبور"], PEN: ["Penang", "بينانج"],
  LGK: ["Langkawi", "لنكاوي"], CGK: ["Jakarta", "جاكرتا"], DPS: ["Bali", "بالي"], SIN: ["Singapore", "سنغافورة"],
  MLE: ["Malé", "ماليه"], CMB: ["Colombo", "كولومبو"], BOM: ["Mumbai", "مومباي"], DEL: ["Delhi", "دلهي"],
  COK: ["Kochi", "كوتشي"], TRV: ["Thiruvananthapuram", "تيروفانانثابورام"], HYD: ["Hyderabad", "حيدر أباد"],
  BLR: ["Bengaluru", "بنغالور"], MAA: ["Chennai", "تشيناي"], ISB: ["Islamabad", "إسلام آباد"], LHE: ["Lahore", "لاهور"],
  KHI: ["Karachi", "كراتشي"], DAC: ["Dhaka", "دكا"], KTM: ["Kathmandu", "كاتماندو"], MNL: ["Manila", "مانيلا"],
  HKG: ["Hong Kong", "هونغ كونغ"], ICN: ["Seoul", "سيول"], NRT: ["Tokyo Narita", "طوكيو ناريتا"], HND: ["Tokyo Haneda", "طوكيو هانيدا"],
  JFK: ["New York", "نيويورك"], IAD: ["Washington", "واشنطن"], ORD: ["Chicago", "شيكاغو"], LAX: ["Los Angeles", "لوس أنجلوس"],
  YYZ: ["Toronto", "تورونتو"], MRU: ["Mauritius", "موريشيوس"], SEZ: ["Seychelles", "سيشل"], ZNZ: ["Zanzibar", "زنجبار"],
};

export const AIRLINES = {
  KU: ["Kuwait Airways", "الخطوط الجوية الكويتية"], J9: ["Jazeera Airways", "طيران الجزيرة"],
  EK: ["Emirates", "طيران الإمارات"], QR: ["Qatar Airways", "الخطوط الجوية القطرية"], EY: ["Etihad Airways", "الاتحاد للطيران"],
  GF: ["Gulf Air", "طيران الخليج"], WY: ["Oman Air", "الطيران العماني"], OV: ["SalamAir", "طيران السلام"],
  SV: ["Saudia", "الخطوط السعودية"], XY: ["flynas", "طيران ناس"], F3: ["flyadeal", "طيران أديل"], RX: ["Riyadh Air", "طيران الرياض"],
  FZ: ["flydubai", "فلاي دبي"], G9: ["Air Arabia", "العربية للطيران"], "3L": ["Air Arabia Abu Dhabi", "العربية للطيران أبوظبي"],
  MS: ["EgyptAir", "مصر للطيران"], RJ: ["Royal Jordanian", "الملكية الأردنية"], ME: ["Middle East Airlines", "طيران الشرق الأوسط"],
  IA: ["Iraqi Airways", "الخطوط الجوية العراقية"], TK: ["Turkish Airlines", "الخطوط الجوية التركية"], PC: ["Pegasus", "طيران بيغاسوس"],
  AJ: ["AJet", "أيه جت"], J2: ["Azerbaijan Airlines", "الخطوط الأذربيجانية"], A9: ["Georgian Airways", "الخطوط الجورجية"],
  BA: ["British Airways", "الخطوط البريطانية"], LH: ["Lufthansa", "لوفتهانزا"], AF: ["Air France", "الخطوط الفرنسية"],
  KL: ["KLM", "الخطوط الملكية الهولندية"], LX: ["SWISS", "الخطوط السويسرية"], OS: ["Austrian", "الخطوط النمساوية"],
  AZ: ["ITA Airways", "إيتا"], A3: ["Aegean", "إيجيان"], MH: ["Malaysia Airlines", "الخطوط الماليزية"],
  TG: ["Thai Airways", "الخطوط التايلاندية"], SQ: ["Singapore Airlines", "الخطوط السنغافورية"], GA: ["Garuda Indonesia", "غارودا الإندونيسية"],
  UL: ["SriLankan Airlines", "الخطوط السريلانكية"], AI: ["Air India", "طيران الهند"], "6E": ["IndiGo", "إنديغو"],
  IX: ["Air India Express", "طيران الهند إكسبريس"], PK: ["PIA", "الخطوط الباكستانية"], BG: ["Biman Bangladesh", "بيمان"],
  PR: ["Philippine Airlines", "الخطوط الفلبينية"], CX: ["Cathay Pacific", "كاثي باسيفيك"], KE: ["Korean Air", "الخطوط الكورية"],
  AA: ["American Airlines", "الخطوط الأمريكية"], UA: ["United", "يونايتد"], DL: ["Delta", "دلتا"], AC: ["Air Canada", "طيران كندا"],
  ET: ["Ethiopian Airlines", "الخطوط الإثيوبية"], KQ: ["Kenya Airways", "الخطوط الكينية"],
};

export function airportName(code, lang) {
  const a = AIRPORTS[(code || "").toUpperCase()];
  return a ? a[lang === "ar" ? 1 : 0] : (code || "");
}
export function airlineName(code, lang) {
  const a = AIRLINES[(code || "").toUpperCase()];
  return a ? a[lang === "ar" ? 1 : 0] : (code || "");
}
