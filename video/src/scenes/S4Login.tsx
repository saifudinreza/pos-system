// ============================================================
// S4Login, Demo masuk ke akun toko.
// Narasi: "Mulai cukup dengan masuk ke akun toko Anda. Aman, dan setiap toko punya datanya sendiri."
// ============================================================

import React from "react";
import { useCurrentFrame } from "remotion";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { useLand, useSpring } from "../lib/anim";
import { AppWindow, Chip, Cursor, NeoButton, SceneShell, Sfx, typed } from "../components/ui";
import { Field, LogoIcon } from "../components/AppMock";
import { SHOP } from "../data/demo";
import { beat } from "../timing";

export const S4Login: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const EMAIL_AT = 44;
  const PASS_AT = 100;
  const CLICK_AT = 150;
  const OK_AT = 172;
  const email = typed(SHOP.email, frame, EMAIL_AT, 15);
  const pass = typed("••••••••", frame, PASS_AT, 9);
  const loggedIn = frame >= OK_AT;
  const lock = beat("s4", 1);
  const welcome = useLand(OK_AT, { dy: 50, rot: -2 });
  const badge1 = useLand(lock + 4, { dy: 40, rot: -3 });
  const badge2 = useLand(lock + 16, { dy: 40, rot: 3 });

  return (
    <SceneShell id="s4" total={total}>
      <AppWindow url="sikasirai.com/login" start={6}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: colors.cream }}>
          {!loggedIn ? (
            <div style={{ width: 640, background: colors.white, border, boxShadow: shadow.lg, padding: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center", height: 70, marginBottom: 20 }}>
                <LogoIcon size={64} />
                <span style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 48 }}>KasirAI</span>
              </div>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 40, marginBottom: 6 }}>Masuk</div>
              <div style={{ fontFamily: fonts.heading, fontSize: 22, opacity: 0.6, marginBottom: 24 }}>Masukkan akun kamu untuk melanjutkan</div>
              <Field label="Email" value={email} placeholder="nama@email.com" focus={frame >= EMAIL_AT && frame < PASS_AT} caret={frame >= EMAIL_AT && frame < PASS_AT && Math.floor(frame / 8) % 2 === 0} mono />
              <Field label="Password" value={pass} placeholder="••••••••" focus={frame >= PASS_AT} caret={frame >= PASS_AT && frame < CLICK_AT && Math.floor(frame / 8) % 2 === 0} mono />
              <div style={{ textAlign: "right", fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, textDecoration: "underline", marginBottom: 20 }}>Lupa password?</div>
              <NeoButton label={frame >= CLICK_AT + 4 ? "Masuk..." : "Masuk →"} pressedAt={CLICK_AT} size={32} style={{ width: "100%" }} />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26, ...welcome }}>
              <div style={{ background: colors.green, border, boxShadow: shadow.lg, padding: "26px 50px", fontFamily: fonts.heading, fontWeight: 700, fontSize: 60 }}>
                ✓ Selamat datang, {SHOP.cashier}!
              </div>
              <div style={{ display: "flex", gap: 18 }}>
                <Chip label={`Toko: ${SHOP.name}`} bg={colors.yellow} size={34} />
                <Chip label="Role: Kasir" bg={colors.white} size={34} />
              </div>
            </div>
          )}
          {/* lencana keamanan */}
          {frame >= lock && (
            <div style={{ position: "absolute", right: 60, top: 140, display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={badge1}>
                <Chip label="🔒 Akun aman" bg={colors.white} size={34} style={{ boxShadow: shadow.md }} />
              </div>
              <div style={badge2}>
                <Chip label="🏪 Data tiap toko terpisah" bg={colors.pink} size={34} style={{ boxShadow: shadow.md }} />
              </div>
            </div>
          )}
        </div>
      </AppWindow>
      <Cursor
        path={[
          { f: 20, x: 1500, y: 800 },
          { f: 40, x: 980, y: 465 },
          { f: PASS_AT - 8, x: 980, y: 465 },
          { f: PASS_AT + 6, x: 980, y: 585 },
          { f: CLICK_AT - 14, x: 980, y: 585 },
          { f: CLICK_AT, x: 960, y: 718 },
          { f: OK_AT + 20, x: 1060, y: 760 },
        ]}
        clicks={[EMAIL_AT - 4, PASS_AT, CLICK_AT]}
      />
      <Sfx name="typing" at={EMAIL_AT} frames={Math.ceil(SHOP.email.length * 2)} volume={0.5} />
      <Sfx name="typing" at={PASS_AT} frames={30} volume={0.5} />
      <Sfx name="click" at={CLICK_AT} volume={0.7} />
      <Sfx name="chime" at={OK_AT} volume={0.5} />
      <Sfx name="pop" at={lock + 4} volume={0.4} />
      <Sfx name="pop" at={lock + 16} volume={0.4} />
    </SceneShell>
  );
};
void borderThin;
void useSpring;
