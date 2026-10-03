// ============================================================
// gen-vo.mjs, Membuat narasi PLACEHOLDER (TTS) per scene.
// Output: public/audio/vo/vo-s1.mp3 ... vo-s8.mp3
//
// PENTING: ini memakai Read Aloud API Microsoft Edge lewat paket npm
// `msedge-tts` (tidak resmi). Hanya untuk placeholder internal, BUKAN audio
// final untuk publikasi. Untuk versi final, ganti file vo-sN.mp3 dengan
// rekaman suara manusia / TTS berlisensi komersial (lihat CREDITS.md).
// ============================================================

import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { readFileSync, writeFileSync, mkdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";

const narration = JSON.parse(readFileSync("src/data/narration.json", "utf8"));
const outDir = path.resolve("public/audio/vo");
mkdirSync(outDir, { recursive: true });

const tts = new MsEdgeTTS();
await tts.setMetadata(narration.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
  sentenceBoundaryEnabled: true,
});

// Waktu mulai/selesai tiap kalimat (detik), dipakai supaya animasi pas dengan narasi
const timing = {};

for (const scene of narration.scenes) {
  const tmp = path.resolve(".remotion/tts-tmp", scene.id);
  mkdirSync(tmp, { recursive: true });
  const { audioFilePath, metadataFilePath } = await tts.toFile(tmp, scene.tts, { rate: narration.rate });
  const meta = JSON.parse(readFileSync(metadataFilePath, "utf8"));
  timing[scene.id] = (meta.Metadata ?? [])
    .filter((m) => m.Type === "SentenceBoundary")
    .map((m) => ({
      start: +(m.Data.Offset / 1e7).toFixed(2),
      end: +((m.Data.Offset + m.Data.Duration) / 1e7).toFixed(2),
      text: m.Data.text.Text,
    }));
  renameSync(audioFilePath, path.join(outDir, `vo-${scene.id}.mp3`));
  rmSync(tmp, { recursive: true, force: true });
  console.log(`vo-${scene.id}.mp3 OK`);
}

writeFileSync("src/data/vo-timing.json", JSON.stringify(timing, null, 2));
console.log("vo-timing.json OK");
