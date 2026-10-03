// ============================================================
// gen-audio.mjs, Membuat musik latar & sound effect ORIGINAL lewat sintesis.
// Semua suara dibuat dari nol oleh script ini (gelombang sinus/noise),
// jadi tidak ada masalah lisensi pihak ketiga.
// Output: public/audio/music/bgm.wav, public/audio/sfx/*.wav
// ============================================================

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SR = 44100;
const TAU = Math.PI * 2;

// ---------- util ----------
function writeWav(file, samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write("RIFF", 0);
  data.writeUInt32LE(36 + samples.length * 2, 4);
  data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16);
  data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22);
  data.writeUInt32LE(SR, 24);
  data.writeUInt32LE(SR * 2, 28);
  data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34);
  data.write("data", 36);
  data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  }
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, data);
}
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

function add(dst, src, atSec, gain = 1) {
  const o = Math.floor(atSec * SR);
  for (let i = 0; i < src.length && o + i < dst.length; i++) dst[o + i] += src[i] * gain;
}
function normalize(b, peak = 0.85) {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  if (m > 0) for (let i = 0; i < b.length; i++) b[i] = (b[i] / m) * peak;
  return b;
}
function lowpass(b, cutoff) {
  const a = Math.exp((-TAU * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < b.length; i++) {
    y = (1 - a) * b[i] + a * y;
    b[i] = y;
  }
  return b;
}

// ---------- instrumen ----------
function kick() {
  const b = buf(0.28);
  let ph = 0;
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const f = 45 + 95 * Math.exp(-t * 28);
    ph += (TAU * f) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t * 11);
  }
  return b;
}
function hat() {
  const b = buf(0.07);
  let prev = 0;
  for (let i = 0; i < b.length; i++) {
    const n = rnd();
    b[i] = (n - prev) * Math.exp((-i / SR) * 70);
    prev = n;
  }
  return b;
}
function clap() {
  const b = buf(0.18);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    b[i] = rnd() * (Math.exp(-t * 28) + 0.6 * Math.exp(-((t - 0.02) ** 2) * 6000));
  }
  return lowpass(b, 6500);
}
function bassNote(freq, len) {
  const b = buf(len);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 80) * Math.exp(-t * 4);
    b[i] = (Math.sin(TAU * freq * t) + 0.35 * Math.sin(TAU * freq * 2 * t)) * env;
  }
  return b;
}
function pluck(freq, len = 0.28) {
  const b = buf(len);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 200) * Math.exp(-t * 11);
    const sq = Math.sign(Math.sin(TAU * freq * t)) * 0.5 + Math.sin(TAU * freq * 2.005 * t) * 0.3;
    b[i] = sq * env;
  }
  return lowpass(b, 3200);
}
function pad(freqs, len) {
  const b = buf(len);
  for (let i = 0; i < b.length; i++) {
    const t = i / SR;
    const env = Math.min(1, t * 3) * Math.min(1, (len - t) * 3);
    let s = 0;
    for (const f of freqs) s += Math.sin(TAU * f * t) + Math.sin(TAU * f * 1.004 * t);
    b[i] = (s / (freqs.length * 2)) * env;
  }
  return b;
}

// ---------- musik latar ----------
function music() {
  const BPM = 120;
  const beat = 60 / BPM;
  const bar = beat * 4;
  const BARS = 100; // 200 detik
  const out = buf(BARS * bar + 1);
  // C - Am - F - G (ceria): akar bass & nada akor
  const prog = [
    { root: 36, chord: [60, 64, 67] },
    { root: 33, chord: [57, 60, 64] },
    { root: 41, chord: [53, 57, 60] },
    { root: 43, chord: [55, 59, 62] },
  ];
  const K = kick();
  const H = hat();
  const C = clap();
  const arp = [0, 1, 2, 1, 0, 1, 2, 1, 2, 1, 0, 1, 2, 1, 0, 1];
  for (let n = 0; n < BARS; n++) {
    const p = prog[n % 4];
    const t0 = n * bar;
    add(out, pad(p.chord.map(midi), bar), t0, 0.22);
    for (let s = 0; s < 16; s++) {
      add(out, pluck(midi(p.chord[arp[s]] + 12)), t0 + (s * beat) / 4, n < 2 ? 0.2 : 0.26);
    }
    if (n >= 2) {
      for (let q = 0; q < 4; q++) add(out, K, t0 + q * beat, 0.9);
      for (let e = 0; e < 8; e++) add(out, H, t0 + (e * beat) / 2 + beat / 4, 0.16);
      for (let e = 0; e < 8; e++) {
        add(out, bassNote(midi(p.root), beat / 2), t0 + (e * beat) / 2, e % 2 ? 0.34 : 0.5);
      }
    }
    if (n >= 6) {
      add(out, C, t0 + beat, 0.45);
      add(out, C, t0 + 3 * beat, 0.45);
    }
  }
  const fade = 4 * SR; // fade-out 4 detik terakhir
  for (let i = 0; i < fade; i++) {
    const idx = out.length - fade + i;
    if (idx >= 0) out[idx] *= 1 - i / fade;
  }
  return normalize(out, 0.8);
}

// ---------- sound effect ----------
const sfx = {
  pop() {
    const b = buf(0.12);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      ph += (TAU * (700 * Math.exp(-t * 18) + 180)) / SR;
      b[i] = Math.sin(ph) * Math.exp(-t * 28);
    }
    return b;
  },
  thump() {
    const b = buf(0.35);
    let ph = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      ph += (TAU * (45 + 110 * Math.exp(-t * 22))) / SR;
      b[i] = Math.sin(ph) * Math.exp(-t * 9) + rnd() * Math.exp(-t * 90) * 0.4;
    }
    return b;
  },
  whoosh() {
    const b = buf(0.6);
    let y = 0;
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const env = Math.sin(Math.PI * Math.min(1, t / 0.6)) ** 1.6;
      const a = Math.exp((-TAU * (300 + 5200 * (t / 0.6))) / SR);
      y = (1 - a) * rnd() + a * y;
      b[i] = y * env * 3;
    }
    return b;
  },
  click() {
    const b = buf(0.06);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] = (rnd() * 0.6 + Math.sin(TAU * 1800 * t)) * Math.exp(-t * 90);
    }
    return b;
  },
  tick() {
    const b = buf(0.03);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] = (rnd() * 0.7 + Math.sin(TAU * 2600 * t) * 0.3) * Math.exp(-t * 160) * 0.7;
    }
    return b;
  },
  typing() {
    // rentetan ketikan keyboard (±13 ketukan per detik, 2,4 detik)
    const b = buf(2.4);
    for (let k = 0; k < 30; k++) {
      const t0 = k * 0.075 + Math.abs(rnd()) * 0.02;
      const f = 2200 + Math.abs(rnd()) * 900;
      for (let i = 0; i < 0.03 * SR; i++) {
        const t = i / SR;
        const idx = Math.floor(t0 * SR) + i;
        if (idx < b.length) b[idx] += (rnd() * 0.7 + Math.sin(TAU * f * t) * 0.3) * Math.exp(-t * 160) * 0.7;
      }
    }
    return b;
  },
  chaching() {
    const b = buf(0.9);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      const hit = rnd() * Math.exp(-t * 60) * 0.6;
      const ring =
        (Math.sin(TAU * 2093 * t) + Math.sin(TAU * 3136 * t) * 0.8 + Math.sin(TAU * 4186 * t) * 0.4) *
        Math.exp(-t * 5);
      const t2 = t - 0.12;
      const second =
        t2 > 0 ? (Math.sin(TAU * 2637 * t2) + Math.sin(TAU * 3951 * t2) * 0.6) * Math.exp(-t2 * 5) : 0;
      b[i] = hit + ring * 0.5 + second * 0.5;
    }
    return b;
  },
  ding() {
    const b = buf(0.9);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] = (Math.sin(TAU * 1318 * t) + 0.5 * Math.sin(TAU * 1975 * t)) * Math.exp(-t * 6) * Math.min(1, t * 300);
    }
    return b;
  },
  buzz() {
    const b = buf(0.3);
    for (let i = 0; i < b.length; i++) {
      const t = i / SR;
      b[i] =
        Math.sign(Math.sin(TAU * 110 * t)) * 0.5 * Math.exp(-t * 7) +
        Math.sign(Math.sin(TAU * 117 * t)) * 0.3 * Math.exp(-t * 7);
    }
    return lowpass(b, 1800);
  },
  chime() {
    const b = buf(1.2);
    [523.25, 659.25, 783.99, 1046.5].forEach((f, k) => {
      const s = k * 0.09;
      for (let i = 0; i < b.length; i++) {
        const t = i / SR - s;
        if (t < 0) continue;
        b[i] += Math.sin(TAU * f * t) * Math.exp(-t * 4.5) * 0.4;
      }
    });
    return b;
  },
};

const root = path.resolve("public/audio");
writeWav(path.join(root, "music/bgm.wav"), music());
for (const [name, fn] of Object.entries(sfx)) {
  writeWav(path.join(root, `sfx/${name}.wav`), normalize(fn(), 0.8));
}
console.log("Audio dibuat di public/audio (bgm.wav + " + Object.keys(sfx).length + " sfx)");
