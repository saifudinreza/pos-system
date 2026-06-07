"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

const EMPTY_FORM = {
  name: "", sku: "", description: "",
  price: "", stock: "", stock_alert: "5",
  category_id: "", is_active: true, image: null,
};

function generateSku(name) {
  const suffix = Math.floor(100 + Math.random() * 900);
  const parts = name.trim().split(/\s+/).filter(Boolean).map((w) => w.slice(0, 3).toUpperCase());
  return parts.length ? parts.join("-") + "-" + suffix : "SKU-" + suffix;
}

function StockBadge({ stock, stockAlert }) {
  if (stock === 0)                          return <NeoBadge color="red">Habis</NeoBadge>;
  if (stock > 0 && stock <= stockAlert)     return <NeoBadge color="orange">Menipis</NeoBadge>;
  return <NeoBadge color="green">Normal</NeoBadge>;
}

export default function ProductsPage() {
  const [search, setSearch]         = useState("");
  const debouncedSearch             = useDebounce(search, 500);

  const { products, meta, isLoading, updateFilters, goToPage, deleteProduct, refetch: refreshProducts } =
    useProducts({ search: debouncedSearch });

  const [categories,  setCategories] = useState([]);
  const [modal,       setModal]      = useState({ open: false, data: null });
  const [form,        setForm]       = useState(EMPTY_FORM);
  const [preview,     setPreview]    = useState(null);
  const [saving,      setSaving]     = useState(false);
  const [formError,   setFormError]  = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    categoryService.getAll({ is_active: true })
      .then((res) => setCategories(res.data ?? res))
      .catch(() => {});
  }, []);

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
    setPreview(data?.image_url ?? null);
    setModal({ open: true, data });
    setFormError("");
  };

  const closeModal = () => {
    setModal({ open: false, data: null });
    setPreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((p) => ({ ...p, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleFieldChange = (field) => (e) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleAutoSku = () => {
    if (!form.name.trim()) return;
    setForm((p) => ({ ...p, sku: generateSku(p.name) }));
  };

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

  const handleToggleStatus = async (row) => {
    try {
      await productService.update(row.id, {
        name: row.name,
        sku: row.sku,
        price: row.price,
        stock: row.stock,
        stock_alert: row.stock_alert,
        category_id: row.category_id ?? row.category?.id ?? "",
        is_active: !row.is_active,
      });
      refreshProducts();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleStockFilter = (type) => {
    setActiveFilter(type);
    if (type === "low") {
      updateFilters({ low_stock: "true", page: 1 });
    } else {
      updateFilters({ low_stock: undefined, page: 1 });
    }
  };

  const columns = [
    {
      key: "name", label: "Produk",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          {row.image_url
            ? <img src={row.image_url} alt={val} className="w-9 h-9 object-cover border-2 border-brand-black/20 shrink-0" />
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
        <div className="flex items-center gap-2">
          <span className="font-mono font-black">{v}</span>
          <StockBadge stock={Number(v)} stockAlert={Number(row.stock_alert ?? 5)} />
        </div>
      ),
    },
    {
      key: "is_active", label: "Status",
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
            className={`relative w-10 h-5 border-2 border-brand-black transition-colors shrink-0 ${v ? "bg-brand-yellow" : "bg-brand-gray"}`}
            style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
            title={v ? "Nonaktifkan" : "Aktifkan"}
          >
            <span
              className={`absolute top-[1px] w-3.5 h-3.5 border-2 border-brand-black bg-white transition-all ${v ? "left-[18px]" : "left-[1px]"}`}
            />
          </button>
          <NeoBadge color={v ? "green" : "gray"}>{v ? "Aktif" : "Nonaktif"}</NeoBadge>
        </div>
      ),
    },
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

  const PLAN_LABEL = { free: "Free", pro: "Pro", enterprise: "Enterprise" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black font-grotesk">Produk</h2>
          <p className="text-sm text-brand-black/50">
            {meta?.is_limited
              ? `${meta.total} dari ${meta.total_in_tenant} produk ditampilkan · ${PLAN_LABEL[meta.plan] ?? meta.plan}`
              : `${meta?.total ?? 0} produk`
            }
          </p>
        </div>
        <NeoButton onClick={() => openModal()}>+ Tambah Produk</NeoButton>
      </div>

      {/* Plan limit banner */}
      {meta?.is_limited && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-amber-50 border-2 border-amber-400 rounded-md">
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-amber-500 shrink-0">
              <path d="M12 2L2 19h20L12 2z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
            <div>
              <p className="font-black text-amber-800 text-sm">
                Paket {PLAN_LABEL[meta.plan] ?? meta.plan} — hanya {meta.plan_limit} produk yang ditampilkan
              </p>
              <p className="text-xs text-amber-700">
                Toko ini punya {meta.total_in_tenant} produk. Upgrade untuk lihat & kelola semua.
              </p>
            </div>
          </div>
          <Link href="/upgrade">
            <NeoButton size="sm" variant="primary">Upgrade →</NeoButton>
          </Link>
        </div>
      )}

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

      <div className="flex gap-2">
        <button
          onClick={() => handleStockFilter("all")}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-brand-black transition-colors ${activeFilter === "all" ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"}`}
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          Semua
        </button>
        <button
          onClick={() => handleStockFilter("low")}
          className={`px-3 py-1.5 text-sm font-bold border-2 border-brand-black transition-colors ${activeFilter === "low" ? "bg-orange-300" : "bg-white hover:bg-orange-100"}`}
          style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        >
          Stok Rendah
        </button>
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

          <div className="grid grid-cols-2 gap-3">
            <NeoInput label="Nama Produk *" id="prod-name" required
              value={form.name} onChange={handleFieldChange("name")}
              placeholder="Contoh: Es Teh Manis" />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-brand-black">SKU *</label>
              <div className="flex gap-2">
                <input
                  id="prod-sku"
                  required
                  value={form.sku}
                  onChange={handleFieldChange("sku")}
                  placeholder="Contoh: ETM-001"
                  className="flex-1 px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                />
                <button
                  type="button"
                  onClick={handleAutoSku}
                  className="px-3 py-2 text-xs font-bold border-2 border-brand-black bg-brand-yellow hover:bg-brand-yellow/70 shrink-0"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
                  title="Generate SKU dari nama produk"
                >
                  Auto
                </button>
              </div>
            </div>
          </div>

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

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-brand-black">Foto Produk</label>
            <div className="flex items-center gap-4">
              {preview && (
                <img src={preview} alt="preview"
                  className="w-16 h-16 object-cover border-2 border-brand-black shrink-0" />
              )}
              <label className="cursor-pointer flex-1">
                <div className="border-2 border-dashed border-brand-black px-4 py-3 text-center text-sm text-brand-black/50 hover:border-brand-yellow hover:text-brand-black transition-colors">
                  {form.image ? form.image.name : (modal.data?.image_url ? "Ganti foto..." : "Klik untuk pilih foto...")}
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              className="w-4 h-4 border-2 border-brand-black" />
            <span className="text-sm font-bold">Produk aktif (tampil di kasir &amp; katalog)</span>
          </label>
        </form>
      </NeoModal>
    </div>
  );
}
