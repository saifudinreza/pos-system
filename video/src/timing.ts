// ============================================================
// timing.ts, Pengaturan durasi scene & sinkronisasi dengan narasi.
// - voStart: detik narasi mulai dalam scene (beri ruang animasi pembuka)
// - min: durasi minimal scene (detik). Durasi akhir = max(min, voStart + panjang narasi + tail)
// Waktu tiap kalimat narasi diambil dari data/vo-timing.json (hasil `npm run vo`).
// ============================================================

import voTiming from "./data/vo-timing.json";
import narration from "./data/narration.json";
import { VIDEO } from "./theme";

export type SceneId = "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8";

export const SCENE_CONFIG: { id: SceneId; voStart: number; min: number; tail: number }[] = [
  { id: "s1", voStart: 1.5, min: 12, tail: 1.5 },
  { id: "s2", voStart: 0.6, min: 21, tail: 1.2 },
  { id: "s3", voStart: 0.8, min: 11, tail: 1.2 },
  { id: "s4", voStart: 1.2, min: 14, tail: 1.5 },
  { id: "s5", voStart: 0.8, min: 18, tail: 1.5 },
  { id: "s6", voStart: 0.8, min: 20, tail: 1.5 },
  { id: "s7", voStart: 0.8, min: 25, tail: 1.5 },
  { id: "s8", voStart: 0.8, min: 15, tail: 3.5 },
];

export const configOf = (id: SceneId) => SCENE_CONFIG.find((s) => s.id === id)!;

/** Durasi scene dalam frame, dari durasi file narasi (detik) per scene. */
export const sceneFrames = (voSeconds: Record<string, number>) =>
  SCENE_CONFIG.map((c) => {
    const needed = c.voStart + (voSeconds[c.id] ?? 0) + c.tail;
    return Math.ceil(Math.max(c.min, needed) * VIDEO.fps);
  });

export const DEFAULT_VO_SECONDS: Record<string, number> = {
  s1: 8.7, s2: 18.2, s3: 8.5, s4: 9, s5: 13.2, s6: 15.7, s7: 18.8, s8: 10.5,
};

type Sentence = { start: number; end: number; text: string };
const timing = voTiming as Record<string, Sentence[]>;

/** Frame (relatif awal scene) saat kalimat ke-`idx` mulai diucapkan. */
export const beat = (id: SceneId, idx: number) => {
  const c = configOf(id);
  const s = timing[id]?.[idx];
  return Math.round(((s ? s.start : 0) + c.voStart) * VIDEO.fps);
};

/** Daftar caption (teks tampilan + rentang frame) untuk sebuah scene. */
export const captionsOf = (id: SceneId) => {
  const c = configOf(id);
  const display = (t: string) =>
    t
      .replace(/si kasir A I titik com/gi, "sikasirai.com")
      .replace(/Si Kasir A I/g, "KasirAI")
      .replace(/asisten A I/g, "asisten AI");
  return (timing[id] ?? []).map((s) => ({
    from: Math.round((c.voStart + s.start) * VIDEO.fps),
    to: Math.round((c.voStart + s.end) * VIDEO.fps) + 6,
    text: display(s.text),
  }));
};

export const NARRATION_SCENES = narration.scenes;
