"use client";

import { useState, useEffect } from "react";
import useSubscriptionStore, { PLANS } from "@/stores/subscriptionStore";
import { formatCurrency, formatDate } from "@/lib/utils";

// ── SVG Icons ──────────────────────────────────────────────
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IconPulse = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IconTag = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
);
const IconLightning = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);
const IconDiamond = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3L8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>
  </svg>
);
const IconTrending = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconPause = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
  </svg>
);
const IconPlay = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const IconRefresh = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const IconLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ── Badges ──────────────────────────────────────────────────
const PLAN_BADGE = {
  free:       { label: "Gratis",     cls: "bg-white/10 text-white border-white/20" },
  pro:        { label: "Pro",        cls: "bg-brand-yellow text-brand-black border-brand-black" },
  enterprise: { label: "Enterprise", cls: "bg-white text-brand-black border-brand-black" },
};

const STATUS_BADGE = {
  active:    { label: "Aktif",       cls: "bg-green-400/20 text-green-300 border-green-400/30" },
  expired:   { label: "Kadaluarsa",  cls: "bg-red-400/20 text-red-300 border-red-400/30" },
  suspended: { label: "Ditangguhkan",cls: "bg-orange-400/20 text-orange-300 border-orange-400/30" },
  free:      { label: "Free",        cls: "bg-white/10 text-white/50 border-white/15" },
};

// ── StatCard ────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, Icon }) {
  return (
    <div
      className="border-2 p-4 flex flex-col gap-2"
      style={{
        borderColor: accent ?? "rgba(255,255,255,0.15)",
        boxShadow: `3px 3px 0 ${accent ?? "rgba(255,255,255,0.1)"}`,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 font-mono">{label}</p>
        {Icon && (
          <span style={{ color: accent ?? "rgba(255,255,255,0.2)" }}>
            <Icon />
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-white font-mono">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

export default function SubscriptionsPage() {
  const { subscriptions, stats, isLoading, error, fetchSubscriptions, updatePlan, toggleStatus } =
    useSubscriptionStore();

  const [search,     setSearch]     = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [editModal,  setEditModal]  = useState(null);
  const [newPlan,    setNewPlan]    = useState("");
  const [saving,     setSaving]     = useState(false);
  const [toggling,   setToggling]   = useState(null);

  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);

  const filtered = subscriptions.filter((s) => {
    const matchSearch = !search ||
      s.user_name.toLowerCase().includes(search.toLowerCase()) ||
      s.user_email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = !filterPlan || s.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const handleEdit = (sub) => { setEditModal(sub); setNewPlan(sub.plan); };

  const handleSavePlan = async () => {
    if (!editModal || !newPlan) return;
    setSaving(true);
    try {
      await updatePlan(editModal.id, newPlan);
      setEditModal(null);
    } catch {
      alert("Gagal mengubah plan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (sub) => {
    setToggling(sub.id);
    try { await toggleStatus(sub.id); }
    catch { alert("Gagal mengubah status. Coba lagi."); }
    finally { setToggling(null); }
  };

  return (
    <div className="space-y-6 page-fade">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white font-grotesk">Manajemen Subscriptions</h1>
          <p className="text-sm text-white/40 mt-1">
            Kelola semua langganan pengguna KasirAI — hanya dapat diakses developer.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 text-xs font-bold border border-white/20 text-white/60 hover:border-brand-yellow hover:text-brand-yellow transition-colors disabled:opacity-40"
        >
          <IconRefresh />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="border-2 border-red-400/40 bg-red-400/10 px-4 py-3 text-sm text-red-300 font-mono">
          ⚠ {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Akun"   value={stats.total}      accent="#FFE500" Icon={IconUsers} />
        <StatCard label="Aktif"        value={stats.active}     sub="akun aktif" accent="#4ade80" Icon={IconPulse} />
        <StatCard label="Free"         value={stats.free}       Icon={IconTag} />
        <StatCard label="Pro"          value={stats.pro}        accent="#FFE500" Icon={IconLightning} />
        <StatCard label="Enterprise"   value={stats.enterprise} accent="white"   Icon={IconDiamond} />
        <StatCard
          label="MRR"
          value={`${((stats.mrr ?? 0) / 1000).toFixed(0)}rb`}
          sub="Monthly Recurring"
          accent="#FFE500"
          Icon={IconTrending}
        />
      </div>

      {/* Plan revenue breakdown */}
      <div
        className="border-2 border-white/10 p-4"
        style={{ background: "rgba(255,255,255,0.04)", boxShadow: "3px 3px 0 rgba(255,255,255,0.05)" }}
      >
        <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-3 font-mono">
          Revenue per Plan
        </p>
        <div className="flex gap-4 flex-wrap">
          {Object.values(PLANS).map((plan) => {
            const count   = subscriptions.filter((s) => s.plan === plan.id && s.status === "active" && !s.is_developer).length;
            const revenue = count * plan.price;
            return (
              <div key={plan.id} className="flex items-center gap-3">
                <span className={`text-xs font-black px-2 py-0.5 border ${PLAN_BADGE[plan.id]?.cls}`}>
                  {plan.name}
                </span>
                <span className="text-sm font-black text-white font-mono">
                  {formatCurrency(revenue)}
                </span>
                <span className="text-xs text-white/30 font-mono">({count}x)</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border-2 border-white/20 bg-white/5 text-white outline-none focus:border-brand-yellow placeholder:text-white/25 font-mono"
          style={{ boxShadow: "2px 2px 0 rgba(255,255,255,0.05)" }}
        />
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="px-3 py-2 text-sm border-2 border-white/20 bg-brand-black text-white outline-none focus:border-brand-yellow"
          style={{ boxShadow: "2px 2px 0 rgba(255,255,255,0.05)" }}
        >
          <option value="">Semua Plan</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div
        className="border-2 border-white/10 overflow-hidden"
        style={{ boxShadow: "4px 4px 0 rgba(255,255,255,0.05)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>
                {["Pengguna", "Plan", "Status", "Mulai", "Kadaluarsa", "Aksi"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-white/40 uppercase tracking-widest font-mono whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/30 font-mono text-sm">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-white/30 font-mono text-sm">
                    {error ? "Gagal memuat" : "Tidak ada data"}
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => {
                  const planBadge   = PLAN_BADGE[sub.plan];
                  const statusBadge = STATUS_BADGE[sub.status] ?? STATUS_BADGE.suspended;
                  const isToggling  = toggling === sub.id;
                  return (
                    <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{sub.user_name}</p>
                          {sub.is_developer && (
                            <span className="text-[8px] bg-brand-yellow text-brand-black font-black px-1.5 py-0.5 font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 font-mono">{sub.user_email}</p>
                        {sub.is_developer && (
                          <span className="text-[9px] bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30 px-1.5 py-0.5 font-mono font-black mt-0.5 inline-block">
                            DEVELOPER
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-black border px-2 py-0.5 ${planBadge?.cls}`}>
                          {planBadge?.label}
                        </span>
                        {sub.plan !== "free" && (
                          <p className="text-[10px] text-white/30 mt-1 font-mono">
                            {formatCurrency(PLANS[sub.plan]?.price)}/bln
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-black border px-2 py-0.5 ${statusBadge.cls}`}>
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50 font-mono">
                        {formatDate(sub.started_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white/50 font-mono">
                        {sub.expires_at ? formatDate(sub.expires_at) : "∞ Selamanya"}
                      </td>
                      <td className="px-4 py-3">
                        {sub.is_developer ? (
                          <span className="flex items-center gap-1.5 text-[10px] text-white/30 font-mono italic">
                            <IconLock /> Developer account
                          </span>
                        ) : (
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleEdit(sub)}
                              className="flex items-center gap-1.5 text-[11px] font-black border px-2 py-1 text-brand-yellow border-brand-yellow/30 hover:bg-brand-yellow hover:text-brand-black transition-colors"
                            >
                              <IconEdit /> Edit Plan
                            </button>
                            <button
                              onClick={() => handleToggle(sub)}
                              disabled={isToggling}
                              className={`flex items-center gap-1.5 text-[11px] font-black border px-2 py-1 transition-colors disabled:opacity-40 ${
                                sub.status === "active"
                                  ? "text-red-300 border-red-300/30 hover:bg-red-500/20"
                                  : "text-green-300 border-green-300/30 hover:bg-green-500/20"
                              }`}
                            >
                              {isToggling ? "..." : sub.status === "active" ? <><IconPause /> Tangguhkan</> : <><IconPlay /> Aktifkan</>}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div
          className="px-4 py-3 border-t border-white/10 text-xs text-white/30 font-mono flex items-center justify-between flex-wrap gap-2"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <span>Menampilkan {filtered.length} dari {subscriptions.length} akun</span>
          <span>Total MRR: <strong className="text-white">{formatCurrency(stats.mrr ?? 0)}</strong>/bulan</span>
        </div>
      </div>

      {/* Feature Matrix */}
      <div className="border-2 border-white/10 p-5" style={{ background: "rgba(255,255,255,0.03)" }}>
        <h2 className="text-sm font-black text-white font-grotesk mb-4">Matriks Fitur per Plan</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="py-2 text-left text-white/40 font-mono font-black uppercase tracking-wider">Fitur</th>
                {Object.values(PLANS).map((p) => (
                  <th key={p.id} className="py-2 text-center text-white/70 font-black capitalize">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[
                { key: "max_products",    label: "Maks. Produk" },
                { key: "max_users",       label: "Maks. Pengguna" },
                { key: "ai_assistant",    label: "AI Assistant" },
                { key: "reports_download",label: "Download Laporan" },
                { key: "analytics_charts",label: "Grafik Analytics" },
                { key: "multi_branch",    label: "Multi-Cabang" },
                { key: "priority_support",label: "Priority Support" },
                { key: "api_access",      label: "Akses API" },
              ].map((feat) => (
                <tr key={feat.key} className="hover:bg-white/5">
                  <td className="py-2 text-white/60 font-mono">{feat.label}</td>
                  {Object.values(PLANS).map((plan) => {
                    const val = plan.features[feat.key];
                    return (
                      <td key={plan.id} className="py-2 text-center">
                        {typeof val === "boolean" ? (
                          <span className={val ? "text-green-400 font-black" : "text-white/20"}>
                            {val ? "✓" : "—"}
                          </span>
                        ) : (
                          <span className="text-white/60 font-mono text-[10px]">
                            {val === -1 ? "∞" : val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {editModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)" }}
          onClick={() => setEditModal(null)}
        >
          <div
            className="bg-brand-black border-2 border-brand-yellow w-full max-w-sm p-6"
            style={{ boxShadow: "6px 6px 0 #FFE500" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-1">
              <IconEdit />
              <h3 className="font-black text-white text-lg font-grotesk">Ubah Plan</h3>
            </div>
            <p className="text-sm text-white/50 mb-4 font-mono">{editModal.user_email}</p>

            <div className="space-y-2 mb-5">
              {Object.values(PLANS).map((plan) => (
                <label
                  key={plan.id}
                  className={`flex items-center justify-between px-3 py-2.5 border-2 cursor-pointer transition-all ${
                    newPlan === plan.id
                      ? "border-brand-yellow bg-brand-yellow/10"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio" name="plan" value={plan.id}
                      checked={newPlan === plan.id}
                      onChange={() => setNewPlan(plan.id)}
                      className="accent-brand-yellow"
                    />
                    <div>
                      <p className="font-bold text-white text-sm">{plan.name}</p>
                      <p className="text-xs text-white/40 font-mono">{plan.limits.products}</p>
                    </div>
                  </div>
                  <span className="font-black text-white font-mono text-sm">
                    {plan.price === 0 ? "Gratis" : formatCurrency(plan.price) + "/bln"}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2 text-sm font-bold text-white/60 border-2 border-white/20 hover:border-white/40 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSavePlan}
                disabled={saving}
                className="flex-1 py-2 text-sm font-black bg-brand-yellow text-brand-black border-2 border-brand-yellow hover:bg-yellow-300 transition-colors disabled:opacity-50"
                style={{ boxShadow: "3px 3px 0 rgba(255,255,255,0.2)" }}
              >
                {saving ? "Menyimpan..." : "Simpan Plan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
