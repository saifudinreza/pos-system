// ============================================================
// CTASection, Panggilan Aksi Terakhir (Call To Action)
//
// Analogi: Ini seperti kasir yang berkata "Mau dibungkus sekarang?"
// setelah pelanggan sudah keliling toko. Satu kesempatan terakhir
// sebelum mereka pergi, harus kuat dan meyakinkan.
//
// Desain: background hitam + shadow kuning, kontras maksimal.
// Satu tombol = satu niat: "Mulai Gratis" (utama), "Lihat Demo"
// (membuka video), dan tautan kecil "Masuk" untuk yang sudah punya akun.
//
// Relasi: Diletakkan setelah FAQ, sebelum Footer.
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
import { Reveal } from "./motion";
import DemoVideoModal from "./DemoVideoModal";
import { trackEvent } from "@/lib/analytics";
import { neoButtonClass } from "@/components/ui/NeoButton";

/**
 * CTASection, panggilan aksi terakhir sebelum footer (lihat header file).
 * State: demoOpen (modal video).
 */
export default function CTASection() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section className="relative z-[1] py-20 px-4 sm:px-6 bg-brand-gray ">
      <div className="max-w-6xl mx-auto rounded-md">

        {/* Kotak CTA utama, hitam pekat untuk kontras maksimal */}
        <Reveal
          y={32}
          className="bg-brand-black text-white border-3 border-brand-black p-12 sm:p-16 text-center relative overflow-hidden rounded-md"
          style={{ boxShadow: "8px 8px 0 var(--yellow)" }}
        >
          {/* Dekorasi latar, titik-titik kecil ala neobrutalist */}
          <div className="absolute inset-0 opacity-5 rounded-md"
            style={{
              backgroundImage: "radial-gradient(circle, #FFE500 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          <div className="relative z-10">
            <div
              className="inline-block bg-brand-yellow text-brand-black border-2 border-brand-yellow px-3 py-1 text-xs font-grotesk font-black tracking-wider mb-6 rounded-md"
            >
              MULAI SEKARANG
            </div>

            <h2 className="text-display font-grotesk mb-4 rounded-md">
              Tingkatkan bisnis kamu
              <br />
              <span className="text-brand-yellow">hari ini juga.</span>
            </h2>

            <p className="text-white/75 font-medium text-lg max-w-lg mx-auto mb-10 rounded-md">
              Mulai dari paket Free, tidak perlu kartu kredit. Upgrade ke Pro
              kapan saja saat tokomu butuh QRIS dan laporan lengkap.
            </p>

            {/* Satu tombol = satu niat */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center rounded-md">
              <Link
                href="/register"
                onClick={() => trackEvent("cta_click", { posisi: "cta_akhir", tujuan: "daftar" })}
                className={neoButtonClass({ variant: "inverse", size: "xl", className: "font-black" })}
              >
                Mulai Gratis →
              </Link>
              <button
                type="button"
                onClick={() => {
                  trackEvent("cta_click", { posisi: "cta_akhir", tujuan: "demo" });
                  setDemoOpen(true);
                }}
                className={neoButtonClass({ variant: "outlineLight", size: "xl" })}
              >
                <Play size={16} fill="currentColor" />
                Lihat Demo
              </button>
            </div>

            <p className="mt-6 text-sm text-white/70 font-medium">
              Sudah punya akun?{" "}
              <Link href="/login" className="font-bold text-white underline underline-offset-2">
                Masuk
              </Link>
            </p>

            {/* Jaminan terakhir, kontras dinaikkan agar terbaca di latar hitam */}
            <div className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/70 rounded-md">
              <span>✓ Tanpa kartu kredit</span>
              <span>✓ Paket Free gratis selamanya</span>
              <span>✓ Upgrade kapan saja</span>
            </div>
          </div>
        </Reveal>
      </div>

      <DemoVideoModal open={demoOpen} onClose={() => setDemoOpen(false)} />
    </section>
  );
}
