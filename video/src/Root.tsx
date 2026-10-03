import React from "react";
import { Composition, staticFile } from "remotion";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { DemoProps, SiKasirAIDemo } from "./SiKasirAIDemo";
import { DEFAULT_VO_SECONDS, SCENE_CONFIG, sceneFrames } from "./timing";
import { VIDEO } from "./theme";

const defaultFrames = sceneFrames(DEFAULT_VO_SECONDS);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="SiKasirAIDemo"
    component={SiKasirAIDemo}
    width={VIDEO.width}
    height={VIDEO.height}
    fps={VIDEO.fps}
    durationInFrames={defaultFrames.reduce((a, b) => a + b, 0)}
    defaultProps={{ sceneFrames: defaultFrames } satisfies DemoProps}
    // Durasi video = jumlah durasi scene; tiap scene mengikuti panjang file narasinya
    calculateMetadata={async () => {
      const secs: Record<string, number> = {};
      for (const c of SCENE_CONFIG) {
        secs[c.id] = await getAudioDurationInSeconds(staticFile(`audio/vo/vo-${c.id}.mp3`));
      }
      const frames = sceneFrames(secs);
      return { durationInFrames: frames.reduce((a, b) => a + b, 0), props: { sceneFrames: frames } };
    }}
  />
);
