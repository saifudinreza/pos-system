// ============================================================
// page.jsx, Landing Page KasirAI (mode "visual storytelling")
//
// Alur cerita (scroll dari atas ke bawah):
//   1. Hero        → value proposition + entrance bold
//   2. Problem     → ribetnya kelola toko manual
//   3. Solution    → fitur POS (di-reveal saat scroll)
//   4. AI Spotlight→ sorotan pembeda: AI sidebar (Groq)
//   5. Pricing     → pilihan paket
//   6. CTA         → ajakan login / demo
//   7. Footer      → info & link
//
// Catatan teknis:
//  - Server Component (tanpa 'use client'), animasi dikelola
//    masing-masing section (client components).
//  - Section di bawah lipatan (below the fold) di-LAZY LOAD via
//    next/dynamic agar initial load tetap ringan. Tetap SSR
//    (ssr default true) supaya SEO & first paint aman.
//  - Hero dimuat eager karena langsung terlihat.
// ============================================================

import dynamic from "next/dynamic";

import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection   from "@/components/landing/HeroSection";

// Skeleton ringan sebagai placeholder saat chunk section dimuat
const SectionFallback = () => (
  <div className="max-w-6xl mx-auto px-6 py-20">
    <div className="skeleton h-10 w-2/3 max-w-md mb-6" />
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="skeleton h-40 w-full" />
      ))}
    </div>
  </div>
);

// --- Section bawah-fold: lazy-loaded ---
const ProblemSection     = dynamic(() => import("@/components/landing/ProblemSection"),     { loading: SectionFallback });
const FeaturesSection    = dynamic(() => import("@/components/landing/FeaturesSection"),    { loading: SectionFallback });
const AISpotlightSection = dynamic(() => import("@/components/landing/AISpotlightSection"), { loading: SectionFallback });
const PricingSection     = dynamic(() => import("@/components/landing/PricingSection"),     { loading: SectionFallback });
const CTASection         = dynamic(() => import("@/components/landing/CTASection"));
const LandingFooter      = dynamic(() => import("@/components/landing/LandingFooter"));

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-cream overflow-x-hidden">
      {/* Grid background pattern, tipis */}
      <div className="bg-grid" aria-hidden="true" />

      {/* 1. Navbar sticky */}
      <LandingNavbar />

      {/* 2. Hero, first impression (eager) */}
      <HeroSection />

      {/* 3. Problem, ribetnya kelola toko manual */}
      <ProblemSection />

      {/* 4. Solution, fitur POS, di-reveal saat scroll */}
      <FeaturesSection />

      {/* 5. AI Spotlight, pembeda utama (Groq) */}
      <AISpotlightSection />

      {/* 6. Pricing, pilihan paket */}
      <PricingSection />

      {/* 7. CTA, ajakan login / demo */}
      <CTASection />

      {/* 8. Footer */}
      <LandingFooter />
    </main>
  );
}
