"use client";

// ============================================================
// Upgrade Success, Halaman setelah pembayaran Midtrans berhasil
//
// Aktivasi plan terjadi via WEBHOOK Midtrans di backend (bisa telat
// beberapa detik). Halaman ini mem-poll fetchCurrentUser() tiap 5 detik
// (maks 6×) sampai user.subscription_plan cocok dengan plan yang dibeli,
// baru tombol "Ke Dashboard" aktif.
// ============================================================

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, PartyPopper, ArrowRight, Loader2 } from "lucide-react";
import useAuthStore from "@/stores/authStore";
import NeoButton from "@/components/ui/NeoButton";
import { formatCurrency } from "@/lib/utils";

function SuccessContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { fetchCurrentUser } = useAuthStore();

  const plan   = searchParams.get("plan") ?? "pro";
  const cycle  = searchParams.get("cycle") ?? "monthly";
  const amount = Number(searchParams.get("amount") ?? 0);

  // ── State: polling aktivasi ──
  // activating: true selama webhook belum meng-update plan user
  const [activating, setActivating] = useState(true);
  const attemptsRef = useRef(0);

  /**
   * Polling aktivasi: beri webhook Midtrans ~2 detik head start, lalu cek
   * fetchCurrentUser() tiap 5 detik. Berhenti kalau plan/role sudah
   * ter-upgrade ATAU sudah 6 percobaan (~32 detik).
   */
  useEffect(() => {
    let timer;

    const poll = async () => {
      await fetchCurrentUser();
      const { user } = useAuthStore.getState();
      // Activation confirmed when plan or role is upgraded
      if (user?.subscription_plan === plan || user?.role === "admin" || attemptsRef.current >= 6) {
        setActivating(false);
        return;
      }
      attemptsRef.current += 1;
      timer = setTimeout(poll, 5000);
    };

    // Give Midtrans webhook ~2s head start before first check
    timer = setTimeout(poll, 2000);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center page-fade">
      <div className="border-2 border-brand-black bg-white p-10" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>

        {/* Icon sukses */}
        <div className="w-20 h-20 bg-green-400 border-3 border-brand-black mx-auto mb-6 flex items-center justify-center"
          style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
          <CheckCircle2 size={40} className="text-white" strokeWidth={2.5} />
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <PartyPopper size={18} />
          <h2 className="text-2xl font-black font-grotesk">Pembayaran Berhasil!</h2>
        </div>

        <p className="text-brand-black/60 text-sm mb-6">
          Selamat! Akun kamu kini sudah aktif sebagai pengguna{" "}
          <span className="font-black capitalize text-brand-black">KasirAI {plan}</span>.
          Nikmati semua fitur premium sekarang.
        </p>

        {/* Ringkasan */}
        <div className="bg-green-50 border-2 border-green-300 p-4 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-brand-black/60">Paket</span>
            <span className="font-black capitalize">{plan} ({cycle === "monthly" ? "Bulanan" : "Tahunan"})</span>
          </div>
          {amount > 0 && (
            <div className="flex justify-between text-sm font-semibold">
              <span className="text-brand-black/60">Dibayar</span>
              <span className="font-black font-mono">{formatCurrency(amount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold">
            <span className="text-brand-black/60">Status</span>
            <span className="font-black text-green-700"> Aktif</span>
          </div>
        </div>

        {/* Activation status */}
        {activating ? (
          <div className="flex items-center justify-center gap-2 text-sm text-brand-black/60 font-semibold mb-4 p-3 bg-brand-yellow/30 border-2 border-brand-black/20">
            <Loader2 size={15} className="animate-spin" />
            Mengaktifkan fitur langganan...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-green-700 font-bold mb-4 p-3 bg-green-50 border-2 border-green-300">
            <CheckCircle2 size={15} />
            Akun berhasil diupgrade! Semua fitur sudah aktif.
          </div>
        )}

        <NeoButton variant="primary" disabled={activating} onClick={() => router.push("/dashboard")}>
          {activating ? (
            <><Loader2 size={14} className="inline mr-1.5 animate-spin" />Menunggu aktivasi...</>
          ) : (
            <>Ke Dashboard <ArrowRight size={14} className="inline ml-1" /></>
          )}
        </NeoButton>

        {activating && (
          <p className="text-xs text-brand-black/40 mt-3">
            Halaman ini otomatis memperbarui status akun kamu. Harap tunggu.
          </p>
        )}
      </div>
    </div>
  );
}

export default function UpgradeSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
