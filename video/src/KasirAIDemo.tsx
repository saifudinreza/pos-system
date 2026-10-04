// ============================================================
// KasirAIDemo.tsx, Menyusun 8 scene berurutan + musik latar.
// Durasi tiap scene dihitung di Root.tsx (calculateMetadata) dari panjang narasi.
// ============================================================

import React from "react";
import { Audio, Series, staticFile, interpolate, useVideoConfig } from "remotion";
import { S1Intro } from "./scenes/S1Intro";
import { S2Problem } from "./scenes/S2Problem";
import { S3Solution } from "./scenes/S3Solution";
import { S4Login } from "./scenes/S4Login";
import { S5Kasir } from "./scenes/S5Kasir";
import { S6Transaksi } from "./scenes/S6Transaksi";
import { S7Laporan } from "./scenes/S7Laporan";
import { S8Outro } from "./scenes/S8Outro";

export type DemoProps = { sceneFrames: number[] };

const SCENES = [S1Intro, S2Problem, S3Solution, S4Login, S5Kasir, S6Transaksi, S7Laporan, S8Outro];
// Volume musik per scene: lebih keras di intro/outro, pelan (ducking) saat narasi
const MUSIC_LEVEL = [0.34, 0.16, 0.2, 0.15, 0.15, 0.15, 0.15, 0.3];

export const KasirAIDemo: React.FC<DemoProps> = ({ sceneFrames }) => {
  const { durationInFrames } = useVideoConfig();

  // Titik-titik volume: tahan level scene, ubah halus di sekitar batas scene
  const starts: number[] = [];
  sceneFrames.reduce((acc, f) => (starts.push(acc), acc + f), 0);
  const inputs: number[] = [];
  const outputs: number[] = [];
  sceneFrames.forEach((f, i) => {
    inputs.push(starts[i] + 14, starts[i] + f - 14);
    outputs.push(MUSIC_LEVEL[i], MUSIC_LEVEL[i]);
  });
  const musicVolume = (frame: number) => {
    const v = interpolate(frame, inputs, outputs, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
    const fadeOut = interpolate(frame, [durationInFrames - 75, durationInFrames], [1, 0], { extrapolateLeft: "clamp" });
    return v * fadeIn * fadeOut;
  };

  return (
    <>
      <Series>
        {SCENES.map((Scene, i) => (
          <Series.Sequence key={i} durationInFrames={sceneFrames[i]}>
            <Scene total={sceneFrames[i]} />
          </Series.Sequence>
        ))}
      </Series>
      <Audio src={staticFile("audio/music/bgm.wav")} volume={musicVolume} />
    </>
  );
};
