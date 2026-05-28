// ============================================================
// cartStore.js — Global state untuk keranjang belanja kasir
//
// Analogi: Ini seperti "nampan" di kasir restoran —
// kasir menaruh produk yang dipesan ke nampan,
// bisa tambah/kurangi/hapus, dan di akhir langsung checkout.
//
// Keranjang ini dipakai di halaman Kasir (/kasir) —
// kasir klik produk → masuk keranjang → checkout → order terbuat
//
// Relasi:
//   - cartStore → dibaca oleh CartPanel.jsx (tampilkan isi keranjang)
//   - cartStore → dibaca oleh ProductGrid.jsx (tombol tambah ke keranjang)
//   - cartStore → dipakai oleh PaymentModal.jsx untuk buat order + transaksi
//   - cartStore → setelah checkout sukses, keranjang dikosongkan (clearCart)
//
// Rumus harga:
//   subtotal = Σ (item.price × item.quantity)
//   tax      = subtotal × 11% (PPN)
//   total    = subtotal + tax
// ============================================================

import { create } from "zustand";

const TAX_RATE = 0;

const useCartStore = create((set, get) => ({
  // ============================================================
  // STATE
  // ============================================================

  // Daftar item di keranjang
  // Format: [{ product_id, name, price, stock, image, quantity }]
  // Analogi: isi nampan — setiap produk adalah satu jenis makanan di nampan
  items: [],

  // ============================================================
  // COMPUTED (getter) — dihitung dari items, bukan disimpan sendiri
  // ============================================================

  // Total sebelum pajak
  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  // Pajak PPN 11%
  getTax: () => {
    return get().getSubtotal() * TAX_RATE;
  },

  // Total akhir yang harus dibayar
  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },

  // Jumlah total item (sum quantity, bukan sum jenis produk)
  // Analogi: total lembar nota, bukan total jenis barang
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // ============================================================
  // ACTIONS
  // ============================================================

  // --- TAMBAH PRODUK KE KERANJANG ---
  // Analogi: kasir klik produk di layar → masuk ke nampan
  // Jika produk sudah ada → tambah quantity (bukan buat item baru)
  // Jika stok tidak cukup → tidak ditambah
  //
  // @param {{ id, name, price, stock, image, ... }} product
  addItem: (product) => {
    set((state) => {
      const existing = state.items.find((i) => i.product_id === product.id);

      if (existing) {
        // Produk sudah ada di keranjang → tambah quantity
        // Cek apakah stok masih cukup untuk tambah 1 lagi
        if (existing.quantity >= product.stock) {
          // Stok habis — tidak tambah (bisa tampilkan toast dari komponen pemanggil)
          return state;
        }
        return {
          items: state.items.map((i) =>
            i.product_id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }

      // Produk belum ada → tambah sebagai item baru dengan quantity 1
      return {
        items: [
          ...state.items,
          {
            product_id: product.id,
            name:       product.name,
            price:      parseFloat(product.price),   // Pastikan number, bukan string
            stock:      product.stock,
            image:      product.image,
            quantity:   1,
          },
        ],
      };
    });
  },

  // --- KURANGI QUANTITY ITEM ---
  // Jika quantity jadi 0 setelah dikurangi, item dihapus dari keranjang
  // Analogi: kasir kembalikan satu porsi dari nampan ke dapur
  removeItem: (productId) => {
    set((state) => {
      const item = state.items.find((i) => i.product_id === productId);
      if (!item) return state;

      if (item.quantity <= 1) {
        // Quantity sudah 1, dikurangi lagi → hapus item
        return { items: state.items.filter((i) => i.product_id !== productId) };
      }

      return {
        items: state.items.map((i) =>
          i.product_id === productId
            ? { ...i, quantity: i.quantity - 1 }
            : i
        ),
      };
    });
  },

  // --- HAPUS ITEM DARI KERANJANG (langsung, apapun quantity-nya) ---
  deleteItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product_id !== productId),
    }));
  },

  // --- UPDATE QUANTITY MANUAL ---
  // Dipanggil saat kasir ketik angka quantity langsung
  // @param {number} productId
  // @param {number} quantity — harus > 0 dan <= stock
  setQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().deleteItem(productId);
      return;
    }

    set((state) => ({
      items: state.items.map((i) => {
        if (i.product_id !== productId) return i;
        const validQty = Math.min(quantity, i.stock);  // Tidak boleh melebihi stok
        return { ...i, quantity: validQty };
      }),
    }));
  },

  // --- KOSONGKAN KERANJANG ---
  // Dipanggil setelah checkout berhasil — bersihkan nampan untuk pelanggan berikutnya
  clearCart: () => set({ items: [] }),

  // --- FORMAT ITEMS UNTUK DIKIRIM KE API ---
  // Backend butuh format: [{ product_id, quantity }]
  // Analogi: mengubah "isi nampan" jadi "daftar pesanan" untuk dapur
  getOrderPayload: () => {
    return get().items.map((i) => ({
      product_id: i.product_id,
      quantity:   i.quantity,
    }));
  },
}));

export default useCartStore;
