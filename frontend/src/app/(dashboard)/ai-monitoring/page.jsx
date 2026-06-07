"use client";

import { useEffect, useState } from "react";
import aiService from "@/services/aiService";

const TYPE_LABEL = {
  sales_analysis: "Analisis Penjualan",
  stock_prediction: "Prediksi Stok",
  recommendation: "Rekomendasi",
};

const TYPE_COLOR = {
  sales_analysis:  "bg-blue-100 text-blue-700 border-blue-200",
  stock_prediction: "bg-green-100 text-green-700 border-green-200",
  recommendation:  "bg-purple-100 text-purple-700 border-purple-200",
};

const PROVIDER_COLOR = {
  groq:       "bg-brand-yellow text-brand-black border-brand-black/20",
  openrouter: "bg-purple-100 text-purple-700 border-purple-200",
};

function StatBox({ label, value, sub, alert = false }) {
  return (
    <div
      className={`border-2 p-4 rounded-none ${alert ? "border-red-500 bg-red-50" : "border-brand-black bg-white"}`}
      style={!alert ? { boxShadow: "3px 3px 0 #0A0A0A" } : { boxShadow: "3px 3px 0 #EF4444" }}
    >
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/40 font-mono mb-1">{label}</p>
      <p className={`text-2xl font-black font-grotesk ${alert ? "text-red-600" : "text-brand-black"}`}>{value}</p>
      {sub && <p className="text-[10px] text-brand-black/40 font-mono mt-0.5">{sub}</p>}
      {alert && <p className="text-[10px] font-black text-red-600 mt-1">⚠ Melebihi threshold</p>}
    </div>
  );
}

function UsageBar({ used, limit, nearLimit }) {
  const pct = limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0;
  const color = pct >= 100 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-green-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-brand-black/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-black font-mono w-10 text-right ${pct >= 100 ? "text-red-500" : nearLimit ? "text-amber-600" : "text-brand-black/50"}`}>
        {used}/{limit}
      </span>
    </div>
  );
}

export default function AiMonitoringPage() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="flex gap-1 justify-center mb-3">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-2 h-2 bg-brand-black rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p className="text-xs font-mono text-brand-black/40">Memuat data monitoring...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="border-2 border-red-400 bg-red-50 p-4 rounded-md">
          <p className="font-bold text-red-700 text-sm">{error}</p>
          <button onClick={fetchStats} className="mt-2 text-xs font-black text-red-600 underline">Coba lagi</button>
        </div>
      </div>
    );
  }

  const { summary, by_type, by_provider, users_today, daily_trend, config } = stats;
  const highTokenAlert = summary.today.high_token_usage;

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black font-grotesk text-brand-black">AI Monitoring</h1>
          <p className="text-xs text-brand-black/40 font-mono mt-0.5">
            Dashboard penggunaan LLM · Refresh terakhir:{" "}
            {lastRefresh ? lastRefresh.toLocaleTimeString("id-ID") : "-"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-mono bg-brand-black/5 border border-brand-black/10 px-2 py-1 rounded">
            Limit/hari: <span className="font-black">{config.daily_limit}</span> req ·{" "}
            Token alert: <span className="font-black">{config.token_alert_threshold.toLocaleString()}</span>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs font-black border-2 border-brand-black px-3 py-1.5 hover:bg-brand-yellow transition-colors"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* High token alert banner */}
      {highTokenAlert && (
        <div className="border-2 border-red-500 bg-red-50 px-4 py-3 flex items-center gap-3">
          <span className="text-lg">🚨</span>
          <div>
            <p className="font-black text-red-700 text-sm">Token Usage Tinggi Hari Ini!</p>
            <p className="text-xs text-red-600">
              Total token hari ini ({summary.today.tokens.toLocaleString()}) melebihi threshold {config.token_alert_threshold.toLocaleString()}.
              Periksa penggunaan di bawah.
            </p>
          </div>
        </div>
      )}

      {/* Stat boxes — Hari Ini */}
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/30 font-mono mb-3">Hari Ini</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBox label="Total Request"   value={summary.today.requests}                         sub="query ke AI" />
          <StatBox label="Total Token"     value={summary.today.tokens.toLocaleString()}           sub="token terpakai" alert={highTokenAlert} />
          <StatBox label="User Aktif"      value={summary.today.active_users}                      sub="user pakai AI" />
          <StatBox label="Sisa Kuota Rata" value={`${config.daily_limit - Math.round(summary.today.requests / Math.max(1, summary.today.active_users))}/${config.daily_limit}`} sub="per user (rata-rata)" />
        </div>
      </div>

      {/* Stat boxes — Minggu & Bulan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox label="Req Minggu Ini"  value={summary.week.requests}               sub="7 hari terakhir" />
        <StatBox label="Token Minggu Ini" value={summary.week.tokens.toLocaleString()} sub="7 hari terakhir" />
        <StatBox label="Req Bulan Ini"   value={summary.month.requests}              sub="bulan berjalan" />
        <StatBox label="Token Bulan Ini" value={summary.month.tokens.toLocaleString()} sub="bulan berjalan" />
      </div>

      {/* By Type + By Provider */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* By Type */}
        <div className="border-2 border-brand-black bg-white p-4" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
          <p className="text-xs font-black uppercase tracking-widest text-brand-black/40 font-mono mb-3">Hari Ini — Per Tipe Query</p>
          {by_type.length === 0 ? (
            <p className="text-xs text-brand-black/30 font-mono">Belum ada query hari ini.</p>
          ) : (
            <div className="space-y-3">
              {by_type.map((t) => (
                <div key={t.type} className="flex items-center justify-between gap-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 border rounded font-mono ${TYPE_COLOR[t.type] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                    {TYPE_LABEL[t.type] ?? t.type}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono text-brand-black/60">
                    <span><span className="font-black text-brand-black">{t.count}</span> req</span>
                    <span><span className="font-black text-brand-black">{t.tokens.toLocaleString()}</span> token</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Provider */}
        <div className="border-2 border-brand-black bg-white p-4" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
          <p className="text-xs font-black uppercase tracking-widest text-brand-black/40 font-mono mb-3">Hari Ini — Provider LLM</p>
          {by_provider.length === 0 ? (
            <p className="text-xs text-brand-black/30 font-mono">Data provider belum tersedia (query lama tidak menyimpan provider).</p>
          ) : (
            <div className="space-y-3">
              {by_provider.map((p) => {
                const total = by_provider.reduce((s, x) => s + x.count, 0);
                const pct   = total > 0 ? Math.round(p.count / total * 100) : 0;
                return (
                  <div key={p.provider} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-black px-2 py-0.5 border rounded font-mono ${PROVIDER_COLOR[p.provider] ?? "bg-gray-100 text-gray-600"}`}>
                        {p.provider === "groq" ? "Groq (Primary)" : "OpenRouter (Fallback)"}
                      </span>
                      <span className="text-xs font-black font-mono">{p.count} req ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-brand-black/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${p.provider === "groq" ? "bg-brand-yellow" : "bg-purple-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              {by_provider.some((p) => p.provider === "openrouter") && (
                <p className="text-[10px] text-amber-600 font-mono font-bold mt-1">
                  ⚠ Fallback aktif — Groq sedang/pernah rate-limited hari ini.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tren 7 Hari */}
      <div className="border-2 border-brand-black bg-white p-4" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
        <p className="text-xs font-black uppercase tracking-widest text-brand-black/40 font-mono mb-4">Tren 7 Hari Terakhir</p>
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
                    {isToday && <span className="ml-1 text-[8px] bg-brand-yellow px-1 font-black">TODAY</span>}
                  </span>
                  <div className="flex-1 h-5 bg-brand-black/5 rounded-sm overflow-hidden">
                    <div
                      className={`h-full rounded-sm flex items-center px-1.5 transition-all ${isToday ? "bg-brand-yellow" : "bg-brand-black/20"}`}
                      style={{ width: `${barW}%` }}
                    >
                      {d.requests > 0 && (
                        <span className="text-[9px] font-black text-brand-black/70 whitespace-nowrap">{d.requests} req</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-brand-black/40 w-24 text-right shrink-0">
                    {d.tokens.toLocaleString()} tok
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-User Usage Hari Ini */}
      <div className="border-2 border-brand-black bg-white p-4" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
        <p className="text-xs font-black uppercase tracking-widest text-brand-black/40 font-mono mb-4">Penggunaan Per User — Hari Ini</p>
        {users_today.length === 0 ? (
          <p className="text-xs text-brand-black/30 font-mono">Belum ada user yang memakai AI hari ini.</p>
        ) : (
          <div className="space-y-3">
            {users_today.map((u, i) => (
              <div key={i} className={`p-3 border ${u.near_limit ? "border-amber-400 bg-amber-50" : "border-brand-black/10 bg-white"} rounded`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand-black text-white flex items-center justify-center text-[10px] font-black rounded-sm">
                      {u.user?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <span className="text-sm font-bold text-brand-black">{u.user}</span>
                    {u.near_limit && u.remaining > 0 && (
                      <span className="text-[9px] font-black bg-amber-400 text-brand-black px-1.5 py-0.5 font-mono">HAMPIR HABIS</span>
                    )}
                    {u.remaining === 0 && (
                      <span className="text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 font-mono">LIMIT TERCAPAI</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-brand-black/40">{u.pct}% terpakai</span>
                </div>
                <UsageBar used={u.used} limit={u.limit} nearLimit={u.near_limit} />
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
