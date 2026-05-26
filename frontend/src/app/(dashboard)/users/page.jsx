"use client";

import { useState, useEffect } from "react";
import userService   from "@/services/userService";
import { useDebounce } from "@/hooks/useDebounce";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoButton from "@/components/ui/NeoButton";
import NeoModal  from "@/components/ui/NeoModal";
import NeoInput  from "@/components/ui/NeoInput";
import { formatDateTime, getRoleLabel, getErrorMessage } from "@/lib/utils";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", role: "kasir", is_active: true };
const ROLE_COLOR = { admin: "black", kasir: "yellow", user: "gray" };

export default function UsersPage() {
  const [users,     setUsers]     = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search,    setSearch]    = useState("");
  const [filters,   setFilters]   = useState({ page: 1, per_page: 10 });
  const [modal,     setModal]     = useState({ open: false, data: null });
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [formError, setFormError] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll({ ...filters, search: debouncedSearch });
      setUsers(data.data ?? []);
      setMeta(data.meta ?? null);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters, debouncedSearch]);

  const openModal = (data = null) => {
    setForm(data
      ? { name: data.name, email: data.email, password: "", phone: data.phone ?? "", role: data.role, is_active: data.is_active }
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
      if (!payload.password) delete payload.password;
      if (modal.data) await userService.update(modal.data.id, payload);
      else            await userService.create(payload);
      setModal({ open: false, data: null });
      fetchData();
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id, name, isActive) => {
    if (!confirm(`${isActive ? "Nonaktifkan" : "Aktifkan"} akun "${name}"?`)) return;
    try {
      await userService.toggleActive(id);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const columns = [
    {
      key: "name", label: "Pengguna",
      render: (v, row) => (
        <div>
          <p className="font-bold text-sm">{v}</p>
          <p className="text-xs text-brand-black/40 font-mono">{row.email}</p>
        </div>
      ),
    },
    { key: "role",      label: "Role",     render: (v) => <NeoBadge color={ROLE_COLOR[v] ?? "gray"}>{getRoleLabel(v)}</NeoBadge> },
    { key: "phone",     label: "No. HP",   render: (v) => <span className="font-mono text-xs">{v ?? "-"}</span> },
    { key: "is_active", label: "Status",   render: (v) => <NeoBadge color={v ? "green" : "red"}>{v ? "Aktif" : "Nonaktif"}</NeoBadge> },
    { key: "created_at", label: "Bergabung", render: (v) => <span className="text-xs font-mono">{formatDateTime(v)}</span> },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <div className="flex gap-2">
          <NeoButton size="sm" variant="secondary" onClick={() => openModal(row)}>Edit</NeoButton>
          <NeoButton size="sm" variant={row.is_active ? "danger" : "secondary"} onClick={() => handleToggle(id, row.name, row.is_active)}>
            {row.is_active ? "Nonaktifkan" : "Aktifkan"}
          </NeoButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl page-fade">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-grotesk">Pengguna</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} pengguna terdaftar</p>
        </div>
        <NeoButton onClick={() => openModal()}>+ Tambah Pengguna</NeoButton>
      </div>

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

      <NeoTable columns={columns} data={users} isLoading={isLoading} emptyText="Tidak ada pengguna" />

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Add/Edit User Modal */}
      <NeoModal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? "Edit Pengguna" : "Tambah Pengguna"}
        footer={
          <div className="flex gap-3 justify-end">
            <NeoButton variant="ghost" onClick={() => setModal({ open: false, data: null })} disabled={saving}>Batal</NeoButton>
            <NeoButton variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan"}
            </NeoButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{formError}</p>}

          <div className="grid grid-cols-2 gap-3">
            <NeoInput label="Nama Lengkap *" id="u-name" required value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="John Doe" />
            <NeoInput label="No. Telepon" id="u-phone" value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="08xxx" />
          </div>

          <NeoInput label="Email *" id="u-email" type="email" required value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="user@email.com" />

          <NeoInput label={modal.data ? "Password Baru (kosongkan jika tidak ubah)" : "Password *"}
            id="u-password" type="password" required={!modal.data} value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} placeholder="Min. 8 karakter" />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold">Role *</label>
            <select
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white focus:border-brand-yellow"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              <option value="kasir">Kasir</option>
              <option value="admin">Admin</option>
              <option value="user">Pelanggan</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))} />
            <span className="text-sm font-bold">Akun aktif</span>
          </label>
        </form>
      </NeoModal>
    </div>
  );
}
