// ============================================================
// anim.ts, Helper animasi berbasis frame (tanpa CSS animation)
// Semua animasi memakai useCurrentFrame() + spring()/interpolate()
// supaya sinkron dengan render Remotion.
// ============================================================

import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const ease = Easing.bezier(0.2, 0, 0, 1);

/** Spring "snappy" khas neobrutalism: cepat, overshoot kecil. Hasil 0..~1. */
export const useSpring = (start: number, opts?: { damping?: number; stiffness?: number; mass?: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - start,
    fps,
    config: { damping: opts?.damping ?? 13, stiffness: opts?.stiffness ?? 170, mass: opts?.mass ?? 0.7 },
  });
};

/** Interpolasi lewat daftar keyframe [frame, nilai], dengan clamp di ujung. */
export const keys = (frame: number, pts: [number, number][]) =>
  interpolate(
    frame,
    pts.map((p) => p[0]),
    pts.map((p) => p[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
  );

/** Progres linear 0..1 antara dua frame. */
export const progress = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/**
 * Efek "mendarat seperti stiker": slide + sedikit rotasi + skala,
 * mulai di frame `start`.
 */
export const useLand = (start: number, opts?: { dx?: number; dy?: number; rot?: number }) => {
  const p = useSpring(start);
  const dx = opts?.dx ?? 0;
  const dy = opts?.dy ?? 50;
  const rot = opts?.rot ?? -3;
  return {
    opacity: Math.min(1, p * 3),
    transform: `translate(${(1 - p) * dx}px, ${(1 - p) * dy}px) rotate(${(1 - p) * rot}deg) scale(${0.92 + 0.08 * p})`,
  } as const;
};

export const sec = (s: number, fps = 30) => Math.round(s * fps);
