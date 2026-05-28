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
import categoryService from "@/services/categoryService";
import NeoButton from "@/components/ui/NeoButton";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoModal  from "@/components/ui/NeoModal";
import NeoInput  from "@/components/ui/NeoInput";
import { getErrorMessage } from "@/lib/utils";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading,  setIsLoading]  = useState(false);
  const [modal,      setModal]      = useState({ open: false, data: null });
  const [form,       setForm]       = useState({ name: "", is_active: true });
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try { setCategories(await categoryService.getAll()); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const openModal = (data = null) => {
    setForm(data ? { name: data.name, is_active: data.is_active } : { name: "", is_active: true });
    setModal({ open: true, data });
    setError("");
  };

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

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus kategori "${name}"?`)) return;
    try { await categoryService.delete(id); fetchData(); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const columns = [
    { key: "name",      label: "Nama Kategori" },
    { key: "slug",      label: "Slug", render: (v) => <span className="font-mono text-xs text-brand-black/50">{v}</span> },
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

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black font-grotesk">Kategori</h2>
        <NeoButton onClick={() => openModal()}>+ Tambah Kategori</NeoButton>
      </div>

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
        <form onSubmit={handleSave} className="space-y-4">
          {error && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border border-red-300">{error}</p>}
          <NeoInput label="Nama Kategori" required id="cat-name"
            value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="Contoh: Minuman, Makanan..." />
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 border-2 border-brand-black" />
            <span className="text-sm font-bold">Kategori aktif</span>
          </label>
        </form>
      </NeoModal>
    </div>
  );
}
