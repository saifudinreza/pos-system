"use client";

// ============================================================
// AI Monitoring — Dashboard penggunaan LLM (admin/developer)
//
// Data yang diambil: aiService.getStats() → GET /api/ai/stats
//   - summary: requests/tokens hari ini, minggu, bulan
//   - by_type: pemakaian per tipe query (analisis/prediksi/rekomendasi)
//   - by_provider: Groq (primary) vs OpenRouter (fallback) — fallback
//     aktif menandakan Groq sedang/pernah rate-limited
//   - users_today: pemakaian per user + sisa kuota (limit bulanan)
//   - daily_trend: tren 7 hari terakhir · config: limit & threshold alert
//
// Kartu berwarna merah (alert) saat token hari ini melebihi threshold.
// ============================================================

import { useEffect, useState } from "react";
import aiService from "@/services/aiService";

// ── Type & Provider maps ─────────────────────────────────────
const TYPE_LABEL = {
  sales_analysis:   "Analisis Penjualan",
  stock_prediction: "Prediksi Stok",
  recommendation:   "Rekomendasi",
};
const TYPE_COLOR = {
  sales_analysis:   "bg-blue-50 text-blue-700 border-blue-200",
  stock_prediction: "bg-emerald-50 text-emerald-700 border-emerald-200",
  recommendation:   "bg-violet-50 text-violet-700 border-violet-200",
};
const PROVIDER_COLOR = {
  groq:       "bg-amber-50 text-amber-700 border-amber-200",
  openrouter: "bg-violet-50 text-violet-700 border-violet-200",
};

// ── SVG Icons ────────────────────────────────────────────────
const IcoActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoCpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
  </svg>
);
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const IcoRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IcoAlert = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoTrendUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IcoCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

// ── StatCard ─────────────────────────────────────────────────
function StatCard({ label, value, sub, alert = false, Icon, accent }) {
  return (
    <div className={`rounded-md border-2 p-4 flex flex-col gap-2 transition-all ${
      alert
        ? "border-red-400 bg-red-50"
        : "border-brand-black/10 bg-white hover:border-brand-black/30"
    }`}
    style={{ boxShadow: alert ? "3px 3px 0 #FCA5A5" : "3px 3px 0 rgba(10,10,10,0.06)" }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/40 font-mono">{label}</p>
        {Icon && (
          <span className={alert ? "text-red-400" : "text-brand-black/20"}>
            <Icon />
          </span>
        )}
      </div>
      <p className={`text-2xl font-black font-grotesk ${alert ? "text-red-600" : "text-brand-black"}`}>{value}</p>
      {sub && <p className="text-[10px] text-brand-black/40 font-mono">{sub}</p>}
      {alert && (
        <div className="flex items-center gap-1 text-[10px] font-black text-red-500">
          <IcoAlert /> Melebihi threshold
        </div>
      )}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ title, Icon, children, className = "" }) {
  return (
    <div className={`rounded-md border-2 border-brand-black/10 bg-white p-5 ${className}`}
      style={{ boxShadow: "3px 3px 0 rgba(10,10,10,0.06)" }}
    >
      {title && (
        <div className="flex items-center gap-2 mb-4">
          {Icon && <span className="text-brand-black/30"><Icon /></span>}
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/40 font-mono">{title}</p>
        </div>
      )}
      {children}
    </div>
  );
}

// ── UsageBar ─────────────────────────────────────────────────
/** UsageBar — Bar pemakaian kuota: hijau <70%, kuning ≥70%, merah 100%. */
function UsageBar({ used, limit, nearLimit }) {
  const pct   = limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0;
  const color = pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-brand-black/8 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-black font-mono w-10 text-right ${pct >= 100 ? "text-red-500" : nearLimit ? "text-amber-600" : "text-brand-black/40"}`}>
        {used}/{limit}
      </span>
    </div>
  );
}

export default function AiMonitoringPage() {
  // ── State: statistik, loading, error, waktu refresh terakhir ──
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  /** fetchStats — Ambil statistik penggunaan AI dari backend. */
  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await aiService.getStats();
      setStats(data);
      setLastRefresh(new Date());
      setError(null);
    } catch {
      setError("Gagal memuat data monitoring AI.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="flex gap-1.5 justify-center">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2 h-2 bg-brand-black rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
        <p className="text-xs font-mono text-brand-black/40">Memuat data monitoring...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6">
      <div className="rounded-md border-2 border-red-300 bg-red-50 p-5 flex items-start gap-3">
        <IcoAlert />
        <div>
          <p className="font-black text-red-700 text-sm">{error}</p>
          <button onClick={fetchStats} className="mt-2 text-xs font-black text-red-600 underline underline-offset-2">
            Coba lagi
          </button>
        </div>
      </div>
    </div>
  );

  const { summary, by_type, by_provider, users_today, daily_trend, config } = stats;
  const highTokenAlert = summary.today.high_token_usage;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-6xl">

      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-grotesk text-brand-black">AI Monitoring</h1>
          <p className="text-xs text-brand-black/40 font-mono mt-0.5">
            Dashboard penggunaan LLM · Refresh terakhir:{" "}
            {lastRefresh ? lastRefresh.toLocaleTimeString("id-ID") : "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md text-[10px] font-mono bg-brand-black/5 border border-brand-black/10 px-3 py-1.5">
            Limit/bulan: <span className="font-black">{config.free_monthly_limit}</span> req ·{" "}
            Token alert: <span className="font-black">{config.token_alert_threshold.toLocaleString()}</span>
          </div>
          <button
            onClick={fetchStats}
            className="flex items-center gap-1.5 text-xs font-black rounded-md border-2 border-brand-black px-3 py-1.5 hover:bg-brand-yellow transition-colors"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            <IcoRefresh /> Refresh
          </button>
        </div>
      </div>

      {/* ── Alert banner ── */}
      {highTokenAlert && (
        <div className="rounded-md border-2 border-red-400 bg-red-50 px-4 py-3 flex items-start gap-3">
          <span className="text-red-500 mt-0.5 shrink-0"><IcoAlert /></span>
          <div>
            <p className="font-black text-red-700 text-sm">Token Usage Tinggi Hari Ini!</p>
            <p className="text-xs text-red-500 mt-0.5">
              Total token hari ini ({summary.today.tokens.toLocaleString()}) melebihi threshold {config.token_alert_threshold.toLocaleString()}.
            </p>
          </div>
        </div>
      )}

      {/* ── Stat Cards — Hari Ini ── */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 font-mono mb-3">Hari Ini</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Request"   value={summary.today.requests}              sub="query ke AI"       Icon={IcoActivity} />
          <StatCard label="Total Token"     value={summary.today.tokens.toLocaleString()} sub="token terpakai"  Icon={IcoCpu}      alert={highTokenAlert} />
          <StatCard label="User Aktif"      value={summary.today.active_users}          sub="user pakai AI"     Icon={IcoUsers} />
          <StatCard
            label="Sisa Kuota Rata"
            value={users_today.filter((u) => u.limit !== null).length > 0
              ? `${Math.round(users_today.filter((u) => u.limit !== null).reduce((acc, u) => acc + (u.remaining ?? 0), 0) / users_today.filter((u) => u.limit !== null).length)}/${config.free_monthly_limit}`
              : "∞"}
            sub="per user (rata-rata)"
            Icon={IcoShield}
          />
        </div>
      </div>

      {/* ── Stat Cards — Minggu & Bulan ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Req Minggu Ini"   value={summary.week.requests}                sub="7 hari terakhir"  Icon={IcoTrendUp} />
        <StatCard label="Token Minggu Ini" value={summary.week.tokens.toLocaleString()}  sub="7 hari terakhir"  Icon={IcoCpu} />
        <StatCard label="Req Bulan Ini"    value={summary.month.requests}               sub="bulan berjalan"   Icon={IcoCalendar} />
        <StatCard label="Token Bulan Ini"  value={summary.month.tokens.toLocaleString()} sub="bulan berjalan"   Icon={IcoCpu} />
      </div>

      {/* ── Per Tipe + Per Provider ── */}
      <div className="grid md:grid-cols-2 gap-4">

        <Section title="Hari Ini — Per Tipe Query">
          {by_type.length === 0 ? (
            <p className="text-xs text-brand-black/30 font-mono">Belum ada query hari ini.</p>
          ) : (
            <div className="space-y-3">
              {by_type.map((t) => (
                <div key={t.type} className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-black px-2.5 py-1 border rounded-md font-mono ${TYPE_COLOR[t.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {TYPE_LABEL[t.type] ?? t.type}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono text-brand-black/50">
                    <span><span className="font-black text-brand-black">{t.count}</span> req</span>
                    <span><span className="font-black text-brand-black">{t.tokens.toLocaleString()}</span> tok</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Hari Ini — Provider LLM">
          {by_provider.length === 0 ? (
            <p className="text-xs text-brand-black/30 font-mono">Data provider belum tersedia (query lama tidak menyimpan provider).</p>
          ) : (
            <div className="space-y-4">
              {by_provider.map((p) => {
                const total = by_provider.reduce((s, x) => s + x.count, 0);
                const pct   = total > 0 ? Math.round(p.count / total * 100) : 0;
                return (
                  <div key={p.provider} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2.5 py-1 border rounded-md font-mono ${PROVIDER_COLOR[p.provider] ?? "bg-gray-100 text-gray-600"}`}>
                        {p.provider === "groq" ? "Groq (Primary)" : "OpenRouter (Fallback)"}
                      </span>
                      <span className="text-xs font-black font-mono text-brand-black/60">{p.count} req · {pct}%</span>
                    </div>
                    <div className="h-2 bg-brand-black/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${p.provider === "groq" ? "bg-amber-400" : "bg-violet-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {by_provider.some((p) => p.provider === "openrouter") && (
                <div className="flex items-center gap-1.5 text-[10px] text-amber-600 font-mono font-bold mt-1 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5">
                  <IcoAlert /> Fallback aktif — Groq sedang/pernah rate-limited hari ini.
                </div>
              )}
            </div>
          )}
        </Section>
      </div>

      {/* ── Tren 7 Hari ── */}
      <Section title="Tren 7 Hari Terakhir" Icon={IcoTrendUp}>
        {daily_trend.length === 0 ? (
          <p className="text-xs text-brand-black/30 font-mono">Belum ada data.</p>
        ) : (
          <div className="space-y-2">
            {daily_trend.map((d) => {
              const maxReq = Math.max(...daily_trend.map((x) => x.requests), 1);
              const barW   = Math.max(4, Math.round(d.requests / maxReq * 100));
              const isToday = d.date === new Date().toISOString().split("T")[0];
              return (
                <div key={d.date} className="flex items-center gap-3">
                  <span className={`text-[10px] font-mono w-24 shrink-0 ${isToday ? "font-black text-brand-black" : "text-brand-black/40"}`}>
                    {new Date(d.date + "T00:00:00").toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                    {isToday && (
                      <span className="ml-1 text-[8px] bg-brand-yellow px-1 py-0.5 font-black rounded-sm">TODAY</span>
                    )}
                  </span>
                  <div className="flex-1 h-6 bg-brand-black/5 rounded-md overflow-hidden">
                    <div
                      className={`h-full rounded-md flex items-center px-2 transition-all ${isToday ? "bg-brand-yellow" : "bg-brand-black/15"}`}
                      style={{ width: `${barW}%` }}
                    >
                      {d.requests > 0 && (
                        <span className="text-[9px] font-black text-brand-black/70 whitespace-nowrap">{d.requests} req</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-brand-black/35 w-20 text-right shrink-0">
                    {d.tokens.toLocaleString()} tok
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Per-User Usage ── */}
      <Section title="Penggunaan Per User — Bulan Ini" Icon={IcoUsers}>
        {users_today.length === 0 ? (
          <p className="text-xs text-brand-black/30 font-mono">Belum ada user yang memakai AI bulan ini.</p>
        ) : (
          <div className="space-y-2">
            {users_today.map((u, i) => (
              <div
                key={i}
                className={`rounded-md p-3 border-2 ${
                  u.remaining === 0
                    ? "border-red-300 bg-red-50"
                    : u.near_limit
                      ? "border-amber-300 bg-amber-50"
                      : "border-brand-black/8 bg-brand-black/2"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-brand-black text-white flex items-center justify-center text-[11px] font-black rounded-md">
                      {u.user?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-bold text-brand-black">{u.user}</span>
                    {u.near_limit && u.remaining > 0 && (
                      <span className="text-[9px] font-black bg-amber-400 text-brand-black px-1.5 py-0.5 font-mono rounded">HAMPIR HABIS</span>
                    )}
                    {u.remaining === 0 && (
                      <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 font-mono rounded">LIMIT TERCAPAI</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-brand-black/40">{u.pct}% terpakai</span>
                </div>
                <UsageBar used={u.used} limit={u.limit} nearLimit={u.near_limit} />
              </div>
            ))}
          </div>
        )}
      </Section>

    </div>
  );
}
