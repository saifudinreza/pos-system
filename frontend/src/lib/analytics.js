// ============================================================
// analytics.js, helper kecil untuk mengirim event ke Google Analytics 4
// (GA4 dipasang lewat <GoogleAnalytics> di app/layout.jsx, aktif kalau
// env NEXT_PUBLIC_GA_MEASUREMENT_ID terisi).
//
// Aman dipanggil di mana saja: tidak melakukan apa-apa di server, saat GA
// belum termuat, atau kalau ada error. Nama event memakai snake_case.
//
// Daftar event funnel (issue #10):
//   landing_view, cta_click {posisi}, register_start, register_success,
//   product_created_first, shift_opened_first, order_paid_first,
//   upgrade_view, upgrade_payment_success
// ============================================================

import { sendGAEvent } from "@next/third-parties/google";

/**
 * trackEvent, kirim satu event ke GA4.
 * @param {string} name   nama event (snake_case)
 * @param {object} params parameter tambahan, mis. { posisi: "hero" }
 */
export function trackEvent(name, params = {}) {
  try {
    if (typeof window === "undefined" || !window.dataLayer) return;
    sendGAEvent("event", name, params);
  } catch {
    // analytics tidak boleh pernah merusak halaman
  }
}
