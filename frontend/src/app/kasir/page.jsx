"use client";

// ============================================================
// Kasir Page — Interface kasir utama (POS)
//
// Analogi: Ini seperti "layar kasir di minimarket" —
// kiri ada grid produk yang bisa diklik, kanan ada keranjang
// dengan total harga dan tombol bayar.
//
// Alur transaksi kasir:
//   1. Kasir klik produk → masuk keranjang (cartStore.addItem)
//   2. Review keranjang (qty, total, PPN)
//   3. Klik "Bayar" → buat order (POST /api/orders)
//   4. Buat transaksi (POST /api/transactions) → dapat snap_token
//   5. Buka Midtrans Snap popup → pelanggan bayar
//   6. Setelah bayar → kosongkan keranjang
// ============================================================

import { useState, useEffect } from "react";
import productService       from "@/services/productService";
import categoryService      from "@/services/categoryService";
import orderService         from "@/services/orderService";
import transactionService   from "@/services/transactionService";
import useCartStore         from "@/stores/cartStore";
import { formatCurrency }   from "@/lib/utils";
import { useDebounce }      from "@/hooks/useDebounce";

// --- Kartu produk di grid kasir ---
const ProductCard = ({ product, onAdd }) => (
  <button
    onClick={() => onAdd(product)}
    disabled={product.stock === 0}
    className={`
      text-left border-2 border-brand-black p-3 bg-white
      transition-all duration-100 flex flex-col gap-1
      ${product.stock === 0
        ? "opacity-40 cursor-not-allowed"
        : "hover:bg-brand-yellow hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
      }
    `}
    style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
  >
    <p className="font-bold text-sm text-brand-black line-clamp-2 leading-tight">{product.name}</p>
    <p className="text-xs text-brand-black/50 font-mono font-bold">{formatCurrency(product.price)}</p>
    <p className={`text-[10px] font-mono ${product.stock <= product.stock_alert ? "text-red-500" : "text-brand-black/30"}`}>
      Stok: {product.stock}
    </p>
  </button>
);

// --- Item di keranjang ---
const CartItem = ({ item, onAdd, onRemove, onDelete }) => (
  <div className="flex items-center justify-between py-2 border-b border-brand-black/10">
    <div className="flex-1 min-w-0">
      <p className="font-bold text-sm text-brand-black truncate">{item.name}</p>
      <p className="text-xs text-brand-black/50 font-mono">{formatCurrency(item.price)}</p>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      {/* Kontrol quantity */}
      <button onClick={() => onRemove(item.product_id)}
        className="w-6 h-6 border-2 border-brand-black font-black text-sm flex items-center justify-center hover:bg-brand-yellow transition-colors">
        −
      </button>
      <span className="w-7 text-center font-black text-sm font-mono">{item.quantity}</span>
      <button onClick={() => onAdd(item)}
        className="w-6 h-6 border-2 border-brand-black font-black text-sm flex items-center justify-center hover:bg-brand-yellow transition-colors"
        disabled={item.quantity >= item.stock}>
        +
      </button>
      <button onClick={() => onDelete(item.product_id)} className="ml-1 text-red-400 hover:text-red-600 font-black text-xs">✕</button>
    </div>
    <p className="w-20 text-right font-black font-mono text-sm">{formatCurrency(item.price * item.quantity)}</p>
  </div>
);

export default function KasirPage() {
  const [products,    setProducts]    = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [selCategory, setSelCategory] = useState("");
  const [search,      setSearch]      = useState("");
  const [isLoading,   setIsLoading]   = useState(false);
  const [paying,      setPaying]      = useState(false);
  const [notes,       setNotes]       = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const {
    items, addItem, removeItem, deleteItem,
    getSubtotal, getTax, getTotal, clearCart, getOrderPayload,
  } = useCartStore();

  // Ambil kategori sekali saat halaman pertama kali dibuka
  useEffect(() => {
    categoryService.getAll({ is_active: true }).then(setCategories).catch(() => {});
  }, []);

  // Ambil produk dari backend — otomatis refresh jika kategori atau search berubah
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const data = await productService.getAll({
          is_active: true,
          category_id: selCategory || undefined,
          search: debouncedSearch || undefined,
          per_page: 50,
        });
        setProducts(data.data ?? []);
      } finally { setIsLoading(false); }
    };
    fetchProducts();
  }, [selCategory, debouncedSearch]);

  // Proses checkout — buat order → buat transaksi → buka Midtrans
  const handleCheckout = async () => {
    if (items.length === 0) return alert("Keranjang masih kosong!");
    setPaying(true);
    try {
      // 1. Buat order ke backend
      const orderRes = await orderService.create({
        items: getOrderPayload(),
        notes,
      });
      const orderId = orderRes.order?.id ?? orderRes.data?.id;

      // 2. Buat transaksi → dapat snap_token Midtrans
      const txRes    = await transactionService.create({ order_id: orderId });
      const snapToken = txRes.transaction?.snap_token ?? txRes.data?.snap_token;

      if (snapToken) {
        // 3. Buka Midtrans Snap popup
        // Midtrans script harus di-load di head (bisa tambahkan di layout atau script tag)
        if (window.snap) {
          window.snap.pay(snapToken, {
            onSuccess:  () => { clearCart(); setNotes(""); alert("Pembayaran berhasil!"); },
            onPending:  () => { alert("Menunggu pembayaran..."); },
            onError:    () => { alert("Pembayaran gagal"); },
            onClose:    () => {},
          });
        } else {
          // Fallback: tampilkan snap_token jika Midtrans JS belum dimuat
          alert(`Snap Token: ${snapToken}\n\nLoad Midtrans script untuk pembayaran otomatis.`);
        }
      } else {
        // Bayar tunai (manual)
        clearCart();
        setNotes("");
        alert(`Order #${orderRes.order?.order_number} berhasil dibuat!`);
      }
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal checkout");
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden gap-4">

      {/* === KIRI: Grid Produk === */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Search + filter */}
        <div className="flex gap-2 mb-3 flex-wrap shrink-0">
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk..."
            className="flex-1 min-w-[140px] px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }} />
          <select value={selCategory} onChange={(e) => setSelCategory(e.target.value)}
            className="px-3 py-2 text-sm border-2 border-brand-black outline-none bg-white"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            <option value="">Semua Kategori</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Grid produk — scrollable */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-brand-black/40">Memuat produk...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} onAdd={addItem} />
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-brand-black/40 font-semibold">
                  Produk tidak ditemukan
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === KANAN: Panel Keranjang === */}
      <div className="w-72 shrink-0 flex flex-col border-2 border-brand-black bg-white overflow-hidden"
        style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>

        {/* Header keranjang */}
        <div className="px-4 py-3 bg-brand-black text-white border-b-2 border-brand-black flex items-center justify-between shrink-0">
          <p className="font-black font-grotesk">Keranjang</p>
          {items.length > 0 && (
            <button onClick={clearCart} className="text-xs text-white/50 hover:text-red-300 font-semibold">Kosongkan</button>
          )}
        </div>

        {/* Daftar item — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-brand-black/30 text-sm font-semibold text-center">
              Klik produk untuk tambahkan ke keranjang
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.product_id}
                item={item}
                onAdd={() => addItem({ id: item.product_id, ...item })}
                onRemove={() => removeItem(item.product_id)}
                onDelete={() => deleteItem(item.product_id)}
              />
            ))
          )}
        </div>

        {/* Ringkasan harga + checkout */}
        <div className="px-4 py-4 border-t-2 border-brand-black bg-brand-cream shrink-0 space-y-2">
          {/* Catatan order */}
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Catatan (opsional)..." rows={2}
            className="w-full text-xs border-2 border-brand-black px-2.5 py-2 outline-none focus:border-brand-yellow resize-none"
            style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />

          {/* Subtotal, pajak, total */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between font-semibold text-brand-black/70">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(getSubtotal())}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-brand-black/50">
              <span>PPN 11%</span>
              <span className="font-mono">{formatCurrency(getTax())}</span>
            </div>
            <div className="flex justify-between font-black text-base border-t-2 border-brand-black pt-2">
              <span>TOTAL</span>
              <span className="font-mono">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          {/* Tombol bayar */}
          <button
            onClick={handleCheckout}
            disabled={items.length === 0 || paying}
            className="w-full py-3 bg-brand-yellow border-2 border-brand-black font-black text-base disabled:opacity-40 hover:bg-yellow-300 transition-colors"
            style={{ boxShadow: "3px 3px 0 #0A0A0A" }}
          >
            {paying ? "Memproses..." : `Bayar ${formatCurrency(getTotal())}`}
          </button>
        </div>
      </div>
    </div>
  );
}
