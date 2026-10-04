// Render beberapa frame contoh untuk dicek tampilannya: node scripts/stills.mjs 90 960 1190
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import { mkdirSync } from "node:fs";

const frames = process.argv.slice(2).map(Number);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const comp = await selectComposition({ serveUrl, id: "KasirAIDemo" });
console.log("durasi:", comp.durationInFrames, "frame =", (comp.durationInFrames / comp.fps).toFixed(1), "detik; sceneFrames =", JSON.stringify(comp.props.sceneFrames));
mkdirSync("out/stills", { recursive: true });
for (const f of frames) {
  await renderStill({ composition: comp, serveUrl, frame: f, output: `out/stills/f${f}.png`, imageFormat: "png" });
  console.log("OK frame", f);
}
