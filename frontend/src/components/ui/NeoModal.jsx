"use client";
// NeoModal — Dialog popup neobrutalist
// Analogi: seperti memo penting di atas semua dokumen lain — harus direspons dulu

import { useEffect } from "react";
import NeoButton from "./NeoButton";

export default function NeoModal({ isOpen, onClose, title, children, footer, size = "md" }) {
  // Kunci scroll body saat modal terbuka — supaya background tidak bergerak
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const WIDTH = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

  return (
    // Overlay gelap di belakang modal
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,0.6)" }}
      onClick={onClose}
    >
      {/* Kotak modal — stopPropagation agar klik dalam modal tidak tutup modal */}
      <div
        className={`bg-white border-3 border-brand-black w-full ${WIDTH[size] ?? WIDTH.md} flex flex-col max-h-[90vh]`}
        style={{ boxShadow: "6px 6px 0 #0A0A0A" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-brand-black shrink-0">
          <h3 className="font-black text-lg text-brand-black font-grotesk">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center font-black text-lg hover:bg-brand-yellow border-2 border-transparent hover:border-brand-black transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>

        {/* Footer (opsional) */}
        {footer && (
          <div className="px-5 py-4 border-t-2 border-brand-black flex justify-end gap-3 shrink-0 bg-brand-gray">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
