// ============================================================
// page.jsx — Halaman Utama (Landing Page) KasirAI
//
// Analogi: Ini seperti "tatanan ruangan" toko —
// pintu masuk (Navbar) → etalase utama (Hero) →
// rak produk (Features) → panduan (HowItWorks) →
// daftar harga (Pricing) → ulasan pelanggan (Testimonials) →
// ajakan beli (CTA) → info kontak (Footer)
//
// Setiap komponen berdiri sendiri seperti "ruangan" berbeda,
// tapi semuanya disatukan di sini dalam urutan yang logis.
//
// Catatan: page.jsx ini adalah Server Component (tidak pakai 'use client')
// karena tidak butuh state di level ini. State dikelola masing-masing section.
// ============================================================

import LandingNavbar       from "@/components/landing/LandingNavbar";
import HeroSection         from "@/components/landing/HeroSection";
import FeaturesSection     from "@/components/landing/FeaturesSection";
import HowItWorksSection   from "@/components/landing/HowItWorksSection";
import PricingSection      from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection          from "@/components/landing/CTASection";
import LandingFooter       from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    // <main> sebagai elemen semantik halaman utama
    // bg-brand-cream: background krem hangat khas KasirAI
    <main className="min-h-screen bg-brand-cream">
      {/* Grid background pattern — tipis, seperti di referensi */}
      <div className="bg-grid" aria-hidden="true" />

      {/* 1. Navbar sticky — selalu terlihat di atas saat scroll */}
      <LandingNavbar />

      {/* 2. Hero — area "first impression", paling atas dan paling penting */}
      <HeroSection />

      {/* 3. Fitur — apa saja yang bisa dilakukan KasirAI */}
      <FeaturesSection />

      {/* 4. Cara Kerja — proses 3 langkah yang simpel */}
      <HowItWorksSection />

      {/* 5. Harga — pilihan paket yang transparan */}
      <PricingSection />

      {/* 6. Testimoni — bukti nyata dari pengguna */}
      <TestimonialsSection />

      {/* 7. CTA — panggilan aksi terakhir sebelum scroll habis */}
      <CTASection />

      {/* 8. Footer — informasi kontak, link, dan copyright */}
      <LandingFooter />

    </main>
  );
}
