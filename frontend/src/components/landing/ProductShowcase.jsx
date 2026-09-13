"use client";

// ============================================================
// ProductShowcase.jsx — Realistic 3D Device Showcase
//
// Menampilkan 3 scene device realistis 3D:
// 1. iPhone 17 Pro — Kasir mobile dengan Dynamic Island, scanner laser, dan cart
// 2. iPad Pro — Tablet counter stand dengan dashboard analitik real-time
// 3. Komputer Kasir Retail — Terminal POS Indomaret/Alfamart lengkap dengan
//    Customer Pole Display VFD, thermal receipt printer, barcode scanner, dan cash drawer.
//
// Dilengkapi interaktif mouse-tilt parallax 3D dan 100% icon SVG tajam (Lucide React),
// tanpa emoji dan tanpa AI-slop graphics.
// ============================================================

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  Tablet,
  Store,
  ScanBarcode,
  Receipt,
  CreditCard,
  TrendingUp,
  ShieldCheck,
  Zap,
  Wifi,
  Battery,
  ShoppingBag,
  Users,
  Search,
  CheckCircle2,
  Printer,
  Sparkles,
} from "lucide-react";

// ======================================================
// 1. iPhone 17 Pro Screen — Mobile Cashier
// ======================================================
const IphoneScreen = () => {
  const [scanned, setScanned] = useState(false);
  const [items, setItems] = useState([
    { name: "Nasi Goreng Spesial", qty: 1, price: "18.000", tag: "FAVORIT" },
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => setScanned(true), 1200);
    const t2 = setTimeout(() => {
      setItems((prev) => [
        ...prev,
        { name: "Es Teh Manis Jumbo", qty: 2, price: "10.000", tag: "MINUMAN" },
      ]);
    }, 2200);
    const t3 = setTimeout(() => {
      setItems((prev) => [
        ...prev,
        { name: "Kerupuk Kaleng", qty: 2, price: "4.000", tag: "SNACK" },
      ]);
    }, 3200);

    const loop = setInterval(() => {
      setScanned(false);
      setItems([{ name: "Nasi Goreng Spesial", qty: 1, price: "18.000", tag: "FAVORIT" }]);
      setTimeout(() => setScanned(true), 1200);
      setTimeout(() => {
        setItems((prev) => [
          ...prev,
          { name: "Es Teh Manis Jumbo", qty: 2, price: "10.000", tag: "MINUMAN" },
        ]);
      }, 2200);
      setTimeout(() => {
        setItems((prev) => [
          ...prev,
          { name: "Kerupuk Kaleng", qty: 2, price: "4.000", tag: "SNACK" },
        ]);
      }, 3200);
    }, 6000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearInterval(loop);
    };
  }, []);

  const total = items.length === 1 ? "18.000" : items.length === 2 ? "28.000" : "32.000";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FAF9F5" }}>
      {/* iOS Status Bar */}
      <div
        style={{
          padding: "36px 16px 8px",
          background: "#0A0A0A",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          fontWeight: 700,
        }}
      >
        <span style={{ letterSpacing: "0.5px" }}>09:41</span>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Wifi size={10} color="#00C27C" />
          <span style={{ fontSize: "8px", color: "#FFE500" }}>5G</span>
          <Battery size={12} color="#fff" />
        </div>
      </div>

      {/* App Header */}
      <div
        style={{
          padding: "8px 12px",
          background: "#FFE500",
          borderBottom: "2px solid #0A0A0A",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div
            style={{
              width: "16px",
              height: "16px",
              background: "#0A0A0A",
              display: "grid",
              placeItems: "center",
              borderRadius: "3px",
            }}
          >
            <Zap size={10} color="#FFE500" />
          </div>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "11px",
              fontWeight: 800,
              color: "#0A0A0A",
            }}
          >
            Kasir Mobile
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            fontWeight: 700,
            background: "#0A0A0A",
            color: "#00C27C",
            padding: "2px 6px",
            borderRadius: "2px",
          }}
        >
          MEJA 04
        </span>
      </div>

      {/* Barcode Camera Scanner Viewfinder */}
      <div
        style={{
          margin: "8px",
          height: "85px",
          background: "#111114",
          border: "2px solid #0A0A0A",
          borderRadius: "6px",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {/* Laser line */}
        {!scanned && <div className="barcode-laser-line" />}

        {/* Viewfinder reticle brackets */}
        <div
          style={{
            width: "60px",
            height: "45px",
            border: "2px dashed rgba(255,229,0,0.8)",
            borderRadius: "4px",
            display: "grid",
            placeItems: "center",
          }}
        >
          <ScanBarcode size={22} color={scanned ? "#00C27C" : "#FFE500"} />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "4px",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            fontWeight: 700,
            color: scanned ? "#00C27C" : "#aaa",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {scanned ? (
            <>
              <CheckCircle2 size={10} color="#00C27C" />
              <span>PRODUK TERDETEKSI: POCARI SWEAT</span>
            </>
          ) : (
            <span>ARAHKAN KAMERA KE BARCODE PRODUK...</span>
          )}
        </div>
      </div>

      {/* Cart Items List */}
      <div style={{ flex: 1, padding: "0 8px", overflow: "hidden" }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            fontWeight: 700,
            color: "#666",
            marginBottom: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Daftar Pesanan ({items.length})
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -16, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                style={{
                  padding: "6px 8px",
                  background: "#fff",
                  border: "1.5px solid #0A0A0A",
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700,
                      fontSize: "10px",
                      color: "#0A0A0A",
                    }}
                  >
                    {item.name}
                  </div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "2px" }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "7px",
                        background: "#FFFBEB",
                        border: "1px solid #FFE500",
                        padding: "1px 4px",
                        fontWeight: 700,
                      }}
                    >
                      {item.tag}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "8px",
                        color: "#888",
                      }}
                    >
                      x{item.qty}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontWeight: 800,
                    fontSize: "10px",
                    color: "#0A0A0A",
                  }}
                >
                  Rp {item.price}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Total & Checkout Bar */}
      <div
        style={{
          padding: "8px",
          background: "#fff",
          borderTop: "2px solid #0A0A0A",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "6px",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "9px",
              fontWeight: 700,
              color: "#555",
            }}
          >
            TOTAL TAGIHAN
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              color: "#0A0A0A",
            }}
          >
            Rp {total}
          </span>
        </div>

        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background: "#FFE500",
            border: "2px solid #0A0A0A",
            borderRadius: "4px",
            padding: "7px",
            textAlign: "center",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: "10px",
            boxShadow: "2px 2px 0 #0A0A0A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            cursor: "pointer",
          }}
        >
          <CreditCard size={12} />
          <span>BAYAR via QRIS / CASH</span>
        </motion.div>
      </div>
    </div>
  );
};

// ======================================================
// 2. iPad Pro Screen — Counter Tablet Dashboard
// ======================================================
const IpadScreen = () => {
  const [chartBars, setChartBars] = useState([42, 60, 38, 75, 90, 68, 52]);
  const [revenue, setRevenue] = useState("4.85");

  useEffect(() => {
    const t = setInterval(() => {
      setChartBars((prev) =>
        prev.map((v) => Math.max(25, Math.min(95, v + (Math.random() - 0.4) * 14)))
      );
      setRevenue((prev) => {
        const val = parseFloat(prev) + (Math.random() - 0.3) * 0.25;
        return Math.max(4.0, Math.min(6.5, val)).toFixed(2);
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const days = ["SEN", "SEL", "RAB", "KAM", "JUM", "SAB", "MIN"];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#FDFDFD" }}>
      {/* iPad Top Navigation */}
      <div
        style={{
          padding: "8px 14px",
          background: "#0A0A0A",
          color: "#fff",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #FFE500",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "20px",
              height: "20px",
              background: "#FFE500",
              border: "1.5px solid #0A0A0A",
              display: "grid",
              placeItems: "center",
              borderRadius: "4px",
            }}
          >
            <Zap size={12} color="#0A0A0A" />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                color: "#FFE500",
                lineHeight: 1.1,
              }}
            >
              SiKasir POS · iPad Pro
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7px",
                color: "#aaa",
              }}
            >
              Outlet Senopati · Shift Pagi (08:00 - 16:00)
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px",
              fontWeight: 700,
              color: "#00C27C",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                background: "#00C27C",
                borderRadius: "50%",
                boxShadow: "0 0 6px #00C27C",
              }}
            />
            ONLINE SYNC
          </span>
        </div>
      </div>

      {/* Main Grid: Left Stats & Chart, Right Orders */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1.7fr 1.1fr", gap: "8px", padding: "8px" }}>
        {/* Left Column: KPI Metrics + Sales Chart */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* 3 Metric Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
            {[
              {
                label: "Omset Hari Ini",
                val: `Rp ${revenue}jt`,
                trend: "↑ 18.4%",
                icon: TrendingUp,
                bg: "#FFE500",
              },
              {
                label: "Transaksi",
                val: "142 Struk",
                trend: "↑ 12.1%",
                icon: Receipt,
                bg: "#FFFBEB",
              },
              {
                label: "Rata-rata Order",
                val: "Rp 34.1k",
                trend: "↑ 6.8%",
                icon: ShoppingBag,
                bg: "#F0FFF4",
              },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  border: "1.5px solid #0A0A0A",
                  background: k.bg,
                  padding: "6px 8px",
                  borderRadius: "4px",
                  boxShadow: "2px 2px 0 #0A0A0A",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "7px",
                      fontWeight: 700,
                      color: "#666",
                      textTransform: "uppercase",
                    }}
                  >
                    {k.label}
                  </span>
                  <k.icon size={10} color="#0A0A0A" />
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    fontSize: "12px",
                    color: "#0A0A0A",
                    margin: "2px 0",
                  }}
                >
                  {k.val}
                </div>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    fontWeight: 700,
                    color: "#00C27C",
                  }}
                >
                  {k.trend} vs kemarin
                </span>
              </div>
            ))}
          </div>

          {/* Weekly Sales Chart */}
          <div
            style={{
              flex: 1,
              border: "1.5px solid #0A0A0A",
              background: "#fff",
              padding: "8px",
              borderRadius: "4px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "9px",
                  color: "#0A0A0A",
                }}
              >
                Tren Penjualan Mingguan
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "7.5px",
                  fontWeight: 700,
                  color: "#888",
                }}
              >
                7 Hari Terakhir
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "flex-end",
                gap: "6px",
                paddingBottom: "14px",
                position: "relative",
              }}
            >
              {chartBars.map((pct, i) => {
                const isMax = pct === Math.max(...chartBars);
                return (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "flex-end",
                      position: "relative",
                    }}
                  >
                    <motion.div
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      style={{
                        width: "100%",
                        background: isMax ? "#FFE500" : "#0A0A0A",
                        border: "1.5px solid #0A0A0A",
                        borderRadius: "2px 2px 0 0",
                        minHeight: "6px",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: "-14px",
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "6.5px",
                        fontWeight: 700,
                        color: isMax ? "#0A0A0A" : "#888",
                      }}
                    >
                      {days[i]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live Orders Queue */}
        <div
          style={{
            border: "1.5px solid #0A0A0A",
            background: "#fff",
            borderRadius: "4px",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "6px",
              paddingBottom: "4px",
              borderBottom: "1.5px solid #eee",
            }}
          >
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "9px",
              }}
            >
              Pesanan Masuk
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "7px",
                background: "#00C27C",
                color: "#fff",
                padding: "1px 4px",
                fontWeight: 700,
                borderRadius: "2px",
              }}
            >
              LIVE
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            {[
              { id: "#108", item: "2x Kopi Susu Aren", price: "44.000", status: "SIAP", color: "#00C27C" },
              { id: "#107", item: "1x Toast Srikaya", price: "28.000", status: "PROSES", color: "#FFE500" },
              { id: "#106", item: "3x Matcha Latte", price: "84.000", status: "LUNAS", color: "#0A0A0A" },
            ].map((o) => (
              <div
                key={o.id}
                style={{
                  border: "1px solid #ddd",
                  padding: "4px 6px",
                  borderRadius: "3px",
                  background: "#FAF9F5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "7.5px",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{o.id}</div>
                  <div style={{ color: "#555" }}>{o.item}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>Rp {o.price}</div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "6.5px",
                      fontWeight: 800,
                      background: o.color === "#FFE500" ? "#FFE500" : o.color === "#00C27C" ? "#00C27C" : "#0A0A0A",
                      color: o.color === "#FFE500" ? "#0A0A0A" : "#fff",
                      padding: "1px 3px",
                      borderRadius: "2px",
                    }}
                  >
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "6px",
              background: "#FFE500",
              border: "1.5px solid #0A0A0A",
              padding: "4px",
              textAlign: "center",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "8px",
              cursor: "pointer",
            }}
          >
            BUKA TRANSAKSI BARU →
          </div>
        </div>
      </div>
    </div>
  );
};

// ======================================================
// 3. Retail POS Kasir Computer (Indomaret / Alfamart Style)
// ======================================================
const RetailPosScreen = () => {
  const [items, setItems] = useState([
    { no: "1", code: "89927611", name: "INDOMIE GOR SPCL 85G", qty: 5, price: "3.100", total: "15.500" },
    { no: "2", code: "89913892", name: "POCARI SWEAT CAN 330ML", qty: 2, price: "7.500", total: "15.000" },
    { no: "3", code: "89980091", name: "ULTRA MILK CHOCO 200ML", qty: 3, price: "5.000", total: "15.000" },
  ]);

  useEffect(() => {
    const t1 = setTimeout(() => {
      setItems((prev) => [
        ...prev,
        { no: "4", code: "89931755", name: "MINYAK GOR TROPICAL 2L", qty: 1, price: "29.000", total: "29.000" },
      ]);
    }, 2000);

    const loop = setInterval(() => {
      setItems([
        { no: "1", code: "89927611", name: "INDOMIE GOR SPCL 85G", qty: 5, price: "3.100", total: "15.500" },
        { no: "2", code: "89913892", name: "POCARI SWEAT CAN 330ML", qty: 2, price: "7.500", total: "15.000" },
        { no: "3", code: "89980091", name: "ULTRA MILK CHOCO 200ML", qty: 3, price: "5.000", total: "15.000" },
      ]);
      setTimeout(() => {
        setItems((prev) => [
          ...prev,
          { no: "4", code: "89931755", name: "MINYAK GOR TROPICAL 2L", qty: 1, price: "29.000", total: "29.000" },
        ]);
      }, 2000);
    }, 7000);

    return () => {
      clearTimeout(t1);
      clearInterval(loop);
    };
  }, []);

  const totalBelanja = items.length === 3 ? "45.500" : "74.500";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#ffffff" }}>
      {/* Top Header - Authentic Minimarket Kasir Bar */}
      <div
        style={{
          background: "#0A0A0A",
          color: "#fff",
          padding: "5px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #FFE500",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Store size={12} color="#FFE500" />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "10px",
              color: "#FFE500",
            }}
          >
            SIKASIR RETAIL POS
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7px",
              color: "#aaa",
              marginLeft: "4px",
            }}
          >
            v2.4
          </span>
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "7.5px",
            color: "#fff",
            display: "flex",
            gap: "10px",
          }}
        >
          <span>KASIR: 01 (DEVI)</span>
          <span>SHIFT: 1</span>
          <span style={{ color: "#00C27C", fontWeight: 700 }}>● TERKONEKSI</span>
        </div>
      </div>

      {/* Member Barcode Banner */}
      <div
        style={{
          background: "#FFFBEB",
          borderBottom: "1.5px solid #0A0A0A",
          padding: "4px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Users size={10} color="#0A0A0A" />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px",
              fontWeight: 700,
              color: "#0A0A0A",
            }}
          >
            MEMBER: 0812-9876-XXXX (POIN: 350)
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            background: "#fff",
            border: "1px solid #0A0A0A",
            padding: "2px 6px",
            borderRadius: "2px",
          }}
        >
          <Search size={8} color="#666" />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              color: "#333",
            }}
          >
            SCAN [ 89931755 ]
          </span>
        </div>
      </div>

      {/* Grocery Items Table */}
      <div style={{ flex: 1, padding: "4px 8px", overflow: "hidden" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "7.5px",
          }}
        >
          <thead>
            <tr style={{ background: "#f0f0eb", borderBottom: "1.5px solid #0A0A0A" }}>
              <th style={{ padding: "3px 4px", textAlign: "left" }}>NO</th>
              <th style={{ padding: "3px 4px", textAlign: "left" }}>BARCODE</th>
              <th style={{ padding: "3px 4px", textAlign: "left" }}>NAMA BARANG</th>
              <th style={{ padding: "3px 4px", textAlign: "center" }}>QTY</th>
              <th style={{ padding: "3px 4px", textAlign: "right" }}>HARGA</th>
              <th style={{ padding: "3px 4px", textAlign: "right" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, idx) => (
              <tr
                key={it.name}
                style={{
                  borderBottom: "1px solid #e5e5e5",
                  background: idx === items.length - 1 && items.length === 4 ? "#FFFDE6" : "transparent",
                  fontWeight: idx === items.length - 1 && items.length === 4 ? 700 : 500,
                }}
              >
                <td style={{ padding: "3px 4px" }}>{it.no}</td>
                <td style={{ padding: "3px 4px", color: "#666" }}>{it.code}</td>
                <td style={{ padding: "3px 4px" }}>{it.name}</td>
                <td style={{ padding: "3px 4px", textAlign: "center" }}>{it.qty}</td>
                <td style={{ padding: "3px 4px", textAlign: "right" }}>{it.price}</td>
                <td style={{ padding: "3px 4px", textAlign: "right", fontWeight: 700 }}>{it.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Big Brutalist Total Display (Khas Mesin Kasir Ritel) */}
      <div
        style={{
          background: "#FFE500",
          borderTop: "2.5px solid #0A0A0A",
          padding: "6px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              fontWeight: 800,
              color: "#0A0A0A",
              textTransform: "uppercase",
            }}
          >
            TOTAL BELANJA ({items.length} ITEM)
          </div>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "16px",
              fontWeight: 900,
              color: "#0A0A0A",
              letterSpacing: "-0.5px",
            }}
          >
            Rp {totalBelanja}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7px",
              color: "#444",
            }}
          >
            PPN 11% SUDAH TERMASUK
          </span>
          <span
            style={{
              background: "#0A0A0A",
              color: "#FFE500",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7.5px",
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: "2px",
              marginTop: "2px",
            }}
          >
            TEKAN [F5] BAYAR
          </span>
        </div>
      </div>

      {/* Hotkey Shortcuts Bar */}
      <div
        style={{
          background: "#0A0A0A",
          color: "#fff",
          padding: "4px 8px",
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "6.5px",
          fontWeight: 700,
        }}
      >
        <span>[F1] CARI</span>
        <span>[F2] MEMBER</span>
        <span>[F3] DISKON</span>
        <span>[F4] HOLD</span>
        <span>[F5] BAYAR</span>
        <span>[F12] CETAK</span>
      </div>
    </div>
  );
};

// ======================================================
// Scene Configs
// ======================================================
const SCENES = [
  {
    id: "mobile",
    name: "Smartphone (Mobile)",
    title: "Kasir Keliling di Genggaman",
    description: "Pelayan bisa catat pesanan meja & terima bayar QRIS langsung di depan pembeli.",
    Icon: Smartphone,
  },
  {
    id: "tablet",
    name: "Tablet (iPad / Android)",
    title: "Display Meja Kasir Modern",
    description: "Sempurna untuk counter kafe & resto. Kelola shift kasir dan pantau antrean.",
    Icon: Tablet,
  },
  {
    id: "retail",
    name: "Komputer Kasir (POS Ritel)",
    title: "Standar Kasir Minimarket",
    description: "Dukungan penuh barcode scanner laser, customer display, dan printer struk thermal.",
    Icon: Store,
  },
];

// ======================================================
// Main Component: ProductShowcase
// ======================================================
export default function ProductShowcase() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);

  // Auto-rotate scene setiap 7 detik jika user tidak sedang hover
  useEffect(() => {
    if (isHovered) return;
    const t = setInterval(() => {
      setActiveIdx((i) => (i + 1) % SCENES.length);
    }, 7000);
    return () => clearInterval(t);
  }, [isHovered]);

  // Mouse Parallax 3D calculation
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -18, y: x * 22 });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const activeScene = SCENES[activeIdx];

  return (
    <section
      style={{
        padding: "96px 24px",
        background: "#FFFBEB",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* Background Decorative Matrix Grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(10,10,10,0.06) 1px, transparent 0)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }}
      />

      {/* Header Section */}
      <div style={{ maxWidth: "860px", margin: "0 auto", textAlign: "center", marginBottom: "48px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "#0A0A0A",
              color: "#FFE500",
              border: "2px solid #0A0A0A",
              padding: "6px 14px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              marginBottom: "20px",
              boxShadow: "3px 3px 0 #FFE500",
            }}
          >
            <Sparkles size={13} color="#FFE500" />
            <span>FLEKSIBEL DI SEGALA PERANGKAT</span>
          </div>

          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(28px, 4.2vw, 48px)",
              lineHeight: 1.15,
              letterSpacing: "-.03em",
              marginBottom: "16px",
            }}
          >
            Bebas Pakai Perangkat Apa Saja,{" "}
            <span
              style={{
                background: "#FFE500",
                padding: "2px 10px",
                border: "2.5px solid #0A0A0A",
                display: "inline-block",
                boxShadow: "4px 4px 0 #0A0A0A",
              }}
            >
              Dari HP Hingga Mesin Kasir Ritel
            </span>
          </h2>

          <p
            style={{
              fontSize: "16px",
              color: "#555",
              fontWeight: 500,
              lineHeight: 1.6,
              maxWidth: "640px",
              margin: "0 auto",
            }}
          >
            Hemat modal usaha Anda. SiKasir AI berjalan mulus di smartphone pelayan untuk jemput order di meja,
            tablet kasir untuk kafe & resto, hingga komputer kasir minimarket lengkap dengan barcode scanner dan printer thermal.
          </p>
        </motion.div>
      </div>

      {/* 3D Showcase Interactive Stage */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="showcase-stage-3d"
        style={{
          maxWidth: "880px",
          minHeight: "540px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "grab",
        }}
      >
        {/* Floating Decorative Badges (100% SVG, Zero AI Slop) */}
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "10px",
            right: "2%",
            background: "#FFE500",
            border: "2.5px solid #0A0A0A",
            boxShadow: "4px 4px 0 #0A0A0A",
            padding: "8px 12px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 30,
          }}
        >
          <ScanBarcode size={18} color="#0A0A0A" />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 800 }}>
              Scan Barcode 0.2 Detik
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "#444" }}>
              Kamera HP & Scanner USB
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
          style={{
            position: "absolute",
            bottom: "30px",
            left: "2%",
            background: "#ffffff",
            border: "2.5px solid #0A0A0A",
            boxShadow: "4px 4px 0 #0A0A0A",
            padding: "8px 12px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            zIndex: 30,
          }}
        >
          <ShieldCheck size={18} color="#00C27C" />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "11px", fontWeight: 800 }}>
              Operasional Tetap Jalan Offline
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "#666" }}>
              Otomatis sinkron saat internet aktif
            </div>
          </div>
        </motion.div>

        {/* 3D Device Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene.id}
            initial={{ opacity: 0, scale: 0.9, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.9, rotateY: 20 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Interactive Mouse Tilt Wrapper */}
            <motion.div
              animate={
                isHovered
                  ? { rotateX: tilt.x, rotateY: tilt.y, scale: 1.02 }
                  : { rotateX: [3, -3, 3], rotateY: [-5, 5, -5], y: [0, -8, 0] }
              }
              transition={
                isHovered
                  ? { type: "spring", stiffness: 280, damping: 22 }
                  : { duration: 6, repeat: Infinity, ease: "easeInOut" }
              }
              className="device-3d-wrapper"
            >
              {/* ======================================================
                  DEVICE 1: iPhone 17 Pro
                  ====================================================== */}
              {activeScene.id === "mobile" && (
                <div className="iphone-17-pro">
                  {/* Physical Buttons */}
                  <div className="iphone-button iphone-btn-action" />
                  <div className="iphone-button iphone-btn-vol-up" />
                  <div className="iphone-button iphone-btn-vol-down" />
                  <div className="iphone-button iphone-btn-power" />

                  {/* Speaker Slit */}
                  <div className="iphone-speaker" />

                  {/* Dynamic Island with Live Activity */}
                  <div className="dynamic-island">
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Zap size={9} color="#FFE500" />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "7.5px",
                          color: "#fff",
                          fontWeight: 700,
                        }}
                      >
                        Kasir #01
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <div className="dynamic-island-sensor" />
                      <div className="dynamic-island-camera" />
                    </div>
                  </div>

                  {/* Screen Content */}
                  <div className="iphone-screen-container">
                    <IphoneScreen />
                    {/* Glass Glare Overlay */}
                    <div className="device-glare" />
                  </div>
                </div>
              )}

              {/* ======================================================
                  DEVICE 2: iPad Pro
                  ====================================================== */}
              {activeScene.id === "tablet" && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div className="ipad-pro">
                    {/* Magnetic Apple Pencil Strip */}
                    <div className="ipad-apple-pencil-strip" />

                    {/* Centered Front Camera */}
                    <div className="ipad-camera" />

                    {/* Screen Content */}
                    <div className="ipad-screen-container">
                      <IpadScreen />
                      {/* Glass Glare Overlay */}
                      <div className="device-glare" />
                    </div>
                  </div>

                  {/* Countertop Angled Stand */}
                  <div className="ipad-stand-neck" />
                  <div className="ipad-stand-base" />
                </div>
              )}

              {/* ======================================================
                  DEVICE 3: Retail POS Kasir Computer (Indomaret/Alfamart)
                  ====================================================== */}
              {activeScene.id === "retail" && (
                <div className="pos-retail-workstation">
                  {/* Main POS Touchscreen Monitor & Cash Drawer */}
                  <div className="pos-retail-terminal">
                    {/* Customer Display Pole (Menghadap pembeli di Indomaret/Alfamart) */}
                    <div className="pos-customer-pole">
                      <div className="pos-vfd-screen">
                        <div>SELAMAT DATANG DI SIKASIR</div>
                        <div style={{ fontWeight: 800 }}>TOTAL: Rp 74.500</div>
                      </div>
                      <div className="pos-vfd-pole-arm" />
                    </div>

                    {/* Industrial Touch Monitor Bezel */}
                    <div className="pos-retail-screen-bezel">
                      <RetailPosScreen />
                      {/* Glass Glare Overlay */}
                      <div className="device-glare" />
                    </div>

                    {/* Heavy-Duty Cash Drawer Base */}
                    <div className="pos-cash-drawer">
                      <div className="pos-drawer-slot" />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "7px",
                          fontWeight: 700,
                          color: "#aaa",
                        }}
                      >
                        HEAVY DUTY CASH DRAWER
                      </span>
                      <div className="pos-drawer-key" />
                    </div>
                  </div>

                  {/* Thermal Receipt Printer with Paper Slip */}
                  <div className="pos-thermal-printer">
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "7px",
                        fontWeight: 800,
                        color: "#fff",
                        marginBottom: "4px",
                      }}
                    >
                      THERMAL PRINTER
                    </div>

                    <div className="pos-printer-slot" />

                    {/* Printed Paper Slip */}
                    <div className="pos-receipt-paper">
                      <div style={{ textAlign: "center", fontWeight: 800, borderBottom: "1px dashed #666", paddingBottom: "3px" }}>
                        SIKASIR MART
                        <div style={{ fontSize: "5.5px", fontWeight: 500 }}>12/09/2026 14:28</div>
                      </div>
                      <div style={{ margin: "4px 0" }}>
                        <div>INDOMIE GOR x5  15.5K</div>
                        <div>POCARI SWEAT x2 15.0K</div>
                        <div>ULTRA MILK x3   15.0K</div>
                        <div>MINYAK 2L x1    29.0K</div>
                      </div>
                      <div style={{ borderTop: "1px dashed #666", paddingTop: "3px", fontWeight: 800 }}>
                        TOTAL: Rp 74.500
                      </div>
                      <div style={{ fontSize: "5.5px", color: "#555" }}>
                        TUNAI: Rp 100.000
                        <br />
                        KEMBALI: Rp 25.500
                      </div>
                      <div style={{ textAlign: "center", marginTop: "4px", fontSize: "7px", letterSpacing: "1px" }}>
                        ||| | ||||| | |||
                      </div>
                    </div>

                    <div className="pos-printer-leds">
                      <div className="pos-led pos-led--green" />
                      <div className="pos-led pos-led--red" />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Device Selector Tabs (Clean Neo-Brutalist, 100% SVG Icons) */}
      <div
        style={{
          maxWidth: "800px",
          margin: "40px auto 0",
          display: "flex",
          gap: "14px",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {SCENES.map((s, i) => {
          const isActive = activeIdx === i;
          return (
            <motion.button
              key={s.id}
              onClick={() => setActiveIdx(i)}
              whileHover={{ y: -3, boxShadow: "5px 5px 0 #0A0A0A" }}
              whileTap={{ y: 0, boxShadow: "2px 2px 0 #0A0A0A" }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "6px",
                padding: "14px 18px",
                background: isActive ? "#FFE500" : "#ffffff",
                border: "2.5px solid #0A0A0A",
                boxShadow: isActive ? "4px 4px 0 #0A0A0A" : "3px 3px 0 #0A0A0A",
                cursor: "pointer",
                flex: "1 1 220px",
                maxWidth: "260px",
                position: "relative",
                textAlign: "left",
              }}
            >
              {/* Active tab bottom highlight bar */}
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "#0A0A0A",
                  }}
                />
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    background: isActive ? "#0A0A0A" : "#FFFBEB",
                    border: "1.5px solid #0A0A0A",
                    borderRadius: "4px",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <s.Icon size={16} color={isActive ? "#FFE500" : "#0A0A0A"} />
                </div>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    fontSize: "13px",
                    color: "#0A0A0A",
                  }}
                >
                  {s.name}
                </span>
              </div>

              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  color: "#0A0A0A",
                }}
              >
                {s.title}
              </span>

              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "10px",
                  color: "#555",
                  lineHeight: 1.4,
                }}
              >
                {s.description}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Progress Dots Indicator */}
      <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "24px" }}>
        {SCENES.map((_, i) => (
          <motion.button
            key={i}
            aria-label={`Slide ${i + 1}`}
            animate={{
              width: activeIdx === i ? "36px" : "10px",
              background: activeIdx === i ? "#0A0A0A" : "#ddd",
            }}
            transition={{ duration: 0.3 }}
            style={{
              height: "10px",
              border: "1.5px solid #0A0A0A",
              cursor: "pointer",
              padding: 0,
            }}
            onClick={() => setActiveIdx(i)}
          />
        ))}
      </div>
    </section>
  );
}
