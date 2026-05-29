"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// ======================================================
// BarChart — Bar animasi yang tumbuh dari bawah saat mount
// ======================================================
const BarChart = () => {
  const [animated, setAnimated] = useState(false);
  const bars = [
    { day: "SEN", pct: 55 },
    { day: "SEL", pct: 42 },
    { day: "RAB", pct: 72 },
    { day: "KAM", pct: 48 },
    { day: "JUM", pct: 88, isTop: true },
    { day: "SAB", pct: 62 },
    { day: "MIN", pct: 50 },
  ];

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      position: "relative", height: "170px",
      border: "2px solid #0A0A0A", background: "#fff",
      padding: "14px 12px 28px",
      display: "flex", alignItems: "flex-end",
      justifyContent: "space-between", gap: "10px",
    }}>
      {bars.map((bar, i) => (
        <div key={bar.day} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", height: "100%", justifyContent: "flex-end",
          position: "relative", zIndex: 1,
        }}>
          {bar.isTop && (
            <div style={{
              position: "absolute", top: "-14px", left: "50%",
              transform: "translateX(-50%) rotate(-4deg)",
              background: "#FF3B3B", color: "#fff",
              border: "2px solid #0A0A0A",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800, fontSize: "9px",
              padding: "2px 6px", letterSpacing: ".06em",
              whiteSpace: "nowrap", boxShadow: "2px 2px 0 #0A0A0A",
              opacity: animated ? 1 : 0,
              transition: "opacity 0.3s 0.9s",
            }}>
              TERLARIS
            </div>
          )}
          <div style={{
            width: "100%",
            background: bar.isTop ? "#FFE500" : "#0A0A0A",
            border: "2px solid #0A0A0A",
            transformOrigin: "bottom",
            transform: animated ? `scaleY(${bar.pct / 100})` : "scaleY(0)",
            transition: `transform 0.9s cubic-bezier(.2,.9,.3,1.2) ${0.1 + i * 0.08}s`,
            height: "100%",
          }} />
          <div style={{
            position: "absolute", bottom: "-22px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px", fontWeight: 700, letterSpacing: ".04em",
          }}>
            {bar.day}
          </div>
        </div>
      ))}
    </div>
  );
};

// ======================================================
// AIChat — Animasi percakapan user → bot step by step
// ======================================================
const AIChat = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 2) return;
    const delay = step === 0 ? 1200 : 2000;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div style={{
      padding: "14px", minHeight: "120px",
      display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px",
    }}>
      {step >= 1 && (
        <div style={{
          alignSelf: "flex-end", padding: "8px 12px",
          background: "#FFE500", color: "#0A0A0A",
          border: "2px solid #FFE500", maxWidth: "88%", lineHeight: 1.4,
        }}>
          Produk apa paling laku minggu ini?
        </div>
      )}
      {step >= 2 && (
        <div style={{
          alignSelf: "flex-start", padding: "8px 12px",
          background: "transparent", color: "#fff",
          border: "2px solid #fff", maxWidth: "88%", lineHeight: 1.4,
        }}>
          <b style={{ color: "#FFE500" }}>Nasi Goreng Spesial</b> — 312 porsi,
          Rp 4,7jt. Bundle dengan Es Teh → +23% margin.
          <span style={{
            display: "inline-block", width: "8px", height: "14px",
            background: "#FFE500", verticalAlign: "-2px", marginLeft: "2px",
            animation: "blink 1s steps(2) infinite",
          }} />
        </div>
      )}
    </div>
  );
};

// ======================================================
// StampRays — 16 sinar berputar di sekitar stamp LUNAS
// ======================================================
const StampRays = ({ visible }) => (
  <div style={{
    position: "absolute",
    inset: "-12px",
    pointerEvents: "none",
    opacity: visible ? 1 : 0,
    transition: "opacity 0.3s",
    animation: visible ? "rayspin 6s linear infinite" : "none",
  }}>
    {Array.from({ length: 16 }, (_, i) => (
      <div key={i} style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: "2.5px",
        height: "14px",
        background: "#0A0A0A",
        transformOrigin: "50% -10px",
        transform: `rotate(${i * 22.5}deg)`,
      }} />
    ))}
  </div>
);

// ======================================================
// OrderTicker — Pesanan masuk berganti tiap 2 detik dengan slide
// ======================================================
const OrderTicker = () => {
  const orders = [
    { inv: "#3829", time: "2 mnt",   amt: "Rp 45.000", pay: "QRIS",     payBg: "#0066FF", payFg: "#fff" },
    { inv: "#3830", time: "barusan", amt: "Rp 25.000", pay: "Cash",     payBg: "#FFE500", payFg: "#0A0A0A" },
    { inv: "#3831", time: "5 mnt",   amt: "Rp 78.000", pay: "Transfer", payBg: "#00C27C", payFg: "#fff" },
  ];
  const [idx, setIdx] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % orders.length);
      setTick((k) => k + 1);
    }, 2200);
    return () => clearInterval(t);
  }, []);

  const o = orders[idx];
  return (
    <div style={{
      padding: "8px 12px", height: "80px", overflow: "hidden",
      display: "flex", alignItems: "center",
    }}>
      <div key={tick} style={{
        width: "100%", display: "flex", alignItems: "center",
        justifyContent: "space-between", gap: "6px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px", fontWeight: 600,
        animation: "tickerSlide 0.45s cubic-bezier(.2,.9,.3,1.2) both",
      }}>
        <span style={{ fontWeight: 700 }}>{o.inv}</span>
        <span style={{ color: "#9CA3AF", fontSize: "10px" }}>{o.time}</span>
        <span style={{ fontWeight: 700 }}>{o.amt}</span>
        <span style={{
          fontSize: "9px", padding: "1px 5px",
          border: "1.5px solid #0A0A0A",
          background: o.payBg, color: o.payFg,
          fontWeight: 700, letterSpacing: ".04em",
        }}>
          {o.pay}
        </span>
      </div>
    </div>
  );
};

// ======================================================
// HeroSection — Hero utama landing page
// ======================================================
export default function HeroSection() {
  const [stampVisible, setStampVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStampVisible(true), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section style={{ position: "relative", zIndex: 1 }}>
      <div className="hero-section-grid">

        {/* ============ LEFT: Copy ============ */}
        <div style={{ display: "flex", flexDirection: "column" }}>

          {/* Eyebrow — chip status dengan dot hijau berkedip */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "10px",
            background: "#fff", border: "2.5px solid #0A0A0A",
            padding: "8px 14px", boxShadow: "3px 3px 0 #0A0A0A",
            fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
            fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase",
            width: "fit-content", marginBottom: "24px",
          }}>
            <span className="hero-dot" />
            POS + AI ASSISTANT
          </div>

          {/* H1 — judul besar dengan highlight & strikethrough */}
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
            fontSize: "clamp(42px, 5.4vw, 82px)", lineHeight: 0.95,
            letterSpacing: "-.035em", marginBottom: "24px",
          }}>
            Kasir yang<br />
            <span style={{
              background: "#FFE500", padding: "2px 10px",
              display: "inline-block",
              boxShadow: "6px 6px 0 #0A0A0A",
              border: "2.5px solid #0A0A0A",
              transform: "rotate(-1.2deg)",
              margin: "8px 0",
            }}>
              ngerti bisnis
            </span>
            <br />
            kamu, bukan cuma<br />
            <span className="hero-strike">catat angka.</span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            maxWidth: "520px", fontSize: "18px", lineHeight: 1.55,
            color: "#222", marginBottom: "36px",
          }}>
            Kelola penjualan, stok, dan laporan di satu layar. Tanya AI Assistant
            langsung dalam Bahasa Indonesia —{" "}
            <b>"produk apa yang paling laku bulan ini?"</b>{" "}
            — dan dapat jawaban dalam hitungan detik.
          </p>

          {/* CTA Buttons */}
          <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/register" className="neo-hover" style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "16px",
              padding: "16px 24px", border: "2.5px solid #0A0A0A",
              background: "#FFE500", boxShadow: "5px 5px 0 #0A0A0A",
              textDecoration: "none", color: "#0A0A0A", display: "inline-block",
            }}>
              Mulai Jualan Sekarang →
            </Link>
            <a href="#cara-kerja" className="neo-hover" style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "16px",
              padding: "16px 24px", border: "2.5px solid #0A0A0A",
              background: "#fff", boxShadow: "5px 5px 0 #0A0A0A",
              textDecoration: "none", color: "#0A0A0A", display: "inline-block",
            }}>
              Lihat Demo Kasir
            </a>
          </div>

          {/* Proof Stats — angka dengan divider vertikal */}
          <div style={{ display: "flex", gap: "28px", marginTop: "48px", alignItems: "center", flexWrap: "wrap" }}>
            {[
              { num: "11%",      label: "Pajak otomatis" },
              null,
              { num: "5+",       label: "Metode Bayar" },
              null,
              { num: "PDF·XLSX", label: "Export Laporan" },
              null,
              { num: "24/7",     label: "AI Insight" },
            ].map((item, i) =>
              item === null ? (
                <div key={`d${i}`} style={{ width: "2.5px", height: "36px", background: "#0A0A0A", flexShrink: 0 }} />
              ) : (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <div style={{
                    fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
                    fontSize: "clamp(16px, 1.8vw, 26px)", letterSpacing: "-.02em",
                  }}>
                    {item.num}
                  </div>
                  <div style={{
                    fontSize: "11px", fontWeight: 600,
                    textTransform: "uppercase", letterSpacing: ".06em", color: "#555",
                  }}>
                    {item.label}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        {/* ============ RIGHT: Stage — collage animasi ============ */}
        <div className="hero-stage">

          {/* Dekorasi geometris */}
          <div style={{
            position: "absolute", width: "140px", height: "140px",
            background: "#FF7AB6", border: "2.5px solid #0A0A0A",
            top: 0, right: "8%", transform: "rotate(10deg)",
            boxShadow: "6px 6px 0 #0A0A0A",
          }} />
          <div style={{
            position: "absolute", width: "80px", height: "80px",
            background: "#0066FF", border: "2.5px solid #0A0A0A",
            bottom: "40px", right: 0, borderRadius: "50%",
            boxShadow: "5px 5px 0 #0A0A0A",
          }} />
          <div style={{
            position: "absolute", width: "60px", height: "60px",
            background: "#8B5CF6", border: "2.5px solid #0A0A0A",
            top: "48%", left: "-10px", transform: "rotate(-12deg)",
            boxShadow: "5px 5px 0 #0A0A0A",
          }} />

          {/* Ping dots dengan animasi ring */}
          <div className="hero-ping" style={{ top: "38%", left: "32%" }} />
          <div className="hero-ping" style={{ top: "18%", right: "36%" }} />

          {/* ---- Dashboard Window (rotasi -1.5deg) ---- */}
          <div style={{
            position: "absolute", top: "30px", left: "40px", width: "460px",
            background: "#fff", border: "2.5px solid #0A0A0A",
            boxShadow: "10px 10px 0 #0A0A0A",
            transform: "rotate(-1.5deg)",
          }}>
            {/* Titlebar macOS style */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", background: "#0A0A0A", color: "#fff",
              borderBottom: "2.5px solid #0A0A0A",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#FF3B3B", "#FFE500", "#00C27C"].map((c, i) => (
                  <span key={i} style={{
                    width: "11px", height: "11px", borderRadius: "50%",
                    border: "1.5px solid #fff", background: c, display: "block",
                  }} />
                ))}
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                background: "#222", border: "1.5px solid #555",
                padding: "3px 10px", color: "#ccc",
              }}>
                kasirai.id/dashboard
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                color: "#FFE500", fontWeight: 700, letterSpacing: ".06em",
              }}>
                ● LIVE
              </div>
            </div>

            {/* Dashboard Body */}
            <div style={{ padding: "18px" }}>
              <div style={{
                display: "flex", alignItems: "baseline",
                justifyContent: "space-between", marginBottom: "14px",
              }}>
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800, fontSize: "16px", letterSpacing: "-.02em",
                }}>
                  Penjualan Minggu Ini
                  <span style={{
                    display: "block",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px", fontWeight: 500, color: "#666",
                    textTransform: "uppercase", letterSpacing: ".06em", marginTop: "2px",
                  }}>
                    Senin 18 – Minggu 24 Mei
                  </span>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                  fontWeight: 700, background: "#00C27C", color: "#fff",
                  padding: "3px 8px", border: "1.5px solid #0A0A0A",
                  display: "inline-flex", alignItems: "center", gap: "4px",
                }}>
                  ↑ REALTIME
                </div>
              </div>

              {/* Stat Strip */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px", marginBottom: "16px",
              }}>
                {[
                  { label: "Revenue", val: "Rp 4,7jt", trend: "↑ 18%", bg: "#FFE500" },
                  { label: "Order",   val: "312",       trend: "↑ 12%", bg: "#FFFBEB" },
                  { label: "AOV",     val: "Rp 15k",    trend: "→ stabil", bg: "#F5F5F5", trendColor: "#0066FF" },
                ].map((s) => (
                  <div key={s.label} style={{ border: "2px solid #0A0A0A", padding: "8px 10px", background: s.bg }}>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                      fontWeight: 700, textTransform: "uppercase",
                      letterSpacing: ".06em", color: "#333",
                    }}>
                      {s.label}
                    </div>
                    <div style={{
                      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800,
                      fontSize: "18px", letterSpacing: "-.02em", marginTop: "2px",
                    }}>
                      {s.val}
                    </div>
                    <div style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                      fontWeight: 700, color: s.trendColor || "#00C27C", marginTop: "2px",
                    }}>
                      {s.trend}
                    </div>
                  </div>
                ))}
              </div>

              <BarChart />
            </div>
          </div>

          {/* ---- LUNAS Stamp (muncul setelah 1.6 detik) ---- */}
          <div style={{
            position: "absolute", top: "60px", right: "18%",
            width: "120px", height: "120px",
            display: "grid", placeItems: "center",
            background: "#00C27C", color: "#fff",
            border: "3px solid #0A0A0A", borderRadius: "50%",
            boxShadow: "6px 6px 0 #0A0A0A",
            transform: `rotate(-12deg) scale(${stampVisible ? 1 : 0})`,
            transition: "transform 0.55s cubic-bezier(.2,1.6,.3,1)",
            textAlign: "center",
            overflow: "visible",
          }}>
            <StampRays visible={stampVisible} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800, fontSize: "24px", letterSpacing: ".02em",
              }}>
                LUNAS
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px", fontWeight: 700, letterSpacing: ".1em", marginTop: "2px",
              }}>
                PAID · QRIS
              </div>
            </div>
          </div>

          {/* ---- Order Ticker (rotasi 4deg) ---- */}
          <div style={{
            position: "absolute", right: "-30px", top: "240px", width: "230px",
            background: "#fff", border: "2.5px solid #0A0A0A",
            boxShadow: "5px 5px 0 #0A0A0A",
            transform: "rotate(4deg)", overflow: "hidden",
          }}>
            <div style={{
              background: "#0A0A0A", color: "#FFE500", padding: "6px 10px",
              fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
              fontWeight: 700, letterSpacing: ".06em",
              display: "flex", alignItems: "center", gap: "6px",
            }}>
              <span className="hero-dot-red" />
              ORDER MASUK
            </div>
            <OrderTicker />
          </div>

          {/* ---- Stock Alert (rotasi -3deg) ---- */}
          <div style={{
            position: "absolute", bottom: "120px", right: "-10px", width: "200px",
            background: "#FF6B00", color: "#fff",
            border: "2.5px solid #0A0A0A", boxShadow: "5px 5px 0 #0A0A0A",
            padding: "10px 12px", transform: "rotate(-3deg)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <div style={{
              width: "34px", height: "34px", minWidth: "34px",
              background: "#fff", color: "#FF6B00",
              border: "2px solid #0A0A0A",
              display: "grid", placeItems: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800, fontSize: "18px",
              animation: "wob 1.4s ease-in-out infinite",
            }}>
              !
            </div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "13px", lineHeight: 1.2 }}>
              Stok Menipis
              <span style={{
                display: "block",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px", fontWeight: 500, opacity: 0.9, marginTop: "2px",
              }}>
                Es Kopi Susu · sisa 8
              </span>
            </div>
          </div>

          {/* ---- AI Chat Panel (rotasi 2.2deg, shadow kuning) ---- */}
          <div style={{
            position: "absolute", bottom: "18px", left: 0, width: "340px",
            background: "#0A0A0A", color: "#fff",
            border: "2.5px solid #0A0A0A",
            boxShadow: "8px 8px 0 #FFE500, 8px 8px 0 2.5px #0A0A0A",
            transform: "rotate(2.2deg)",
          }}>
            {/* Header panel */}
            <div style={{
              padding: "10px 14px", borderBottom: "2px solid #333",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                fontWeight: 700, letterSpacing: ".08em",
                textTransform: "uppercase", color: "#FFE500",
              }}>
                <span style={{
                  width: "8px", height: "8px", background: "#00C27C",
                  borderRadius: "50%", boxShadow: "0 0 8px #00C27C",
                  display: "inline-block",
                }} />
                AI Assistant
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "#888" }}>
                Groq · LLaMA 3.3
              </div>
            </div>

            <AIChat />

            {/* Footer dengan input prompt */}
            <div style={{
              padding: "8px 12px", borderTop: "2px solid #333",
              display: "flex", alignItems: "center", gap: "8px",
              background: "#1a1a1a",
            }}>
              <div style={{
                flex: 1, fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px", color: "#777",
                border: "1.5px solid #444", padding: "4px 8px", background: "#0a0a0a",
              }}>
                Tanya apa saja tentang bisnismu...
              </div>
              <div style={{
                background: "#FFE500", color: "#0A0A0A",
                border: "1.5px solid #FFE500", padding: "4px 8px",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800, fontSize: "10px", cursor: "pointer",
              }}>
                KIRIM →
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
