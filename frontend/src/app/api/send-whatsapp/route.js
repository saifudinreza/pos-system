// ============================================================
// route.js — API route kirim pesan WhatsApp via Fonnte
//
// Endpoint POST /api/send-whatsapp — dipakai untuk debug/tes
// pengiriman struk WhatsApp manual. Meneruskan pesan ke
// https://api.fonnte.com/send dengan token dari env server.
//
// ⚠️ PENTING:
//   - FONNTE_TOKEN dibaca dari env SERVER (process.env) —
//     JANGAN pernah memakai prefix NEXT_PUBLIC_* (bocor ke browser)
//   - Token tidak pernah dikirim ke frontend — hanya dipakai di sini
// ============================================================

import { NextResponse } from "next/server";

export async function POST(request) {
  const { target, message } = await request.json();

  // Token Fonnte dari env server — tanpa token, tolak langsung
  // (alur normal pengiriman struk tetap jalan via job backend Laravel)
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { status: false, reason: "Token Fonnte belum dikonfigurasi di server." },
      { status: 500 }
    );
  }

  try {
    // Teruskan ke API Fonnte — countryCode 62 memastikan nomor
    // lokal Indonesia (08xx → 628xx) diproses dengan benar
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target, message, countryCode: "62" }),
    });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    // Kegagalan jaringan ke Fonnte — balas 500 dengan pesan error
    return NextResponse.json(
      { status: false, reason: err.message },
      { status: 500 }
    );
  }
}
