"use client";

// ============================================================
// HeroSection — Area paling depan, bagian paling penting di landing page
//
// Analogi: Ini seperti etalase depan toko paling mewah di mall.
// Dalam 5 detik pertama, pengunjung harus langsung paham:
//   1. Ini toko apa? (headline)
//   2. Apa manfaatnya buat saya? (subheadline)
//   3. Apa yang harus saya lakukan? (tombol CTA)
//   4. Apakah bisa dipercaya? (trust badges)
//
// Relasi: Hero → membutuhkan DashboardMockup (ilustrasi UI di sebelah kanan)
// ============================================================

import Link from "next/link";

// --- Komponen MockupDashboard ---
// Analogi: Foto produk di toko online — menunjukkan tampilan asli aplikasi
// sebelum pengguna mencoba sendiri
const DashboardMockup = () => (
  <div
    className="relative w-full max-w-lg mx-auto"
    style={{ perspective: "1000px" }}
  >
    {/* Bingkai utama mockup — seperti layar laptop/tablet */}
    <div
      className="relative bg-white border-3 border-brand-black overflow-hidden"
      style={{ boxShadow: "8px 8px 0 #0A0A0A", borderRadius: "2px" }}
    >
      {/* === BAR ATAS (header aplikasi) === */}
      <div className="flex items-center gap-2 px-4 py-3 bg-brand-black">
        {/* Dot merah/kuning/hijau — seperti tombol window di MacOS */}
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-brand-yellow" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <span className="ml-2 text-white text-xs font-mono opacity-60">KasirAI — Kasir</span>
      </div>

      {/* === KONTEN DASHBOARD === */}
      <div className="p-4 bg-[#F8F8F3]">

        {/* Baris atas: Ringkasan penjualan hari ini */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: "Penjualan Hari Ini", value: "Rp 4,2jt", color: "bg-brand-yellow" },
            { label: "Transaksi",          value: "28",        color: "bg-white" },
            { label: "Produk Terjual",     value: "112",       color: "bg-white" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`${stat.color} border-2 border-brand-black p-2`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              <p className="text-[9px] font-bold text-brand-black/60 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-sm font-black text-brand-black font-mono">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Area Kasir — grid produk di kiri, keranjang di kanan */}
        <div className="grid grid-cols-5 gap-2">
          {/* Produk grid — seperti rak pajangan di toko */}
          <div className="col-span-3 space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-widest text-brand-black/50">
              Produk
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { name: "Es Teh Manis",     price: "5k",  emoji: "🧋" },
                { name: "Nasi Goreng",       price: "25k", emoji: "🍳" },
                { name: "Ayam Geprek",       price: "20k", emoji: "🍗" },
                { name: "Jus Jeruk",         price: "12k", emoji: "🍊" },
                { name: "Mie Goreng",        price: "18k", emoji: "🍜" },
                { name: "Teh Botol",         price: "5k",  emoji: "🫖" },
              ].map((p) => (
                <div
                  key={p.name}
                  className="bg-white border-2 border-brand-black p-1.5 cursor-pointer hover:bg-brand-yellow transition-colors"
                  style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
                >
                  <div className="text-base">{p.emoji}</div>
                  <p className="text-[8px] font-bold text-brand-black leading-tight">{p.name}</p>
                  <p className="text-[9px] font-black text-brand-black font-mono">Rp {p.price}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Panel keranjang/order di kanan — seperti bon belanja */}
          <div
            className="col-span-2 bg-white border-2 border-brand-black p-2 flex flex-col"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            <p className="text-[9px] font-black uppercase tracking-widest mb-2 border-b-2 border-brand-black pb-1">
              Order #042
            </p>
            {/* Item di keranjang */}
            {[
              { name: "Es Teh Manis", qty: 2, total: "10k" },
              { name: "Nasi Goreng",  qty: 1, total: "25k" },
              { name: "Ayam Geprek",  qty: 1, total: "20k" },
            ].map((item) => (
              <div key={item.name} className="flex justify-between text-[8px] font-semibold py-0.5">
                <span className="text-brand-black/80">{item.qty}x {item.name}</span>
                <span className="font-mono font-black">Rp {item.total}</span>
              </div>
            ))}
            {/* Total */}
            <div className="mt-auto pt-2 border-t-2 border-brand-black">
              <div className="flex justify-between text-[9px] font-black">
                <span>TOTAL</span>
                <span className="font-mono">Rp 55k</span>
              </div>
              {/* Tombol bayar */}
              <div
                className="mt-1.5 bg-brand-yellow border-2 border-brand-black text-center py-1 text-[9px] font-black"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              >
                BAYAR SEKARANG
              </div>
            </div>
          </div>
        </div>

        {/* AI Chat Bubble — fitur unggulan */}
        <div
          className="mt-3 bg-brand-black text-white p-2 flex items-start gap-2"
          style={{ borderRadius: "2px" }}
        >
          <span className="text-brand-yellow font-black text-xs">AI</span>
          <p className="text-[9px] leading-relaxed opacity-90">
            "Penjualan hari ini naik 15% dari kemarin. Produk terlaris: Nasi Goreng (12 porsi). Stok Es Teh Manis tinggal 8 cup — perlu restock?"
          </p>
        </div>
      </div>
    </div>

    {/* Elemen dekoratif mengambang di luar mockup */}
    {/* Analogi: seperti post-it yang ditempel di samping laptop */}
    <div
      className="absolute -top-4 -right-4 bg-brand-yellow border-2 border-brand-black px-3 py-1.5 font-black text-xs animate-float"
      style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
    >
      +15% Penjualan
    </div>
    <div
      className="absolute -bottom-4 -left-4 bg-white border-2 border-brand-black px-3 py-1.5 font-black text-xs"
      style={{ boxShadow: "3px 3px 0 #0A0A0A", animationDelay: "1.5s" }}
    >
      ✓ AI siap membantu
    </div>
  </div>
);

// --- Komponen TrustBadge ---
// Tanda kepercayaan kecil — seperti sertifikat yang dipajang di dinding toko
const TrustBadge = ({ icon, text }) => (
  <div className="flex items-center gap-2 text-sm font-semibold text-brand-black/70">
    <span className="text-brand-black font-black">{icon}</span>
    {text}
  </div>
);

export default function HeroSection() {
  return (
    // Section hero: padding atas besar karena ada navbar fixed di atas
    <section className="pt-32 pb-20 px-4 sm:px-6 max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-2 gap-12 items-center">

        {/* === KOLOM KIRI: Teks & CTA === */}
        <div className="flex flex-col gap-6">

          {/* Badge "New" — penanda fitur terbaru, seperti label "Baru" di produk */}
          <div className="inline-flex items-center w-fit">
            <div
              className="flex items-center gap-2 bg-brand-yellow border-2 border-brand-black px-3 py-1"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              <span className="font-mono font-black text-xs tracking-wider">✦ BARU</span>
              <span className="text-xs font-bold">AI Assistant Terintegrasi</span>
            </div>
          </div>

          {/* Headline utama — pesan paling penting, harus besar & jelas */}
          <h1 className="text-5xl sm:text-6xl font-black text-brand-black leading-[1.05] tracking-tight font-grotesk">
            Kasir Pintar,
            <br />
            <span
              className="bg-brand-yellow px-2 inline-block"
              style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
            >
              Bisnis
            </span>{" "}
            Makin
            <br />
            Lancar.
          </h1>

          {/* Sub-headline — penjelasan singkat, satu paragraf cukup */}
          <p className="text-lg text-brand-black/70 font-medium leading-relaxed max-w-md">
            Kelola penjualan, stok, dan laporan dalam satu platform.
            Dilengkapi <strong className="text-brand-black">AI Assistant</strong> yang siap menjawab
            pertanyaan bisnis Anda kapan saja.
          </p>

          {/* Tombol CTA — dua pilihan: primer (kuning) dan sekunder (outline) */}
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="px-6 py-3 bg-brand-yellow border-2 border-brand-black font-bold text-base neo-hover inline-block"
              style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
            >
              Coba Gratis 14 Hari →
            </Link>
            <a
              href="#cara-kerja"
              className="px-6 py-3 bg-white border-2 border-brand-black font-bold text-base neo-hover inline-block"
              style={{ boxShadow: "4px 4px 0 #0A0A0A" }}
            >
              Lihat Demo
            </a>
          </div>

          {/* Trust badges — alasan percaya: tanpa kartu kredit, dll */}
          <div className="flex flex-wrap gap-4 pt-2">
            <TrustBadge icon="✓" text="Tanpa kartu kredit" />
            <TrustBadge icon="✓" text="Setup 5 menit" />
            <TrustBadge icon="✓" text="Batalkan kapan saja" />
          </div>

          {/* Statistik singkat — "social proof" angka */}
          <div className="flex gap-8 pt-2 border-t-2 border-brand-black/10">
            {[
              { num: "2.000+", label: "Bisnis aktif" },
              { num: "500rb+", label: "Transaksi/hari" },
              { num: "4.9★",  label: "Rating pengguna" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black text-brand-black font-mono">{s.num}</p>
                <p className="text-xs font-semibold text-brand-black/60 uppercase tracking-wide">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* === KOLOM KANAN: Mockup dashboard === */}
        <div className="relative">
          <DashboardMockup />
        </div>
      </div>
    </section>
  );
}
