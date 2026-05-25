"use client";

// ============================================================
// Products Page — Daftar & manajemen produk
//
// Analogi: Ini seperti "buku katalog gudang" —
// bisa lihat semua produk, cari berdasarkan nama/SKU,
// tambah produk baru, edit yang ada, atau hapus yang tidak terpakai.
//
// Alur CRUD produk:
//   Tambah: klik "+ Tambah" → isi form → POST /api/products
//   Edit:   klik "Edit" di baris → form terisi data lama → PUT /api/products/{id}
//   Hapus:  klik "Hapus" → confirm → DELETE /api/products/{id}
//
// Produk dengan gambar dikirim sebagai multipart/form-data (lihat productService.js)
// ============================================================

import { useState, useEffect } from "react";
import { useProducts }    from "@/hooks/useProducts";
import { useDebounce }    from "@/hooks/useDebounce";
import categoryService    from "@/services/categoryService";
import productService     from "@/services/productService";
import NeoButton  from "@/components/ui/NeoButton";
import NeoTable   from "@/components/ui/NeoTable";
import NeoBadge   from "@/components/ui/NeoBadge";
import NeoModal   from "@/components/ui/NeoModal";
import NeoInput   from "@/components/ui/NeoInput";
import { formatCurrency, getImageUrl, getErrorMessage } from "@/lib/utils";

// --- State awal form produk ---
const EMPTY_FORM = {
  name: "", sku: "", description: "",
  price: "", stock: "", stock_alert: "5",
  category_id: "", is_active: true, image: null,
};

export default function ProductsPage() {
  const [search, setSearch]         = useState("");
  const debouncedSearch             = useDebounce(search, 500);

  const { products, meta, isLoading, updateFilters, goToPage, deleteProduct, refetch: refreshProducts } =
    useProducts({ search: debouncedSearch });

  const [categories, setCategories] = useState([]);
  const [modal,      setModal]      = useState({ open: false, data: null });
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [preview,    setPreview]    = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");

  // Ambil semua kategori untuk dropdown di form
  useEffect(() => {
    categoryService.getAll({ is_active: true }).then(setCategories).catch(() => {});
  }, []);

  // Buka modal — jika edit, isi form dengan data produk yang ada
  const openModal = (data = null) => {
    setForm(data
      ? {
          name: data.name, sku: data.sku, description: data.description ?? "",
          price: data.price, stock: data.stock, stock_alert: data.stock_alert ?? "5",
          category_id: data.category_id ?? data.category?.id ?? "",
          is_active: data.is_active, image: null,
        }
      : EMPTY_FORM
    );
    setPreview(data?.image ? getImageUrl(data.image) : null);
    setModal({ open: true, data });
    setFormError("");
  };

  const closeModal = () => {
    setModal({ open: false, data: null });
    setPreview(null);
  };

  // Handle pilih gambar — tampilkan preview sebelum upload
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleFieldChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  // Simpan produk — buat baru atau update yang ada
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        stock_alert: Number(form.stock_alert),
        // Jangan kirim field image jika tidak ada file baru
        ...(form.image ? { image: form.image } : {}),
      };
      if (!form.image) delete payload.image;

      if (modal.data) await productService.update(modal.data.id, payload);
      else            await productService.create(payload);

      closeModal();
      refreshProducts();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;
    try { await deleteProduct(id); }
    catch (err) { alert(getErrorMessage(err)); }
  };

  const columns = [
    {
      key: "name", label: "Produk",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.image
            ? <img src={getImageUrl(row.image)} alt={val} className="w-9 h-9 object-cover border-2 border-brand-black/20 shrink-0" />
            : <div className="w-9 h-9 bg-brand-gray border-2 border-brand-black/10 shrink-0 flex items-center justify-center text-xs text-brand-black/30">📦</div>
          }
          <div>
            <p className="font-bold text-sm">{val}</p>
            <p className="text-[10px] text-brand-black/40 font-mono">{row.sku}</p>
          </div>
        </div>
      ),
    },
    { key: "category",  label: "Kategori", render: (v) => v?.name ?? <span className="text-brand-black/30">-</span> },
    { key: "price",     label: "Harga",    render: (v) => <span className="font-mono font-bold">{formatCurrency(v)}</span> },
    {
      key: "stock", label: "Stok",
      render: (v, row) => (
        <span className={`font-mono font-black ${row.is_low_stock ? "text-red-600" : "text-green-700"}`}>
          {v} {row.is_low_stock && "⚠️"}
        </span>
      ),
    },
    { key: "is_active", label: "Status", render: (v) => <NeoBadge color={v ? "green" : "gray"}>{v ? "Aktif" : "Nonaktif"}</NeoBadge> },
    {
      key: "id", label: "Aksi",
      render: (id, row) => (
        <div className="flex gap-2">
          <NeoButton size="sm" variant="secondary" onClick={() => openModal(row)}>Edit</NeoButton>
          <NeoButton size="sm" variant="danger" onClick={() => handleDelete(id, row.name)}>Hapus</NeoButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Produk</h2>
          <p className="text-sm text-brand-black/50">{meta?.total ?? 0} produk</p>
        </div>
        <NeoButton onClick={() => openModal()}>+ Tambah Produk</NeoButton>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari produk atau SKU..."
          className="flex-1 min-w-[200px] px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
        <select onChange={(e) => updateFilters({ is_active: e.target.value, page: 1 })}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Nonaktif</option>
        </select>
        <select onChange={(e) => updateFilters({ category_id: e.target.value, page: 1 })}
          className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
          <option value="">Semua Kategori</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <NeoTable columns={columns} data={products} isLoading={isLoading} emptyText="Belum ada produk" />

      {meta && meta.last_page > 1 && (
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: Math.min(meta.last_page, 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => goToPage(p)}
              className={`w-9 h-9 text-sm font-bold border-2 border-brand-black ${p === meta.current_page ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>{p}</button>
          ))}
        </div>
      )}

      {/* ============================================================
          Modal Tambah / Edit Produk
          Analogi: "formulir pendaftaran produk" — buka saat tambah atau edit
          ============================================================ */}
      <NeoModal
        isOpen={modal.open}
        onClose={closeModal}
        size="lg"
        title={modal.data ? "Edit Produk" : "Tambah Produk"}
        footer={
          <div className="flex gap-3 justify-end">
            <NeoButton variant="ghost" onClick={closeModal} disabled={saving}>Batal</NeoButton>
            <NeoButton variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Produk"}
            </NeoButton>
          </div>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{formError}</p>
          )}

          {/* Baris 1: Nama + SKU */}
          <div className="grid grid-cols-2 gap-3">
            <NeoInput label="Nama Produk *" id="prod-name" required
              value={form.name} onChange={handleFieldChange("name")}
              placeholder="Contoh: Es Teh Manis" />
            <NeoInput label="SKU *" id="prod-sku" required
              value={form.sku} onChange={handleFieldChange("sku")}
              placeholder="Contoh: ETM-001" />
          </div>

          {/* Baris 2: Harga + Stok + Min. Stok */}
          <div className="grid grid-cols-3 gap-3">
            <NeoInput label="Harga (Rp) *" id="prod-price" type="number" required min="0"
              value={form.price} onChange={handleFieldChange("price")}
              placeholder="5000" />
            <NeoInput label="Stok *" id="prod-stock" type="number" required min="0"
              value={form.stock} onChange={handleFieldChange("stock")}
              placeholder="100" />
            <NeoInput label="Min. Stok" id="prod-alert" type="number" min="0"
              value={form.stock_alert} onChange={handleFieldChange("stock_alert")}
              placeholder="5" />
          </div>

          {/* Kategori */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-brand-black">Kategori</label>
            <select
              value={form.category_id}
              onChange={handleFieldChange("category_id")}
              className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white focus:border-brand-yellow"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Deskripsi */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-bold text-brand-black">Deskripsi</label>
            <textarea
              value={form.description}
              onChange={handleFieldChange("description")}
              placeholder="Deskripsi produk (opsional)..."
              rows={3}
              className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow resize-none"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            />
          </div>

          {/* Gambar produk */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-brand-black">Foto Produk</label>
            <div className="flex items-center gap-4">
              {/* Preview gambar */}
              {preview && (
                <img src={preview} alt="preview"
                  className="w-16 h-16 object-cover border-2 border-brand-black shrink-0" />
              )}
              <label className="cursor-pointer flex-1">
                <div className="border-2 border-dashed border-brand-black px-4 py-3 text-center text-sm text-brand-black/50 hover:border-brand-yellow hover:text-brand-black transition-colors">
                  {form.image ? form.image.name : (modal.data?.image ? "Ganti foto..." : "Klik untuk pilih foto...")}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Status aktif */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 border-2 border-brand-black" />
            <span className="text-sm font-bold">Produk aktif (tampil di kasir & katalog)</span>
          </label>
        </form>
      </NeoModal>
    </div>
  );
}
