"use client";

// ============================================================
// AISidebar — Panel chat AI yang bisa dibuka/tutup
// Analogi: seperti "konsultan yang duduk di pojok ruangan" —
// selalu ada, bisa dipanggil kapan saja untuk tanya soal bisnis.
// ============================================================

import { useState, useRef, useEffect } from "react";
import useAiStore from "@/stores/aiStore";

// --- Bubble satu pesan ---
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[90%] px-3 py-2 text-xs font-medium leading-relaxed border-2 border-brand-black
          ${isUser
            ? "bg-brand-yellow text-brand-black"
            : msg.isError
              ? "bg-red-50 text-red-700"
              : "bg-white text-brand-black"
          }
        `}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
      >
        {msg.content}
      </div>
      {msg.tokens_used && (
        <span className="text-[9px] text-brand-black/30 font-mono">{msg.tokens_used} tokens</span>
      )}
    </div>
  );
};

// Pertanyaan cepat yang sering dipakai
const QUICK_PROMPTS = [
  "Produk apa yang paling laris hari ini?",
  "Berapa total penjualan bulan ini?",
  "Stok mana yang perlu di-reorder?",
  "Rekomendasikan strategi promo",
];

export default function AISidebar({ isOpen, onClose }) {
  const [input, setInput]   = useState("");
  const bottomRef           = useRef(null);
  const { messages, isLoading, sendQuery, clearMessages } = useAiStore();

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading) return;
    setInput("");
    try { await sendQuery(q); } catch {}
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div className="fixed inset-0 bg-brand-black/30 z-30 xl:hidden" onClick={onClose} />
      )}

      {/* Panel AI */}
      <aside
        className={`
          fixed xl:static right-0 top-0 h-full w-72
          bg-white border-l-2 border-brand-black
          flex flex-col z-40 transition-transform duration-200
          ${isOpen ? "translate-x-0" : "translate-x-full xl:translate-x-0"}
        `}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-brand-black text-white border-b-2 border-brand-black flex items-center justify-between shrink-0">
          <div>
            <p className="font-black text-sm font-grotesk">AI Assistant</p>
            <p className="text-[10px] text-white/50 font-mono">Powered by Groq LLaMA</p>
          </div>
          <div className="flex gap-2">
            <button onClick={clearMessages} className="text-white/50 hover:text-brand-yellow text-xs font-mono">Reset</button>
            <button onClick={onClose} className="xl:hidden text-white/70 hover:text-white font-black">✕</button>
          </div>
        </div>

        {/* Riwayat chat — scrollable */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
          {/* Indikator AI sedang "mengetik" */}
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-brand-black w-fit"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-brand-black rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-[10px] font-mono text-brand-black/50">AI sedang berpikir...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Pertanyaan cepat */}
        <div className="px-3 py-2 border-t border-brand-black/10 flex flex-wrap gap-1.5 shrink-0">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              disabled={isLoading}
              className="text-[10px] font-semibold bg-brand-cream border border-brand-black/30 px-2 py-1 hover:bg-brand-yellow hover:border-brand-black transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input box */}
        <div className="px-3 py-3 border-t-2 border-brand-black shrink-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Tanya ke AI..."
              rows={2}
              disabled={isLoading}
              className="flex-1 text-xs font-medium resize-none border-2 border-brand-black px-2.5 py-2 outline-none focus:border-brand-yellow placeholder:text-brand-black/30 disabled:opacity-50"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-3 bg-brand-yellow border-2 border-brand-black font-black text-sm disabled:opacity-40 hover:bg-yellow-300 transition-colors"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              →
            </button>
          </div>
          <p className="text-[9px] text-brand-black/30 mt-1 font-mono">Enter = kirim · Shift+Enter = baris baru</p>
        </div>
      </aside>
    </>
  );
}
