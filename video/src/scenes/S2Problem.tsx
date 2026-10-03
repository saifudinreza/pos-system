// ============================================================
// S2Problem, Masalah toko manual: kartu-kartu menumpuk lalu ditandai silang.
// Narasi: tiga kalimat (catatan tercecer, stok habis, kas tidak cocok).
// ============================================================

import React from "react";
import { useCurrentFrame } from "remotion";
import { border, colors, fonts, shadow } from "../theme";
import { useLand, useSpring } from "../lib/anim";
import { SceneShell, Sfx } from "../components/ui";
import { beat } from "../timing";

const CARDS = [
  { emoji: "📒", title: "Catatan tercecer", sub: "Nota dan kertas ada di mana-mana", x: 110, y: 250, r: -4, bg: colors.white },
  { emoji: "📦", title: "Stok habis tanpa sadar", sub: "Baru tahu saat pembeli bertanya", x: 690, y: 290, r: 3, bg: colors.yellow },
  { emoji: "💸", title: "Uang kas tidak cocok", sub: "Selisih di akhir hari, bingung sebabnya", x: 1250, y: 240, r: -2, bg: colors.white },
  { emoji: "⏳", title: "Waktu terbuang", sub: "Hitung manual, bukan melayani pelanggan", x: 640, y: 580, r: 2, bg: colors.pink },
];

export const S2Problem: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const s2 = beat("s2", 1); // kalimat tentang tiga masalah
  const s3 = beat("s2", 2); // "Semuanya menyita waktu..."
  const appear = [s2 + 4, s2 + 80, s2 + 160, s3 + 4];
  const stampAt = [s3 + 100, s3 + 112, s3 + 124, s3 + 136];
  const head = useLand(8, { dy: -50, rot: 2 });

  return (
    <SceneShell id="s2" total={total}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 55, textAlign: "center", fontFamily: fonts.heading, fontWeight: 700, fontSize: 92, ...head }}>
        Ngurus toko manual itu <span style={{ background: colors.yellow, border, padding: "0 16px" }}>ribet</span>
      </div>
      {CARDS.map((c, i) => {
        const land = useLand(appear[i], { dx: i % 2 ? 160 : -160, dy: 70, rot: c.r * 3 });
        const stamp = useSpring(stampAt[i], { damping: 10, stiffness: 260 });
        const wobble = frame > stampAt[i] ? Math.sin((frame - stampAt[i]) / 2) * (1 - Math.min(1, (frame - stampAt[i]) / 12)) * 3 : 0;
        return (
          <div key={c.title} style={{ position: "absolute", left: c.x, top: c.y, width: 560, height: 250, zIndex: 10 - i, ...land }}>
            <div style={{ transform: `rotate(${c.r + wobble}deg)`, width: "100%", height: "100%" }}>
              <div style={{ width: "100%", height: "100%", background: c.bg, border, boxShadow: shadow.lg, padding: "26px 30px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 76, lineHeight: 1 }}>{c.emoji}</div>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38 }}>{c.title}</div>
                <div style={{ fontFamily: fonts.heading, fontSize: 25, opacity: 0.7 }}>{c.sub}</div>
              </div>
              {/* tanda silang merah */}
              <div
                style={{
                  position: "absolute",
                  right: -22,
                  top: -26,
                  width: 120,
                  height: 120,
                  background: colors.red,
                  border,
                  boxShadow: shadow.md,
                  color: colors.white,
                  fontFamily: fonts.heading,
                  fontWeight: 700,
                  fontSize: 100,
                  lineHeight: "108px",
                  textAlign: "center",
                  transform: `scale(${stamp}) rotate(${(1 - stamp) * 40}deg)`,
                  opacity: frame >= stampAt[i] ? 1 : 0,
                }}
              >
                ✕
              </div>
            </div>
          </div>
        );
      })}
      {appear.map((a, i) => (
        <Sfx key={`t${i}`} name="thump" at={a + 6} volume={0.7} />
      ))}
      {stampAt.map((a, i) => (
        <Sfx key={`b${i}`} name="buzz" at={a} volume={0.5} />
      ))}
    </SceneShell>
  );
};
