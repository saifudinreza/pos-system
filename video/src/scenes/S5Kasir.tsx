// ============================================================
// S5Kasir, Demo buka shift lalu memilih produk ke keranjang.
// Narasi: "Buka shift, lalu layani pembeli. Pilih produk, dan keranjang langsung
//          menghitung totalnya. Stok pun ikut diperiksa secara otomatis."
// ============================================================

import React from "react";
import { useCurrentFrame } from "remotion";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { progress, useLand } from "../lib/anim";
import { AppWindow, Chip, Cursor, NeoButton, SceneShell, Sfx, typed } from "../components/ui";
import { KasirScreen, productCenter } from "./KasirScreen";
import { Field } from "../components/AppMock";
import { getProduct, rupiah } from "../data/demo";
import { beat } from "../timing";

export const S5Kasir: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const OPEN_START = 14;
  const MODAL_CLICK = 118;
  const MODAL_GONE = 130;
  const picks = [
    { id: 1, idx: 0, at: beat("s5", 1) + 14 },
    { id: 1, idx: 0, at: beat("s5", 1) + 56 },
    { id: 4, idx: 3, at: beat("s5", 1) + 98 },
  ];
  const stockAt = beat("s5", 2) + 6;

  // hitung qty keranjang sesuai klik
  const qty = (id: number) => picks.filter((p) => p.id === id && frame >= p.at).length;
  const lines = [1, 4].map((id) => ({ productId: id, qty: qty(id), visible: qty(id) > 0 }));
  const last = [...picks].reverse().find((p) => frame >= p.at);
  const pop = last ? 1 - progress(frame, last.at, last.at + 10) : 0;
  const hot = last && frame < last.at + 14 ? last.id : undefined;

  const modal = useLand(OPEN_START, { dy: 60, rot: -2 });
  const modalVisible = frame >= OPEN_START && frame < MODAL_GONE;
  const stock = useLand(stockAt, { dy: 30, rot: -3 });

  const cursorPath = [
    { f: 20, x: 1500, y: 820 },
    { f: 70, x: 960, y: 655 },
    { f: 112, x: 960, y: 655 },
    { f: MODAL_CLICK, x: 960, y: 735 },
    { f: MODAL_CLICK + 12, x: 1000, y: 700 },
    ...picks.flatMap((p, i) => {
      const c = productCenter(p.idx);
      return [
        { f: p.at - 18, x: c.x - 20, y: c.y - 10 },
        { f: p.at, x: c.x, y: c.y },
        ...(i < picks.length - 1 ? [{ f: p.at + 12, x: c.x, y: c.y }] : []),
      ];
    }),
    { f: picks[2].at + 40, x: 1560, y: 740 },
  ];

  return (
    <SceneShell id="s5" total={total}>
      <AppWindow url="sikasirai.com/kasir" start={0}>
        <KasirScreen lines={lines} hot={hot} pop={pop} frame={frame} />
        {modalVisible && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 640, background: colors.white, border, boxShadow: shadow.xl, padding: 36, ...modal }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 40, marginBottom: 20 }}>Buka Shift</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                {["Pagi", "Siang", "Malam"].map((s, i) => (
                  <Chip key={s} label={s} bg={i === 0 ? colors.yellow : colors.white} size={24} />
                ))}
                <Chip label="08:00 – 16:00" bg={colors.white} size={24} style={{ fontFamily: fonts.mono }} />
              </div>
              <Field label="Modal awal" value={typed("Rp 200.000", frame, 62, 10)} mono focus={frame >= 62 && frame < MODAL_CLICK} />
              <NeoButton label="Buka Shift" pressedAt={MODAL_CLICK} size={30} style={{ width: "100%" }} />
            </div>
          </div>
        )}
        {/* info stok otomatis */}
        {frame >= stockAt && (
          <div style={{ position: "absolute", left: 90, bottom: 40, ...stock }}>
            <div style={{ background: colors.white, border, boxShadow: shadow.md, padding: "14px 22px", fontFamily: fonts.heading, fontWeight: 700, fontSize: 28, display: "flex", gap: 14, alignItems: "center" }}>
              <span>📦 Stok otomatis berkurang</span>
              <span style={{ fontFamily: fonts.mono }}>
                {getProduct(1).name}: {getProduct(1).stock} → {getProduct(1).stock - 2}
              </span>
            </div>
          </div>
        )}
      </AppWindow>
      <Cursor path={cursorPath} clicks={[MODAL_CLICK, ...picks.map((p) => p.at)]} />
      <Sfx name="pop" at={OPEN_START} volume={0.5} />
      <Sfx name="typing" at={62} frames={30} volume={0.5} />
      <Sfx name="click" at={MODAL_CLICK} volume={0.7} />
      <Sfx name="chime" at={MODAL_CLICK + 6} volume={0.4} />
      {picks.map((p, i) => (
        <Sfx key={i} name="pop" at={p.at} volume={0.7} />
      ))}
      <Sfx name="ding" at={stockAt} volume={0.4} />
    </SceneShell>
  );
};
void borderThin;
void rupiah;
