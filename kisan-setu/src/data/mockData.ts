export interface Center {
  id: string;
  name: string;
  nameHi: string;
  nameTe: string;
  district: string;
  districtTe: string;
  address: string;
  lat: number;
  lng: number;
  crops: string[];
  capacity: number; // metric tonnes per day
  currentLoad: number; // % of capacity used right now
  queueLength: number;
  avgWaitMins: number;
  dailySlots: number;
  slotsBookedToday: number;
  opensAt: string;
  closesAt: string;
  phone: string;
  rating: number;
  tags: string[];
}

export const centers: Center[] = [
  {
    id: "c1",
    name: "Guntur Market Yard",
    nameHi: "गुंटूर मार्केट यार्ड",
    nameTe: "గుంటూరు మార్కెట్ యార్డ్",
    district: "Guntur",
    districtTe: "గుంటూరు",
    address: "Market Yard, Guntur, Andhra Pradesh",
    lat: 16.3067,
    lng: 80.4365,
    crops: ["Paddy", "Chilli", "Cotton", "Maize"],
    capacity: 420,
    currentLoad: 62,
    queueLength: 14,
    avgWaitMins: 35,
    dailySlots: 120,
    slotsBookedToday: 84,
    opensAt: "07:00",
    closesAt: "19:30",
    phone: "+91 863 223 4500",
    rating: 4.5,
    tags: ["Nearby", "Fast moving"],
  },
  {
    id: "c2",
    name: "Vijayawada Procurement Center",
    nameHi: "विजयवाड़ा खरीद केंद्र",
    nameTe: "విజయవాడ కొనుగోలు కేంద్రం",
    district: "Krishna",
    districtTe: "కృష్ణా",
    address: "Auto Nagar, Vijayawada, Andhra Pradesh",
    lat: 16.5062,
    lng: 80.648,
    crops: ["Paddy", "Maize", "Cotton"],
    capacity: 380,
    currentLoad: 78,
    queueLength: 27,
    avgWaitMins: 58,
    dailySlots: 96,
    slotsBookedToday: 91,
    opensAt: "06:30",
    closesAt: "20:00",
    phone: "+91 866 247 1100",
    rating: 4.2,
    tags: ["High load"],
  },
  {
    id: "c3",
    name: "Tenali Agricultural Market",
    nameHi: "तेनाली कृषि बाज़ार",
    nameTe: "తెనాలి వ్యవసాయ మార్కెట్",
    district: "Guntur",
    districtTe: "గుంటూరు",
    address: "Market Road, Tenali, Andhra Pradesh",
    lat: 16.2422,
    lng: 80.6396,
    crops: ["Paddy", "Tur", "Bengal Gram"],
    capacity: 260,
    currentLoad: 45,
    queueLength: 8,
    avgWaitMins: 22,
    dailySlots: 80,
    slotsBookedToday: 41,
    opensAt: "08:00",
    closesAt: "18:00",
    phone: "+91 8644 226 505",
    rating: 4.7,
    tags: ["Nearby", "Low wait"],
  },
  {
    id: "c4",
    name: "Kurnool Market Yard",
    nameHi: "कुरनूल मार्केट यार्ड",
    nameTe: "కర్నూలు మార్కెట్ యార్డ్",
    district: "Kurnool",
    districtTe: "కర్నూలు",
    address: "Market Yard, Kurnool, Andhra Pradesh",
    lat: 15.8281,
    lng: 78.0373,
    crops: ["Cotton", "Groundnut", "Tur"],
    capacity: 310,
    currentLoad: 55,
    queueLength: 12,
    avgWaitMins: 30,
    dailySlots: 90,
    slotsBookedToday: 62,
    opensAt: "07:30",
    closesAt: "19:00",
    phone: "+91 8518 220 444",
    rating: 4.3,
    tags: [],
  },
  {
    id: "c5",
    name: "Eluru Procurement Unit",
    nameHi: "एलुरु खरीद इकाई",
    nameTe: "ఏలూరు కొనుగోలు యూనిట్",
    district: "West Godavari",
    districtTe: "పశ్చిమ గోదావరి",
    address: "Duggirala Road, Eluru, Andhra Pradesh",
    lat: 16.7107,
    lng: 81.0952,
    crops: ["Paddy", "Maize", "Groundnut"],
    capacity: 240,
    currentLoad: 33,
    queueLength: 5,
    avgWaitMins: 15,
    dailySlots: 64,
    slotsBookedToday: 22,
    opensAt: "08:30",
    closesAt: "17:30",
    phone: "+91 8812 233 110",
    rating: 4.8,
    tags: ["Low wait"],
  },
  {
    id: "c6",
    name: "Rajamahendravaram Center",
    nameHi: "राजमहेंद्रवरम केंद्र",
    nameTe: "రాజమహేంద్రవరం కేంద్రం",
    district: "East Godavari",
    districtTe: "తూర్పు గోదావరి",
    address: "Danavaipeta, Rajahmundry, Andhra Pradesh",
    lat: 17.0005,
    lng: 81.804,
    crops: ["Paddy", "Groundnut", "Tur"],
    capacity: 350,
    currentLoad: 68,
    queueLength: 19,
    avgWaitMins: 44,
    dailySlots: 100,
    slotsBookedToday: 88,
    opensAt: "07:00",
    closesAt: "20:00",
    phone: "+91 883 244 8840",
    rating: 4.4,
    tags: [],
  },
];

export type Crop = "Paddy" | "Cotton" | "Groundnut" | "Tur" | "Maize" | "Bengal Gram";

export interface Slot {
  id: string;
  centerId: string;
  date: string;
  time: string;
  label: string;
  remaining: number;
  total: number;
}

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

export const generateSlots = (centerId: string): Slot[] => {
  const times = [
    { time: "07:00", label: "07:00 – 08:00" },
    { time: "08:00", label: "08:00 – 09:00" },
    { time: "09:00", label: "09:00 – 10:00" },
    { time: "10:00", label: "10:00 – 11:00" },
    { time: "11:00", label: "11:00 – 12:00" },
    { time: "13:00", label: "13:00 – 14:00" },
    { time: "14:00", label: "14:00 – 15:00" },
    { time: "16:00", label: "16:00 – 17:00" },
  ];
  return times.map((t, i) => {
    const total = [10, 12, 8, 10, 9, 10, 8, 9][i % 8];
    const remaining = [0, 2, 8, 3, 0, 6, 4, 9][i % 8];
    return {
      id: `${centerId}-${t.time}`,
      centerId,
      date: today(),
      time: t.time,
      label: t.label,
      remaining,
      total,
    };
  });
};

export interface Booking {
  id: string;
  farmerId: string;
  centerId: string;
  centerName: string;
  crop: string;
  qtyTonnes: number;
  slotTime: string;
  date: string;
  token: string;
  status: "pending" | "inspection" | "weighing" | "approved" | "payment" | "completed" | "rejected";
  qualityGrade: "A" | "B" | "C" | null;
  amount: number | null;
}

export interface AppNotification {
  id: string;
  type: "slot" | "schedule" | "payment" | "info";
  title: string;
  titleHi: string;
  titleTe: string;
  message: string;
  messageHi: string;
  messageTe: string;
  time: string;
  read: boolean;
}

export const demoFarmer = {
  id: "f1",
  name: "Venkat Rao",
  nameHi: "वेंकट राव",
  nameTe: "వెంకట రావు",
  phone: "+91 98480 11223",
  crop: "Paddy" as Crop,
  landSize: "4.5 acres",
  landSizeHi: "4.5 एकड़",
  landSizeTe: "4.5 ఎకరాలు",
  aadhaar: "XXXX-XXXX-4421",
  village: "Vill. Kaza, Guntur",
  villageHi: "गाँव काज़ा, गुंटूर",
  villageTe: "కాజా గ్రామం, గుంటూరు",
};

export const demoBooking: Booking = {
  id: "b1",
  farmerId: "f1",
  centerId: "c1",
  centerName: "Guntur Market Yard",
  crop: "Paddy",
  qtyTonnes: 2.4,
  slotTime: "09:00",
  date: today(),
  token: "GNT-3412",
  status: "inspection",
  qualityGrade: null,
  amount: null,
};

export const notes: AppNotification[] = [
  {
    id: "n1",
    type: "slot",
    title: "Slot confirmed",
    titleHi: "स्लॉट की पुष्टि हुई",
    titleTe: "స్లాట్ నిర్ధారణ అయింది",
    message: "Your delivery slot on 09:00 – 10:00 at Guntur Market Yard is confirmed.",
    messageHi: "गुंटूर मार्केट यार्ड पर आपका 09:00 – 10:00 का डिलीवरी स्लॉट पक्का हो गया है।",
    messageTe: "గుంటూరు మార్కెట్ యార్డ్లో మీ 09:00 – 10:00 డెలివరీ స్లాట్ నిర్ధారణ అయింది.",
    time: "Today, 6:42 AM",
    read: false,
  },
  {
    id: "n2",
    type: "schedule",
    title: "Schedule update",
    titleHi: "शेड्यूल अपडेट",
    titleTe: "షెడ్యూల్ నవీకరణ",
    message: "Guntur Market Yard will remain open until 19:30 today for arrivals.",
    messageHi: "गुंटूर मार्केट यार्ड आज 19:30 तक आवक के लिए खुला रहेगा।",
    messageTe: "గుంటూరు మార్కెట్ యార్డ్ ఈరోజు 19:30 వరకు రాకల కోసం తెరిచి ఉంటుంది.",
    time: "Yesterday, 8:10 PM",
    read: true,
  },
  {
    id: "n3",
    type: "payment",
    title: "Payment processed",
    titleHi: "भुगतान संसाधित",
    titleTe: "చెల్లింపు పూర్తయింది",
    message: "₹1,10,400 for your Cotton (7.2 t) at Kurnool Market Yard has been credited to your account.",
    messageHi: "कुरनूल मार्केट यार्ड में आपकी कपास (7.2 टन) के ₹1,10,400 आपके खाते में जमा कर दिए गए हैं।",
    messageTe: "కర్నూలు మార్కెట్ యార్డ్లో మీ పత్తి (7.2 టన్నులు) కోసం ₹1,10,400 మీ ఖాతాలో జమ అయ్యాయి.",
    time: "Mon, 11:20 AM",
    read: true,
  },
  {
    id: "n4",
    type: "info",
    title: "MSP update",
    titleHi: "न्यूनतम समर्थन मूल्य",
    titleTe: "MSP నవీకరణ",
    message: "New MSP notified for Kharif 2026: Paddy ₹2,300/quintal.",
    messageHi: "खरीफ 2026 हेतु नया MSP जारी: धान ₹2,300/क्विंटल।",
    messageTe: "ఖరీఫ్ 2026 కోసం కొత్త MSP ప్రకటించబడింది: వరి ₹2,300/క్వింటాల్.",
    time: "Sun, 5:05 PM",
    read: true,
  },
];

export const statusSteps: {
  key: Booking["status"];
  label: string;
  labelHi: string;
  labelTe: string;
  desc: string;
  descHi: string;
  descTe: string;
}[] = [
  {
    key: "pending",
    label: "Slot Reserved",
    labelHi: "स्लॉट आरक्षित",
    labelTe: "స్లాట్ రిజర్వ్ అయింది",
    desc: "Token issued, head to the center before your slot.",
    descHi: "टोकन जारी हुआ, अपने स्लॉट से पहले केंद्र पहुंचें।",
    descTe: "టోకెన్ జారీ అయింది, మీ స్లాట్కు ముందే కేంద్రానికి చేరుకోండి.",
  },
  {
    key: "inspection",
    label: "Pending Inspection",
    labelHi: "निरीक्षण लंबित",
    labelTe: "పరిశీలన పెండింగ్",
    desc: "Produce under quality & moisture inspection.",
    descHi: "उपज का गुणवत्ता व नमी निरीक्षण हो रहा है।",
    descTe: "పంట నాణ్యత & తేమ పరిశీలనలో ఉంది.",
  },
  {
    key: "weighing",
    label: "Weighing",
    labelHi: "तौल हो रही",
    labelTe: "తూకం వేస్తున్నారు",
    desc: "Your produce is being weighed and bagged.",
    descHi: "आपकी उपज का तौल और बंडलीकरण हो रहा है।",
    descTe: "మీ పంట తూకం వేసి బస్తాలలో నింపుతున్నారు.",
  },
  {
    key: "approved",
    label: "Approved",
    labelHi: "स्वीकृत",
    labelTe: "ఆమోదించబడింది",
    desc: "Grading complete. Payment is being processed.",
    descHi: "ग्रेडिंग पूर्ण। भुगतान संसाधित हो रहा है।",
    descTe: "గ్రేడింగ్ పూర్తయింది. చెల్లింపు ప్రక్రియలో ఉంది.",
  },
  {
    key: "payment",
    label: "Payment Processed",
    labelHi: "भुगतान हो गया",
    labelTe: "చెల్లింపు పూర్తయింది",
    desc: "Amount credited to your bank account.",
    descHi: "राशि आपके बैंक खाते में जमा हो गई है।",
    descTe: "మొత్తం మీ బ్యాంక్ ఖాతాలో జమ అయింది.",
  },
];

export const stepsIndex: Record<Booking["status"], number> = {
  pending: 0,
  inspection: 1,
  weighing: 2,
  approved: 3,
  payment: 4,
  completed: 4,
  rejected: -1,
};

export const mspRates: Record<Crop, number> = {
  Paddy: 2300,
  Cotton: 7020,
  Groundnut: 6783,
  Tur: 7550,
  Maize: 2225,
  "Bengal Gram": 5650,
};

export const languagesAvailable = [
  { code: "en", label: "English", script: "EN" },
  { code: "te", label: "తెలుగు", script: "తె" },
  { code: "hi", label: "हिन्दी", script: "हि" },
];