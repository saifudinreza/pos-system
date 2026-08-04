"use client";

import { useState, useRef, useEffect } from "react";
import useAiStore from "@/stores/aiStore";

const PROVIDER_LABEL = {
  groq:        { text: "Groq",        cls: "bg-brand-yellow text-brand-black" },
  openrouter:  { text: "OpenRouter",  cls: "bg-purple-100 text-purple-700" },
};

const ChatIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2a9 9 0 0 1 9 9c0 2.4-.94 4.6-2.48 6.23L20 22l-4.5-1.5A9 9 0 1 1 12 2z"/>
    <circle cx="8.5"  cy="11.5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="12"   cy="11.5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="15.5" cy="11.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);

const SendIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);

const ResetIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/>
  </svg>
);

const WarningIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const BlockIcon = ({ className = "" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
  </svg>
);

const QUICK_PROMPT_ICONS = {
  "Produk terlaris bulan ini?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
  "Stok apa yang mau habis?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  "Rekomendasikan produk untuk dijual bareng?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  ),
  "Total penjualan hari ini?": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 shrink-0">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  const provider = !isUser && msg.provider ? PROVIDER_LABEL[msg.provider] : null;
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[92%] px-3 py-2 text-xs font-medium leading-relaxed border-2 border-brand-black/80 rounded-md
          ${isUser
            ? "bg-brand-yellow text-brand-black"
            : msg.isError
              ? "bg-red-50 text-red-700 border-red-300"
              : "bg-white text-brand-black"
          }
        `}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
      >
        {msg.content}
      </div>
      <div className="flex items-center gap-2">
        {provider && (
          <span className={`text-[8px] font-black px-1.5 py-0.5 font-mono border border-brand-black/20 rounded ${provider.cls}`}>
            {provider.text}
          </span>
        )}
        {msg.tokens_used && (
          <span className="text-[9px] text-brand-black/25 font-mono">{msg.tokens_used} tokens</span>
        )}
      </div>
    </div>
  );
};

const QUICK_PROMPTS = [
  "Produk terlaris bulan ini?",
  "Stok apa yang mau habis?",
  "Rekomendasikan produk untuk dijual bareng?",
  "Total penjualan hari ini?",
];

export default function AISidebar({ isOpen, onClose, alwaysVisible = false, isDev = false }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const {
    messages, isLoading, sendQuery, clearMessages,
    dailyUsage, limitReached, usageWarning, fetchUsage,
  } = useAiStore();

  const lastAiMsg      = [...messages].reverse().find((m) => m.role === "assistant" && m.provider);
  const activeProvider = lastAiMsg?.provider ?? "groq";
  const isOpenRouter   = activeProvider === "openrouter";

  // Ambil kuota harian saat panel pertama kali terbuka
  useEffect(() => {
    fetchUsage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || isLoading || limitReached) return;
    setInput("");
    try { await sendQuery(q); } catch {}
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleQuickPrompt = (q) => {
    if (limitReached) return;
    setInput(q);
    setTimeout(async () => {
      if (!isLoading) {
        setInput("");
        try { await sendQuery(q); } catch {}
      }
    }, 50);
  };

  // Warna bar kuota: hijau → kuning → merah
  // limit null (Pro/Enterprise) = tak terbatas, bar tidak ditampilkan
  const unlimited    = dailyUsage.limit === null || dailyUsage.limit === undefined;
  const remaining    = dailyUsage.remaining;
  const usageRatio   = unlimited ? 0 : dailyUsage.used / dailyUsage.limit;
  const barColor     = usageRatio >= 1 ? "bg-red-500" : usageRatio >= 0.7 ? "bg-amber-400" : "bg-green-400";
  const periodLabel  = unlimited ? "AI Assistant" : "Sisa kuota AI bulan ini";
  const periodValue  = unlimited ? "Tak terbatas" : `${remaining}/${dailyUsage.limit}`;

  const panelContent = (
    <aside className="h-full w-80 lg:w-96 bg-white border-l-2 border-brand-black flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-brand-black text-white border-b-2 border-brand-black flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <ChatIcon className="w-4 h-4 text-brand-yellow" />
            <p className="font-black text-sm font-grotesk">KasirAI Assistant</p>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full" style={{ animation: "neo-pulse 2s infinite" }} />
              <span className="text-[9px] text-green-300 font-mono">online</span>
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-white/40 font-mono">
              {isOpenRouter ? "Fallback: OpenRouter LLaMA 3.1" : "Powered by Groq LLaMA 3.3"}
            </p>
            {isOpenRouter && (
              <span className="text-[8px] bg-purple-400 text-white font-black px-1.5 py-0.5 font-mono animate-pulse">
                FALLBACK
              </span>
            )}
            {isDev && !isOpenRouter && (
              <span className="text-[8px] bg-brand-yellow text-brand-black font-black px-1.5 py-0.5 font-mono">
                DEV
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={clearMessages}
            title="Reset percakapan"
            className="flex items-center gap-1.5 text-white/40 hover:text-brand-yellow text-[10px] font-mono border border-white/20 px-2 py-0.5 hover:border-brand-yellow transition-colors rounded"
          >
            <ResetIcon className="w-3 h-3" /> Reset
          </button>
          {!alwaysVisible && (
            <button onClick={onClose} className="text-white/60 hover:text-white font-black text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Usage counter bar */}
      <div className="px-3 py-2 border-b border-brand-black/10 bg-brand-black/5 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-bold text-brand-black/60">{periodLabel}</span>
          <span className={`text-[10px] font-black font-mono ${limitReached ? "text-red-500" : unlimited ? "text-green-600" : "text-brand-black"}`}>
            {periodValue}
          </span>
        </div>
        {!unlimited && (
          <div className="h-1 bg-brand-black/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${Math.max(0, (remaining / dailyUsage.limit) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Warning banner — mendekati limit */}
      {!limitReached && usageWarning && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-md bg-orange-50 border-2 border-orange-400 shrink-0">
          <div className="flex items-start gap-2">
            <WarningIcon className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-orange-800 leading-snug">
              Sisa kuota chat AI tinggal <span className="font-black">{dailyUsage.remaining}/{dailyUsage.limit}</span>. Gunakan dengan bijak!
            </p>
          </div>
        </div>
      )}

      {/* Limit reached banner */}
      {limitReached && (
        <div className="mx-3 mt-3 px-3 py-2.5 rounded-md bg-red-50 border-2 border-red-400 shrink-0">
          <div className="flex items-start gap-2">
            <BlockIcon className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs font-bold text-red-800 leading-snug">
              Kuota AI bulanan paket FREE sudah habis. Upgrade ke Pro untuk AI tak terbatas!
            </p>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        {isLoading && (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-brand-black rounded-md w-fit"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-brand-black rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-[10px] font-mono text-brand-black/40">AI sedang berpikir...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      {!limitReached && (
        <div className="px-3 py-2 border-t border-brand-black/10 flex flex-wrap gap-1.5 shrink-0 bg-brand-cream/50">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickPrompt(q)}
              disabled={isLoading}
              className="flex items-center gap-1.5 text-[10px] font-semibold bg-white border border-brand-black/20 px-2 py-1 rounded hover:bg-brand-yellow hover:border-brand-black transition-all duration-100 disabled:opacity-40"
            >
              {QUICK_PROMPT_ICONS[q]}
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t-2 border-brand-black shrink-0 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={limitReached ? "Kuota AI bulanan habis. Upgrade ke Pro." : "Tanya ke AI..."}
            rows={2}
            disabled={isLoading || limitReached}
            className="flex-1 text-xs font-medium resize-none border-2 border-brand-black rounded-md px-2.5 py-2 outline-none focus:border-brand-yellow placeholder:text-brand-black/25 disabled:opacity-50 bg-white"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || limitReached}
            className="px-3 bg-brand-yellow border-2 border-brand-black rounded-md disabled:opacity-30 hover:bg-yellow-300 transition-colors flex items-center"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
        {!limitReached && (
          <p className="text-[9px] text-brand-black/25 mt-1.5 font-mono">
            Enter = kirim · Shift+Enter = baris baru
          </p>
        )}
      </div>
    </aside>
  );

  if (alwaysVisible) {
    return panelContent;
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-brand-black/30 z-30" onClick={onClose} />
      )}
      <div
        className={`
          fixed right-0 top-0 h-full z-40
          transition-transform duration-200 ease-in-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {panelContent}
      </div>
    </>
  );
}
