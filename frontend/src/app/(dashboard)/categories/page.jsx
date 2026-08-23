"use client";

// ============================================================
// CategoriesPage — CRUD kategori produk
//
// Kategori dipakai untuk:
//   1. Filter di halaman kasir (tab horizontal)
//   2. Pengelompokan produk di tabel produk
//
// Alur data:
//   GET    /api/categories      → tampilkan tabel
//   POST   /api/categories      → tambah kategori baru
//   PUT    /api/categories/{id} → edit kategori
//   DELETE /api/categories/{id} → hapus (gagal kalau ada produk terkait)
//
// Slug di-generate otomatis dari nama di backend (CategorySeeder/Model boot)
// ============================================================
import { useState, useEffect } from "react";
import Link from "next/link";
import categoryService from "@/services/categoryService";
import tenantService    from "@/services/tenantService";
import { useAuthStore } from "@/stores/authStore";
import NeoButton from "@/components/ui/NeoButton";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoModal  from "@/components/ui/NeoModal";
import NeoInput  from "@/components/ui/NeoInput";
import { getErrorMessage } from "@/lib/utils";

const PLAN_LABEL = { free: "Free", pro: "Pro", enterprise: "Enterprise" };

export default function CategoriesPage() {
  // ── State ──
  // planMeta: info limit paket dari backend ({ plan, plan_limit, is_limited, ... })
  const [categories, setCategories] = useState([]);
  const [planMeta,   setPlanMeta]   = useState(null); // { plan, plan_limit, is_limited, total_in_tenant }
  const [isLoading,  setIsLoading]  = useState(false);
  const [modal,      setModal]      = useState({ open: false, data: null });
  const [form,       setForm]       = useState({ name: "", is_active: true });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  // ── Developer: pilih tenant untuk memfilter kategori (lihat 1 tenant saja) ──
  const isDeveloper     = useAuthStore((s) => s.isDeveloper());
  const [tenants,       setTenants]       = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(""); // "" = semua tenant (default developer)
  const [sort,          setSort]           = useState({ sort_by: "name", sort_order: "asc" });

  /** fetchData — Ambil daftar kategori + meta limit paket dari backend. */
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (isDeveloper && selectedTenant) params.tenant_id = selectedTenant;
      // Sortir (developer boleh sortir berdasarkan tenant)
      if (isDeveloper) {
        params.sort_by = sort.sort_by;
        params.sort_order = sort.sort_order;
      }
      const res = await categoryService.getAll(params);
      setCategories(res.data ?? res);
      if (res.meta) setPlanMeta(res.meta);
    }
    finally { setIsLoading(false); }
  };

  // Ambil daftar tenant (developer) sekali saat halaman dibuka
  useEffect(() => {
    if (isDeveloper) {
      tenantService.getAll()
        .then((res) => setTenants(res.data ?? []))
        .catch(() => {});
    }
  }, [isDeveloper]);

  useEffect(() => { fetchData(); }, [isDeveloper, selectedTenant, sort]);

  /** handleTenantChange — Ganti tenant yang difilter (developer only). */
  const handleTenantChange = (e) => {
    setSelectedTenant(e.target.value);
  };

  /** handleSortChange — Sortir tabel (developer only, termasuk berdasarkan tenant). */
  const handleSortChange = (e) => {
    const [sort_by, sort_order] = e.target.value.split(":");
    setSort({ sort_by, sort_order });
  };

  /** openModal — Buka modal tambah (data=null) atau edit (data=kategori). */
  const openModal = (data = null) => {
    setForm(data ? { name: data.name, is_active: data.is_active } : { name: "", is_active: true });
    setModal({ open: true, data });
    setError("");
  };

  /** handleSave — Simpan kategori (create/update) lalu refresh tabel. */
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.data) await categoryService.update(modal.data.id, form);
      else            await categoryService.create(form);
      setModal({ open: false, data: null });
      fetchData();
    } catch (err) { setError(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  /** handleDelete — Hapus kategori (gagal kalau masih ada produk terkait). */
  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try { await categoryService.delete(id); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  // ── Definisi kolom tabel ──
  const columns = [
    { key: "name",      label: "Nama Kategori" },
    { key: "slug",      label: "Slug", render: (v) => <span className="font-mono text-xs text-brand-black/50">{v}</span> },
    ...(isDeveloper ? [{
      key: "tenant", label: "Tenant",
      render: (v) => v?.name ?? <span className="text-brand-black/30">-</span>,
    }] : []),
    { key: "is_active", label: "Status", render: (v) => <NeoBadge color={v ? "green" : "gray"}>{v ? "Aktif" : "Nonaktif"}</NeoBadge> },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <div className="flex gap-2">
          <NeoButton size="sm" variant="secondary" onClick={() => openModal(row)}>Edit</NeoButton>
          <NeoButton size="sm" variant="danger"    onClick={() => handleDelete(id, row.name)}>Hapus</NeoButton>
        </div>
      ),
    },
  ];

  // ── Render: header → banner limit plan → tabel → modal tambah/edit ──
  return (
    <div className="space-y-5 rounded-md">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Kategori</h2>
          {planMeta && (
            <p className="text-xs text-brand-black/40 font-mono mt-0.5">
              {planMeta.is_limited
                ? `Menampilkan ${categories.length} dari ${planMeta.total_in_tenant} kategori (${PLAN_LABEL[planMeta.plan] ?? planMeta.plan} tier)`
                : `${categories.length} kategori · ${PLAN_LABEL[planMeta.plan] ?? planMeta.plan}`
              }
            </p>
          )}
        </div>
        <NeoButton className="ml-4 rounded-md" onClick={() => openModal()}>+ Tambah Kategori</NeoButton>
      </div>

      {/* Developer: pilih tenant untuk memfilter kategori */}
      {isDeveloper && (
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-brand-black">Tenant</label>
            <select onChange={handleTenantChange} value={selectedTenant}
              className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white font-bold"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <option value="">Semua Tenant</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}{t.is_active === false ? " (nonaktif)" : ""}
                </option>
              ))}
            </select>
            <label className="text-sm font-bold text-brand-black">Urut</label>
            <select onChange={handleSortChange} value={`${sort.sort_by}:${sort.sort_order}`}
              className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white font-bold"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <option value="name:asc">Nama A-Z</option>
              <option value="created_at:desc">Terbaru</option>
              <option value="tenant:asc">Tenant A-Z</option>
            </select>
          </div>
        )}

      {/* Plan limit banner */}
      {planMeta?.is_limited && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border-2 border-amber-400 rounded-md">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-500 shrink-0">
              <path d="M12 2L2 19h20L12 2z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
            <div>
              <p className="font-black text-amber-800 text-sm">
                Paket {PLAN_LABEL[planMeta.plan] ?? planMeta.plan} — hanya {planMeta.plan_limit} kategori yang ditampilkan
              </p>
              <p className="text-xs text-amber-700">
                Toko ini punya {planMeta.total_in_tenant} kategori. Upgrade untuk lihat semua.
              </p>
            </div>
          </div>
          <Link href="/upgrade">
            <NeoButton size="sm" variant="primary">Upgrade →</NeoButton>
          </Link>
        </div>
      )}

      <NeoTable columns={columns} data={categories} isLoading={isLoading} emptyText="Belum ada kategori" />

      <NeoModal
        isOpen={modal.open} onClose={() => setModal({ open: false, data: null })}
        title={modal.data ? "Edit Kategori" : "Tambah Kategori"}
        footer={
          <>
            <NeoButton variant="ghost" onClick={() => setModal({ open: false, data: null })}>Batal</NeoButton>
            <NeoButton variant="primary" onClick={handleSave} disabled={saving}>{saving ? "Menyimpan..." : "Simpan"}</NeoButton>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4 ">
          {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border border-red-300 ">{error}</p>}
          <NeoInput className="" label="Nama Kategori" required id="cat-name"
            value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Contoh: Minuman, Makanan..." />
          <label className="flex items-center gap-3 cursor-pointer ">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 border-2 border-brand-black " />
            <span className="text-sm font-bold ">Kategori aktif</span>
          </label>
        </form>
      </NeoModal>
    </div>
  );
}
