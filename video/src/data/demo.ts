// ============================================================
// demo.ts, Satu-satunya sumber data fiktif untuk semua scene.
// Toko: "Kopi Senja" (fiktif). JANGAN pakai data tenant/pelanggan asli.
// ============================================================

export const SHOP = {
  name: "Kopi Senja",
  cashier: "Rina",
  email: "rina@kopisenja.id",
  customerWa: "0812-xxxx-xxxx", // disamarkan
  url: "sikasirai.com",
};

export type Product = { id: number; name: string; price: number; emoji: string; stock: number; cost: number };

export const PRODUCTS: Product[] = [
  { id: 1, name: "Es Kopi Susu", price: 18000, cost: 7000, emoji: "🧋", stock: 42 },
  { id: 2, name: "Americano", price: 15000, cost: 5500, emoji: "☕", stock: 35 },
  { id: 3, name: "Matcha Latte", price: 22000, cost: 9000, emoji: "🍵", stock: 28 },
  { id: 4, name: "Croissant", price: 16000, cost: 8000, emoji: "🥐", stock: 18 },
  { id: 5, name: "Roti Bakar", price: 14000, cost: 6000, emoji: "🍞", stock: 22 },
  { id: 6, name: "Air Mineral", price: 5000, cost: 2500, emoji: "💧", stock: 60 },
  { id: 7, name: "Cappuccino", price: 20000, cost: 8000, emoji: "☕", stock: 30 },
  { id: 8, name: "Choco Cookies", price: 12000, cost: 5000, emoji: "🍪", stock: 25 },
];

// Transaksi yang didemokan: 2x Es Kopi Susu + 1x Croissant
export const CART = [
  { productId: 1, qty: 2 },
  { productId: 4, qty: 1 },
];

const TAX_RATE = 0.11; // PPN 11%, sama dengan cartStore di aplikasi
const byId = (id: number) => PRODUCTS.find((p) => p.id === id)!;

export const SUBTOTAL = CART.reduce((s, c) => s + byId(c.productId).price * c.qty, 0); // 52.000
export const TAX = Math.round(SUBTOTAL * TAX_RATE); // 5.720
export const TOTAL = SUBTOTAL + TAX; // 57.720
export const CASH_PAID = 100000;
export const CHANGE = CASH_PAID - TOTAL; // 42.280
export const getProduct = byId;

export const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

// Dashboard & laporan (angka konsisten: omzet hari ini >= satu transaksi)
export const TREND_7D = [
  { day: "Sen", value: 1850000 },
  { day: "Sel", value: 2120000 },
  { day: "Rab", value: 1760000 },
  { day: "Kam", value: 2390000 },
  { day: "Jum", value: 2840000 },
  { day: "Sab", value: 3410000 },
  { day: "Min", value: 3105000 },
];

export const TOP_PRODUCTS = [
  { name: "Es Kopi Susu", qty: 186 },
  { name: "Croissant", qty: 124 },
  { name: "Matcha Latte", qty: 98 },
  { name: "Americano", qty: 81 },
  { name: "Roti Bakar", qty: 57 },
];

// Angka bulanan (dashboard) dan 7 hari terakhir (laporan) dibuat konsisten dengan TREND_7D
export const MONTH = { revenue: 71380000, orders: 2468 };

export const REPORT = {
  revenue: 17475000,
  orders: 612,
  cogs: 8890000,
  profit: 8585000,
  margin: 49.1, // laba / pendapatan
};

export const AI_QA = {
  question: "Produk apa yang paling laku minggu ini?",
  answer:
    "Es Kopi Susu paling laku minggu ini: 186 gelas terjual dengan omzet Rp 3,35 juta. Disusul Croissant (124 pcs). Stok Croissant tinggal 18, sebaiknya segera restock.",
};
