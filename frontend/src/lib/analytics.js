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

/**
 * trackOnce, kirim event HANYA SEKALI per browser (untuk event "pertama kali":
 * product_created_first, shift_opened_first, order_paid_first).
 * Penanda disimpan di localStorage, jadi ini perkiraan per perangkat. Untuk
 * angka yang benar-benar "pertama per akun", hitung di GA4 lewat user_id.
 */
export function trackOnce(name, params = {}) {
  try {
    if (typeof window === "undefined") return;
    const key = `kasirai_evt_${name}`;
    if (window.localStorage.getItem(key)) return;
    window.localStorage.setItem(key, "1");
  } catch {
    // localStorage tidak tersedia: lewati penandaan, tetap kirim event
  }
  trackEvent(name, params);
}
