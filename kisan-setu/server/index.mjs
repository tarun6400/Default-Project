import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "..", "dist");
const dbPath = path.join(__dirname, "db.json");

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
};

function loadDb() {
  if (fs.existsSync(dbPath)) {
    return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
  }
  const initial = {
    booking: {
      id: "b1",
      farmerId: "f1",
      centerId: "c1",
      centerName: "Guntur Market Yard",
      crop: "Paddy",
      qtyTonnes: 3.1,
      slotTime: "09:00 – 10:00",
      date: "Today",
      token: "GNT-3412",
      status: "inspection",
      qualityGrade: null,
      amount: null,
    },
    notifications: [
      { id: "n1", type: "information", title: "Arrived at mandi", titleHi: "मंडी पहुंचे", titleTe: "మార్కెట్ చేరుకున్నారు", message: "Your vehicle is at gate #2. Queue position #12, estimated wait 20 min.", messageHi: "आपका वाहन गेट #2 पर है। कतार स्थिति #12, लगभग 20 मिनट।", messageTe: "మీ వాహనం గేట్ #2 వద్ద ఉంది. క్యూ స్థానం #12, సుమారు 20 నిమిషాలు.", time: "8:51 AM", read: false },
      { id: "n2", type: "slot", title: "Slot confirmed", titleHi: "स्लॉट की पुष्टि हुई", titleTe: "స్లాట్ నిర్ధారణ అయింది", message: "Your delivery slot 09:00–10:00 at Guntur Market Yard is confirmed. Token GNT-3412.", messageHi: "गुंटूर मंडी पर आपका 09:00–10:00 डिलीवरी स्लॉट पक्का है। टोकन GNT-3412।", messageTe: "గుంటూరు మార్కెట్ యార్డులో మీ 09:00–10:00 డెలివరీ స్లాట్ నిర్ధారణ అయింది. టోకెన్ GNT-3412.", time: "6:42 AM", read: false },
    ],
    smsLog: [
      { id: "sms0", text: "Kisan Setu: Your queue position is #12 at Guntur Market Yard. Estimated wait 20 min.", time: "8:51 AM" },
      { id: "sms1", text: "Kisan Setu: Slot confirmed 09:00–10:00 at Guntur Market Yard. Token GNT-3412.", time: "6:42 AM" },
    ],
    queue: [
      { id: "q1", name: "Venkat Rao", nameHi: "वेंकट राव", nameTe: "వెంకట్ రావు", crop: "Paddy", cropHi: "धान", cropTe: "వరి", qty: 3.1, pos: 1, state: "inspection", lot: "GNT-1102", centerId: "c1" },
      { id: "q2", name: "Lakshmi Devi", nameHi: "लक्ष्मी देवी", nameTe: "లక్ష్మీ దేవి", crop: "Cotton", cropHi: "कपास", cropTe: "పత్తి", qty: 4.6, pos: 2, state: "arrived", lot: "GNT-1103", centerId: "c1" },
      { id: "q3", name: "Srinivas Reddy", nameHi: "श्रीनिवास रेड्डी", nameTe: "శ్రీనివాస్ రెడ్డి", crop: "Paddy", cropHi: "धान", cropTe: "వరి", qty: 2.2, pos: 3, state: "arrived", lot: "GNT-1105", centerId: "c1" },
      { id: "q4", name: "Nagaraju", nameHi: "नागराजू", nameTe: "నాగరాజు", crop: "Groundnut", cropHi: "मूंगफली", cropTe: "వేరుశనగ", qty: 1.8, pos: 4, state: "scheduled", lot: "GNT-1108", centerId: "c1" },
      { id: "q5", name: "Padmavathi", nameHi: "पद्मावती", nameTe: "పద్మావతి", crop: "Maize", cropHi: "मक्का", cropTe: "మొక్కజొన్న", qty: 5.0, pos: 5, state: "scheduled", lot: "GNT-1110", centerId: "c1" },
    ],
    mspRates: { Paddy: 2300, Cotton: 7020, Groundnut: 6783, Tur: 7550, Maize: 2225, "Bengal Gram": 5650 },
  };
  fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
  return initial;
}

function saveDb(db) { fs.writeFileSync(dbPath, JSON.stringify(db, null, 2)); }

function sendJson(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => { data += c; });
    req.on("end", () => {
      try { resolve(JSON.parse(data)); } catch { resolve(null); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
    return res.end();
  }

  const db = loadDb();

  // ─── API ────────────────────────────────────────────────────
  if (pathname === "/api/centers" && req.method === "GET") {
    const { centers } = await import("../src/data/mockData.js").catch(() => ({ centers: [] }));
    return sendJson(res, 200, centers.length ? centers : db.centers ?? []);
  }

  if (pathname === "/api/booking" && req.method === "GET") {
    return sendJson(res, 200, { booking: db.booking, notifications: db.notifications, smsLog: db.smsLog, queue: db.queue });
  }

  if (pathname === "/api/book" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body) return sendJson(res, 400, { error: "Invalid body" });
    const b = {
      id: "b-" + Date.now(),
      farmerId: body.farmerId ?? "f1",
      centerId: body.centerId,
      centerName: body.centerName,
      crop: body.crop,
      qtyTonnes: body.qtyTonnes,
      slotTime: body.slotTime,
      date: body.date,
      token: body.token,
      status: "pending",
      qualityGrade: null,
      amount: null,
      createdAt: new Date().toISOString(),
    };
    db.booking = b;
    const notif = {
      id: "n-" + Date.now(),
      type: "slot",
      title: "Slot confirmed",
      titleHi: "स्लॉट की पुष्टि हुई",
      titleTe: "స్లాట్ నిర్ధారణ అయింది",
      message: `Your delivery slot ${body.slotTime} at ${body.centerName} is confirmed. Token ${body.token}.`,
      messageHi: `${body.centerName} पर आपका ${body.slotTime} डिलीवरी स्लॉट पक्का है। टोकन ${body.token}।`,
      messageTe: `${body.centerName}లో మీ ${body.slotTime} డెలివరీ స్లాట్ నిర్ధారణ అయింది. టోకెన్ ${body.token}.`,
      time: "Just now",
      read: false,
    };
    db.notifications.unshift(notif);
    const sms = { id: "sms-" + Date.now(), text: `Kisan Setu: Slot confirmed ${body.slotTime} at ${body.centerName}. Token ${body.token}.`, time: new Date().toISOString() };
    db.smsLog.unshift(sms);
    saveDb(db);
    return sendJson(res, 200, { booking: b, notifications: db.notifications, smsLog: db.smsLog });
  }

  if (pathname === "/api/admin/advance" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.id) return sendJson(res, 400, { error: "Need id" });
    const nextState = { scheduled: "arrived", arrived: "inspection", inspection: "weighing", weighing: "graded", graded: "paid", paid: "paid" };
    const mspRates = { Paddy: 2300, Cotton: 7020, Groundnut: 6783, Tur: 7550, Maize: 2225, "Bengal Gram": 5650 };
    const oldRow = db.queue.find((r) => r.id === body.id);
    const oldState = oldRow?.state ?? null;
    db.queue = db.queue.map((r) => r.id === body.id ? { ...r, state: nextState[r.state] ?? r.state } : r);
    const row = db.queue.find((r) => r.id === body.id);
    let notifications = [...db.notifications];
    let smsLog = [...db.smsLog];
    let booking = db.booking;
    const statusMap = { scheduled: "arrived", arrived: "inspection", inspection: "weighing", weighing: "approved", graded: "payment", paid: "completed" };
    if (oldState === "graded") {
      const amount = Math.round(row.qty * 10 * (mspRates[row.crop] ?? 2300));
      const notif = {
        id: "n-" + Date.now(),
        type: "payment",
        title: "Payment processed",
        titleHi: "भुगतान संसाधित",
        titleTe: "చెల్లింపు జరిగింది",
        message: `₹${amount.toLocaleString("en-IN")} for your ${row.crop} (${row.qty} t) has been credited.`,
        messageHi: `आपकी ${row.cropHi} (${row.qty} टन) के ₹${amount.toLocaleString("en-IN")} आपके खाते में जमा हो गए।`,
        messageTe: `మీ ${row.cropTe} (${row.qty} టన్నుల) కోసం ₹${amount.toLocaleString("en-IN")} మీ ఖాతాలో జమ అయింది.`,
        time: "Just now",
        read: false,
      };
      notifications.unshift(notif);
      smsLog.unshift({ id: "sms-" + Date.now(), text: `Kisan Setu: ₹${amount.toLocaleString("en-IN")} credited for ${row.crop} (${row.qty} t).`, time: new Date().toISOString() });
      if (booking && booking.centerId === row.centerId && booking.crop === row.crop && (booking.status === "inspection" || booking.status === "weighing" || booking.status === "approved")) {
        booking = { ...booking, status: "payment", qualityGrade: "A", amount };
      }
      db.booking = booking;
    }
    if (row && booking && booking.centerId === row.centerId && booking.crop === row.crop && oldState && statusMap[oldState] && booking.status !== "payment" && booking.status !== "completed" && booking.status !== "rejected") {
      booking = { ...booking, status: statusMap[oldState] };
      db.booking = booking;
    }
    db.notifications = notifications;
    db.smsLog = smsLog;
    saveDb(db);
    return sendJson(res, 200, { queue: db.queue, booking: db.booking, notifications: db.notifications, smsLog: db.smsLog });
  }

  if (pathname === "/api/admin/reject" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.id) return sendJson(res, 400, { error: "Need id" });
    db.queue = db.queue.map((r) => r.id === body.id ? { ...r, state: "inspection", rejected: true, rejectReason: body.reason ?? "Quality not acceptable" } : r);
    const row = db.queue.find((r) => r.id === body.id);
    let booking = db.booking;
    let notifications = [...db.notifications];
    let smsLog = [...db.smsLog];
    if (row) {
      const notif = {
        id: "n-" + Date.now(),
        type: "info",
        title: "Quality rejected",
        titleHi: "गुणवत्ता अस्वीकृत",
        titleTe: "నాణ్యత తిరస్కరించబడింది",
        message: `Your ${row.crop} lot ${row.lot} was not accepted. Reason: ${row.rejectReason}. Please re-deliver after preparation.`,
        messageHi: `आपकी ${row.cropHi} लॉट ${row.lot} स्वीकार नहीं की गई। कारण: ${row.rejectReason}। कृपया तैयारी के बाद दोबारा लाएं।`,
        messageTe: `మీ ${row.cropTe} లాట్ ${row.lot} ఆమోదించబడలేదు. కారణం: ${row.rejectReason}. దయచేసి సిద్ధమైన తర్వాత మళ్ళీ రండి.`,
        time: "Just now",
        read: false,
      };
      notifications.unshift(notif);
      smsLog.unshift({ id: "sms-" + Date.now(), text: `Kisan Setu: Your ${row.crop} lot ${row.lot} was rejected (${row.rejectReason}). Please re-deliver.`, time: new Date().toISOString() });
      if (booking && booking.centerId === row.centerId && booking.crop === row.crop && (booking.status === "inspection" || booking.status === "weighing")) {
        booking = { ...booking, status: "rejected" };
      }
      db.booking = booking;
      db.notifications = notifications;
      db.smsLog = smsLog;
    }
    saveDb(db);
    return sendJson(res, 200, { queue: db.queue, booking: db.booking, notifications: db.notifications, smsLog: db.smsLog });
  }

  if (pathname === "/api/sms/send" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.text) return sendJson(res, 400, { error: "Need text" });
    const sms = { id: "sms-" + Date.now(), text: body.text, time: new Date().toISOString() };
    db.smsLog.unshift(sms);
    saveDb(db);
    return sendJson(res, 200, sms);
  }

  if (pathname === "/api/sms" && req.method === "GET") {
    return sendJson(res, 200, db.smsLog);
  }

  // ─── Static files ───────────────────────────────────────────
  let filePath = path.join(distDir, pathname === "/" ? "index.html" : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(distDir, "index.html"); // SPA fallback
  }
  const ext = path.extname(filePath);
  const mime = MIME[ext] ?? "application/octet-stream";
  const content = fs.readFileSync(filePath);
  res.writeHead(200, { "Content-Type": mime });
  res.end(content);
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Kisan Setu server running on http://localhost:${PORT}`);
});