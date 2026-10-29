// ============================================================
// demoFlow.js, satu alur transaksi demo yang menggerakkan tiga layar
// hero (issue #22): mesin POS, tablet pesanan, dan HP pemilik.
//
// Langkah (step):
//   0  kasir menambah Kopi Susu Gula Aren x2
//   1  menambah Nasi Goreng Spesial
//   2  menambah Es Teh Manis x2
//   3  bayar QRIS, cap LUNAS
//   4  struk terkirim ke WhatsApp (toast di HP)
//   5  pesanan masuk di tablet, laporan bertambah
//
// FINAL_STEP dipakai saat render server dan reduced motion supaya
// tampilan statis sudah lengkap. Angka dibuat konsisten:
// subtotal 73.000 + PPN 11% 8.030 = 81.030.
// ============================================================

export const STEP_COUNT = 6;
export const FINAL_STEP = STEP_COUNT - 1;
export const STEP_MS = 1400;

export const CART_ITEMS = [
  { name: "Kopi Susu Gula Aren", unit: 18000, qty: 2 },
  { name: "Nasi Goreng Spesial", unit: 25000, qty: 1 },
  { name: "Es Teh Manis",        unit: 6000,  qty: 2 },
];

export const rupiah = (n) => "Rp " + n.toLocaleString("id-ID");
export const angka  = (n) => n.toLocaleString("id-ID");

/** Isi keranjang pada langkah tertentu (langkah 0 = 1 item). */
export function cartAt(step) {
  const items = CART_ITEMS.slice(0, Math.min(step, 2) + 1);
  const subtotal = items.reduce((s, i) => s + i.unit * i.qty, 0);
  const tax = Math.round(subtotal * 0.11);
  return {
    items,
    qty: items.reduce((s, i) => s + i.qty, 0),
    subtotal,
    tax,
    total: subtotal + tax,
    paid: step >= 3,
    // Produk yang sedang "diklik" kasir (disorot di grid)
    adding: step <= 2 ? CART_ITEMS[step].name : null,
  };
}

// Laporan pemilik sebelum dan sesudah transaksi ini masuk
const BASE = { revenue: 8640000, orders: 312, items: 587 };

export function reportAt(step) {
  const done = step >= 5;
  const { total, qty } = cartAt(FINAL_STEP);
  const revenue = BASE.revenue + (done ? total : 0);
  const orders  = BASE.orders + (done ? 1 : 0);
  return {
    revenue,
    orders,
    average: Math.round(revenue / orders),
    items: BASE.items + (done ? qty : 0),
    delta: done ? total : 0,
    receiptSent: step >= 4,
  };
}
