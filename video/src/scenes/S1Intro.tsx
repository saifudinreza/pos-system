// ============================================================
// S1Intro, Pembuka: blok kuning menyapu, logo "mendarat", tagline per kata.
// Narasi: "Kenalkan, KasirAI. Aplikasi kasir pintar untuk UMKM Indonesia."
// ============================================================

import React from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { border, colors, fonts, shadow } from "../theme";
import { keys, progress, useLand, useSpring } from "../lib/anim";
import { Chip, GridBg, SceneShell, Sfx } from "../components/ui";
import { beat } from "../timing";

const Floaters: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    { x: 130, y: 150, s: 90, c: colors.pink, r: 12, sq: true },
    { x: 1700, y: 190, s: 70, c: colors.green, r: -8, sq: false },
    { x: 220, y: 700, s: 60, c: colors.blue, r: 20, sq: false },
    { x: 1650, y: 640, s: 100, c: colors.purple, r: -15, sq: true },
    { x: 960, y: 70, s: 50, c: colors.orange, r: 30, sq: true },
  ];
  return (
    <>
      {items.map((it, i) => {
        const p = useSpring(30 + i * 5);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: it.x,
              top: it.y + Math.sin((frame + i * 20) / 22) * 14,
              width: it.s,
              height: it.s,
              background: it.c,
              border,
              boxShadow: shadow.md,
              borderRadius: it.sq ? 0 : it.s,
              transform: `rotate(${it.r + frame * (i % 2 ? 0.2 : -0.2)}deg) scale(${p})`,
            }}
          />
        );
      })}
    </>
  );
};

export const S1Intro: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const logo = useLand(20, { dy: 140, rot: -5 });
  const words = ["Kasir", "pintar", "untuk", "UMKM", "Indonesia"];
  const t0 = beat("s1", 1);
  const sweepX = keys(frame, [
    [0, 0],
    [20, 1920],
  ]);
  const chipDelay = t0 + 20;

  return (
    <SceneShell id="s1" total={total} intro={false} bg={<GridBg />}>
      <Floaters />
      {/* logo */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 150, display: "flex", justifyContent: "center", ...logo }}>
        <div style={{ background: colors.white, border, boxShadow: shadow.xl, padding: "10px 30px", width: 880 }}>
          <img src={staticFile("logo/logo-primary.png")} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
      {/* tagline per kata */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 650, display: "flex", justifyContent: "center", gap: 22, flexWrap: "wrap" }}>
        {words.map((w, i) => {
          const p = useSpring(t0 + i * 5);
          return (
            <span
              key={w}
              style={{
                fontFamily: fonts.heading,
                fontWeight: 700,
                fontSize: 78,
                transform: `translateY(${(1 - p) * 40}px)`,
                opacity: Math.min(1, p * 3),
                background: i === 3 ? colors.yellow : "transparent",
                border: i === 3 ? border : "3px solid transparent",
                padding: "0 14px",
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {/* stiker fitur */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 800, display: "flex", justifyContent: "center", gap: 22 }}>
        {[
          ["Kasir", colors.yellow],
          ["Stok", colors.green],
          ["Laporan", colors.pink],
          ["AI Assistant", colors.blue],
        ].map(([l, c], i) => {
          const st = useLand(chipDelay + i * 6, { dy: 40, rot: i % 2 ? 4 : -4 });
          return (
            <div key={l} style={st}>
              <Chip label={l} bg={c} color={c === colors.blue ? colors.white : colors.black} size={34} />
            </div>
          );
        })}
      </div>
      {/* sapuan blok kuning pembuka */}
      <AbsoluteFill style={{ zIndex: 80, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: sweepX, width: 1920, background: colors.yellow, borderLeft: `14px solid ${colors.black}` }} />
      </AbsoluteFill>
      <Sfx name="thump" at={26} volume={0.9} />
      <Sfx name="pop" at={t0} volume={0.5} />
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} name="pop" at={chipDelay + i * 6} volume={0.35} />
      ))}
    </SceneShell>
  );
};
void progress;
