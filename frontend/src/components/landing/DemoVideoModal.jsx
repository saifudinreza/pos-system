"use client";

// ============================================================
// DemoVideoModal, modal pemutar video demo kasir (dipakai Hero & CTA)
//
// Video hanya dimuat saat modal dibuka, jadi tidak membebani load awal.
// Bisa ditutup dengan tombol X, klik area gelap, atau tombol Escape.
// ============================================================

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

/**
 * DemoVideoModal
 * Props: open (boolean), onClose (function)
 */
export default function DemoVideoModal({ open, onClose }) {
  // Tutup dengan tombol Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Video demo kasir"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl bg-brand-black border-3 border-brand-yellow shadow-[8px_8px_0_var(--ink)] p-2 rounded-md overflow-hidden"
          >
            <div className="flex items-center justify-between p-3 border-b-2 border-neutral-800 bg-neutral-900">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success" />
                <span className="font-grotesk font-extrabold text-sm text-white">
                  Demo Operasional Kasir & AI Asisten
                </span>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup video"
                className="p-1 text-white hover:text-brand-yellow transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-yellow"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative aspect-video w-full bg-black">
              <video
                src="/landing/sikasirai-demo.mp4"
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
