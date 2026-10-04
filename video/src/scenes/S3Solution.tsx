// ============================================================
// S3Solution, Perkenalan solusi: tampilan laptop + HP KasirAI.
// Narasi: "KasirAI hadir untuk merapikan semuanya, cukup dari laptop, tablet, atau HP Anda."
// ============================================================

import React from "react";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { useLand } from "../lib/anim";
import { Chip, SceneShell, Sfx } from "../components/ui";
import { LogoIcon } from "../components/AppMock";
import { PRODUCTS, rupiah } from "../data/demo";

const MiniScreen: React.FC<{ scale: number }> = ({ scale }) => (
  <div style={{ width: 760 * scale, height: 440 * scale, background: colors.cream, overflow: "hidden", position: "relative" }}>
    <div style={{ width: 760, height: 440, transform: `scale(${scale})`, transformOrigin: "0 0", display: "flex" }}>
      <div style={{ flex: 1, padding: 16 }}>
        <div style={{ height: 40, border: borderThin, background: colors.white, marginBottom: 14, fontFamily: fonts.heading, fontSize: 18, padding: "6px 12px", opacity: 0.5 }}>Cari produk...</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {PRODUCTS.slice(0, 6).map((p, i) => (
            <div key={p.id} style={{ border: borderThin, background: i === 0 ? colors.yellow : colors.white, padding: 8, textAlign: "center", boxShadow: shadow.sm }}>
              <div style={{ fontSize: 44 }}>{p.emoji}</div>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 16 }}>{p.name}</div>
              <div style={{ fontFamily: fonts.mono, fontSize: 14 }}>{rupiah(p.price)}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ width: 220, borderLeft: border, background: colors.white, padding: 14, fontFamily: fonts.heading }}>
        <div style={{ fontWeight: 700, fontSize: 22 }}>Keranjang</div>
        <div style={{ fontFamily: fonts.mono, fontSize: 14, marginTop: 10, opacity: 0.7 }}>2× Es Kopi Susu<br />1× Croissant</div>
        <div style={{ marginTop: 40, background: colors.yellow, border: borderThin, textAlign: "center", fontWeight: 700, fontSize: 20, padding: "8px 0" }}>Bayar Tunai</div>
      </div>
    </div>
  </div>
);

export const S3Solution: React.FC<{ total: number }> = ({ total }) => {
  const head = useLand(8, { dy: -50, rot: -2 });
  const laptop = useLand(24, { dx: -200, dy: 40, rot: -4 });
  const phone = useLand(40, { dx: 200, dy: 40, rot: 5 });
  const chips = [useLand(70, { dy: 30 }), useLand(80, { dy: 30 }), useLand(90, { dy: 30 })];

  return (
    <SceneShell id="s3" total={total}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 50, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, ...head }}>
        <LogoIcon size={110} />
        <span style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 88 }}>
          merapikan <span style={{ background: colors.yellow, border, padding: "0 14px" }}>semuanya</span>
        </span>
      </div>
      {/* laptop */}
      <div style={{ position: "absolute", left: 250, top: 250, width: 880, ...laptop }}>
        <div style={{ border, boxShadow: shadow.xl, background: colors.black, padding: 14, borderRadius: 4, width: 880 }}>
          <MiniScreen scale={1.11} />
        </div>
        <div style={{ height: 22, background: colors.black, width: 1000, marginLeft: -60, borderRadius: "0 0 24px 24px", marginTop: -2 }} />
      </div>
      {/* HP */}
      <div style={{ position: "absolute", left: 1290, top: 230, ...phone }}>
        <div style={{ width: 340, height: 600, border, borderRadius: 44, boxShadow: shadow.xl, background: colors.black, padding: 12 }}>
          <div style={{ width: "100%", height: "100%", borderRadius: 32, background: colors.cream, overflow: "hidden", padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <LogoIcon size={40} />
              <span style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28 }}>KasirAI</span>
            </div>
            <div style={{ fontFamily: fonts.mono, fontSize: 15, opacity: 0.6 }}>PENDAPATAN HARI INI</div>
            <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 34, background: colors.yellow, border, padding: "6px 10px", marginBottom: 14 }}>Rp 3.105.000</div>
            {[["Pesanan", "87"], ["Stok menipis", "3"], ["Pelanggan", "248"]].map(([k, v]) => (
              <div key={k} style={{ border: borderThin, background: colors.white, padding: "10px 12px", marginBottom: 10, display: "flex", justifyContent: "space-between", fontFamily: fonts.heading, fontWeight: 700, fontSize: 21 }}>
                <span>{k}</span>
                <span style={{ fontFamily: fonts.mono }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* chip perangkat */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", gap: 26 }}>
        {["Laptop", "Tablet", "HP"].map((l, i) => (
          <div key={l} style={chips[i]}>
            <Chip label={l} bg={[colors.green, colors.pink, colors.blue][i]} color={i === 2 ? colors.white : colors.black} size={36} />
          </div>
        ))}
      </div>
      <Sfx name="thump" at={30} volume={0.8} />
      <Sfx name="thump" at={46} volume={0.7} />
      {[70, 80, 90].map((a) => (
        <Sfx key={a} name="pop" at={a} volume={0.4} />
      ))}
    </SceneShell>
  );
};
