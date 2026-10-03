"use client";

// ============================================================
// /dev/design-system, katalog desain KasirAI (khusus developer)
//
// Satu halaman untuk melihat semua token dan varian komponen, supaya
// junior engineer tidak perlu menebak. Dikunci oleh DevLayout (PIN /
// email developer). Aturan lengkap: frontend/DESIGN_SYSTEM.md
// ============================================================

import NeoButton from "@/components/ui/NeoButton";
import NeoCard from "@/components/ui/NeoCard";
import NeoBadge from "@/components/ui/NeoBadge";

const COLORS = [
  { name: "brand-yellow", cls: "bg-brand-yellow", hex: "#FFE500", rule: "CTA utama (dalam aplikasi), penanda aktif, 1 highlight kata per section" },
  { name: "brand-black", cls: "bg-brand-black", hex: "#0A0A0A", rule: "Teks, border, shadow, tombol CTA di latar terang", light: true },
  { name: "brand-cream", cls: "bg-brand-cream", hex: "#FFFBEB", rule: "Latar utama halaman" },
  { name: "brand-gray", cls: "bg-brand-gray", hex: "#F5F5F0", rule: "Latar section alternatif" },
  { name: "success", cls: "bg-success", hex: "#00C27C", rule: "Berhasil, lunas, aman" },
  { name: "danger", cls: "bg-danger", hex: "#FF3B3B", rule: "Error, bahaya, hapus", light: true },
  { name: "warning", cls: "bg-warning", hex: "#FF9F1C", rule: "Peringatan, stok menipis" },
  { name: "info", cls: "bg-info", hex: "#0066FF", rule: "Informasi netral", light: true },
  { name: "accent", cls: "bg-accent", hex: "#8B5CF6", rule: "Aksen sekunder: dekorasi dan grafik", light: true },
];

const TYPE = [
  { cls: "text-display", name: "display", use: "Judul hero dan CTA besar", sample: "Kasir yang ngerti bisnis kamu" },
  { cls: "text-h1", name: "h1", use: "Judul halaman aplikasi", sample: "Laporan Penjualan" },
  { cls: "text-h2", name: "h2", use: "Judul section landing", sample: "Pilih paket yang pas" },
  { cls: "text-h3", name: "h3", use: "Judul kartu besar", sample: "AI Assistant yang paham tokomu" },
  { cls: "text-h4", name: "h4", use: "Judul kartu kecil", sample: "Stok real-time" },
  { cls: "text-body", name: "body", use: "Teks isi", sample: "Kelola penjualan, stok, dan laporan di satu layar." },
  { cls: "text-small", name: "small", use: "Teks pendukung", sample: "Tanpa kartu kredit. Paket Free gratis selamanya." },
  { cls: "text-caption", name: "caption", use: "Keterangan, label kecil", sample: "Contoh tampilan dengan data fiktif" },
];

const VARIANTS = [
  ["cta", "CTA utama di latar terang (landing). Satu per layar."],
  ["inverse", "CTA utama di latar gelap."],
  ["primary", "Aksi utama di dalam aplikasi (kasir, form)."],
  ["secondary", "Aksi pendukung."],
  ["dark", "Aksi penekanan di atas kartu kuning."],
  ["outlineLight", "Aksi pendukung di latar gelap."],
  ["ghost", "Aksi ringan / pasif."],
  ["danger", "Hanya aksi merusak (hapus, batalkan)."],
];

const Section = ({ title, children, note }) => (
  <section className="mb-12">
    <h2 className="font-grotesk text-h3 mb-1">{title}</h2>
    {note && <p className="text-small text-brand-black/60 font-medium mb-4 max-w-2xl">{note}</p>}
    {children}
  </section>
);

export default function DesignSystemPage() {
  return (
    <div className="bg-brand-cream text-brand-black p-5 sm:p-8 min-h-[80vh]">
      <h1 className="font-grotesk text-h1 mb-2">Design System KasirAI</h1>
      <p className="text-body text-brand-black/70 font-medium mb-10 max-w-2xl">
        Gaya neobrutalism: border tebal, bayangan tanpa blur, sudut tegas. Token warna ada di{" "}
        <code className="font-mono text-small bg-white border border-brand-black/30 px-1">src/app/globals.css</code>, aturan
        lengkap di <code className="font-mono text-small bg-white border border-brand-black/30 px-1">frontend/DESIGN_SYSTEM.md</code>.
      </p>

      <Section title="Warna" note="Pakai nama token, bukan hex atau palet bawaan Tailwind (bg-green-100 dll.).">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COLORS.map((c) => (
            <NeoCard key={c.name} noPad className="flex">
              <div className={`${c.cls} w-24 shrink-0 border-r-2 border-brand-black flex items-center justify-center font-mono text-caption font-bold ${c.light ? "text-white" : "text-brand-black"}`}>
                {c.hex}
              </div>
              <div className="p-3">
                <p className="font-mono text-small font-bold">{c.name}</p>
                <p className="text-caption text-brand-black/65 font-medium">{c.rule}</p>
              </div>
            </NeoCard>
          ))}
        </div>
        <div className="mt-5 grid sm:grid-cols-2 gap-4">
          <NeoCard variant="highlight">
            <p className="font-grotesk text-h4 mb-1">Kuning dipakai untuk</p>
            <ul className="text-small font-medium list-disc pl-5 space-y-1">
              <li>CTA utama di dalam aplikasi</li>
              <li>Penanda aktif (menu, tab)</li>
              <li>Maksimal 1 highlight kata per section</li>
            </ul>
          </NeoCard>
          <NeoCard>
            <p className="font-grotesk text-h4 mb-1">Kuning TIDAK dipakai untuk</p>
            <ul className="text-small font-medium list-disc pl-5 space-y-1">
              <li>Dekorasi bebas (kotak ikon, kartu biasa)</li>
              <li>Tombol CTA di atas latar kuning (pakai hitam)</li>
              <li>Banyak elemen sekaligus dalam satu layar</li>
            </ul>
          </NeoCard>
        </div>
      </Section>

      <Section title="Tipografi" note="Space Grotesk untuk judul, Inter untuk isi, JetBrains Mono hanya untuk angka, harga, dan kode.">
        <div className="space-y-3">
          {TYPE.map((t) => (
            <div key={t.name} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 border-b border-brand-black/10 pb-3">
              <p className="font-mono text-caption text-brand-black/60 sm:w-40 shrink-0">
                {t.name} · {t.use}
              </p>
              <p className={`${t.cls} font-grotesk`}>{t.sample}</p>
            </div>
          ))}
          <p className="font-mono text-small">Rp 129.000 /bulan (angka dan harga memakai font mono)</p>
        </div>
      </Section>

      <Section title="Tombol" note="Satu tombol utama per layar. Untuk tautan gunakan neoButtonClass() dari components/ui/NeoButton.">
        <div className="space-y-5">
          {VARIANTS.map(([v, desc]) => (
            <div key={v} className={`flex flex-col lg:flex-row lg:items-center gap-3 p-4 border-2 border-brand-black/15 ${v === "inverse" || v === "outlineLight" ? "bg-brand-black" : "bg-white"}`}>
              <div className="lg:w-72 shrink-0">
                <p className={`font-mono text-small font-bold ${v === "inverse" || v === "outlineLight" ? "text-white" : ""}`}>{v}</p>
                <p className={`text-caption font-medium ${v === "inverse" || v === "outlineLight" ? "text-white/70" : "text-brand-black/65"}`}>{desc}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {["sm", "md", "lg", "xl"].map((s) => (
                  <NeoButton key={s} variant={v} size={s}>{s}</NeoButton>
                ))}
                <NeoButton variant={v} disabled>disabled</NeoButton>
                <NeoButton variant={v} loading>loading</NeoButton>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Kartu" note="Sudut tegas. md untuk dashboard, lg untuk landing page.">
        <div className="grid sm:grid-cols-3 gap-5">
          <NeoCard><p className="font-grotesk text-h4">default · md</p><p className="text-small font-medium text-brand-black/65">Kartu biasa di dashboard.</p></NeoCard>
          <NeoCard variant="highlight" size="lg"><p className="font-grotesk text-h4">highlight · lg</p><p className="text-small font-medium">Kartu yang ingin ditonjolkan.</p></NeoCard>
          <NeoCard variant="dark" size="lg"><p className="font-grotesk text-h4">dark · lg</p><p className="text-small font-medium text-white/75">Penekanan (mis. fitur AI).</p></NeoCard>
        </div>
      </Section>

      <Section title="Badge" note="Gunakan nama semantik. Nama lama (green, red, blue, orange) masih bekerja sebagai alias.">
        <div className="flex flex-wrap gap-3">
          {["yellow", "black", "success", "danger", "warning", "info", "gray"].map((c) => (
            <NeoBadge key={c} color={c}>{c}</NeoBadge>
          ))}
        </div>
      </Section>
    </div>
  );
}
