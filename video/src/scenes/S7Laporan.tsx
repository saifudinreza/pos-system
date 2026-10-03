// ============================================================
// S7Laporan, Demo dashboard, laporan laba kotor, export, dan asisten AI.
// Narasi: "Di akhir hari, lihat ringkasan penjualan, produk terlaris, sampai laba kotor Anda.
//          Laporan bisa diunduh ke PDF atau Excel. Bingung membaca angka? Tanyakan saja ke asisten AI."
// ============================================================

import React from "react";
import { useCurrentFrame } from "remotion";
import { border, borderThin, colors, fonts, shadow } from "../theme";
import { progress, useLand } from "../lib/anim";
import { AppWindow, Chip, Cursor, NeoButton, SceneShell, Sfx, typed } from "../components/ui";
import { BarList, LineChart, LogoIcon, SideNav, StatCard } from "../components/AppMock";
import { AI_QA, MONTH, REPORT, rupiah, TOP_PRODUCTS, TREND_7D } from "../data/demo";
import { beat } from "../timing";

export const S7Laporan: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const REPORT_AT = 215; // pindah ke halaman laporan (kata "laba kotor")
  const EXPORT_AT = beat("s7", 1);
  const PDF_CLICK = EXPORT_AT + 36;
  const XLS_CLICK = EXPORT_AT + 78;
  const AI_AT = beat("s7", 2);
  const ASK_AT = beat("s7", 3);
  const ANS_AT = ASK_AT + 86;

  const onReport = frame >= REPORT_AT;
  const stat = [useLand(24, { dy: 40, rot: -2 }), useLand(32, { dy: 40, rot: 2 }), useLand(40, { dy: 40, rot: -2 }), useLand(48, { dy: 40, rot: 2 })];
  const prof = [useLand(REPORT_AT + 6, { dy: 40, rot: -2 }), useLand(REPORT_AT + 14, { dy: 40, rot: 2 }), useLand(REPORT_AT + 22, { dy: 40, rot: -2 })];
  const ai = useLand(AI_AT, { dx: 500, dy: 0, rot: 0 });
  const file1 = useLand(PDF_CLICK + 4, { dy: 30, rot: -3 });
  const file2 = useLand(XLS_CLICK + 4, { dy: 30, rot: 3 });
  const question = typed(AI_QA.question, frame, ASK_AT, 15);
  const answer = typed(AI_QA.answer, frame, ANS_AT, 110);

  return (
    <SceneShell id="s7" total={total}>
      <AppWindow url={onReport ? "sikasirai.com/reports" : "sikasirai.com/dashboard"} start={0}>
        <div style={{ display: "flex", height: "100%" }}>
          <SideNav active={onReport ? "Laporan" : "Dashboard"} />
          <div style={{ flex: 1, padding: 26, display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }}>
            {!onReport ? (
              <>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38 }}>Dashboard</div>
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: 1, ...stat[0] }}><StatCard label="Pendapatan Bulan Ini" value={rupiah(MONTH.revenue)} bg={colors.yellow} icon="💰" /></div>
                  <div style={{ flex: 1, ...stat[1] }}><StatCard label="Pesanan Bulan Ini" value={MONTH.orders.toLocaleString("id-ID")} icon="🧾" /></div>
                  <div style={{ flex: 1, ...stat[2] }}><StatCard label="Stok Hampir Habis" value="3" bg={colors.orange} icon="⚠️" /></div>
                  <div style={{ flex: 1, ...stat[3] }}><StatCard label="Total Customer" value="248" icon="👥" /></div>
                </div>
                <div style={{ display: "flex", gap: 22, flex: 1, minHeight: 0 }}>
                  <div style={{ flex: 1.5, background: colors.white, border, boxShadow: shadow.md, padding: 18 }}>
                    <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, marginBottom: 6 }}>Tren Penjualan 7 Hari</div>
                    <LineChart data={TREND_7D} w={640} h={330} draw={progress(frame, 60, 150)} />
                  </div>
                  <div style={{ flex: 1, background: colors.white, border, boxShadow: shadow.md, padding: 18 }}>
                    <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, marginBottom: 14 }}>Produk Terlaris</div>
                    <BarList items={TOP_PRODUCTS} w={420} grow={progress(frame, 110, 170)} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38 }}>Laporan Penjualan <span style={{ fontSize: 26, opacity: 0.6 }}>· 7 hari terakhir</span></div>
                  <div style={{ display: "flex", gap: 14 }}>
                    <NeoButton label="⬇ PDF" bg={colors.white} size={24} pressedAt={PDF_CLICK} />
                    <NeoButton label="⬇ Excel" bg={colors.green} size={24} pressedAt={XLS_CLICK} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 18 }}>
                  <div style={{ flex: 1, ...prof[0] }}><StatCard label="Total Pendapatan" value={rupiah(REPORT.revenue)} bg={colors.yellow} /></div>
                  <div style={{ flex: 1, ...prof[1] }}><StatCard label="Harga Pokok (COGS)" value={rupiah(REPORT.cogs)} /></div>
                  <div style={{ flex: 1, ...prof[2] }}><StatCard label="Laba Kotor" value={rupiah(REPORT.profit)} bg={colors.green} /></div>
                </div>
                <div style={{ display: "flex", gap: 18, alignItems: "stretch" }}>
                  <div style={{ background: colors.white, border, boxShadow: shadow.md, padding: "16px 22px", flex: 1, fontFamily: fonts.heading, fontWeight: 700, fontSize: 28 }}>
                    Margin Laba <span style={{ fontFamily: fonts.mono, background: colors.pink, border: borderThin, padding: "0 12px", marginLeft: 10 }}>{REPORT.margin}%</span>
                    <div style={{ fontFamily: fonts.mono, fontSize: 19, opacity: 0.6, fontWeight: 500, marginTop: 6 }}>Laba kotor = pendapatan − COGS</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", minWidth: 420 }}>
                    {frame >= PDF_CLICK + 4 && (
                      <div style={file1}><Chip label="📄 laporan-penjualan.pdf ✓" bg={colors.white} size={24} style={{ boxShadow: shadow.sm }} /></div>
                    )}
                    {frame >= XLS_CLICK + 4 && (
                      <div style={file2}><Chip label="📊 laporan-penjualan.xlsx ✓" bg={colors.green} size={24} style={{ boxShadow: shadow.sm }} /></div>
                    )}
                  </div>
                </div>
                <div style={{ background: colors.white, border, boxShadow: shadow.md, padding: 18, flex: 1, minHeight: 0 }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 24, marginBottom: 6 }}>Tren Penjualan</div>
                  <LineChart data={TREND_7D} w={1180} h={230} draw={1} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* sidebar AI */}
        {frame >= AI_AT && (
          <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 520, background: colors.white, borderLeft: border, padding: 24, display: "flex", flexDirection: "column", gap: 16, ...ai }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <LogoIcon size={48} />
              <div>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28 }}>KasirAI Assistant</div>
                <div style={{ fontFamily: fonts.mono, fontSize: 16, opacity: 0.6 }}>Tanya apa saja soal tokomu</div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14, justifyContent: "flex-start" }}>
              {frame >= ASK_AT && (
                <div style={{ alignSelf: "flex-end", background: colors.yellow, border: borderThin, padding: "12px 16px", fontFamily: fonts.heading, fontWeight: 700, fontSize: 24, maxWidth: 420 }}>{question}</div>
              )}
              {frame >= ANS_AT && (
                <div style={{ alignSelf: "flex-start", background: colors.cream, border: borderThin, padding: "14px 16px", fontFamily: fonts.heading, fontSize: 23, lineHeight: 1.35, maxWidth: 440 }}>{answer}</div>
              )}
            </div>
            <div style={{ border, background: colors.white, padding: "12px 16px", fontFamily: fonts.heading, fontSize: 22, opacity: 0.45 }}>Tanya ke AI...</div>
          </div>
        )}
      </AppWindow>

      <Cursor
        path={[
          { f: 150, x: 1500, y: 900 },
          { f: REPORT_AT - 24, x: 1500, y: 900 },
          { f: REPORT_AT - 6, x: 200, y: 448 },
          { f: REPORT_AT, x: 200, y: 448 },
          { f: PDF_CLICK - 20, x: 1500, y: 700 },
          { f: PDF_CLICK, x: 1352, y: 168 },
          { f: XLS_CLICK, x: 1500, y: 168 },
          { f: XLS_CLICK + 40, x: 1400, y: 500 },
          { f: ASK_AT - 10, x: 1400, y: 500 },
          { f: ASK_AT, x: 1420, y: 800 },
        ]}
        clicks={[REPORT_AT, PDF_CLICK, XLS_CLICK]}
      />
      {[24, 32, 40, 48].map((a) => (
        <Sfx key={a} name="pop" at={a} volume={0.4} />
      ))}
      <Sfx name="whoosh" at={60} volume={0.3} />
      <Sfx name="click" at={REPORT_AT} volume={0.6} />
      {[REPORT_AT + 6, REPORT_AT + 14, REPORT_AT + 22].map((a) => (
        <Sfx key={a} name="pop" at={a} volume={0.4} />
      ))}
      <Sfx name="click" at={PDF_CLICK} volume={0.6} />
      <Sfx name="click" at={XLS_CLICK} volume={0.6} />
      <Sfx name="chime" at={PDF_CLICK + 4} volume={0.35} />
      <Sfx name="chime" at={XLS_CLICK + 4} volume={0.35} />
      <Sfx name="whoosh" at={AI_AT} volume={0.4} />
      <Sfx name="typing" at={ASK_AT} frames={90} volume={0.5} />
      <Sfx name="ding" at={ANS_AT} volume={0.6} />
    </SceneShell>
  );
};
