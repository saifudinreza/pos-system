"use client";

// ============================================================
// useDebounce.js — Hook untuk "tunda" perubahan nilai
//
// Analogi: Ini seperti "timer otomatis di lift" —
// lift tidak langsung tutup pintu saat satu orang masuk.
// Dia tunggu beberapa detik dulu, kalau ada orang lagi masuk
// timer di-reset. Baru kalau tidak ada yang masuk sekian detik,
// pintu benar-benar ditutup.
//
// Dalam konteks search:
//   - User ketik "a" → timer mulai (500ms)
//   - User ketik "ay" → timer di-reset, mulai lagi dari 0
//   - User ketik "aya" → timer di-reset lagi
//   - User berhenti ketik → 500ms berlalu → request ke API dikirim
//   - Tanpa debounce: setiap ketukan huruf langsung request (spam API)
//
// Cara pakai:
//   const debouncedSearch = useDebounce(searchQuery, 500);
//   useEffect(() => { fetch('/products?search=' + debouncedSearch) }, [debouncedSearch]);
//
// @param {any}    value — nilai yang mau di-debounce (biasanya string input)
// @param {number} delay — waktu tunggu dalam millisecond (default 500ms)
// @returns       nilai yang sudah di-debounce (stabil setelah delay)
// ============================================================

import { useState, useEffect } from "react";

export function useDebounce(value, delay = 500) {
  // debouncedValue = nilai yang "terlambat" dibanding value asli
  // Inilah yang kita pakai untuk query API — lebih stabil
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set timer: setelah `delay` ms, update debouncedValue
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: batalkan timer lama saat value berubah lagi sebelum delay habis
    // Ini yang membuat debounce bekerja — timer selalu di-reset kalau nilai berubah
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
