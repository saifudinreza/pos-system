// ============================================================
// ui.tsx, Komponen dasar bergaya neobrutalism untuk video
// NeoCard, NeoButton, Chip, Caption, Wipe, AppWindow, Cursor,
// TypingText, Sfx, GridBg, SceneShell.
// ============================================================

import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { keys, progress, useLand, useSpring } from "../lib/anim";
import { beat, captionsOf, configOf, SceneId } from "../timing";

// ---------- SFX ----------
export const SFX_FILES = ["pop", "thump", "whoosh", "click", "tick", "chaching", "ding", "buzz", "chime", "typing"] as const;
export type SfxName = (typeof SFX_FILES)[number];

/** Memutar sound effect mulai frame `at` (relatif awal scene/Sequence induk). */
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number; frames?: number }> = ({
  name,
  at,
  volume = 0.8,
  frames,
}) => (
  <Sequence from={Math.max(0, at)} durationInFrames={frames} layout="none">
    <Audio src={staticFile(`audio/sfx/${name}.wav`)} volume={volume} />
  </Sequence>
);

// ---------- latar ----------
export const GridBg: React.FC<{ color?: string; line?: string }> = ({
  color = colors.cream,
  line = "rgba(10,10,10,0.07)",
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: color,
      backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
      backgroundSize: "60px 60px",
    }}
  />
);

// ---------- kartu & tombol ----------
export const NeoCard: React.FC<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
  bg?: string;
  sh?: keyof typeof shadow;
  thin?: boolean;
}> = ({ children, style, bg = colors.white, sh = "md", thin }) => (
  <div style={{ background: bg, border: thin ? borderThin : border, boxShadow: shadow[sh], ...style }}>{children}</div>
);

/** Tombol neobrutalism. `pressedAt`: frame saat ditekan (geser 4px, shadow hilang). */
export const NeoButton: React.FC<{
  label: string;
  bg?: string;
  color?: string;
  size?: number;
  pressedAt?: number;
  style?: React.CSSProperties;
}> = ({ label, bg = colors.yellow, color = colors.black, size = 28, pressedAt, style }) => {
  const frame = useCurrentFrame();
  const pressed = pressedAt !== undefined && frame >= pressedAt && frame < pressedAt + 8;
  return (
    <div
      style={{
        background: bg,
        color,
        border,
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: size,
        padding: `${size * 0.42}px ${size * 0.9}px`,
        textAlign: "center",
        boxShadow: pressed ? "0 0 0 #0A0A0A" : shadow.md,
        transform: pressed ? "translate(4px,4px)" : "none",
        ...style,
      }}
    >
      {label}
    </div>
  );
};

export const Chip: React.FC<{ label: string; bg?: string; color?: string; size?: number; style?: React.CSSProperties }> = ({
  label,
  bg = colors.yellow,
  color = colors.black,
  size = 22,
  style,
}) => (
  <span
    style={{
      display: "inline-block",
      background: bg,
      color,
      border: borderThin,
      fontFamily: fonts.heading,
      fontWeight: 700,
      fontSize: size,
      padding: `${size * 0.2}px ${size * 0.6}px`,
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {label}
  </span>
);

/** Pembungkus yang "mendarat" mulai frame `at`; aman dipakai di dalam render bersyarat. */
export const LandBox: React.FC<{ at: number; dx?: number; dy?: number; rot?: number; children: React.ReactNode }> = ({
  at,
  dx,
  dy,
  rot,
  children,
}) => {
  const st = useLand(at, { dx, dy, rot });
  return <div style={st}>{children}</div>;
};

// ---------- jendela aplikasi ----------
export const WINDOW = { x: 140, y: 30, w: 1640, h: 840, bar: 56 } as const;

/** Bingkai jendela browser gaya neobrutalism; isi aplikasi berukuran 1640 x 784. */
export const AppWindow: React.FC<{ url: string; children: React.ReactNode; start?: number; style?: React.CSSProperties }> = ({
  url,
  children,
  start = 0,
  style,
}) => {
  const land = useLand(start, { dy: 80, rot: 0 });
  return (
    <div
      style={{
        position: "absolute",
        left: WINDOW.x,
        top: WINDOW.y,
        width: WINDOW.w,
        height: WINDOW.h,
        border,
        boxShadow: shadow.xl,
        background: colors.cream,
        overflow: "hidden",
        ...land,
        ...style,
      }}
    >
      <div
        style={{
          height: WINDOW.bar,
          background: colors.yellow,
          borderBottom: border,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px",
        }}
      >
        {[colors.red, colors.orange, colors.green].map((c) => (
          <div key={c} style={{ width: 18, height: 18, borderRadius: 9, background: c, border: borderThin }} />
        ))}
        <div
          style={{
            marginLeft: 20,
            flex: 1,
            height: 34,
            background: colors.white,
            border: borderThin,
            fontFamily: fonts.mono,
            fontSize: 20,
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
          }}
        >
          {url}
        </div>
      </div>
      <div style={{ position: "relative", width: WINDOW.w - 6, height: WINDOW.h - WINDOW.bar - 6, overflow: "hidden" }}>{children}</div>
    </div>
  );
};

// ---------- teks ketik ----------
export const typed = (text: string, frame: number, start: number, cps = 14, fps = 30) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.floor(((frame - start) / fps) * cps))));

// ---------- kursor ----------
export type CursorKey = { f: number; x: number; y: number };

/** Kursor mouse animasi. Posisi di-interpolasi antar keyframe; `clicks` = frame klik. */
export const Cursor: React.FC<{ path: CursorKey[]; clicks?: number[] }> = ({ path, clicks = [] }) => {
  const frame = useCurrentFrame();
  const x = keys(frame, path.map((p) => [p.f, p.x] as [number, number]));
  const y = keys(frame, path.map((p) => [p.f, p.y] as [number, number]));
  const visible = frame >= path[0].f;
  const near = clicks.find((c) => frame >= c && frame < c + 12);
  const scale = near !== undefined && frame < near + 4 ? 0.85 : 1;
  return (
    <>
      {near !== undefined && (
        <div
          style={{
            position: "absolute",
            left: x - 30,
            top: y - 30,
            width: 60,
            height: 60,
            borderRadius: 30,
            border: `4px solid ${colors.black}`,
            opacity: 1 - (frame - near) / 12,
            transform: `scale(${0.5 + ((frame - near) / 12) * 1.2})`,
            zIndex: 99,
          }}
        />
      )}
      <svg
        width="44"
        height="44"
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x,
          top: y,
          zIndex: 100,
          opacity: visible ? 1 : 0,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          filter: "drop-shadow(3px 3px 0 rgba(10,10,10,0.35))",
        }}
      >
        <path d="M3 2 L3 19 L8 14.5 L11.5 22 L14.5 20.7 L11 13.5 L18 13.5 Z" fill={colors.white} stroke={colors.black} strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    </>
  );
};

// ---------- caption ----------
/** Caption gaya neobrutalism; teks mengikuti kalimat narasi. */
export const Captions: React.FC<{ id: SceneId }> = ({ id }) => {
  const frame = useCurrentFrame();
  const list = captionsOf(id);
  const cur = list.find((c) => frame >= c.from && frame < c.to);
  const p = useSpring(cur ? cur.from : 0, { damping: 16, stiffness: 220 });
  if (!cur) return null;
  const long = cur.text.length > 70;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 34,
        display: "flex",
        justifyContent: "center",
        zIndex: 60,
        transform: `translateY(${(1 - p) * 30}px)`,
        opacity: Math.min(1, p * 3),
      }}
    >
      <div
        style={{
          background: colors.white,
          border,
          boxShadow: shadow.md,
          padding: "14px 30px",
          maxWidth: 1560,
          textAlign: "center",
          textWrap: "balance",
          fontFamily: fonts.heading,
          fontWeight: 700,
          fontSize: long ? 38 : 46,
          lineHeight: 1.2,
          color: colors.black,
        }}
      >
        {cur.text}
      </div>
    </div>
  );
};

// ---------- wipe antar scene ----------
/** Blok kuning + garis hitam yang menyapu layar di awal (buka) dan akhir (tutup) scene. */
export const Wipe: React.FC<{ intro?: boolean; outro?: boolean; total: number }> = ({ intro = true, outro = true, total }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const D = 10;
  let x: number | null = null;
  if (intro && frame < D) x = progress(frame, 0, D) * width;
  else if (outro && frame > total - D) x = (progress(frame, total - D, total) - 1) * width;
  if (x === null) return null;
  return (
    <AbsoluteFill style={{ zIndex: 90, pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: 0, bottom: 0, left: x, width, background: colors.yellow, borderLeft: `14px solid ${colors.black}`, borderRight: `14px solid ${colors.black}` }} />
    </AbsoluteFill>
  );
};

// ---------- bungkus scene ----------
/** Pembungkus tiap scene: latar, narasi, caption, wipe. */
export const SceneShell: React.FC<{
  id: SceneId;
  total: number;
  children: React.ReactNode;
  bg?: React.ReactNode;
  intro?: boolean;
  outro?: boolean;
  captions?: boolean;
}> = ({ id, total, children, bg, intro = true, outro = true, captions = true }) => {
  const c = configOf(id);
  return (
    <AbsoluteFill style={{ fontFamily: fonts.heading, color: colors.black }}>
      {bg ?? <GridBg />}
      {children}
      {captions && <Captions id={id} />}
      <Sequence from={Math.round(c.voStart * 30)} layout="none">
        <Audio src={staticFile(`audio/vo/vo-${id}.mp3`)} volume={1} />
      </Sequence>
      {intro && <Sfx name="whoosh" at={0} volume={0.5} />}
      <Wipe intro={intro} outro={outro} total={total} />
    </AbsoluteFill>
  );
};

export { beat };
