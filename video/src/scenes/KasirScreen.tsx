// ============================================================
// KasirScreen.tsx, Tiruan layar kasir (split-screen: grid produk + keranjang)
// Dipakai di scene S5 (memilih produk) dan S6 (pembayaran).
// Koordinat (relatif isi jendela): area kiri 1194px, keranjang 440px.
// ============================================================

import React from "react";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { PRODUCTS } from "../data/demo";
import { CartPanel, ProductCard } from "../components/AppMock";

/** Posisi pusat kartu produk ke-`i` dalam koordinat layar video (untuk kursor). */
export const productCenter = (i: number) => ({
  x: 143 + 24 + (i % 4) * 294 + 135,
  y: 89 + 24 + 86 + 24 + Math.floor(i / 4) * 262 + 119,
});

export const KasirScreen: React.FC<{
  lines: { productId: number; qty: number; visible: boolean }[];
  hot?: number; // id produk yang sedang disorot
  pop?: number; // 0..1 efek tekan
  payPressedAt?: number;
  frame?: number;
}> = ({ lines, hot, pop = 0, payPressedAt, frame = 0 }) => (
  <div style={{ display: "flex", width: "100%", height: "100%", background: colors.cream }}>
    <div style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 24, minWidth: 0 }}>
      <div style={{ display: "flex", gap: 14, height: 86, alignItems: "stretch" }}>
        <div
          style={{
            flex: 1,
            border,
            background: colors.white,
            boxShadow: shadow.sm,
            display: "flex",
            alignItems: "center",
            padding: "0 22px",
            fontFamily: fonts.heading,
            fontSize: 26,
            color: "rgba(10,10,10,0.4)",
          }}
        >
          Cari produk atau SKU...
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {["Semua", "Kopi", "Makanan", "Minuman"].map((c, i) => (
            <div
              key={c}
              style={{
                border: borderThin,
                background: i === 0 ? colors.yellow : colors.white,
                fontFamily: fonts.heading,
                fontWeight: 700,
                fontSize: 22,
                padding: "10px 18px",
              }}
            >
              {c}
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 270px)", gap: 24 }}>
        {PRODUCTS.map((p) => {
          const qty = lines.find((l) => l.productId === p.id && l.visible)?.qty ?? 0;
          return <ProductCard key={p.id} p={p} qty={qty} hot={hot === p.id} pop={hot === p.id ? pop : 0} />;
        })}
      </div>
    </div>
    <CartPanel lines={lines} buttonPressedAt={payPressedAt} frame={frame} />
  </div>
);
