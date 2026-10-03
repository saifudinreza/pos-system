// ============================================================
// S6Transaksi, Demo pembayaran tunai, QRIS, dan struk ke WhatsApp.
// Narasi: "Pembeli bisa membayar tunai, kembaliannya langsung dihitung. Atau bayar digital
//          lewat QRIS dan dompet digital. Setelah lunas, struk dikirim otomatis ke WhatsApp pelanggan."
// ============================================================

import React from "react";
import { useCurrentFrame } from "remotion";
import { border, colors, fonts, shadow } from "../theme";
import { progress, useLand, useSpring } from "../lib/anim";
import { AppWindow, Chip, Cursor, LandBox, NeoButton, SceneShell, Sfx, typed } from "../components/ui";
import { KasirScreen } from "./KasirScreen";
import { Field, PhoneChat, QrCode, Receipt, Row } from "../components/AppMock";
import { CASH_PAID, CHANGE, rupiah, TOTAL } from "../data/demo";
import { beat } from "../timing";

const FULL_CART = [
  { productId: 1, qty: 2, visible: true },
  { productId: 4, qty: 1, visible: true },
];

export const S6Transaksi: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const CASH_OPEN = 12;
  const TYPE_AT = 52;
  const CHANGE_AT = 100;
  const PROC_CLICK = 148;
  const RECEIPT_AT = PROC_CLICK + 8;
  const QRIS_AT = beat("s6", 1); // kalimat 2
  const PAID_AT = QRIS_AT + 92;
  const WA_AT = beat("s6", 2); // kalimat 3

  const showCashModal = frame >= CASH_OPEN && frame < QRIS_AT - 8;
  const showReceipt = frame >= RECEIPT_AT && frame < QRIS_AT - 8;
  const showQris = frame >= QRIS_AT && frame < WA_AT - 6;
  const showWA = frame >= WA_AT;

  const cashModal = useLand(CASH_OPEN, { dy: 60, rot: -2 });
  const receipt = useLand(RECEIPT_AT, { dx: 200, dy: 20, rot: 5 });
  const qris = useLand(QRIS_AT, { dy: 60, rot: 2 });
  const paid = useSpring(PAID_AT, { damping: 10, stiffness: 240 });
  const chg = useSpring(CHANGE_AT);
  const phone = useLand(WA_AT, { dx: 400, dy: 0, rot: 6 });
  const bubble = progress(frame, WA_AT + 40, WA_AT + 52);
  const lunas = useLand(WA_AT + 6, { dx: -200, dy: 0, rot: -4 });

  return (
    <SceneShell id="s6" total={total}>
      <AppWindow url="sikasirai.com/kasir" start={0}>
        <KasirScreen lines={FULL_CART} frame={frame} payPressedAt={CASH_OPEN - 4} />
        {(showCashModal || showQris) && <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.55)" }} />}

        {/* modal bayar tunai */}
        {showCashModal && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingRight: showReceipt ? 700 : 0, transition: "none" }}>
            <div style={{ width: 620, background: colors.white, border, boxShadow: shadow.xl, padding: 34, ...cashModal }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38, marginBottom: 14 }}>Bayar Tunai</div>
              <div style={{ background: colors.yellow, border, padding: "12px 18px", marginBottom: 18, fontFamily: fonts.mono, fontSize: 28 }}>
                <Row k="Total Bayar" v={rupiah(TOTAL)} bold big />
              </div>
              <Field label="Uang diterima" value={typed("Rp 100.000", frame, TYPE_AT, 11)} mono focus={frame >= TYPE_AT && frame < PROC_CLICK} />
              {frame >= CHANGE_AT && (
                <div style={{ background: colors.green, border, padding: "12px 18px", marginBottom: 18, fontFamily: fonts.mono, transform: `scale(${0.9 + 0.1 * chg})`, opacity: Math.min(1, chg * 3) }}>
                  <Row k="Kembalian" v={rupiah(CHANGE)} bold big />
                </div>
              )}
              <NeoButton label="Proses Bayar" pressedAt={PROC_CLICK} size={30} style={{ width: "100%" }} />
            </div>
          </div>
        )}

        {/* struk */}
        {showReceipt && (
          <div style={{ position: "absolute", right: 90, top: 70, ...receipt }}>
            <Receipt paidLabel="Tunai" paid={CASH_PAID} change={CHANGE} />
          </div>
        )}

        {/* modal QRIS */}
        {showQris && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 760, background: colors.white, border, boxShadow: shadow.xl, padding: 34, display: "flex", gap: 34, ...qris }}>
              <div>
                <div style={{ border, padding: 12, background: colors.white }}>
                  <QrCode size={300} />
                </div>
                <div style={{ textAlign: "center", marginTop: 12 }}>
                  <Chip label="QRIS" bg={colors.red} color={colors.white} size={30} />
                </div>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36 }}>Bayar Digital</div>
                <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 40, background: colors.yellow, border, padding: "6px 12px" }}>{rupiah(TOTAL)}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  {["QRIS", "GoPay", "OVO", "Virtual Account", "Kartu Kredit"].map((m, i) => {
                    return (
                      <LandBox key={m} at={QRIS_AT + 18 + i * 6} dy={24}>
                        <Chip label={m} bg={colors.white} size={22} />
                      </LandBox>
                    );
                  })}
                </div>
                {frame >= PAID_AT ? (
                  <div style={{ background: colors.green, border, boxShadow: shadow.md, padding: "14px 18px", fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, transform: `scale(${0.8 + 0.2 * paid})` }}>
                    ✓ Pembayaran berhasil
                  </div>
                ) : (
                  <div style={{ fontFamily: fonts.heading, fontSize: 24, opacity: 0.6 }}>Menunggu pembayaran… scan dengan aplikasi apa pun</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WhatsApp */}
        {showWA && (
          <>
            <div style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.55)" }} />
            <div style={{ position: "absolute", left: 160, top: 120, ...lunas }}>
              <Receipt paidLabel="QRIS" paid={TOTAL} />
            </div>
            <div style={{ position: "absolute", right: 140, top: 4, ...phone }}>
              <div style={{ transform: "scale(0.96)", transformOrigin: "top center" }}>
                <PhoneChat showMsg={bubble} typingDots={bubble < 1} />
              </div>
            </div>
            <div style={{ position: "absolute", left: 640, top: 330, ...lunas }}>
              <Chip label="Struk terkirim otomatis →" bg={colors.yellow} size={34} style={{ boxShadow: shadow.md }} />
            </div>
          </>
        )}
      </AppWindow>

      <Cursor
        path={[
          { f: 0, x: 1500, y: 900 },
          { f: CASH_OPEN - 4, x: 1560, y: 810 },
          { f: TYPE_AT - 6, x: 960, y: 560 },
          { f: PROC_CLICK - 14, x: 960, y: 560 },
          { f: PROC_CLICK, x: 940, y: 800 },
          { f: PROC_CLICK + 24, x: 1100, y: 840 },
          { f: QRIS_AT + 140, x: 1100, y: 840 },
        ]}
        clicks={[CASH_OPEN - 4, PROC_CLICK]}
      />
      <Sfx name="click" at={CASH_OPEN - 4} volume={0.6} />
      <Sfx name="pop" at={CASH_OPEN} volume={0.5} />
      <Sfx name="typing" at={TYPE_AT} frames={30} volume={0.5} />
      <Sfx name="pop" at={CHANGE_AT} volume={0.5} />
      <Sfx name="click" at={PROC_CLICK} volume={0.7} />
      <Sfx name="chaching" at={RECEIPT_AT} volume={0.8} />
      <Sfx name="pop" at={QRIS_AT} volume={0.5} />
      <Sfx name="chime" at={PAID_AT} volume={0.6} />
      <Sfx name="ding" at={WA_AT + 40} volume={0.7} />
      <Sfx name="pop" at={WA_AT} volume={0.5} />
    </SceneShell>
  );
};
