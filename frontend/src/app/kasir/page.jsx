"use client";

// ============================================================
// KasirPage — Halaman Point of Sale (POS)
//
// Analogi: Ini seperti mesin kasir digital —
// kasir pilih produk → masuk keranjang → checkout → bayar via Midtrans.
//
// ALUR LENGKAP:
//   1. Halaman load → ambil daftar produk + kategori dari API
//   2. Kasir klik produk → produk masuk keranjang (cartStore.addItem)
//   3. Kasir klik BAYAR → handleCheckout():
//      a. Buat order:       POST /api/orders       → dapat order_id
//      b. Buat transaksi:   POST /api/transactions  → dapat snap_token Midtrans
//      c. Buka popup bayar: window.snap.pay(snapToken)
//      d. Setelah bayar:    Midtrans kirim webhook ke backend
//      e. Backend update:   order.status → paid, transaction.status → settlement
//
// STRUKTUR LAYOUT (dua kolom):
//   Left  (flex-1, ~60%): Grid produk + search + filter kategori
//   Right (w-80, ~40%):   Keranjang + ringkasan harga + tombol bayar
//
//   Di mobile: keranjang tersembunyi → buka via tombol 🛒 (slide-over dari kanan)
//
// State management:
//   - cartStore (Zustand): keranjang — persists selama sesi, tidak hilang saat navigate
//   - useState lokal: products, categories, search, loading, dll
//
// Relasi:
//   - KasirPage → cartStore (tambah/kurangi/hapus item)
//   - KasirPage → productService (ambil daftar produk)
//   - KasirPage → categoryService (ambil kategori untuk filter)
//   - KasirPage → orderService (buat order saat checkout)
//   - KasirPage → transactionService (buat transaksi + dapat snap_token)
//   - KasirPage → window.snap (Midtrans Snap SDK untuk popup pembayaran)
// ============================================================

import { useState, useEffect, useRef } from "react";
import productService     from "@/services/productService";
import categoryService    from "@/services/categoryService";
import orderService       from "@/services/orderService";
import transactionService from "@/services/transactionService";
import useCartStore       from "@/stores/cartStore";
import useAuthStore       from "@/stores/authStore";
import { formatCurrency, getImageUrl, getErrorMessage } from "@/lib/utils";
import { useDebounce }    from "@/hooks/useDebounce";

// ============================================================
// QuickProductPanel — Panel slide-over untuk kelola produk
//
// Kasir bisa tambah/edit/hapus produk langsung dari halaman kasir
// tanpa harus pergi ke menu Produk. Berguna saat ada produk baru
// saat sedang melayani pelanggan.
//
// Ada dua "mode":
//   editTarget === null  → tampilkan list produk (LIST VIEW)
//   editTarget === {}    → form tambah produk baru (FORM VIEW)
//   editTarget === {...} → form edit produk yang ada (FORM VIEW)
// ============================================================
const EMPTY_PROD = {
  name: "", sku: "", price: "", stock: "", stock_alert: "5",
  category_id: "", is_active: true, image: null
};

function QuickProductPanel({ isOpen, onClose, categories, onProductSaved }) {
  const [list,       setList]      = useState([]);     // daftar produk
  const [loading,    setLoading]   = useState(false);
  const [editTarget, setEdit]      = useState(null);   // null=list, {}=baru, {id}=edit
  const [form,       setForm]      = useState(EMPTY_PROD);
  const [preview,    setPreview]   = useState(null);   // URL preview gambar yang dipilih
  const [saving,     setSaving]    = useState(false);
  const [formErr,    setFormErr]   = useState("");
  const [search,     setSearch]    = useState("");
  // useDebounce: tunda request sampai user berhenti ketik 400ms
  const debouncedS = useDebounce(search, 400);

  // Ambil list produk dari API
  // Dependency: isOpen (hanya fetch kalau panel terbuka) + debouncedS (refresh saat search berubah)
  const loadList = async () => {
    setLoading(true);
    try {
      const res = await productService.getAll({ search: debouncedS || undefined, per_page: 30 });
      setList(res.data ?? []);
    } finally { setLoading(false); }
  };

  // useEffect: fetch list saat panel dibuka ATAU search berubah
  // editTarget === null: hanya refresh kalau sedang di mode list (bukan form)
  useEffect(() => { if (isOpen && editTarget === null) loadList(); }, [isOpen, debouncedS]);

  // Buka form tambah produk baru
  const openNew = () => { setForm(EMPTY_PROD); setPreview(null); setEdit({}); setFormErr(""); };

  // Buka form edit produk yang sudah ada
  // Pre-fill form dengan data produk yang dipilih
  const openEdit = (p) => {
    setForm({
      name: p.name, sku: p.sku ?? "", price: p.price,
      stock: p.stock, stock_alert: p.stock_alert ?? 5,
      category_id: p.category_id ?? p.category?.id ?? "",
      is_active: p.is_active, image: null
    });
    // Tampilkan preview gambar yang sudah ada (image_url sudah full URL dari backend)
    setPreview(p.image_url ?? null);
    setEdit(p);
    setFormErr("");
  };

  // Kembali ke list dan refresh
  const backToList = () => { setEdit(null); setPreview(null); loadList(); };

  // Handle pilih gambar — buat URL preview lokal dari File object
  const handleImg = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setForm((p) => ({ ...p, image: f }));
    // URL.createObjectURL: buat URL sementara untuk preview gambar sebelum upload
    setPreview(URL.createObjectURL(f));
  };

  // Simpan produk (create atau update)
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setFormErr("");
    try {
      // Konversi string → number untuk field numerik
      const payload = {
        ...form,
        price:       Number(form.price),
        stock:       Number(form.stock),
        stock_alert: Number(form.stock_alert)
      };
      // Jika tidak ada gambar baru → hapus key image agar tidak kirim null ke backend
      if (!form.image) delete payload.image;
      // Pilih create atau update berdasarkan editTarget
      if (editTarget?.id) await productService.update(editTarget.id, payload);
      else                await productService.create(payload);
      // Callback: refresh grid produk di halaman kasir utama
      onProductSaved?.();
      backToList();
    } catch (err) { setFormErr(getErrorMessage(err)); }
    finally { setSaving(false); }
  };

  // Hapus produk dengan konfirmasi
  const handleDelete = async (p) => {
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await productService.delete(p.id);
      loadList();
      onProductSaved?.();
    } catch (err) { alert(getErrorMessage(err)); }
  };

  // Panel tidak dirender kalau tidak terbuka (optimasi performa)
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop: klik di luar panel → tutup */}
      <div className="fixed inset-0 bg-brand-black/50 z-40" onClick={onClose} />

      {/* Panel slide dari kanan */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white border-l-2 border-brand-black z-50 flex flex-col" style={{ boxShadow: "-6px 0 0 #0A0A0A" }}>
        {/* Header panel */}
        <div className="px-4 py-3 bg-brand-black text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {/* Tombol kembali ke list — hanya tampil saat di FORM VIEW */}
            {editTarget !== null && (
              <button onClick={backToList} className="text-white/60 hover:text-white font-black mr-1">←</button>
            )}
            <span className="font-black font-grotesk text-sm">
              {editTarget === null ? "Kelola Produk" : editTarget?.id ? "Edit Produk" : "Tambah Produk"}
            </span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white font-black">✕</button>
        </div>

        {/* ── LIST VIEW: tampilkan daftar produk ── */}
        {editTarget === null && (
          <>
            <div className="p-3 border-b-2 border-brand-black flex gap-2 shrink-0">
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari produk..." className="flex-1 px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow" style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
              <button onClick={openNew}
                className="px-3 py-2 bg-brand-yellow border-2 border-brand-black font-black text-sm hover:bg-yellow-300 transition-colors"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                + Tambah
              </button>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-brand-black/10">
              {loading && <p className="text-center py-8 text-sm text-brand-black/40">Memuat...</p>}
              {!loading && list.length === 0 && <p className="text-center py-8 text-sm text-brand-black/40">Tidak ada produk</p>}
              {list.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-brand-cream transition-colors">
                  {p.image_url
                    ? <img src={p.image_url} alt={p.name} className="w-10 h-10 object-cover border-2 border-brand-black/20 shrink-0" />
                    : <div className="w-10 h-10 bg-brand-cream border-2 border-brand-black/10 shrink-0 flex items-center justify-center text-lg">📦</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name}</p>
                    <p className="text-xs font-mono text-brand-black/50">{formatCurrency(p.price)} · stok: {p.stock}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => openEdit(p)}
                      className="px-2.5 py-1 text-xs font-bold border-2 border-brand-black bg-white hover:bg-brand-yellow transition-colors"
                      style={{ boxShadow: "1px 1px 0 #0A0A0A" }}>Edit</button>
                    <button onClick={() => handleDelete(p)}
                      className="px-2.5 py-1 text-xs font-bold border-2 border-red-400 text-red-500 hover:bg-red-50 transition-colors">Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── FORM VIEW: form tambah/edit produk ── */}
        {editTarget !== null && (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4">
            {formErr && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{formErr}</p>}

            {/* Upload foto produk */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold">Foto Produk</label>
              <div className="flex items-center gap-3">
                {preview
                  ? <img src={preview} alt="preview" className="w-16 h-16 object-cover border-2 border-brand-black shrink-0" />
                  : <div className="w-16 h-16 bg-brand-cream border-2 border-brand-black shrink-0 flex items-center justify-center text-2xl">📦</div>
                }
                {/* Label wrapper untuk input file — klik area → buka file picker */}
                <label className="flex-1 cursor-pointer">
                  <div className="border-2 border-dashed border-brand-black px-3 py-3 text-center text-sm text-brand-black/50 hover:border-brand-yellow hover:text-brand-black transition-colors">
                    {form.image ? form.image.name : "Klik untuk pilih / ganti foto"}
                  </div>
                  {/* Input file disembunyikan (hidden), digantikan oleh label di atas */}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImg} />
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold">Nama Produk / Rasa *</label>
              <input required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Es Teh Manis, Kopi Susu Gula Aren..."
                className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold">Kode / SKU</label>
              <input value={form.sku} onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="ETM-001 (bisa dikosongkan)"
                className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow font-mono"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
            </div>

            {/* Harga dan stok dalam 2 kolom */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold">Harga (Rp) *</label>
                <input required type="number" min="0" value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="15000"
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow font-mono"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold">Stok *</label>
                <input required type="number" min="0" value={form.stock}
                  onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                  placeholder="50"
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow font-mono"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
              </div>
            </div>

            {/* Pilih kategori — hanya tampil kalau ada data kategori */}
            {categories.length > 0 && (
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold">Kategori</label>
                <select value={form.category_id}
                  onChange={(e) => setForm((p) => ({ ...p, category_id: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border-2 border-brand-black outline-none bg-white focus:border-brand-yellow"
                  style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                  <option value="">-- Pilih Kategori --</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}

            {/* Toggle aktif/nonaktif */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="w-4 h-4 border-2 border-brand-black" />
              <span className="text-sm font-bold">Produk aktif (tampil di kasir)</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={backToList}
                className="flex-1 py-2.5 border-2 border-brand-black font-bold text-sm bg-white hover:bg-brand-cream transition-colors"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                Batal
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 bg-brand-yellow border-2 border-brand-black font-black text-sm disabled:opacity-50 hover:bg-yellow-300 transition-colors"
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

// ============================================================
// ProductCard — Kartu produk di grid kasir
//
// Klik kartu → addItem(product) → masuk keranjang
// Produk stok 0 → disabled (tidak bisa diklik)
// Produk stok rendah (≤ stock_alert) → text stok oranye sebagai peringatan
// ============================================================
const ProductCard = ({ product, onAdd }) => {
  const outOfStock = product.stock === 0;
  const lowStock   = product.stock > 0 && product.stock <= (product.stock_alert ?? 5);

  return (
    <button
      onClick={() => !outOfStock && onAdd(product)}
      disabled={outOfStock}
      className={`
        text-left border-2 border-brand-black p-2.5 bg-white
        transition-all duration-100 flex flex-col gap-1.5 group
        ${outOfStock
          ? "opacity-40 cursor-not-allowed"
          // Efek neobrutalism saat hover: geser sedikit ke kiri-atas
          : "hover:bg-brand-yellow hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
        }
      `}
      style={{ boxShadow: outOfStock ? "none" : "3px 3px 0 #0A0A0A" }}
    >
      {/* Gambar produk — fallback ke emoji kalau tidak ada gambar
          image_url sudah full URL dari backend (contoh: http://localhost:8000/storage/products/abc.jpg) */}
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full aspect-square object-cover border border-brand-black/10"
        />
      ) : (
        <div className="w-full aspect-square bg-brand-cream border border-brand-black/10 flex items-center justify-center text-3xl">
          📦
        </div>
      )}
      <div>
        <p className="font-bold text-xs text-brand-black line-clamp-2 leading-tight">{product.name}</p>
        <p className="text-xs text-brand-black/60 font-mono font-bold mt-0.5">{formatCurrency(product.price)}</p>
        {/* Warna teks stok berubah sesuai kondisi */}
        <p className={`text-[10px] font-mono mt-0.5 ${
          outOfStock ? "text-red-500 font-black" : lowStock ? "text-orange-500" : "text-brand-black/30"
        }`}>
          {outOfStock ? "Stok Habis" : `Stok: ${product.stock}`}
        </p>
      </div>
    </button>
  );
};

// ============================================================
// CartItem — Satu baris item di keranjang
//
// Tombol +/- untuk ubah quantity, ✕ untuk hapus item
// Subtotal per item: harga × quantity
// ============================================================
const CartItem = ({ item, onAdd, onRemove, onDelete }) => (
  <div className="flex items-center gap-2 py-2.5 border-b border-brand-black/10 last:border-0">
    <div className="flex-1 min-w-0">
      <p className="font-bold text-xs text-brand-black truncate">{item.name}</p>
      <p className="text-[10px] text-brand-black/50 font-mono">{formatCurrency(item.price)}</p>
    </div>
    {/* Kontrol quantity: −, angka, + */}
    <div className="flex items-center gap-1 shrink-0">
      <button onClick={onRemove}
        className="w-6 h-6 border-2 border-brand-black font-black text-xs flex items-center justify-center hover:bg-brand-yellow transition-colors">
        −
      </button>
      <span className="w-6 text-center font-black text-xs font-mono">{item.quantity}</span>
      {/* Tombol + di-disable kalau quantity sudah mencapai stok */}
      <button onClick={onAdd} disabled={item.quantity >= item.stock}
        className="w-6 h-6 border-2 border-brand-black font-black text-xs flex items-center justify-center hover:bg-brand-yellow transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        +
      </button>
      {/* Tombol hapus item langsung */}
      <button onClick={onDelete}
        className="ml-1 w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors font-black text-[10px]">
        ✕
      </button>
    </div>
    {/* Subtotal: harga × quantity */}
    <p className="w-16 text-right font-black font-mono text-xs shrink-0">
      {formatCurrency(item.price * item.quantity)}
    </p>
  </div>
);

// ============================================================
// KasirPage — Komponen utama halaman kasir
// ============================================================
export default function KasirPage() {
  const [products,    setProducts]    = useState([]);      // daftar produk dari API
  const [categories,  setCategories]  = useState([]);      // daftar kategori untuk filter
  const [selCategory, setSelCategory] = useState("");      // kategori yang dipilih ("" = semua)
  const [search,      setSearch]      = useState("");      // teks pencarian
  const [isLoading,   setIsLoading]   = useState(false);   // loading grid produk
  const [paying,        setPaying]      = useState(false);   // loading proses checkout
  const [notes,         setNotes]       = useState("");      // catatan pesanan opsional
  const [customerPhone, setCustomerPhone] = useState("");   // nomor HP customer untuk struk WA
  const [cartVisible,  setCartVisible] = useState(false);   // tampilkan keranjang di mobile
  const [prodPanel,    setProdPanel]   = useState(false);   // tampilkan panel kelola produk

  // useDebounce: tunda request pencarian sampai 400ms setelah user berhenti ketik
  // Tanpa ini, setiap keystroke langsung kirim request API (spam)
  const debouncedSearch = useDebounce(search, 400);

  // Ambil fungsi dan data dari cartStore (Zustand)
  // Destructuring langsung dari store — semua ini reaktif
  const { items, addItem, removeItem, deleteItem, getSubtotal, getTax, getTotal, clearCart, getOrderPayload } = useCartStore();
  const user = useAuthStore((s) => s.user);

  // Fetch kategori SEKALI saat halaman pertama load
  // Dependency array kosong [] = hanya jalan sekali (seperti componentDidMount)
  useEffect(() => {
    categoryService.getAll({ is_active: true }).then(setCategories).catch(() => {});
  }, []);

  // Fetch produk setiap kali filter atau search berubah
  // Dependency: selCategory dan debouncedSearch (bukan search mentah)
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getAll({
          is_active:   true,             // hanya produk aktif
          category_id: selCategory || undefined,  // undefined = tidak kirim param ini
          search:      debouncedSearch || undefined,
          per_page:    60,               // tampilkan 60 produk sekaligus
        });
        setProducts(data.data ?? []);
      } finally { setIsLoading(false); }
    };
    fetchProducts();
  }, [selCategory, debouncedSearch]);

  // ============================================================
  // handleCheckout — Proses pembayaran
  //
  // Alur:
  //   1. Buat order di backend → dapat order_id
  //   2. Buat transaksi → backend buat Midtrans order → dapat snap_token
  //   3. Buka Midtrans Snap popup dengan snap_token
  //   4. User bayar → Midtrans kirim webhook ke backend
  //   5. Backend update status order + transaksi
  //
  // getOrderPayload() mengubah items keranjang ke format backend:
  //   [{ product_id: 1, quantity: 2 }, { product_id: 3, quantity: 1 }]
  // ============================================================
  const handleCheckout = async () => {
    if (items.length === 0) return alert("Keranjang masih kosong!");
    setPaying(true);
    try {
      // Step 1: Buat order
      const orderRes  = await orderService.create({
        items: getOrderPayload(),
        notes,
        // Kirim nomor HP kalau diisi — backend akan kirim struk WA setelah lunas
        ...(customerPhone ? { customer_phone: customerPhone } : {}),
      });
      const orderId   = orderRes.data?.id;

      // Step 2: Buat transaksi (sekaligus buat Midtrans order di backend)
      const txRes     = await transactionService.create({ order_id: orderId });
      // snap_token bisa di level root atau di dalam data — handle keduanya
      const snapToken = txRes.snap_token ?? txRes.data?.snap_token;

      if (snapToken && window.snap) {
        // Step 3: Buka popup Midtrans Snap
        // window.snap tersedia karena Script Midtrans dimuat di kasir/layout.jsx
        window.snap.pay(snapToken, {
          onSuccess:  () => {
            // Pembayaran berhasil → bersihkan keranjang dan form
            clearCart(); setNotes(""); setCustomerPhone(""); setCartVisible(false);
            alert("Pembayaran berhasil! 🎉");
          },
          onPending:  () => alert("Menunggu pembayaran..."),
          onError:    () => alert("Pembayaran gagal. Coba lagi."),
          onClose:    () => {},  // user tutup popup tanpa bayar → tidak ada aksi
        });
      } else if (snapToken) {
        // Midtrans tersedia tapi window.snap belum load
        alert(`Snap Token: ${snapToken}`);
      } else {
        // Tidak ada snap_token → bayar tunai (cash)
        clearCart();
        setNotes("");
        setCustomerPhone("");
        setCartVisible(false);
        alert(`✓ Order #${orderRes.order?.order_number} berhasil dibuat (Bayar Tunai)`);
      }
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal checkout. Coba lagi.");
    } finally { setPaying(false); }
  };

  // Total item di keranjang (jumlah unit, bukan jenis produk)
  // Dipakai untuk badge di tombol 🛒 mobile
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
    {/* Layout dua kolom: grid produk (kiri) + keranjang (kanan) */}
    <div className="flex h-full gap-0 overflow-hidden bg-brand-cream">

      {/* ═══════════════════════════════════════
          KOLOM KIRI — Grid Produk
          flex-1: ambil semua sisa ruang setelah kolom kanan
          ═══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden border-r-2 border-brand-black">

        {/* Bar pencarian + filter kategori */}
        <div className="px-3 pt-3 pb-2 shrink-0 space-y-2 bg-white border-b-2 border-brand-black">
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari produk atau SKU..."
              className="flex-1 px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow bg-white"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            />
            {/* Tombol kelola produk — hanya di sm+ (tersembunyi di mobile kecil) */}
            <button
              onClick={() => setProdPanel(true)}
              className="px-3 py-2 border-2 border-brand-black font-black text-sm bg-white hover:bg-brand-yellow transition-colors hidden sm:flex items-center gap-1.5"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              title="Kelola Produk"
            >
              📦 Produk
            </button>
            {/* Tombol toggle keranjang — HANYA di mobile (lg:hidden) */}
            <button
              onClick={() => setCartVisible(true)}
              className="lg:hidden relative px-3 py-2 bg-brand-yellow border-2 border-brand-black font-black text-sm"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              🛒
              {/* Badge jumlah item — hanya tampil kalau ada item */}
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-black text-white text-[10px] font-black flex items-center justify-center border border-brand-black">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Tab filter kategori — horizontal scroll (overflow-x-auto) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
            {/* Tab "Semua" — aktif kalau selCategory kosong */}
            <button
              onClick={() => setSelCategory("")}
              className={`shrink-0 px-3 py-1.5 text-xs font-black border-2 border-brand-black transition-colors whitespace-nowrap ${
                !selCategory ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"
              }`}
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              Semua
            </button>
            {/* Tab per kategori — aktif kalau ID-nya cocok dengan selCategory */}
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelCategory(String(c.id))}
                className={`shrink-0 px-3 py-1.5 text-xs font-black border-2 border-brand-black transition-colors whitespace-nowrap ${
                  selCategory === String(c.id) ? "bg-brand-yellow" : "bg-white hover:bg-brand-yellow/30"
                }`}
                style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Grid produk — responsive kolom: 2 → 3 → 4 → 5 sesuai lebar layar */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          {isLoading ? (
            // Skeleton loading: tampilkan placeholder saat data belum datang
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="skeleton border-2 border-brand-black/10 aspect-[4/5]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((p) => <ProductCard key={p.id} product={p} onAdd={addItem} />)}
              {products.length === 0 && (
                <div className="col-span-full text-center py-16 text-brand-black/40 font-semibold">
                  <p className="text-3xl mb-2">🔍</p>
                  <p>Produk tidak ditemukan</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════
          KOLOM KANAN — Panel Keranjang
          Desktop (lg+): selalu terlihat di sebelah kanan
          Mobile:        slide-over dari kanan (toggle dengan tombol 🛒)
          ═══════════════════════════════════════ */}

      {/* Backdrop untuk mobile saat keranjang terbuka */}
      {cartVisible && (
        <div className="fixed inset-0 bg-brand-black/40 z-30 lg:hidden"
          onClick={() => setCartVisible(false)} />
      )}

      <div
        className={`
          fixed lg:static right-0 top-14 bottom-0 lg:h-auto
          w-72 lg:w-[38%] xl:w-80 shrink-0
          flex flex-col border-l-2 border-brand-black bg-white
          z-40 transition-transform duration-200
          ${cartVisible ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
        style={{ boxShadow: "-3px 0 0 #0A0A0A" }}
      >
        {/* Header keranjang */}
        <div className="px-4 py-3 bg-brand-black text-white border-b-2 border-brand-black flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <p className="font-black font-grotesk text-sm">Keranjang</p>
            {totalItems > 0 && (
              <span className="bg-brand-yellow text-brand-black text-[10px] font-black px-1.5 py-0.5 font-mono">
                {totalItems} item
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Tombol kosongkan keranjang */}
            {items.length > 0 && (
              <button onClick={clearCart} className="text-[10px] text-white/40 hover:text-red-300 font-semibold border border-white/10 px-2 py-0.5">
                Kosongkan
              </button>
            )}
            {/* Tombol tutup — hanya di mobile */}
            <button onClick={() => setCartVisible(false)} className="lg:hidden text-white/60 hover:text-white font-black">✕</button>
          </div>
        </div>

        {/* List item keranjang — bisa scroll kalau banyak */}
        <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin">
          {items.length === 0 ? (
            // State kosong: panduan untuk kasir
            <div className="h-full flex flex-col items-center justify-center text-brand-black/25 text-center gap-3 py-12">
              <span className="text-4xl">🛒</span>
              <p className="text-xs font-semibold">Klik produk untuk tambahkan<br />ke keranjang</p>
            </div>
          ) : (
            // Render setiap item dengan CartItem komponen
            // key={item.product_id}: React butuh key unik untuk tiap item list
            items.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                // onAdd: tambah 1 unit — perlu buat object product ulang (addItem butuh format product)
                onAdd={() => addItem({ id: item.product_id, name: item.name, price: item.price, stock: item.stock })}
                onRemove={() => removeItem(item.product_id)}
                onDelete={() => deleteItem(item.product_id)}
              />
            ))
          )}
        </div>

        {/* Panel checkout di bawah keranjang */}
        <div className="px-4 py-4 border-t-2 border-brand-black bg-brand-cream shrink-0 space-y-3">
          {/* Nomor HP customer untuk struk WhatsApp */}
          <div className="flex items-center gap-2 border-2 border-brand-black bg-white"
            style={{ boxShadow: "1px 1px 0 #0A0A0A" }}>
            <span className="pl-2.5 text-sm shrink-0">📱</span>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="No. HP customer (struk WA)"
              className="flex-1 text-xs py-2 pr-2.5 outline-none bg-transparent"
            />
            {customerPhone && (
              <button onClick={() => setCustomerPhone("")}
                className="pr-2 text-brand-black/30 hover:text-red-400 font-bold text-xs">✕</button>
            )}
          </div>

          {/* Catatan pesanan */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan pesanan (opsional)..."
            rows={2}
            className="w-full text-xs border-2 border-brand-black px-2.5 py-2 outline-none focus:border-brand-yellow resize-none bg-white"
            style={{ boxShadow: "1px 1px 0 #0A0A0A" }}
          />

          {/* Ringkasan harga */}
          <div className="space-y-1.5 text-sm">
            {/* Subtotal: total sebelum pajak */}
            <div className="flex justify-between font-semibold text-brand-black/70">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(getSubtotal())}</span>
            </div>
            {/* PPN 11% */}
            <div className="flex justify-between text-xs font-semibold text-brand-black/50">
              <span>PPN 11%</span>
              <span className="font-mono">{formatCurrency(getTax())}</span>
            </div>
            {/* Total = subtotal + pajak */}
            <div className="flex justify-between font-black text-base border-t-2 border-brand-black pt-2">
              <span>TOTAL</span>
              <span className="font-mono">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          {/* Tombol bayar — disabled kalau keranjang kosong atau sedang proses */}
          <button
            onClick={handleCheckout}
            disabled={items.length === 0 || paying}
            className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-40 hover:bg-yellow-300 active:translate-y-0.5 transition-all"
            style={{ boxShadow: items.length === 0 ? "none" : "3px 3px 0 #0A0A0A" }}
          >
            {paying ? "⏳ Memproses..." : `💳 BAYAR — ${formatCurrency(getTotal())}`}
          </button>
        </div>
      </div>
    </div>

    {/* Panel kelola produk — di-render di luar flex layout agar bisa fixed overlay */}
    <QuickProductPanel
      isOpen={prodPanel}
      onClose={() => setProdPanel(false)}
      categories={categories}
      // Callback setelah produk disimpan: refresh grid produk di halaman kasir
      onProductSaved={() => {
        productService.getAll({ is_active: true, per_page: 60 })
          .then((d) => setProducts(d.data ?? []));
      }}
    />
    </>
  );
}
