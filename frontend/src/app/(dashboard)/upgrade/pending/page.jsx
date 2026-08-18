"use client";

// ============================================================
// Upgrade Pending — Halaman setelah pembayaran Midtrans pending
//
// Terjadi saat user memilih VA/transfer lalu menutup popup, atau pembayaran
// masih diproses bank. Aktivasi otomatis terjadi begitu webhook Midtrans
// mengonfirmasi pembayaran — user cukup menunggu / memantau lewat Profil.
// ============================================================

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock, AlertCircle } from "lucide-react";
import NeoButton from "@/components/ui/NeoButton";

function PendingContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") ?? "pro";

  // ── Render: kartu status pending + info langkah selanjutnya ──
  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center page-fade">
      <div className="border-2 border-brand-black bg-white p-10" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>

        <div className="w-20 h-20 bg-brand-yellow border-3 border-brand-black mx-auto mb-6 flex items-center justify-center"
          style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <Clock size={40} className="text-brand-black" strokeWidth={2.5} />
        </div>

        <h2 className="text-2xl font-black font-grotesk mb-2">Pembayaran Pending</h2>
        <p className="text-brand-black/60 text-sm mb-6">
          Pembayaran kamu sedang diproses. Kami akan mengaktifkan paket{" "}
          <span className="font-black capitalize">{plan}</span> segera setelah pembayaran dikonfirmasi
          oleh bank/penyedia pembayaran.
        </p>

        <div className="bg-brand-yellow/20 border-2 border-brand-yellow p-4 mb-6 text-left space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-yellow-700" />
            <p className="text-brand-black/70">
              <strong>Transfer bank / virtual account:</strong> selesaikan pembayaran sebelum batas waktu di instruksi Midtrans.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0 text-yellow-700" />
            <p className="text-brand-black/70">
              Akun kamu akan otomatis diupgrade dalam beberapa menit setelah pembayaran dikonfirmasi.
            </p>
          </div>
        </div>

        {/* Demo info Midtrans */}
        <div className="bg-brand-yellow/30 border-2 border-brand-black/20 p-3 mb-6 text-left text-xs font-mono">
          <p className="font-black text-brand-black mb-1">Midtrans Sandbox — Alur Pending</p>
          <p className="text-brand-black/60">Status: <span className="text-yellow-700 font-bold">pending</span></p>
          <p className="text-brand-black/60">User menutup popup tanpa menyelesaikan pembayaran atau memilih VA/transfer</p>
          <p className="text-brand-black/60 mt-1">Webhook akan dikirim Midtrans saat pembayaran berhasil diproses</p>
        </div>

        <div className="flex gap-3 justify-center">
          <NeoButton variant="primary" onClick={() => router.push("/profile")}>
            Lihat Status Langganan
          </NeoButton>
          <NeoButton variant="ghost" onClick={() => router.push("/dashboard")}>
            Dashboard
          </NeoButton>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePendingPage() {
  return <Suspense><PendingContent /></Suspense>;
}
