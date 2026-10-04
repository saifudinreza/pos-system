// ============================================================
// AppMock.tsx, Tiruan tampilan aplikasi KasirAI (bukan rekaman layar).
// Mengikuti layout & label aplikasi asli (frontend/src/app/...), disederhanakan.
// Semua angka berasal dari data/demo.ts.
// ============================================================

import React from "react";
import { staticFile } from "remotion";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { CART, getProduct, Product, rupiah, SHOP, SUBTOTAL, TAX, TOTAL } from "../data/demo";

// ---------- logo ----------
export const LogoIcon: React.FC<{ size: number }> = ({ size }) => (
  <img src={staticFile("logo/logo-icon.png")} width={size} height={size} style={{ objectFit: "contain", display: "block" }} />
);

// ---------- field input ----------
export const Field: React.FC<{ label: string; value: string; focus?: boolean; caret?: boolean; mono?: boolean; placeholder?: string }> = ({
  label,
  value,
  focus,
  caret,
  mono,
  placeholder,
}) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 24, marginBottom: 8 }}>
      {label} <span style={{ color: colors.red }}>*</span>
    </div>
    <div
      style={{
        border: `3px solid ${focus ? colors.yellow : colors.black}`,
        background: colors.white,
        height: 66,
        padding: "0 18px",
        display: "flex",
        alignItems: "center",
        fontFamily: mono ? fonts.mono : fonts.heading,
        fontSize: 28,
        boxShadow: focus ? `0 0 0 4px ${colors.black}` : "none",
        color: value ? colors.black : "rgba(10,10,10,0.35)",
      }}
    >
      {value || placeholder}
      {caret && <span style={{ width: 3, height: 34, background: colors.black, marginLeft: 2 }} />}
    </div>
  </div>
);

// ---------- sidebar dashboard ----------
const NAV = ["Dashboard", "Kasir", "Produk", "Pesanan", "Transaksi", "Laporan", "Pelanggan"];
export const SideNav: React.FC<{ active: string }> = ({ active }) => (
  <div style={{ width: 300, height: "100%", background: colors.white, borderRight: border, padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
      <LogoIcon size={54} />
      <span style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36 }}>KasirAI</span>
    </div>
    {NAV.map((n) => (
      <div
        key={n}
        style={{
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: 25,
          padding: "12px 16px",
          border: n === active ? border : "3px solid transparent",
          background: n === active ? colors.yellow : "transparent",
          boxShadow: n === active ? shadow.sm : "none",
        }}
      >
        {n}
      </div>
    ))}
    <div style={{ marginTop: "auto", fontFamily: fonts.mono, fontSize: 18, opacity: 0.6 }}>
      {SHOP.name}
      <br />
      Kasir: {SHOP.cashier}
    </div>
  </div>
);

// ---------- kartu produk ----------
export const ProductCard: React.FC<{ p: Product; qty?: number; hot?: boolean; pop?: number }> = ({ p, qty = 0, hot, pop = 0 }) => (
  <div
    style={{
      background: hot ? colors.yellow : colors.white,
      border,
      boxShadow: hot ? shadow.sm : shadow.md,
      transform: hot ? `translate(2px,2px) scale(${1 - pop * 0.03})` : "none",
      padding: 16,
      position: "relative",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      height: 238,
    }}
  >
    {qty > 0 && (
      <div
        style={{
          position: "absolute",
          top: -14,
          right: -14,
          width: 46,
          height: 46,
          background: colors.black,
          color: colors.white,
          fontFamily: fonts.mono,
          fontWeight: 700,
          fontSize: 26,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border,
          transform: `scale(${1 + pop * 0.25})`,
        }}
      >
        {qty}
      </div>
    )}
    <div style={{ fontSize: 84, lineHeight: 1.1, textAlign: "center", flex: 1 }}>{p.emoji}</div>
    <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 25 }}>{p.name}</div>
    <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 23 }}>{rupiah(p.price)}</div>
    <div style={{ fontFamily: fonts.mono, fontSize: 17, opacity: 0.55 }}>Stok: {p.stock}</div>
  </div>
);

// ---------- keranjang ----------
export const CartPanel: React.FC<{
  lines: { productId: number; qty: number; visible: boolean }[];
  buttonPressedAt?: number;
  showPay?: boolean;
  frame?: number;
}> = ({ lines, buttonPressedAt, showPay = true, frame = 0 }) => {
  const shown = lines.filter((l) => l.visible && l.qty > 0);
  const sub = shown.reduce((s, l) => s + getProduct(l.productId).price * l.qty, 0);
  const tax = Math.round(sub * 0.11);
  const pressed = buttonPressedAt !== undefined && frame >= buttonPressedAt && frame < buttonPressedAt + 8;
  return (
    <div style={{ width: 440, height: "100%", background: colors.white, borderLeft: border, padding: 22, display: "flex", flexDirection: "column" }}>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, marginBottom: 14 }}>Keranjang</div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        {shown.length === 0 && (
          <div style={{ fontFamily: fonts.heading, fontSize: 24, opacity: 0.4, marginTop: 60, textAlign: "center" }}>Keranjang masih kosong</div>
        )}
        {shown.map((l) => {
          const p = getProduct(l.productId);
          return (
            <div key={l.productId} style={{ border: borderThin, padding: "10px 14px", background: colors.cream, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 23 }}>{p.name}</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 18, opacity: 0.6 }}>
                  {l.qty} × {rupiah(p.price)}
                </div>
              </div>
              <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 22 }}>{rupiah(p.price * l.qty)}</div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: border, paddingTop: 14, fontFamily: fonts.mono, fontSize: 22, display: "flex", flexDirection: "column", gap: 6 }}>
        <Row k="Subtotal" v={rupiah(sub)} />
        <Row k="PPN 11%" v={rupiah(tax)} />
        <Row k="Total" v={rupiah(sub + tax)} bold />
      </div>
      {showPay && (
        <div
          style={{
            marginTop: 14,
            background: colors.yellow,
            border,
            textAlign: "center",
            fontFamily: fonts.heading,
            fontWeight: 700,
            fontSize: 28,
            padding: "14px 0",
            boxShadow: pressed ? "none" : shadow.md,
            transform: pressed ? "translate(4px,4px)" : "none",
          }}
        >
          Bayar Tunai
        </div>
      )}
      {showPay && (
        <div style={{ marginTop: 12, background: colors.black, color: colors.white, border, textAlign: "center", fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, padding: "12px 0" }}>
          Bayar Digital (QRIS)
        </div>
      )}
    </div>
  );
};

export const Row: React.FC<{ k: string; v: string; bold?: boolean; big?: boolean }> = ({ k, v, bold, big }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontWeight: bold ? 700 : 500, fontSize: big ? 30 : undefined }}>
    <span>{k}</span>
    <span>{v}</span>
  </div>
);

// ---------- struk ----------
export const Receipt: React.FC<{ paidLabel: string; paid: number; change?: number }> = ({ paidLabel, paid, change }) => (
  <div style={{ width: 430, background: colors.white, border, boxShadow: shadow.lg, padding: "26px 28px", fontFamily: fonts.mono, fontSize: 21 }}>
    <div style={{ textAlign: "center", fontFamily: fonts.heading, fontWeight: 700, fontSize: 32 }}>{SHOP.name}</div>
    <div style={{ textAlign: "center", opacity: 0.6, marginBottom: 10 }}>Struk Digital · Kasir {SHOP.cashier}</div>
    <div style={{ borderTop: "2px dashed #0A0A0A", margin: "10px 0" }} />
    {CART.map((c) => {
      const p = getProduct(c.productId);
      return <Row key={c.productId} k={`${c.qty}× ${p.name}`} v={rupiah(p.price * c.qty)} />;
    })}
    <div style={{ borderTop: "2px dashed #0A0A0A", margin: "10px 0" }} />
    <Row k="Subtotal" v={rupiah(SUBTOTAL)} />
    <Row k="PPN 11%" v={rupiah(TAX)} />
    <Row k="Total" v={rupiah(TOTAL)} bold />
    <Row k={`Bayar (${paidLabel})`} v={rupiah(paid)} />
    {change !== undefined && <Row k="Kembalian" v={rupiah(change)} bold />}
    <div
      style={{
        marginTop: 16,
        textAlign: "center",
        background: colors.green,
        border,
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 30,
        padding: "6px 0",
        transform: "rotate(-3deg)",
      }}
    >
      LUNAS
    </div>
  </div>
);

// ---------- QR (pola contoh, bukan QR sungguhan) ----------
export const QrCode: React.FC<{ size: number }> = ({ size }) => {
  const N = 25;
  const cell = size / N;
  let s = 7;
  const rand = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  const finderOn = (x: number, y: number) => {
    const fx = x < 7 ? x : x - (N - 7);
    const fy = y < 7 ? y : y - (N - 7);
    return fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
  };
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const on = finder(x, y) ? finderOn(x, y) : rand() > 0.52;
      if (on) cells.push(<rect key={`${x}-${y}`} x={x * cell} y={y * cell} width={cell + 0.5} height={cell + 0.5} fill={colors.black} />);
    }
  }
  return (
    <svg width={size} height={size} style={{ background: colors.white, display: "block" }}>
      {cells}
    </svg>
  );
};

// ---------- WhatsApp (tampilan generik, tanpa logo merek) ----------
export const PhoneChat: React.FC<{ showMsg: number; typingDots?: boolean }> = ({ showMsg, typingDots }) => (
  <div style={{ width: 420, height: 800, background: colors.black, border: `6px solid ${colors.black}`, borderRadius: 50, boxShadow: shadow.xl, padding: 12, position: "relative" }}>
    <div style={{ width: "100%", height: "100%", borderRadius: 38, overflow: "hidden", background: "#E6DDD4", display: "flex", flexDirection: "column" }}>
      <div style={{ background: "#128C7E", color: colors.white, padding: "34px 20px 16px", fontFamily: fonts.heading, fontWeight: 700, fontSize: 26 }}>
        {SHOP.name}
        <div style={{ fontSize: 17, fontWeight: 500, opacity: 0.85 }}>Akun bisnis · online</div>
      </div>
      <div style={{ flex: 1, padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 10 }}>
        {typingDots && <div style={{ background: colors.white, padding: "10px 18px", fontSize: 28, alignSelf: "flex-start", border: borderThin }}>• • •</div>}
        <div
          style={{
            background: colors.white,
            padding: "16px 18px",
            alignSelf: "flex-start",
            maxWidth: 340,
            border: borderThin,
            fontFamily: fonts.mono,
            fontSize: 17,
            lineHeight: 1.45,
            opacity: showMsg,
            transform: `translateY(${(1 - showMsg) * 30}px)`,
          }}
        >
          <b>Struk Digital · {SHOP.name}</b>
          <br />
          2× Es Kopi Susu · 1× Croissant
          <br />
          Total : {rupiah(TOTAL)}
          <br />
          Bayar (QRIS) : {rupiah(TOTAL)}
          <br />
          Status : LUNAS ✓
          <br />
          Terima kasih sudah berbelanja! ☕
        </div>
        <div style={{ alignSelf: "flex-start", fontFamily: fonts.mono, fontSize: 15, opacity: 0.55 }}>Dikirim ke {SHOP.customerWa}</div>
      </div>
    </div>
  </div>
);

// ---------- grafik ----------
export const StatCard: React.FC<{ label: string; value: string; bg?: string; icon?: string }> = ({ label, value, bg = colors.white, icon }) => (
  <div style={{ background: bg, border, boxShadow: shadow.md, padding: "18px 22px", flex: 1, minWidth: 0 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.mono, fontWeight: 700, fontSize: 16, opacity: 0.65, textTransform: "uppercase", letterSpacing: 1 }}>
      <span>{label}</span>
      <span style={{ fontSize: 28, opacity: 1 }}>{icon}</span>
    </div>
    <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 34, marginTop: 6, whiteSpace: "nowrap" }}>{value}</div>
  </div>
);

/** Line chart sederhana; `draw` 0..1 = seberapa jauh garis tergambar. */
export const LineChart: React.FC<{ data: { day: string; value: number }[]; w: number; h: number; draw: number }> = ({ data, w, h, draw }) => {
  const padL = 70, padB = 44, padT = 16, padR = 16;
  const max = 3600000;
  const x = (i: number) => padL + (i * (w - padL - padR)) / (data.length - 1);
  const y = (v: number) => padT + (1 - v / max) * (h - padT - padB);
  const pts = data.map((d, i) => `${x(i)},${y(d.value)}`);
  const len = 2200;
  return (
    <svg width={w} height={h}>
      {[0, 1000000, 2000000, 3000000].map((t) => (
        <g key={t}>
          <line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="rgba(10,10,10,0.15)" strokeWidth={2} />
          <text x={padL - 10} y={y(t) + 6} textAnchor="end" fontFamily={fonts.mono} fontSize={17} fill={colors.black}>
            {t === 0 ? "0" : `${t / 1000000} jt`}
          </text>
        </g>
      ))}
      {data.map((d, i) => (
        <text key={d.day} x={x(i)} y={h - 14} textAnchor="middle" fontFamily={fonts.mono} fontSize={18} fill={colors.black}>
          {d.day}
        </text>
      ))}
      <polyline points={pts.join(" ")} fill="none" stroke={colors.black} strokeWidth={6} strokeLinejoin="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} />
      {data.map((d, i) => {
        const on = draw >= i / (data.length - 1) - 0.02;
        return on ? <circle key={i} cx={x(i)} cy={y(d.value)} r={10} fill={colors.yellow} stroke={colors.black} strokeWidth={4} /> : null;
      })}
    </svg>
  );
};

/** Bar horizontal untuk produk terlaris; `grow` 0..1. */
export const BarList: React.FC<{ items: { name: string; qty: number }[]; w: number; grow: number }> = ({ items, w, grow }) => {
  const max = Math.max(...items.map((i) => i.qty));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: w }}>
      {items.map((it, i) => (
        <div key={it.name}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fonts.heading, fontWeight: 700, fontSize: 21, marginBottom: 4 }}>
            <span>{it.name}</span>
            <span style={{ fontFamily: fonts.mono }}>{Math.round(it.qty * grow)}</span>
          </div>
          <div style={{ height: 26, border: borderThin, background: colors.white }}>
            <div style={{ height: "100%", width: `${(it.qty / max) * 100 * grow}%`, background: [colors.yellow, colors.green, colors.pink, colors.blue, colors.purple][i % 5], borderRight: borderThin }} />
          </div>
        </div>
      ))}
    </div>
  );
};
