import { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import "./AiChat.css";

interface Msg {
  who: "bot" | "user";
  text: string;
}

const KB: Array<{ keys: string[]; reply: string }> = [
  { keys: ["paddy", "dhani", "vadi", "వరి"], reply: "Paddy MSP is ₹2,300/quintal this season (A-grade full rate). Prices have been stable for 2 weeks — ideal time to sell if your stock is ready." },
  { keys: ["cotton", "kapas", "patti"], reply: "Cotton MSP is ₹7,020/quintal. Grade 'A' clears at full MSP at Guntur Market Yard. Expect wait time ~25 min if you book a slot." },
  { keys: ["price", "msp", "daam", "rate"], reply: "Live today — Paddy ₹2,300 · Maize ₹2,225 · Cotton ₹7,020 · Groundnut ₹6,783 · Tur ₹7,550 · Bengal Gram ₹5,650 per quintal." },
  { keys: ["slot", "book", "queue", "booking"], reply: "Go to Dashboard → pick a market yard → choose a time slot. Your token is generated instantly and you skip ~70 min of waiting." },
  { keys: ["pay", "paisa", "payment", "credit", "💰"], reply: "Payments are credited directly to your linked bank account within 48 hours of grading. Check your Wallet card on the Dashboard." },
  { keys: ["language", "bhasha", "telugu", "hindi", "భాష"], reply: "Tap the language button in the top-right to switch between English, తెలుగు and हिन्दी. Your choice is remembered on every screen." },
  { keys: ["center", "yard", "mandi", "market", "find"], reply: "There are 6 live markets across 5 Andhra Pradesh districts. Open the Map to see load %, wait times and directions." },
  { keys: ["hello", "hi", "namaste", "నమస్తే", "नमस्ते"], reply: "Namaste 🙏 I'm Kisan AI. Ask me about mandi prices, slot booking, payments or language help." },
];

const FALLBACK =
  "I can help with live MSP prices, slot booking, payments, logistics and language help. Try asking 'What is paddy MSP?' or 'How do I book a slot?'";

export default function AiChat() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "bot", text: "Namaste 🙏 I'm Kisan AI. How can I help you today? I can answer MSP prices, slot booking, payments and more." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, typing, open]);

  const ask = (raw: string) => {
    const q = raw.trim();
    if (!q) return;
    setMsgs((m) => [...m, { who: "user", text: q }]);
    setText("");
    setTyping(true);
    const hit = KB.find((k) => k.keys.some((key) => q.toLowerCase().includes(key)));
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [...m, { who: "bot", text: hit ? hit.reply : FALLBACK }]);
    }, 900);
  };

  return (
    <>
      <button
        className={`aichat__fab ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Ask Kisan AI"
      >
        {open ? <X size={22} /> : <Bot size={22} />}
      </button>

      {open && (
        <div className="aichat card card-static">
          <div className="aichat__head">
            <span className="aichat__avatar"><Bot size={18} /></span>
            <div>
              <b>Kisan AI</b>
              <small><i /> Online · replies instantly</small>
            </div>
            <Sparkles size={15} className="aichat__spark" />
          </div>
          <div className="aichat__body">
            {msgs.map((m, i) => (
              <div key={i} className={`aichat__msg ${m.who}`}>
                {m.who === "bot" && <span className="aichat__mini"><Bot size={13} /></span>}
                <p>{m.text}</p>
              </div>
            ))}
            {typing && (
              <div className="aichat__msg bot">
                <span className="aichat__mini"><Bot size={13} /></span>
                <p className="aichat__typing"><i /><i /><i /></p>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <form
            className="aichat__input"
            onSubmit={(e) => { e.preventDefault(); ask(text); }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask about prices, slots, payments…"
            />
            <button type="submit" className="aichat__send" aria-label="Send"><Send size={16} /></button>
          </form>
        </div>
      )}
    </>
  );
}