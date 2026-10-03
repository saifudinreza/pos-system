"use client";

// ============================================================
// OnboardingChecklist, panduan langkah awal untuk toko baru
//
// Tampil di dashboard sampai semua langkah selesai (atau ditutup user).
// Status tiap langkah dihitung dari data nyata oleh halaman dashboard,
// komponen ini hanya menampilkan. Langkah pertama yang belum selesai
// diberi tombol aksi utama supaya jelas "apa yang harus kulakukan sekarang".
// ============================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import NeoCard from "@/components/ui/NeoCard";
import { neoButtonClass } from "@/components/ui/NeoButton";

const DISMISS_KEY = "kasirai_onboarding_dismissed";

/**
 * Props:
 *   steps: [{ key, title, desc, href?, cta?, done }] (tanpa href = tanpa tombol)
 */
export default function OnboardingChecklist({ steps }) {
  // null = belum dibaca dari localStorage (hindari kedip saat hidrasi)
  const [dismissed, setDismissed] = useState(null);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  if (dismissed !== false || allDone) return null;

  const nextIndex = steps.findIndex((s) => !s.done);

  const dismiss = () => {
    setDismissed(true);
    try { window.localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  return (
    <NeoCard noPad className="slide-up">
      <div className="px-5 py-4 border-b-2 border-brand-black flex items-center justify-between gap-3 bg-brand-yellow">
        <div>
          <h3 className="font-black text-base font-grotesk">Mulai dalam {steps.length} langkah</h3>
          <p className="text-xs font-semibold text-brand-black/70">
            {doneCount} dari {steps.length} selesai
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup panduan"
          className="p-1 hover:bg-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-black"
        >
          <X size={18} />
        </button>
      </div>

      {/* Bilah kemajuan */}
      <div className="h-2 bg-white border-b-2 border-brand-black" aria-hidden="true">
        <div
          className="h-full bg-success transition-all"
          style={{ width: `${(doneCount / steps.length) * 100}%` }}
        />
      </div>

      <ol className="divide-y-2 divide-brand-black/10">
        {steps.map((s, i) => (
          <li key={s.key} className="px-5 py-3.5 flex items-center gap-4">
            <span
              className={`shrink-0 w-7 h-7 border-2 border-brand-black flex items-center justify-center font-black text-sm ${
                s.done ? "bg-success" : i === nextIndex ? "bg-brand-yellow" : "bg-white"
              }`}
            >
              {s.done ? <Check size={16} strokeWidth={3} /> : i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm ${s.done ? "line-through text-brand-black/45" : ""}`}>{s.title}</p>
              {!s.done && <p className="text-xs text-brand-black/60 font-medium">{s.desc}</p>}
            </div>
            {!s.done && i === nextIndex && s.href && (
              <Link
                href={s.href}
                className={neoButtonClass({ variant: "cta", size: "sm", className: "shrink-0" })}
              >
                {s.cta} →
              </Link>
            )}
          </li>
        ))}
      </ol>
    </NeoCard>
  );
}
