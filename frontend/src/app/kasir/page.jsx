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

import { useState, useEffect } from "react";
import productService     from "@/services/productService";
import categoryService    from "@/services/categoryService";
import orderService       from "@/services/orderService";
import transactionService from "@/services/transactionService";
import shiftService       from "@/services/shiftService";
import useCartStore       from "@/stores/cartStore";
import useAuthStore       from "@/stores/authStore";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
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

// ── CashPaymentModal — Input nominal tunai + hitung kembalian ──────────────
function CashPaymentModal({ isOpen, onClose, total, onConfirm }) {
  const [cashInput, setCashInput] = useState("");
  const cash    = parseFloat(cashInput) || 0;
  const change  = cash - total;
  const enough  = cash >= total;

  const QUICK = [...new Set([total, Math.ceil(total / 5000) * 5000, 50000, 100000, 200000, 500000])]
    .filter((v) => v >= total)
    .slice(0, 6);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.7)" }}>
      <div className="bg-white border-2 border-brand-black w-full max-w-sm" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
        <div className="px-5 py-4 bg-brand-yellow border-b-2 border-brand-black">
          <h3 className="font-black text-lg font-grotesk">💵 Bayar Tunai</h3>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex justify-between items-center py-2 border-2 border-brand-black px-3 bg-brand-cream">
            <span className="font-bold text-sm">Total Bayar</span>
            <span className="font-black text-xl font-mono">{formatCurrency(total)}</span>
          </div>
          <div>
            <label className="text-sm font-bold block mb-1">Uang Diterima (Rp)</label>
            <input
              type="number"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-3 text-2xl font-black font-mono border-2 border-brand-black outline-none focus:border-brand-yellow text-right"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK.map((amt) => (
              <button key={amt} onClick={() => setCashInput(String(amt))}
                className="py-1.5 text-xs font-bold border-2 border-brand-black hover:bg-brand-yellow transition-colors"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }}>
                {formatCurrency(amt)}
              </button>
            ))}
          </div>
          {cash > 0 && (
            <div className={`flex justify-between text-base font-black p-3 border-2 ${enough ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"}`}>
              <span>KEMBALIAN</span>
              <span className={`font-mono ${enough ? "text-green-700" : "text-red-600"}`}>
                {enough ? formatCurrency(change) : "Kurang " + formatCurrency(-change)}
              </span>
            </div>
          )}
        </div>
        <div className="px-5 py-4 border-t-2 border-brand-black flex gap-3 bg-brand-cream">
          <button onClick={onClose}
            className="flex-1 py-2.5 font-bold text-sm border-2 border-brand-black bg-white hover:bg-gray-50"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            Batal
          </button>
          <button onClick={() => enough && onConfirm(cash)} disabled={!enough}
            className="flex-1 py-2.5 font-black text-sm border-2 border-brand-black bg-brand-yellow hover:bg-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: enough ? "2px 2px 0 #0A0A0A" : "none" }}>
            Proses Bayar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ReceiptModal — Struk setelah pembayaran sukses ────────────────────────
function ReceiptModal({ isOpen, data, onClose }) {
  const [sending, setSending] = useState(false);
  if (!isOpen || !data) return null;

  const buildWhatsAppText = () => {
    const LINE = "━━━━━━━━━━━━━━━━━━━━━━━━━";
    let t = "";

    t += `*KASIR AI*\n`;
    t += `_Struk Pembayaran Digital_\n`;
    t += `${LINE}\n\n`;

    t += ` *Detail Pesanan*\n`;
    t += ` No. Order  : *${data.order_number}*\n`;
    t += ` Kasir       : ${data.kasir}\n`;
    t += ` Tanggal    : ${data.date}\n\n`;

    t += `${LINE}\n`;
    t += ` *Item Pesanan*\n`;
    t += `${LINE}\n`;
    data.items.forEach((i) => {
      t += `▸ *${i.name}*\n`;
      t += `   ${i.quantity} pcs × ${formatCurrency(i.price)} = *${formatCurrency(i.price * i.quantity)}*\n`;
    });
    t += `${LINE}\n\n`;

    t += ` Subtotal       : ${formatCurrency(data.subtotal)}\n`;
    t += `${LINE}\n`;
    t += ` *TOTAL           : ${formatCurrency(data.total)}*\n`;
    t += `${LINE}\n\n`;

    t += ` Bayar (${data.payment_method}) : ${formatCurrency(data.cash)}\n`;
    if (data.change > 0) t += ` Kembalian        : *${formatCurrency(data.change)}*\n`;

    t += `\n${LINE}\n`;
    t += `*Terima kasih sudah berbelanja!*\n`;
    t += `Sampai jumpa lagi & selamat menikmati! 👋✨`;

    return t;
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=420,height=700");
    const fmt = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
    w.document.write(`<html><head><title>Struk ${data.order_number}</title>
      <style>body{font-family:monospace;font-size:12px;width:280px;padding:10px;margin:0 auto}
      .c{text-align:center}.b{font-weight:bold}.sep{border-top:1px dashed #000;margin:6px 0}
      .row{display:flex;justify-content:space-between}</style></head><body>
      <div class="c b" style="font-size:15px">POS SYSTEM</div>
      <div class="sep"></div>
      <div class="row"><span>Order</span><span>${data.order_number}</span></div>
      <div class="row"><span>Kasir</span><span>${data.kasir}</span></div>
      <div class="row"><span>Tgl</span><span>${data.date}</span></div>
      <div class="sep"></div>
      ${data.items.map((i) => `<div class="b">${i.name}</div><div class="row"><span style="padding-left:8px">${i.quantity} x ${fmt(i.price)}</span><span>${fmt(i.price * i.quantity)}</span></div>`).join("")}
      <div class="sep"></div>
      <div class="row"><span>Subtotal</span><span>${fmt(data.subtotal)}</span></div>
      <div class="sep"></div>
      <div class="row b"><span>TOTAL</span><span>${fmt(data.total)}</span></div>
      <div class="sep"></div>
      <div class="row"><span>Bayar (${data.payment_method})</span><span>${fmt(data.cash)}</span></div>
      ${data.change > 0 ? `<div class="row"><span>Kembalian</span><span class="b">${fmt(data.change)}</span></div>` : ""}
      <div class="sep"></div>
      <div class="c">Terima kasih sudah berbelanja! 😊</div>
      <script>window.onload=function(){window.print();window.close()}</script>
      </body></html>`);
    w.document.close();
  };

  const handleWhatsApp = async () => {
    const phone = (data.customer_phone ?? "").replace(/\D/g, "");
    if (!phone) return alert("Nomor HP customer belum diisi di kolom No. HP.");

    setSending(true);
    try {
      const res = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: phone, message: buildWhatsAppText() }),
      });
      const json = await res.json();
      if (json.status) {
        alert("Struk berhasil dikirim ke WhatsApp customer!");
      } else {
        alert("Gagal kirim: " + (json.reason ?? "Cek token Fonnte di server."));
      }
    } catch (err) {
      alert("Gagal kirim WhatsApp: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.7)" }}>
      <div className="bg-white border-2 border-brand-black w-full max-w-sm flex flex-col max-h-[92vh]"
        style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
        {/* Header */}
        <div className="px-5 py-4 bg-green-400 border-b-2 border-brand-black text-center shrink-0">
          <div className="text-4xl mb-1">✅</div>
          <h3 className="font-black text-xl font-grotesk">PEMBAYARAN SUKSES</h3>
        </div>
        {/* Struk */}
        <div className="flex-1 overflow-y-auto p-5 font-mono text-sm space-y-1 scrollbar-thin">
          <div className="text-center border-b-2 border-dashed border-brand-black/30 pb-3 mb-3">
            <p className="font-black text-base">POS SYSTEM</p>
          </div>
          <div className="flex justify-between text-xs"><span>Order</span><span className="font-bold">{data.order_number}</span></div>
          <div className="flex justify-between text-xs"><span>Kasir</span><span>{data.kasir}</span></div>
          <div className="flex justify-between text-xs"><span>Tgl</span><span>{data.date}</span></div>
          <div className="border-t border-dashed border-brand-black/30 my-2" />
          {data.items.map((item, i) => (
            <div key={i}>
              <p className="text-xs font-bold truncate">{item.name}</p>
              <div className="flex justify-between text-xs text-brand-black/60 pl-2">
                <span>{item.quantity} × {formatCurrency(item.price)}</span>
                <span className="font-bold">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-dashed border-brand-black/30 my-2" />
          <div className="flex justify-between text-xs"><span>Subtotal</span><span>{formatCurrency(data.subtotal)}</span></div>
          <div className="border-t-2 border-brand-black mt-2 pt-2">
            <div className="flex justify-between font-black text-base"><span>TOTAL</span><span>{formatCurrency(data.total)}</span></div>
          </div>
          <div className="border-t border-dashed border-brand-black/30 my-2" />
          <div className="flex justify-between text-xs"><span>Bayar ({data.payment_method})</span><span>{formatCurrency(data.cash)}</span></div>
          {data.change > 0 && (
            <div className="flex justify-between text-xs font-black text-green-700">
              <span>Kembalian</span><span>{formatCurrency(data.change)}</span>
            </div>
          )}
          <div className="text-center mt-4 text-xs text-brand-black/40">Terima kasih sudah berbelanja! 😊</div>
        </div>
        {/* Actions */}
        <div className="p-4 border-t-2 border-brand-black space-y-2 bg-brand-cream shrink-0">
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex-1 py-2.5 font-black text-sm border-2 border-brand-black bg-white hover:bg-gray-50"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              🖨️ Print Struk
            </button>
            <button onClick={handleWhatsApp} disabled={sending}
              className="flex-1 py-2.5 font-black text-sm border-2 border-brand-black bg-green-400 hover:bg-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              {sending ? "Mengirim..." : "WhatsApp"}
            </button>
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 font-black text-sm border-2 border-brand-black bg-brand-yellow hover:bg-yellow-300"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            ✕ Transaksi Baru
          </button>
        </div>
      </div>
    </div>
  );
}

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
        relative text-left rounded-xl border-2 border-brand-black bg-white
        transition-all duration-100 flex flex-col overflow-hidden group
        ${outOfStock
          ? "opacity-40 cursor-not-allowed"
          : "hover:bg-brand-yellow hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer active:translate-x-0 active:translate-y-0"
        }
      `}
      style={{ boxShadow: outOfStock ? "none" : "3px 3px 0 #0A0A0A" }}
    >
      {/* Gambar produk */}
      <div className="relative w-full aspect-square bg-brand-cream overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl select-none">📦</div>
        )}
        {/* Badge stok menipis */}
        {lowStock && (
          <span className="absolute top-1.5 right-1.5 bg-orange-400 border border-orange-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full leading-none">
            TIPIS
          </span>
        )}
        {/* Overlay "Habis" */}
        {outOfStock && (
          <div className="absolute inset-0 bg-brand-black/50 flex items-center justify-center">
            <span className="text-white text-[10px] font-black tracking-widest">HABIS</span>
          </div>
        )}
      </div>

      {/* Info produk */}
      <div className="p-2.5 flex flex-col gap-0.5 flex-1">
        <p className="font-bold text-[11px] text-brand-black line-clamp-2 leading-tight">{product.name}</p>
        <p className="text-[11px] text-brand-black font-black font-mono mt-auto pt-1">
          {formatCurrency(product.price)}
        </p>
        <p className={`text-[9px] font-mono ${
          outOfStock ? "text-red-500 font-black" : lowStock ? "text-orange-500" : "text-brand-black/30"
        }`}>
          {outOfStock ? "Stok habis" : `Stok: ${product.stock}`}
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

// ── Pecahan Rupiah (lembar & koin) untuk kalkulator laci ──────
const RUPIAH = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100];

// ── DenominationCounter — hitung total uang laci dari rincian pecahan ──
// value: objek { "100000": qty, ... }; onChange(nextObj, total)
function DenominationCounter({ value, onChange }) {
  const counts = value || {};
  const setQty = (denom, raw) => {
    const n = Math.max(0, parseInt(raw, 10) || 0);
    const next = { ...counts };
    if (n === 0) delete next[denom];
    else next[denom] = n;
    const total = RUPIAH.reduce((s, d) => s + d * (next[d] || 0), 0);
    onChange(next, total);
  };

  return (
    <div className="border-2 border-brand-black divide-y divide-brand-black/10">
      {RUPIAH.map((d) => {
        const qty = counts[d] || 0;
        return (
          <div key={d} className="flex items-center gap-2 px-2.5 py-1.5 text-xs">
            <span className="w-20 font-mono font-bold shrink-0">{formatCurrency(d)}</span>
            <span className="text-brand-black/30">×</span>
            <input
              type="number" min="0" value={qty || ""}
              onChange={(e) => setQty(d, e.target.value)}
              placeholder="0"
              className="w-14 text-center px-1 py-1 font-mono font-bold border-2 border-brand-black outline-none focus:border-brand-yellow"
            />
            <span className="ml-auto font-mono font-black text-right">{formatCurrency(d * qty)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── ShiftOpenModal — Modal buka shift baru ──
function ShiftOpenModal({ isOpen, onClose, onConfirm, user }) {
  const [shiftName, setShiftName] = useState("Pagi");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime,   setEndTime]   = useState("16:00");
  const [denoms, setDenoms] = useState({});
  const [total, setTotal] = useState(0);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!isOpen) return null;

  const SHIFT_PRESETS = [
    { label: "Pagi",  start: "07:00", end: "16:00" },
    { label: "Siang", start: "12:00", end: "21:00" },
    { label: "Malam", start: "17:00", end: "23:59" },
  ];

  const applyPreset = (preset) => {
    setShiftName(preset.label);
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const reset = () => {
    setShiftName("Pagi"); setStartTime("07:00"); setEndTime("16:00");
    setDenoms({}); setTotal(0); setNote(""); setErr("");
  };

  const handleOpen = async () => {
    if (!shiftName.trim()) { setErr("Nama shift wajib diisi."); return; }
    if (!startTime || !endTime) { setErr("Jam mulai dan selesai wajib diisi."); return; }
    setLoading(true); setErr("");
    try {
      await onConfirm({
        shift_name: shiftName.trim(),
        start_time: startTime,
        end_time: endTime,
        opening_balance: total,
        opening_note: note || undefined,
        opening_denominations: Object.keys(denoms).length ? denoms : undefined,
      });
      reset();
    } catch (e) { setErr(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const today = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.7)" }}>
      <div className="bg-white border-2 border-brand-black w-full max-w-md flex flex-col max-h-[92vh]" style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
        <div className="px-5 py-4 bg-brand-yellow border-b-2 border-brand-black shrink-0">
          <h3 className="font-black text-lg font-grotesk">Buka Kasir / Shift Baru</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
          {/* 1. Identitas */}
          <div className="border-2 border-brand-black bg-brand-cream p-3 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-brand-black/60">Tanggal</span><span className="font-bold">{today}</span></div>
            <div className="flex justify-between"><span className="text-brand-black/60">Kasir Bertugas</span><span className="font-bold">{user?.name ?? "-"}</span></div>
          </div>

          {err && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{err}</p>}

          {/* 2. Nama & Jam Shift */}
          <div className="space-y-3">
            <div>
              <label className="text-sm font-bold block mb-1">Nama Shift</label>
              <div className="flex gap-2 mb-2">
                {SHIFT_PRESETS.map(p => (
                  <button key={p.label} onClick={() => applyPreset(p)}
                    className={`px-3 py-1 text-xs font-black border-2 border-brand-black transition-colors ${shiftName === p.label ? "bg-brand-yellow" : "bg-white hover:bg-brand-cream"}`}
                    style={{ boxShadow: "1px 1px 0 #0A0A0A" }}>
                    {p.label}
                  </button>
                ))}
              </div>
              <input type="text" value={shiftName} onChange={e => setShiftName(e.target.value)}
                placeholder="Atau ketik nama shift..."
                className="w-full text-sm border-2 border-brand-black px-3 py-2 outline-none focus:border-brand-yellow"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold block mb-1">Jam Mulai</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full text-sm border-2 border-brand-black px-3 py-2 outline-none focus:border-brand-yellow font-mono"
                  style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
              </div>
              <div>
                <label className="text-sm font-bold block mb-1">Jam Selesai</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full text-sm border-2 border-brand-black px-3 py-2 outline-none focus:border-brand-yellow font-mono"
                  style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
              </div>
            </div>
            <p className="text-xs text-brand-black/50">Kasir hanya bisa diakses selama jam shift berlangsung.</p>
          </div>

          {/* 3. Modal Awal */}
          <div>
            <label className="text-sm font-bold block mb-1">Rincian Uang Laci (Modal Awal)</label>
            <DenominationCounter value={denoms} onChange={(d, t) => { setDenoms(d); setTotal(t); }} />
          </div>
          <div className="flex justify-between items-center py-3 px-4 border-2 border-brand-black bg-brand-yellow" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            <span className="font-black text-sm">TOTAL MODAL</span>
            <span className="font-black text-2xl font-mono">{formatCurrency(total)}</span>
          </div>

          {/* 4. Catatan */}
          <div>
            <label className="text-sm font-bold block mb-1">Catatan (opsional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2}
              placeholder="Misal: tukar uang receh Rp 50.000 di awal shift..."
              className="w-full text-sm border-2 border-brand-black px-3 py-2 outline-none focus:border-brand-yellow resize-none"
              style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
          </div>
        </div>

        <div className="px-5 py-4 border-t-2 border-brand-black flex gap-3 bg-brand-cream shrink-0">
          <button onClick={() => { reset(); onClose(); }}
            className="flex-1 py-2.5 font-bold text-sm border-2 border-brand-black bg-white hover:bg-gray-50"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            Nanti
          </button>
          <button onClick={handleOpen} disabled={loading}
            className="flex-1 py-2.5 font-black text-sm border-2 border-brand-black bg-brand-yellow hover:bg-yellow-300 disabled:opacity-40"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            {loading ? "Membuka..." : "Buka Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ShiftCloseModal — Modal tutup shift (klerek lengkap) ──────────────
function ShiftCloseModal({ isOpen, shift, report, onClose, onConfirm }) {
  const [closingDenoms, setClosingDenoms] = useState({});
  const [closingTotal, setClosingTotal] = useState(0);   // = saldo fisik laci
  const [pettyCash, setPettyCash] = useState("");
  const [pettyNote, setPettyNote] = useState("");
  const [notes, setNotes] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!isOpen || !shift) return null;

  const cashReport = report?.cash_summary;
  const sales      = report?.sales_summary;
  const groups     = report?.payment_groups;

  const openingBalance = cashReport?.opening_balance ?? 0;
  const cashSales      = cashReport?.cash_sales ?? 0;
  const petty          = parseFloat(pettyCash) || 0;

  // Uang tunai seharusnya = Modal Awal + Penjualan Tunai − Pengeluaran Kas Kecil
  const expected = openingBalance + cashSales - petty;
  // Selisih = uang fisik − seharusnya  (minus = kurang/shortage, plus = lebih/overage)
  const variance = closingTotal - expected;

  const reset = () => {
    setClosingDenoms({}); setClosingTotal(0); setPettyCash(""); setPettyNote("");
    setNotes(""); setVerifiedBy(""); setErr("");
  };

  const handleClose = async () => {
    setLoading(true); setErr("");
    try {
      await onConfirm({
        closing_balance: closingTotal,
        closing_denominations: Object.keys(closingDenoms).length ? closingDenoms : undefined,
        petty_cash: petty || undefined,
        petty_cash_note: pettyNote || undefined,
        notes: notes || undefined,
        verified_by: verifiedBy || undefined,
      });
      reset();
    } catch (e) { setErr(getErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const closeTime = new Date().toLocaleString("id-ID");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.7)" }}>
      <div className="bg-white border-2 border-brand-black w-full max-w-2xl flex flex-col max-h-[95vh]"
        style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
        <div className="px-5 py-4 bg-brand-black text-white border-b-2 border-brand-black shrink-0">
          <h3 className="font-black text-lg font-grotesk">🔒 Tutup Shift — {shift.shift_name}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {/* 1. Informasi Dasar & Identitas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 bg-brand-cream border-2 border-brand-black">
              <p className="text-[10px] font-bold text-brand-black/50 uppercase tracking-wider">Dibuka</p>
              <p className="font-black font-mono text-xs">{shift.opened_at}</p>
            </div>
            <div className="p-3 bg-brand-cream border-2 border-brand-black">
              <p className="text-[10px] font-bold text-brand-black/50 uppercase tracking-wider">Ditutup</p>
              <p className="font-black font-mono text-xs">{closeTime}</p>
            </div>
            <div className="p-3 bg-brand-cream border-2 border-brand-black">
              <p className="text-[10px] font-bold text-brand-black/50 uppercase tracking-wider">Shift</p>
              <p className="font-black">{shift.shift_name} <span className="text-brand-black/40 font-mono">#{shift.shift_number}</span></p>
            </div>
            <div className="p-3 bg-brand-cream border-2 border-brand-black">
              <p className="text-[10px] font-bold text-brand-black/50 uppercase tracking-wider">Kasir</p>
              <p className="font-black text-xs">{shift.user?.name ?? "-"}</p>
            </div>
          </div>

          {/* 2. Ringkasan Penjualan (Sales Summary) */}
          {sales && (
            <div className="border-2 border-brand-black">
              <div className="px-4 py-2 bg-brand-black text-white"><p className="font-bold text-xs uppercase">Ringkasan Penjualan</p></div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span>Penjualan Kotor (sebelum PPN)</span><span className="font-mono font-bold">{formatCurrency(sales.gross_sales)}</span></div>
                <div className="flex justify-between"><span>PPN 11%</span><span className="font-mono font-bold">{formatCurrency(sales.tax)}</span></div>
                <div className="flex justify-between border-t-2 border-brand-black pt-2 font-black"><span>Penjualan Bersih (diterima)</span><span className="font-mono">{formatCurrency(sales.net_sales)}</span></div>
                {sales.void_count > 0 && (
                  <div className="flex justify-between text-brand-black/50 text-xs pt-1">
                    <span>Transaksi dibatalkan (void)</span>
                    <span className="font-mono">{sales.void_count} tx · {formatCurrency(sales.void_amount)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Metode Pembayaran (Tunai vs Non-Tunai) */}
          {groups && (
            <div>
              <p className="text-sm font-bold mb-2">Metode Pembayaran</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="p-3 border-2 border-brand-black bg-white text-center" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                  <p className="text-[10px] font-bold text-brand-black/50 uppercase">Tunai</p>
                  <p className="font-black font-mono">{formatCurrency(groups.cash)}</p>
                </div>
                <div className="p-3 border-2 border-brand-black bg-white text-center" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
                  <p className="text-[10px] font-bold text-brand-black/50 uppercase">Non-Tunai</p>
                  <p className="font-black font-mono">{formatCurrency(groups.non_cash)}</p>
                </div>
              </div>
              {report?.payment_breakdown?.length > 0 && (
                <div className="border-2 border-brand-black divide-y divide-brand-black/10">
                  {report.payment_breakdown.map((p, i) => (
                    <div key={i} className="flex justify-between px-3 py-1.5 text-xs">
                      <span className="font-semibold capitalize">{p.method}</span>
                      <div className="text-right">
                        <span className="font-black font-mono">{formatCurrency(p.total)}</span>
                        <span className="text-brand-black/40 ml-2">({p.count} tx)</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Perhitungan Uang Tunai Fisik (Cash Counting) */}
          <div>
            <p className="text-sm font-bold mb-2">Hitung Uang Fisik di Laci</p>
            <DenominationCounter value={closingDenoms} onChange={(d, t) => { setClosingDenoms(d); setClosingTotal(t); }} />
            <div className="flex justify-between items-center py-2.5 px-4 border-2 border-brand-black bg-brand-yellow mt-2" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
              <span className="font-black text-sm">SALDO FISIK (LACI)</span>
              <span className="font-black text-xl font-mono">{formatCurrency(closingTotal)}</span>
            </div>
          </div>

          {/* Petty cash — pengeluaran kas kecil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-bold block mb-1">Pengeluaran Kas Kecil (Rp)</label>
              <input type="number" min="0" value={pettyCash} onChange={(e) => setPettyCash(e.target.value)}
                placeholder="0"
                className="w-full text-right px-3 py-2 font-black font-mono border-2 border-brand-black outline-none focus:border-brand-yellow text-sm"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Catatan Pengeluaran</label>
              <input value={pettyNote} onChange={(e) => setPettyNote(e.target.value)}
                placeholder="Misal: beli lakban, bayar kurir"
                className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
            </div>
          </div>

          {/* 5. Rekonsiliasi & Selisih (Variance) */}
          <div className="border-2 border-brand-black bg-brand-cream">
            <div className="px-4 py-2 bg-brand-black text-white"><p className="font-bold text-xs uppercase">Rekonsiliasi Kas</p></div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Modal Awal</span><span className="font-mono font-bold">{formatCurrency(openingBalance)}</span></div>
              <div className="flex justify-between"><span>+ Penjualan Tunai</span><span className="font-mono font-bold">{formatCurrency(cashSales)}</span></div>
              <div className="flex justify-between"><span>− Pengeluaran Kas Kecil</span><span className="font-mono font-bold">{formatCurrency(petty)}</span></div>
              <div className="flex justify-between border-t-2 border-brand-black pt-2 font-black"><span>Uang Tunai Seharusnya</span><span className="font-mono">{formatCurrency(expected)}</span></div>
              <div className="flex justify-between"><span>Uang Fisik di Laci</span><span className="font-mono font-bold">{formatCurrency(closingTotal)}</span></div>
              {closingTotal > 0 && (
                <div className={`flex justify-between font-black text-base p-3 border-2 mt-2 ${
                  variance === 0
                    ? "bg-green-50 border-green-400 text-green-700"
                    : Math.abs(variance) < 1000
                    ? "bg-yellow-50 border-yellow-400 text-yellow-700"
                    : "bg-red-50 border-red-400 text-red-700"
                }`}>
                  <span>SELISIH {variance === 0 ? "(PAS)" : variance > 0 ? "(LEBIH)" : "(KURANG)"}</span>
                  <span className="font-mono">{formatCurrency(variance)}</span>
                </div>
              )}
            </div>
          </div>

          {/* 6. Validasi (Otorisasi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 border-2 border-brand-black bg-white">
              <p className="text-[10px] font-bold text-brand-black/50 uppercase tracking-wider">Ditutup oleh (Kasir)</p>
              <p className="font-black text-sm mt-0.5">{shift.user?.name ?? "-"}</p>
              <p className="text-[10px] text-brand-black/40">Tercatat otomatis oleh sistem</p>
            </div>
            <div>
              <label className="text-sm font-bold block mb-1">Diverifikasi oleh (Supervisor)</label>
              <input value={verifiedBy} onChange={(e) => setVerifiedBy(e.target.value)}
                placeholder="Nama supervisor (opsional)"
                className="w-full px-3 py-2 text-sm border-2 border-brand-black outline-none focus:border-brand-yellow"
                style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
            </div>
          </div>

          {/* Catatan umum */}
          <div>
            <label className="text-sm font-bold block mb-1">Catatan Shift (opsional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan untuk shift ini..."
              rows={2}
              className="w-full text-sm border-2 border-brand-black px-3 py-2 outline-none focus:border-brand-yellow resize-none"
              style={{ boxShadow: "1px 1px 0 #0A0A0A" }} />
          </div>

          {err && <p className="text-sm text-red-600 font-semibold bg-red-50 p-3 border-2 border-red-300">{err}</p>}

          {/* Recent Orders */}
          {report?.orders && report.orders.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">Riwayat Transaksi ({report.orders.length})</p>
              <div className="max-h-48 overflow-y-auto border-2 border-brand-black scrollbar-thin">
                <table className="w-full text-xs">
                  <thead className="bg-brand-black text-white sticky top-0">
                    <tr>
                      <th className="text-left px-2 py-1.5">Order</th>
                      <th className="text-left px-2 py-1.5">Item</th>
                      <th className="text-left px-2 py-1.5">Metode</th>
                      <th className="text-right px-2 py-1.5">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-black/10">
                    {report.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-brand-cream">
                        <td className="px-2 py-1.5 font-mono font-bold">{o.order_number}</td>
                        <td className="px-2 py-1.5">{o.item_count}</td>
                        <td className="px-2 py-1.5 capitalize">{o.payment_method ?? "-"}</td>
                        <td className="px-2 py-1.5 text-right font-mono font-bold">{formatCurrency(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t-2 border-brand-black flex gap-3 bg-brand-cream shrink-0">
          <button onClick={onClose}
            className="flex-1 py-2.5 font-bold text-sm border-2 border-brand-black bg-white hover:bg-gray-50"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            Kembali
          </button>
          <button onClick={handleClose} disabled={loading}
            className="flex-1 py-2.5 font-black text-sm border-2 border-brand-black bg-brand-yellow hover:bg-yellow-300 disabled:opacity-40"
            style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            {loading ? "Menutup..." : "Tutup Shift"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ShiftHistoryModal — Riwayat shift ─────────────────────────
function ShiftHistoryModal({ isOpen, onClose, shifts, onSelectShift }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,0.7)" }}>
      <div className="bg-white border-2 border-brand-black w-full max-w-lg flex flex-col max-h-[80vh]"
        style={{ boxShadow: "6px 6px 0 #0A0A0A" }}>
        <div className="px-5 py-4 bg-brand-black text-white border-b-2 border-brand-black flex items-center justify-between shrink-0">
          <h3 className="font-black text-lg font-grotesk">Riwayat Shift</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white font-black">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-brand-black/10">
          {shifts.length === 0 ? (
            <p className="text-center py-8 text-sm text-brand-black/40">Belum ada riwayat shift.</p>
          ) : (
            shifts.map((s) => (
              <button key={s.id} onClick={() => onSelectShift(s)}
                className="w-full text-left px-4 py-3 hover:bg-brand-cream transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-sm">{s.shift_name}</span>
                    <span className={`ml-2 text-[10px] font-black px-1.5 py-0.5 ${
                      s.status === "open" ? "bg-green-100 text-green-700 border border-green-300" : "bg-gray-100 text-gray-500 border border-gray-300"
                    }`}>
                      {s.status === "open" ? "AKTIF" : "TUTUP"}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-brand-black/40">{s.opened_at}</span>
                </div>
                <div className="flex gap-4 mt-1 text-xs text-brand-black/60">
                  <span>Order: <strong>{s.order_count}</strong></span>
                  <span>Penjualan: <strong>{formatCurrency(s.total_sales)}</strong></span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [cashModal,    setCashModal]   = useState(false);   // modal bayar tunai
  const [receiptData,  setReceiptData] = useState(null);    // data struk setelah bayar
  const [receiptOpen,  setReceiptOpen] = useState(false);   // tampilkan struk

  // ── Shift State ──
  const [currentShift,     setCurrentShift]     = useState(null);
  const [shiftWithinWindow, setShiftWithinWindow] = useState(true);
  const [shiftLoading,     setShiftLoading]     = useState(true);
  const [shiftOpenModal, setShiftOpenModal] = useState(false);
  const [shiftCloseModal, setShiftCloseModal] = useState(false);
  const [shiftReport,   setShiftReport]   = useState(null);
  const [shiftHistory,   setShiftHistory]  = useState([]);
  const [shiftHistoryModal, setShiftHistoryModal] = useState(false);
  const [closeReportLoading, setCloseReportLoading] = useState(false);

  // useDebounce: tunda request pencarian sampai 400ms setelah user berhenti ketik
  // Tanpa ini, setiap keystroke langsung kirim request API (spam)
  const debouncedSearch = useDebounce(search, 400);

  // Ambil fungsi dan data dari cartStore (Zustand)
  // Destructuring langsung dari store — semua ini reaktif
  const { items, addItem, removeItem, deleteItem, getSubtotal, getTax, getTotal, clearCart, getOrderPayload } = useCartStore();
  const user = useAuthStore((s) => s.user);

  // Fetch kategori & shift SEKALI saat halaman pertama load
  useEffect(() => {
    categoryService.getAll({ is_active: true }).then((res) => setCategories(res.data ?? res)).catch(() => {});
    loadCurrentShift();
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
  // Buat objek data struk dari order + pilihan bayar
  const buildReceipt = (orderRes, cashAmount, paymentMethod) => ({
    order_number:   orderRes.data?.order_number ?? orderRes.order?.order_number ?? "-",
    kasir:          user?.name ?? "Kasir",
    date:           new Date().toLocaleString("id-ID"),
    items:          [...items],
    subtotal:       getSubtotal(),
    tax:            getTax(),
    total:          getTotal(),
    cash:           cashAmount,
    change:         Math.max(0, cashAmount - getTotal()),
    payment_method: paymentMethod,
    customer_phone: customerPhone,
  });

  const showReceipt = (data) => {
    setReceiptData(data);
    setReceiptOpen(true);
    clearCart();
    setNotes("");
    setCustomerPhone("");
    setCartVisible(false);
  };

  // Checkout tunai: buat order → tandai paid → tampilkan struk
  const handleCashCheckout = async (cashAmount) => {
    if (!currentShift) {
      alert("Kamu harus membuka shift terlebih dahulu sebelum bertransaksi.");
      return;
    }
    if (!shiftWithinWindow) {
      alert(`Jam shift ${currentShift.shift_name} (${currentShift.start_time}–${currentShift.end_time}) sudah berakhir. Lakukan klerk untuk menutup shift.`);
      return;
    }
    setCashModal(false);
    setPaying(true);
    try {
      const orderRes = await orderService.create({
        items: getOrderPayload(),
        notes,
        ...(customerPhone ? { customer_phone: customerPhone } : {}),
      });
      const orderId = orderRes.data?.id ?? orderRes.order?.id ?? orderRes.id;
      if (orderId) await orderService.updateStatus(orderId, "paid", "cash");
      showReceipt(buildReceipt(orderRes, cashAmount, "Tunai"));
      loadCurrentShift();
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal checkout. Coba lagi.");
    } finally { setPaying(false); }
  };

  // Load snap.js Midtrans secara dinamis dengan client key milik tenant
  const loadMidtransSnap = (clientKey) => new Promise((resolve, reject) => {
    if (window.snap) return resolve();
    const existing = document.getElementById("midtrans-snap-js");
    if (existing) { existing.onload = resolve; return; }
    const script = document.createElement("script");
    script.id = "midtrans-snap-js";
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey);
    script.onload  = resolve;
    script.onerror = () => reject(new Error("Gagal memuat Midtrans Snap."));
    document.body.appendChild(script);
  });

  // Checkout digital: buat order → buat transaksi → buka Midtrans Snap
  const handleDigitalCheckout = async () => {
    if (items.length === 0) return alert("Keranjang masih kosong!");
    if (!currentShift) {
      alert("Kamu harus membuka shift terlebih dahulu sebelum bertransaksi.");
      return;
    }
    if (!shiftWithinWindow) {
      alert(`Jam shift ${currentShift.shift_name} (${currentShift.start_time}–${currentShift.end_time}) sudah berakhir. Lakukan klerk untuk menutup shift.`);
      return;
    }
    if (!user?.midtrans_client_key) {
      alert("Midtrans belum dikonfigurasi. Masuk ke Profil → atur Midtrans Client Key & Server Key terlebih dahulu.");
      return;
    }
    setPaying(true);
    try {
      await loadMidtransSnap(user.midtrans_client_key);

      const orderRes  = await orderService.create({
        items: getOrderPayload(),
        notes,
        ...(customerPhone ? { customer_phone: customerPhone } : {}),
      });
      const orderId   = orderRes.data?.id ?? orderRes.order?.id;
      const txRes     = await transactionService.create({ order_id: orderId });
      const snapToken = txRes.snap_token ?? txRes.data?.snap_token;

      if (snapToken && window.snap) {
        window.snap.pay(snapToken, {
          onSuccess: () => {
            showReceipt(buildReceipt(orderRes, getTotal(), "QRIS"));
            loadCurrentShift();
          },
          onPending: () => alert("Menunggu pembayaran..."),
          onError:   () => alert("Pembayaran gagal. Coba lagi."),
          onClose:   () => {},
        });
      } else if (snapToken) {
        showReceipt(buildReceipt(orderRes, getTotal(), "Digital"));
      } else {
        showReceipt(buildReceipt(orderRes, getTotal(), "Tunai"));
      }
    } catch (err) {
      alert(err.response?.data?.message ?? "Gagal checkout. Coba lagi.");
    } finally { setPaying(false); }
  };

  // ── Shift Functions ──
  const loadCurrentShift = async () => {
    setShiftLoading(true);
    try {
      const res = await shiftService.getCurrent();
      if (res.data) {
        setCurrentShift(res.data);
        setShiftWithinWindow(res.within_window !== false);
      } else {
        setCurrentShift(null);
        setShiftWithinWindow(true);
      }
    } catch (e) {
      // ignore
    } finally {
      setShiftLoading(false);
    }
  };

  const handleOpenShift = async (payload) => {
    const res = await shiftService.open(payload);
    setCurrentShift(res.data);
    setShiftOpenModal(false);
  };

  const handleCloseShift = async (payload) => {
    const res = await shiftService.close(currentShift.id, payload);
    setShiftCloseModal(false);
    setCurrentShift(null);
    setShiftReport(null);

    // Beri konfirmasi hasil rekonsiliasi kas ke kasir
    const diff = res.data?.difference ?? 0;
    const status =
      diff === 0 ? "Kas PAS ✅"
      : diff > 0 ? `Kas LEBIH ${formatCurrency(diff)} 🔼`
      : `Kas KURANG ${formatCurrency(Math.abs(diff))} 🔽`;
    alert(`Shift berhasil ditutup.\n\nSelisih kas: ${status}`);

    // Muat ulang status shift → tampilkan saran shift berikutnya di info bar
    loadCurrentShift();
  };

  const openCloseModal = async () => {
    setCloseReportLoading(true);
    try {
      const res = await shiftService.getReport(currentShift.id);
      setShiftReport(res.data);
      setShiftCloseModal(true);
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setCloseReportLoading(false);
    }
  };

  const openShiftHistory = async () => {
    try {
      const res = await shiftService.getAll();
      setShiftHistory(res.data ?? []);
      setShiftHistoryModal(true);
    } catch (e) {
      alert(getErrorMessage(e));
    }
  };

  const viewShiftReport = async (shift) => {
    setShiftHistoryModal(false);
    setCloseReportLoading(true);
    try {
      const res = await shiftService.getReport(shift.id);
      setShiftReport(res.data);
      setShiftCloseModal(true);
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setCloseReportLoading(false);
    }
  };

  // Total item di keranjang (jumlah unit, bukan jenis produk)
  // Dipakai untuk badge di tombol 🛒 mobile
  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <>
    {/* ── Shift Info Bar ── */}
    {!shiftLoading && (
      <>
      <div className={`px-4 py-1.5 border-b-2 border-brand-black flex items-center justify-between text-xs font-bold shrink-0 ${
        currentShift ? (shiftWithinWindow ? "bg-green-50" : "bg-orange-50") : "bg-yellow-50"
      }`}>
        <div className="flex items-center gap-3">
          {currentShift ? (
            <>
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full inline-block ${shiftWithinWindow ? "bg-green-500" : "bg-orange-400"}`} />
                <span className="font-black">{currentShift.shift_name}</span>
                {currentShift.start_time && currentShift.end_time && (
                  <span className="text-brand-black/50 font-mono">{currentShift.start_time}–{currentShift.end_time}</span>
                )}
              </span>
              <span className="text-brand-black/50">|</span>
              <span className="text-brand-black/60 font-mono">Buka: {currentShift.opened_at}</span>
              <span className="text-brand-black/50">|</span>
              <span className="text-brand-black/60">
                Order: <strong>{currentShift.order_count}</strong>
              </span>
              {currentShift.total_sales > 0 && (
                <>
                  <span className="text-brand-black/50">|</span>
                  <span className="text-brand-black/60 font-mono">
                    {formatCurrency(currentShift.total_sales)}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              <span className="font-semibold">Belum ada shift aktif</span>
              <span className="text-brand-black/50">— Buka shift untuk mulai bertransaksi</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentShift ? (
            <>
              <button onClick={openShiftHistory}
                className="text-[10px] px-2 py-1 border border-brand-black/30 hover:bg-white transition-colors font-semibold">
                Riwayat Shift
              </button>
              <button onClick={openCloseModal} disabled={closeReportLoading}
                className="text-[10px] px-2 py-1 bg-brand-black text-white border border-brand-black hover:bg-gray-800 transition-colors font-black disabled:opacity-40">
                {closeReportLoading ? "Memuat..." : "🔒 Tutup Shift"}
              </button>
            </>
          ) : (
            <button onClick={() => setShiftOpenModal(true)}
              className="text-[10px] px-2 py-1 bg-brand-yellow border-2 border-brand-black font-black hover:bg-yellow-300 transition-colors">
              Buka Shift
            </button>
          )}
        </div>
      </div>
      {/* Banner peringatan di luar jam shift */}
      {currentShift && !shiftWithinWindow && (
        <div className="px-4 py-2 bg-orange-100 border-b-2 border-orange-400 text-xs font-semibold text-orange-700 flex items-center gap-2 shrink-0">
          <span>⚠️</span>
          <span>Di luar jam shift <strong>{currentShift.shift_name}</strong> ({currentShift.start_time}–{currentShift.end_time}). Transaksi diblokir — lakukan klerk untuk menutup shift ini.</span>
        </div>
      )}
      </>
    )}

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
              className="px-3 py-2 border-2 border-brand-black font-black text-sm bg-white hover:bg-brand-yellow transition-colors hidden sm:flex items-center"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              title="Kelola Produk"
            >
              Produk
            </button>
            {/* Tombol toggle keranjang — HANYA di mobile (lg:hidden) */}
            <button
              onClick={() => setCartVisible(true)}
              className="lg:hidden relative px-3 py-2 bg-brand-yellow border-2 border-brand-black font-black text-sm"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
            >
              Keranjang
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="skeleton rounded-xl aspect-[4/5]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {products.map((p) => <ProductCard key={p.id} product={p} onAdd={addItem} />)}
              {products.length === 0 && (
                <div className="col-span-full text-center py-16 text-brand-black/40 font-semibold">
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
          w-72 lg:w-72 xl:w-80 shrink-0
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
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="No. HP customer (struk WA)"
              className="flex-1 text-xs py-2 px-2.5 outline-none bg-transparent"
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
            <div className="flex justify-between font-black text-base border-t-2 border-brand-black pt-2">
              <span>TOTAL</span>
              <span className="font-mono">{formatCurrency(getTotal())}</span>
            </div>
          </div>

          {/* Dua tombol bayar: TUNAI dan DIGITAL (PRD: split button) */}
          <div className="flex gap-2">
            <button
              onClick={() => { if (items.length > 0) setCashModal(true); }}
              disabled={items.length === 0 || paying}
              className="flex-1 py-3 bg-white border-2 border-brand-black font-black text-sm disabled:opacity-40 hover:bg-gray-50 active:translate-y-0.5 transition-all"
              style={{ boxShadow: items.length > 0 ? "2px 2px 0 #0A0A0A" : "none" }}
            >
              TUNAI
            </button>
            <button
              onClick={handleDigitalCheckout}
              disabled={items.length === 0 || paying}
              className="flex-1 py-3 bg-brand-yellow border-2 border-brand-black font-black text-sm disabled:opacity-40 hover:bg-yellow-300 active:translate-y-0.5 transition-all"
              style={{ boxShadow: items.length > 0 ? "3px 3px 0 #0A0A0A" : "none" }}
            >
              {paying ? "Memproses..." : "DIGITAL"}
            </button>
          </div>
          <p className="text-[10px] font-mono text-brand-black/30 text-center">
            Total: {formatCurrency(getTotal())}
          </p>
        </div>
      </div>
    </div>

    {/* Modal bayar tunai */}
    <CashPaymentModal
      isOpen={cashModal}
      onClose={() => setCashModal(false)}
      total={getTotal()}
      onConfirm={handleCashCheckout}
    />

    {/* Modal struk setelah sukses */}
    <ReceiptModal
      isOpen={receiptOpen}
      data={receiptData}
      onClose={() => setReceiptOpen(false)}
    />

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

    {/* Shift modals */}
    <ShiftOpenModal
      isOpen={shiftOpenModal}
      onClose={() => setShiftOpenModal(false)}
      onConfirm={handleOpenShift}
      user={user}
    />

    <ShiftCloseModal
      isOpen={shiftCloseModal}
      shift={currentShift}
      report={shiftReport}
      onClose={() => setShiftCloseModal(false)}
      onConfirm={handleCloseShift}
    />

    <ShiftHistoryModal
      isOpen={shiftHistoryModal}
      onClose={() => setShiftHistoryModal(false)}
      shifts={shiftHistory}
      onSelectShift={viewShiftReport}
    />
    </>
  );
}
