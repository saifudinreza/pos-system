"use client";

// ============================================================
// Upgrade Cancel, Halaman setelah pembayaran Midtrans dibatalkan/gagal
//
// Tujuan: memberi tahu user tidak ada biaya yang dikenakan, daftar
// kemungkinan penyebab, dan tombol untuk mencoba lagi / kembali ke profil.
// Plan user TIDAK berubah di halaman ini, backend menangani status
// subscription lewat webhook (cancel/deny/expire).
// ============================================================

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { XCircle, RefreshCw } from "lucide-react";
import NeoButton from "@/components/ui/NeoButton";

function CancelContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "pro";

  // ── Render: kartu konfirmasi batal + penyebab + tombol aksi ──
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center page-fade">
      <div className="border-2 border-brand-black bg-white p-10" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>

        <div className="w-20 h-20 bg-red-100 border-3 border-brand-black mx-auto mb-6 flex items-center justify-center"
          style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <XCircle size={40} className="text-red-500" strokeWidth={2.5} />
        </div>

        <h2 className="text-2xl font-black font-grotesk mb-2">Pembayaran Dibatalkan</h2>
        <p className="text-brand-black/60 text-sm mb-6">
          Pembayaran untuk paket <span className="font-black capitalize">{plan}</span> dibatalkan atau gagal.
          Tidak ada biaya yang dikenakan. Kamu bisa mencoba lagi kapan saja.
        </p>

        <div className="bg-red-50 border-2 border-red-200 p-4 mb-6 text-left text-sm space-y-1.5">
          <p className="font-bold text-red-700">Kemungkinan penyebab:</p>
          <ul className="text-brand-black/60 space-y-1 text-xs list-disc list-inside">
            <li>Saldo kartu/rekening tidak mencukupi</li>
            <li>Pembayaran melebihi batas waktu</li>
            <li>Transaksi ditolak oleh bank</li>
            <li>Kamu menutup halaman pembayaran</li>
          </ul>
        </div>

        {/* Demo info Midtrans */}
        <div className="bg-brand-yellow/30 border-2 border-brand-black/20 p-3 mb-6 text-left text-xs font-mono">
          <p className="font-black text-brand-black mb-1">Midtrans Sandbox, Alur Cancel/Gagal</p>
          <p className="text-brand-black/60">Status: <span className="text-red-600 font-bold">cancel / deny / expire</span></p>
          <p className="text-brand-black/60">Webhook diterima → subscription.status = cancelled → user.subscription_plan tidak berubah</p>
        </div>

        <div className="flex gap-3 justify-center">
          <NeoButton variant="primary" onClick={() => router.push(`/upgrade?plan=${plan}&cycle=monthly`)}>
            <RefreshCw size={14} className="inline mr-1.5" />
            Coba Lagi
          </NeoButton>
          <NeoButton variant="ghost" onClick={() => router.push("/profile")}>
            Kembali ke Profil
          </NeoButton>
        </div>
      </div>
    </div>
  );
}

export default function UpgradeCancelPage() {
  return <Suspense><CancelContent /></Suspense>;
}
