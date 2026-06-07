"use client";

import { useState, useEffect } from "react";
import tenantService from "@/services/tenantService";
import userService   from "@/services/userService";
import NeoButton from "@/components/ui/NeoButton";
import NeoModal  from "@/components/ui/NeoModal";
import NeoInput  from "@/components/ui/NeoInput";
import NeoBadge  from "@/components/ui/NeoBadge";
import { getErrorMessage } from "@/lib/utils";

const ROLE_COLORS = { admin: "black", kasir: "yellow", developer: "red", user: "gray" };

// ── SVG icons ──────────────────────────────────────────────
const IcoBuilding = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>
  </svg>
);
const IcoUsers = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoEdit = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IcoTrash = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const IcoChevron = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

export default function TenantsPage() {
  const [tenants,   setTenants]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [expanded,  setExpanded]  = useState(null); // tenant id yang expand user list
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [delModal,  setDelModal]  = useState({ open: false, data: null });
  const [form,      setForm]      = useState({ name: "", description: "", is_active: true });
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [err,       setErr]       = useState("");
  const [roleChanging, setRoleChanging] = useState(null); // user id sedang diubah rolenya

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getAll({ search });
      setTenants(res.data ?? []);
    } catch { /* handled */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [search]);

  const openEdit = (tenant) => {
    setForm({ name: tenant.name, description: tenant.description ?? "", is_active: tenant.is_active });
    setEditModal({ open: true, data: tenant });
    setErr("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await tenantService.update(editModal.data.id, form);
      setEditModal({ open: false, data: null });
      fetchData();
    } catch (e) { setErr(getErrorMessage(e)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await tenantService.delete(delModal.data.id);
      setDelModal({ open: false, data: null });
      fetchData();
    } catch (e) { alert(getErrorMessage(e)); }
    finally { setDeleting(false); }
  };

  const handleRoleChange = async (userId, userName, newRole, tenantId) => {
    if (!confirm(`Ubah role "${userName}" menjadi ${newRole}?`)) return;
    setRoleChanging(userId);
    try {
      await userService.patchRole(userId, newRole);
      setTenants((prev) => prev.map((t) =>
        t.id === tenantId
          ? { ...t, users: t.users.map((u) => u.id === userId ? { ...u, role: newRole } : u) }
          : t
      ));
    } catch (e) { alert(getErrorMessage(e)); }
    finally { setRoleChanging(null); }
  };

  const stats = {
    total: tenants.length,
    active: tenants.filter((t) => t.is_active).length,
    totalUsers: tenants.reduce((sum, t) => sum + (t.users_count ?? 0), 0),
  };

  return (
    <div className="space-y-6 max-w-5xl page-fade">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk flex items-center gap-2">
            <IcoBuilding className="w-7 h-7" /> Manage Tenant
          </h2>
          <p className="text-sm text-brand-black/50 mt-0.5">Semua toko/tenant yang terdaftar di sistem</p>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Tenant", value: stats.total,      bg: "bg-white" },
          { label: "Aktif",        value: stats.active,     bg: "bg-green-100" },
          { label: "Total User",   value: stats.totalUsers, bg: "bg-brand-yellow" },
          { label: "Nonaktif",     value: stats.total - stats.active, bg: "bg-brand-black text-white" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border-2 border-brand-black p-4 rounded-md`} style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 font-mono">{s.label}</p>
            <p className="text-3xl font-black font-mono">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama tenant..."
        className="w-full max-w-sm px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow rounded-md"
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
      />

      {/* ── Tenant List ── */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-brand-black/5 rounded-md animate-pulse" />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="py-16 text-center text-brand-black/40 font-semibold">Tidak ada tenant ditemukan</div>
      ) : (
        <div className="space-y-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="border-2 border-brand-black bg-white rounded-md overflow-hidden" style={{ boxShadow: "3px 3px 0 #0A0A0A" }}>

              {/* ── Tenant Row ── */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(expanded === tenant.id ? null : tenant.id)}
                  className="w-7 h-7 border-2 border-brand-black/20 rounded flex items-center justify-center hover:bg-brand-yellow/30 transition-colors shrink-0"
                >
                  <IcoChevron className={`w-3.5 h-3.5 transition-transform ${expanded === tenant.id ? "rotate-180" : ""}`} />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 bg-brand-yellow border-2 border-brand-black rounded flex items-center justify-center font-black text-lg shrink-0"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                  {tenant.name[0]?.toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-sm">{tenant.name}</p>
                    {!tenant.is_active && <NeoBadge color="red">Nonaktif</NeoBadge>}
                  </div>
                  <p className="text-[11px] text-brand-black/40 font-mono">
                    ID: {tenant.id} · slug: {tenant.slug} · {tenant.users_count} anggota · dibuat {tenant.created_at}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <NeoButton size="sm" variant="secondary" onClick={() => openEdit(tenant)}>
                    <IcoEdit className="w-3.5 h-3.5" />
                  </NeoButton>
                  <NeoButton size="sm" variant="danger" onClick={() => setDelModal({ open: true, data: tenant })}>
                    <IcoTrash className="w-3.5 h-3.5" />
                  </NeoButton>
                </div>
              </div>

              {/* ── User List (expanded) ── */}
              {expanded === tenant.id && tenant.users?.length > 0 && (
                <div className="border-t-2 border-brand-black/10 bg-brand-cream/50">
                  <div className="px-4 py-2 flex items-center gap-2">
                    <IcoUsers className="w-3.5 h-3.5 text-brand-black/40" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-black/40 font-mono">
                      Anggota ({tenant.users.length})
                    </p>
                  </div>
                  <div className="divide-y divide-brand-black/5">
                    {tenant.users.map((u) => (
                      <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/60 transition-colors">
                        <div className="w-7 h-7 bg-white border-2 border-brand-black/20 rounded flex items-center justify-center font-black text-xs shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{u.name}</p>
                          <p className="text-[10px] text-brand-black/40 font-mono truncate">{u.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <NeoBadge color={ROLE_COLORS[u.role] ?? "gray"}>{u.role}</NeoBadge>
                          {(u.role === "kasir" || u.role === "admin") && (
                            <NeoButton
                              size="sm"
                              variant="ghost"
                              disabled={roleChanging === u.id}
                              onClick={() => handleRoleChange(u.id, u.name, u.role === "kasir" ? "admin" : "kasir", tenant.id)}
                            >
                              {roleChanging === u.id ? "..." : u.role === "kasir" ? "→ Admin" : "→ Kasir"}
                            </NeoButton>
                          )}
                          {!u.is_active && <NeoBadge color="red">Nonaktif</NeoBadge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {expanded === tenant.id && tenant.users?.length === 0 && (
                <div className="border-t-2 border-brand-black/10 px-4 py-3 text-sm text-brand-black/40 bg-brand-cream/50">
                  Tidak ada anggota di tenant ini.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Edit Modal ── */}
      <NeoModal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, data: null })}
        title={`Edit Tenant · ${editModal.data?.name}`}
        footer={
          <div className="flex gap-3 justify-end">
            <NeoButton variant="ghost" onClick={() => setEditModal({ open: false, data: null })} disabled={saving}>Batal</NeoButton>
            <NeoButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</NeoButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {err && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300 rounded-md">{err}</p>}
          <NeoInput label="Nama Tenant *" id="t-name" required
            value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nama toko" />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Deskripsi toko (opsional)"
              rows={3}
              className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow rounded-md resize-none"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 border-2 border-brand-black" />
            <span className="text-sm font-bold">Tenant aktif</span>
          </label>
        </form>
      </NeoModal>

      {/* ── Delete Modal ── */}
      <NeoModal
        isOpen={delModal.open}
        onClose={() => setDelModal({ open: false, data: null })}
        title="Hapus Tenant"
        footer={
          <div className="flex gap-3 justify-end">
            <NeoButton variant="ghost" onClick={() => setDelModal({ open: false, data: null })} disabled={deleting}>Batal</NeoButton>
            <NeoButton variant="danger" onClick={handleDelete} disabled={deleting}>{deleting ? "Menghapus..." : "Ya, Hapus"}</NeoButton>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 border-2 border-red-400 rounded-md">
            <IcoTrash className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-800">Aksi ini tidak bisa dibatalkan!</p>
              <p className="text-xs text-red-600 mt-0.5">
                Semua produk, kategori, dan pesanan tenant ini akan ikut terhapus. User dalam tenant ini akan dilepas dari tenant (tidak dihapus).
              </p>
            </div>
          </div>
          {delModal.data && (
            <div className="p-3 bg-white border-2 border-brand-black/20 rounded-md">
              <p className="text-xs text-brand-black/50 font-mono mb-1">Tenant yang akan dihapus:</p>
              <p className="font-black text-brand-black">{delModal.data.name}</p>
              <p className="text-xs text-brand-black/50 font-mono">{delModal.data.users_count} anggota</p>
            </div>
          )}
        </div>
      </NeoModal>

    </div>
  );
}
