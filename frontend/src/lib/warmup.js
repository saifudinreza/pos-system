// ============================================================
// warmup.js, Bangunkan backend Render (plan gratis) lebih awal
// Analogi: seperti menyalakan mesin kasir sebelum toko buka,
// jadi saat pembeli (user) datang, mesinnya sudah siap.
//
// Render plan gratis tidur setelah ±15 menit tanpa request dan butuh
// 30-60 detik untuk bangun. Fungsi di sini memanggil endpoint health
// check Laravel (/up) diam-diam supaya server sudah bangun sebelum
// user menekan tombol Masuk.
// ============================================================

const SESSION_KEY = "kasirai_warmup_at";
const FRESH_MS = 5 * 60 * 1000; // dianggap masih hangat selama 5 menit
const DEFAULT_TIMEOUT_MS = 90 * 1000; // cold start Render bisa ±60 detik

// Promise yang sedang berjalan, dipakai bersama supaya tidak ada request ganda
let inflight = null;

/**
 * getBackendOrigin, Ambil origin backend dari NEXT_PUBLIC_API_URL.
 * Contoh: "https://x.onrender.com/api" → "https://x.onrender.com".
 * Mengembalikan null kalau env kosong atau bukan URL valid.
 */
export function getBackendOrigin() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function readLastWarm() {
  try {
    return Number(window.sessionStorage.getItem(SESSION_KEY)) || 0;
  } catch {
    return 0; // sessionStorage bisa error di mode private
  }
}

function writeLastWarm() {
  try {
    window.sessionStorage.setItem(SESSION_KEY, String(Date.now()));
  } catch {
    // abaikan, warm-up tetap jalan tanpa cache
  }
}

/**
 * warmUpBackend, Panggil GET {origin backend}/up dan tunggu sampai server membalas.
 *
 * - Tidak pernah melempar error, selalu resolve ke { ok, ms }.
 * - ok: true kalau server membalas (status apa pun), false kalau timeout / gagal.
 * - ms: lama menunggu (0 kalau dilewati karena baru saja berhasil).
 * - Panggilan yang bersamaan memakai Promise yang sama; yang berhasil dalam
 *   5 menit terakhir langsung dianggap hangat tanpa request baru.
 *
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ ok: boolean, ms: number }>}
 */
export function warmUpBackend(options = {}) {
  if (typeof window === "undefined") {
    return Promise.resolve({ ok: false, ms: 0 });
  }

  const origin = getBackendOrigin();
  if (!origin) return Promise.resolve({ ok: false, ms: 0 });

  if (Date.now() - readLastWarm() < FRESH_MS) {
    return Promise.resolve({ ok: true, ms: 0 });
  }

  if (inflight) return inflight;

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();

  inflight = fetch(`${origin}/up`, {
    method: "GET",
    cache: "no-store",
    signal: controller.signal,
  })
    .then(() => {
      writeLastWarm();
      return { ok: true, ms: Date.now() - started };
    })
    .catch(() => ({ ok: false, ms: Date.now() - started }))
    .finally(() => {
      clearTimeout(timer);
      inflight = null;
    });

  return inflight;
}
