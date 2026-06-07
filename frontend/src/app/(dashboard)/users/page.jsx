"use client";

import { useState, useEffect } from "react";
import { ShieldOff, UserPlus, Trash2 } from "lucide-react";
import userService    from "@/services/userService";
import useAuthStore   from "@/stores/authStore";
import { useDebounce } from "@/hooks/useDebounce";
import NeoTable  from "@/components/ui/NeoTable";
import NeoCard   from "@/components/ui/NeoCard";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoButton from "@/components/ui/NeoButton";
import NeoModal  from "@/components/ui/NeoModal";
import NeoInput  from "@/components/ui/NeoInput";
import { formatDateTime, getRoleLabel, getErrorMessage } from "@/lib/utils";

const EMPTY_FORM = {
  name: "", email: "", password: "", password_confirmation: "",
  phone: "", role: "kasir", is_active: true,
};

const ROLE_COLOR  = { admin: "black", kasir: "yellow", user: "gray", developer: "red" };

const AVATAR_COLORS = [
  "bg-brand-yellow text-brand-black",
  "bg-green-200 text-green-800",
  "bg-blue-200 text-blue-800",
  "bg-purple-200 text-purple-800",
  "bg-pink-200 text-pink-800",
  "bg-orange-200 text-orange-800",
];

function UserAvatar({ name }) {
  const initials = (name ?? " ")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
  const colorCls = AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
  return (
    <div
      className={`w-9 h-9 ${colorCls} border-2 border-brand-black flex items-center justify-center font-black text-xs shrink-0`}
      style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
    >
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const currentUser = useAuthStore((s) => s.user);

  const [users,     setUsers]     = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [denied,    setDenied]    = useState(false);
  const [search,    setSearch]    = useState("");
  const [filters,   setFilters]   = useState({ page: 1, per_page: 15 });
  const [modal,        setModal]        = useState({ open: false, data: null });
  const [deleteModal,  setDeleteModal]  = useState({ open: false, data: null });
  const [form,         setForm]         = useState(EMPTY_FORM);
  const [saving,       setSaving]       = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [formError,    setFormError]    = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll({ ...filters, search: debouncedSearch });
      setUsers(data.data ?? []);
      setMeta(data.meta ?? null);
    } catch (err) {
      if (err.response?.status === 403) setDenied(true);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters, debouncedSearch]);

  const openModal = (data = null) => {
    setForm(data
      ? {
          name: data.name, email: data.email,
          password: "", password_confirmation: "",
          phone: data.phone ?? "", role: data.role, is_active: data.is_active,
        }
      : EMPTY_FORM
    );
    setModal({ open: true, data });
    setFormError("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = { ...form };
      if (!payload.password) {
        delete payload.password;
        delete payload.password_confirmation;
      }
      if (modal.data) await userService.update(modal.data.id, payload);
      else            await userService.create(payload);
      setModal({ open: false, data: null });
      fetchData();
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteModal.data) return;
    setDeleting(true);
    try {
      await userService.delete(deleteModal.data.id);
      setDeleteModal({ open: false, data: null });
      fetchData();
    } catch (err) { alert(getErrorMessage(err)); }
    finally { setDeleting(false); }
  };

  const handleRoleChange = async (id, name, newRole) => {
    if (!confirm(`Ubah role "${name}" menjadi ${newRole}?`)) return;
    try {
      const res = await userService.patchRole(id, newRole);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role: res.data?.role ?? newRole } : u));
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const handleToggle = async (id, name, isActive) => {
    if (id === currentUser?.id) {
      alert("Tidak bisa mengubah status akunmu sendiri.");
      return;
    }
    if (!confirm(`${isActive ? "Nonaktifkan" : "Aktifkan"} akun "${name}"?`)) return;
    try {
      await userService.toggleActive(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) { alert(getErrorMessage(err)); }
  };

  // Role stats dari halaman ini (dari page yang sedang dimuat)
  const roleStats = {
    admin:  users.filter((u) => u.role === "admin").length,
    kasir:  users.filter((u) => u.role === "kasir").length,
    user:   users.filter((u) => u.role === "user").length,
    aktif:  users.filter((u) => u.is_active).length,
  };

  const columns = [
    {
      key: "name", label: "Pengguna",
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <UserAvatar name={v} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-sm">{v}</p>
              {row.id === currentUser?.id && (
                <span className="text-[9px] font-black bg-brand-yellow border border-brand-black px-1 py-0.5">
                  SAYA
                </span>
              )}
            </div>
            <p className="text-xs text-brand-black/40 font-mono">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role", label: "Role",
      render: (v) => <NeoBadge color={ROLE_COLOR[v] ?? "gray"}>{getRoleLabel(v)}</NeoBadge>,
    },
    {
      key: "phone", label: "No. HP",
      render: (v) => <span className="font-mono text-xs">{v ?? "-"}</span>,
    },
    {
      key: "is_active", label: "Status",
      render: (v) => <NeoBadge color={v ? "green" : "red"}>{v ? "Aktif" : "Nonaktif"}</NeoBadge>,
    },
    {
      key: "created_at", label: "Bergabung",
      render: (v) => <span className="text-xs font-mono">{formatDateTime(v)}</span>,
    },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <div className="flex gap-2">
          <NeoButton size="sm" variant="secondary" onClick={() => openModal(row)}>Edit</NeoButton>
          {id !== currentUser?.id ? (
            <>
              {/* Quick role toggle — kasir ↔ admin */}
              {(row.role === "kasir" || row.role === "admin") && (
                <NeoButton
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRoleChange(id, row.name, row.role === "kasir" ? "admin" : "kasir")}
                  title={row.role === "kasir" ? "Jadikan Admin" : "Jadikan Kasir"}
                >
                  {row.role === "kasir" ? "→ Admin" : "→ Kasir"}
                </NeoButton>
              )}
              <NeoButton
                size="sm"
                variant={row.is_active ? "danger" : "secondary"}
                onClick={() => handleToggle(id, row.name, row.is_active)}
              >
                {row.is_active ? "Nonaktifkan" : "Aktifkan"}
              </NeoButton>
              {row.role !== "developer" && (
                <NeoButton
                  size="sm"
                  variant="danger"
                  onClick={() => setDeleteModal({ open: true, data: row })}
                  title="Hapus permanen"
                >
                  <Trash2 size={13} />
                </NeoButton>
              )}
            </>
          ) : (
            <span className="px-2 py-1 text-[10px] font-black bg-brand-cream border-2 border-brand-black/20 text-brand-black/40">
              Akun Saya
            </span>
          )}
        </div>
      ),
    },
  ];

  if (denied) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 page-fade">
      <div className="w-20 h-20 bg-red-100 border-2 border-brand-black flex items-center justify-center"
        style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
        <ShieldOff size={36} className="text-red-500" strokeWidth={2} />
      </div>
      <h2 className="text-2xl font-black font-grotesk">Akses Ditolak</h2>
      <p className="text-sm text-brand-black/50 text-center max-w-xs">
        Halaman ini hanya bisa diakses oleh <span className="font-bold text-brand-black">Developer</span> atau <span className="font-bold text-brand-black">Admin</span>.
      </p>
    </div>
  );

  return (
    <div className="space-y-5 max-w-5xl page-fade">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Pengguna</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? users.length} pengguna terdaftar</p>
        </div>
        <NeoButton onClick={() => openModal()}>
          <UserPlus size={15} />Tambah Pengguna
        </NeoButton>
      </div>

      {/* ── Role Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Pengguna", value: meta?.total ?? users.length,  bg: "#ffffff",  fg: "#0A0A0A" },
          { label: "Admin",          value: roleStats.admin,               bg: "#0A0A0A",  fg: "#ffffff" },
          { label: "Kasir",          value: roleStats.kasir,               bg: "#FFE500",  fg: "#0A0A0A" },
          { label: "Akun Aktif",     value: roleStats.aktif,               bg: "#dcfce7",  fg: "#0A0A0A" },
        ].map((s) => (
          <NeoCard key={s.label} className="flex items-center gap-3 py-3" style={{ backgroundColor: s.bg, color: s.fg }}>
            <div>
              <p className="text-xs font-black uppercase tracking-widest opacity-60 font-mono">{s.label}</p>
              <p className="text-2xl font-black font-mono">{s.value}</p>
            </div>
          </NeoCard>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex gap-3 flex-wrap">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        />
        <select
          onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="kasir">Kasir</option>
          <option value="user">Pelanggan</option>
          <option value="developer">Developer</option>
        </select>
        <select
          onChange={(e) => setFilters((p) => ({ ...p, is_active: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
      </div>

      {/* ── Table ── */}
      <NeoTable columns={columns} data={users} isLoading={isLoading} emptyText="Tidak ada pengguna" />

      {/* ── Pagination ── */}
      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black
                ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      <NeoModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, data: null })}
        title="Hapus Pengguna"
        footer={
          <div className="flex gap-3 justify-end">
            <NeoButton variant="ghost" onClick={() => setDeleteModal({ open: false, data: null })} disabled={deleting}>
              Batal
            </NeoButton>
            <NeoButton variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Menghapus..." : "Ya, Hapus Permanen"}
            </NeoButton>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 border-2 border-red-400">
            <Trash2 size={20} className="text-red-500 shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-800">Tindakan ini tidak bisa dibatalkan!</p>
              <p className="text-xs text-red-600 mt-0.5">Semua data terkait user ini akan ikut terhapus.</p>
            </div>
          </div>
          {deleteModal.data && (
            <div className="p-3 bg-white border-2 border-brand-black/20 rounded">
              <p className="text-xs text-brand-black/50 font-mono mb-1">User yang akan dihapus:</p>
              <p className="font-bold text-brand-black">{deleteModal.data.name}</p>
              <p className="text-xs text-brand-black/50 font-mono">{deleteModal.data.email}</p>
            </div>
          )}
        </div>
      </NeoModal>

      {/* ── Add/Edit Modal ── */}
      <NeoModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? "Edit Pengguna" : "Tambah Pengguna"}
        footer={
          <div className="flex gap-3 justify-end">
            <NeoButton variant="ghost" onClick={() => setModal({ open: false, data: null })} disabled={saving}>
              Batal
            </NeoButton>
            <NeoButton variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </NeoButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{formError}</p>
          )}

          {/* Self-edit warning */}
          {modal.data?.id === currentUser?.id && (
            <div className="flex items-center gap-2 bg-brand-yellow/40 border-2 border-brand-black p-3"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <span className="text-sm font-bold">Kamu sedang mengedit akunmu sendiri.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <NeoInput
              label="Nama Lengkap *" id="u-name" required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="John Doe"
            />
            <NeoInput
              label="No. Telepon" id="u-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              placeholder="08xxx"
            />
          </div>

          <NeoInput
            label="Email *" id="u-email" type="email" required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="user@email.com"
          />

          <NeoInput
            label={modal.data ? "Password Baru (kosongkan jika tidak ubah)" : "Password *"}
            id="u-password" type="password" required={!modal.data}
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="Min. 8 karakter"
          />

          {form.password && (
            <NeoInput
              label="Konfirmasi Password *"
              id="u-password-confirm" type="password" required
              value={form.password_confirmation}
              onChange={(e) => setForm((p) => ({ ...p, password_confirmation: e.target.value }))}
              placeholder="Ulangi password baru"
            />
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              disabled={modal.data?.id === currentUser?.id}
              className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white focus:border-brand-yellow disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
              <option value="user">Pelanggan</option>
              <option value="developer">Developer</option>
            </select>
            {modal.data?.id === currentUser?.id && (
              <p className="text-[11px] text-brand-black/50">Role tidak bisa diubah untuk akun sendiri.</p>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              disabled={modal.data?.id === currentUser?.id}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 border-2 border-brand-black disabled:opacity-50"
            />
            <span className="text-sm font-bold">Akun aktif</span>
          </label>
        </form>
      </NeoModal>
    </div>
  );
}
