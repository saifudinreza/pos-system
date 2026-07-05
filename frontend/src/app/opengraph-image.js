import { readFileSync } from "fs";
import { join } from "path";
import { ImageResponse } from "next/og";

// Generate saat request (Node.js runtime) — baca font langsung dari disk,
// tidak bergantung resolusi URL relatif yang bermasalah di beberapa environment.
export const dynamic = "force-dynamic";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "KasirAI — Kasir yang Ngerti Bisnis Kamu";

export default async function Image() {
  const fontData = readFileSync(join(process.cwd(), "src/app/_og-font.ttf"));

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFBEB",
          fontFamily: "Space Grotesk",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* Kotak shadow (efek neobrutalism: offset hitam di belakang kotak kuning) */}
          <div style={{ display: "flex", position: "relative" }}>
            <div
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 120,
                height: 120,
                backgroundColor: "#0A0A0A",
                borderRadius: 20,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                backgroundColor: "#FFE500",
                border: "6px solid #0A0A0A",
                borderRadius: 20,
                fontSize: 68,
                fontWeight: 700,
                color: "#0A0A0A",
              }}
            >
              K
            </div>
          </div>

          <div style={{ display: "flex", fontSize: 88, fontWeight: 700, letterSpacing: -3 }}>
            <span style={{ color: "#0A0A0A" }}>Kasir</span>
            <span style={{ color: "#FFE500" }}>AI</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 40,
            fontSize: 34,
            fontWeight: 700,
            color: "#0A0A0A",
            textAlign: "center",
            maxWidth: 880,
          }}
        >
          Kasir yang ngerti bisnis kamu, bukan cuma catat angka.
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 22,
            fontWeight: 600,
            color: "#0A0A0A",
            opacity: 0.55,
          }}
        >
          POS + AI Assistant · Coba Gratis 14 Hari
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Space Grotesk",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
