"use client";

// Users Page — Manajemen pengguna (admin only, GET/PUT/PATCH /api/users)
import { useState, useEffect } from "react";
import userService from "@/services/userService";
import { useDebounce } from "@/hooks/useDebounce";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoButton from "@/components/ui/NeoButton";
import { formatDateTime, getRoleLabel, getErrorMessage } from "@/lib/utils";

export default function UsersPage() {
  const [users,     setUsers]     = useState([]);
  const [meta,      setMeta]      = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [search,    setSearch]    = useState("");
  const [filters,   setFilters]   = useState({ page: 1, per_page: 10 });
  const debouncedSearch           = useDebounce(search, 500);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await userService.getAll({ ...filters, search: debouncedSearch });
      setUsers(data.data ?? []);
      setMeta(data.meta ?? null);
    } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, [filters, debouncedSearch]);

  const handleToggle = async (id, name, isActive) => {
    if (!confirm(`${isActive ? "Nonaktifkan" : "Aktifkan"} akun "${name}"?`)) return;
    try {
      await userService.toggleActive(id);
      // Update lokal tanpa refetch
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, is_active: !u.is_active } : u));
    } catch (err) { alert(getErrorMessage(err)); }
  };

  const ROLE_COLOR = { admin: "black", kasir: "yellow", user: "gray" };

  const columns = [
    {
      key: "name", label: "Nama",
      render: (v, row) => (
        <div>
          <p className="font-bold text-sm">{v}</p>
          <p className="text-xs text-brand-black/40">{row.email}</p>
        </div>
      ),
    },
    { key: "role",       label: "Role",     render: (v) => <NeoBadge color={ROLE_COLOR[v] ?? "gray"}>{getRoleLabel(v)}</NeoBadge> },
    { key: "phone",      label: "No. HP",   render: (v) => v ?? "-" },
    { key: "is_active",  label: "Status",   render: (v) => <NeoBadge color={v ? "green" : "red"}>{v ? "Aktif" : "Nonaktif"}</NeoBadge> },
    { key: "created_at", label: "Bergabung", render: (v) => formatDateTime(v) },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <NeoButton
          size="sm"
          variant={row.is_active ? "danger" : "secondary"}
          onClick={() => handleToggle(id, row.name, row.is_active)}
        >
          {row.is_active ? "Nonaktifkan" : "Aktifkan"}
        </NeoButton>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Pengguna</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} pengguna terdaftar</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
        <select onChange={(e) => setFilters((p) => ({ ...p, role: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
          <option value="">Semua Role</option>
          <option value="admin">Admin</option>
          <option value="kasir">Kasir</option>
          <option value="user">Pelanggan</option>
        </select>
      </div>

      <NeoTable columns={columns} data={users} isLoading={isLoading} emptyText="Tidak ada pengguna" />

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setFilters((prev) => ({ ...prev, page: p }))}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>{p}</button>
          ))}
        </div>
      )}
    </div>
  );
}
