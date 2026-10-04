// ============================================================
// S8Outro, Penutup: 3 manfaat, harga paket, ajakan coba gratis.
// Narasi: "KasirAI. Kasir lebih rapi, bisnis lebih pasti. Coba gratis sekarang di sikasirai.com."
// Harga mengikuti SubscriptionController::PRICES (cek ulang sebelum render final).
// ============================================================

import React from "react";
import { useCurrentFrame } from "remotion";
import { border, colors, fonts, shadow } from "../theme";
import { useLand, useSpring } from "../lib/anim";
import { Chip, SceneShell, Sfx } from "../components/ui";
import { SHOP } from "../data/demo";
import { LogoIcon } from "../components/AppMock";
import { beat } from "../timing";

const BENEFITS = [
  { icon: "🧾", title: "Kasir lebih rapi", sub: "Tunai & QRIS, kembalian otomatis", bg: colors.yellow },
  { icon: "💬", title: "Struk ke WhatsApp", sub: "Terkirim otomatis setelah lunas", bg: colors.white },
  { icon: "📊", title: "Laporan & AI", sub: "Laba kotor dan saran bisnis", bg: colors.pink },
];

const PLANS = [
  { name: "Free", price: "Rp 0", per: "gratis", note: "Kasir tunai · 50 produk", bg: colors.white, fg: colors.black },
  { name: "Pro", price: "Rp 129.000", per: "/bulan", note: "QRIS & e-wallet · PDF/Excel · AI 10×/hari", bg: colors.yellow, fg: colors.black, tag: "Populer" },
  { name: "Enterprise", price: "Rp 499.000", per: "/bulan", note: "Semua fitur Pro · outlet unlimited", bg: colors.black, fg: colors.white },
];

export const S8Outro: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const t0 = beat("s8", 0);
  const t1 = beat("s8", 1);
  const head = useLand(8, { dy: -50, rot: 2 });
  const cta = useSpring(t1 + 20, { damping: 9, stiffness: 200 });
  const pulse = 1 + Math.max(0, Math.sin((frame - (t1 + 40)) / 6)) * 0.03 * (frame > t1 + 40 ? 1 : 0);

  return (
    <SceneShell id="s8" total={total} outro={false}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 36, textAlign: "center", fontFamily: fonts.heading, fontWeight: 700, fontSize: 84, ...head }}>
        Kasir lebih <span style={{ background: colors.yellow, border, padding: "0 14px" }}>rapi</span>, bisnis lebih <span style={{ background: colors.green, border, padding: "0 14px" }}>pasti</span>
      </div>
      <div style={{ position: "absolute", left: 44, top: 40, ...head }}>
        <LogoIcon size={120} />
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 190, display: "flex", gap: 34 }}>
        {BENEFITS.map((b, i) => {
          const st = useLand(t0 + 10 + i * 12, { dy: 70, rot: i % 2 ? 3 : -3 });
          return (
            <div key={b.title} style={{ flex: 1, background: b.bg, border, boxShadow: shadow.lg, padding: "22px 26px", ...st }}>
              <div style={{ fontSize: 60, lineHeight: 1 }}>{b.icon}</div>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36, marginTop: 8 }}>{b.title}</div>
              <div style={{ fontFamily: fonts.heading, fontSize: 24, opacity: 0.75 }}>{b.sub}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 110, right: 110, top: 480, display: "flex", gap: 34 }}>
        {PLANS.map((p, i) => {
          const st = useLand(t1 + i * 10, { dy: 60, rot: i % 2 ? -2 : 2 });
          return (
            <div key={p.name} style={{ flex: 1, background: p.bg, color: p.fg, border, boxShadow: shadow.lg, padding: "20px 26px", position: "relative", ...st }}>
              {p.tag && (
                <div style={{ position: "absolute", top: -22, right: 20 }}>
                  <Chip label={p.tag} bg={colors.red} color={colors.white} size={22} />
                </div>
              )}
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30 }}>{p.name}</div>
              <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 44 }}>
                {p.price} <span style={{ fontSize: 22, opacity: 0.7 }}>{p.per}</span>
              </div>
              <div style={{ fontFamily: fonts.heading, fontSize: 22, opacity: 0.85 }}>{p.note}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 745, display: "flex", justifyContent: "center", transform: `scale(${cta * pulse})`, opacity: Math.min(1, cta * 3) }}>
        <div style={{ background: colors.yellow, border, boxShadow: shadow.xl, padding: "16px 56px", fontFamily: fonts.heading, fontWeight: 700, fontSize: 64 }}>
          Coba gratis → <span style={{ background: colors.black, color: colors.yellow, padding: "0 14px" }}>{SHOP.url}</span>
        </div>
      </div>
      <Sfx name="thump" at={t0 + 10} volume={0.6} />
      <Sfx name="thump" at={t0 + 22} volume={0.6} />
      <Sfx name="thump" at={t0 + 34} volume={0.6} />
      {[0, 1, 2].map((i) => (
        <Sfx key={i} name="pop" at={t1 + i * 10} volume={0.4} />
      ))}
      <Sfx name="chaching" at={t1 + 20} volume={0.6} />
    </SceneShell>
  );
};
