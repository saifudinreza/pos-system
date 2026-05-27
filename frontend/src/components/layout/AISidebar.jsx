"use client";

import { useState, useRef, useEffect } from "react";
import useAiStore from "@/stores/aiStore";

const PROVIDER_LABEL = {
  groq:        { text: "Groq",        cls: "bg-brand-yellow text-brand-black" },
  openrouter:  { text: "OpenRouter",  cls: "bg-purple-100 text-purple-700" },
};

const MessageBubble = ({ msg }) => {
  const isUser = msg.role === "user";
  const provider = !isUser && msg.provider ? PROVIDER_LABEL[msg.provider] : null;
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[92%] px-3 py-2 text-xs font-medium leading-relaxed border-2 border-brand-black
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
      <div className="flex items-center gap-2">
        {provider && (
          <span className={`text-[8px] font-black px-1.5 py-0.5 font-mono border border-brand-black/20 ${provider.cls}`}>
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
  const bottomRef         = useRef(null);
  const { messages, isLoading, sendQuery, clearMessages } = useAiStore();

  // Ambil provider dari pesan AI terakhir
  const lastAiMsg   = [...messages].reverse().find((m) => m.role === "assistant" && m.provider);
  const activeProvider = lastAiMsg?.provider ?? "groq";
  const isOpenRouter   = activeProvider === "openrouter";

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

  const handleQuickPrompt = (q) => {
    setInput(q);
    // auto-send on click
    setTimeout(async () => {
      if (!isLoading) {
        setInput("");
        try { await sendQuery(q); } catch {}
      }
    }, 50);
  };

  const panelContent = (
    <aside className="h-full w-72 bg-white border-l-2 border-brand-black flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 bg-brand-black text-white border-b-2 border-brand-black flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-black text-sm font-grotesk">AI Assistant</p>
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
            className="text-white/40 hover:text-brand-yellow text-[10px] font-mono border border-white/20 px-2 py-0.5 hover:border-brand-yellow transition-colors"
          >
            Reset
          </button>
          {!alwaysVisible && (
            <button onClick={onClose} className="text-white/60 hover:text-white font-black text-sm">✕</button>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
        {messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)}
        {isLoading && (
          <div
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-2 border-brand-black w-fit"
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
      <div className="px-3 py-2 border-t border-brand-black/10 flex flex-wrap gap-1.5 shrink-0 bg-brand-cream/50">
        {QUICK_PROMPTS.map((q) => (
          <button
            key={q}
            onClick={() => handleQuickPrompt(q)}
            disabled={isLoading}
            className="text-[10px] font-semibold bg-white border border-brand-black/20 px-2 py-1 hover:bg-brand-yellow hover:border-brand-black transition-all duration-100 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t-2 border-brand-black shrink-0 bg-white">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tanya ke AI..."
            rows={2}
            disabled={isLoading}
            className="flex-1 text-xs font-medium resize-none border-2 border-brand-black px-2.5 py-2 outline-none focus:border-brand-yellow placeholder:text-brand-black/25 disabled:opacity-50 bg-white"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-3 bg-brand-yellow border-2 border-brand-black font-black text-sm disabled:opacity-30 hover:bg-yellow-300 transition-colors"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            →
          </button>
        </div>
        <p className="text-[9px] text-brand-black/25 mt-1.5 font-mono">
          Enter = kirim · Shift+Enter = baris baru
        </p>
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
