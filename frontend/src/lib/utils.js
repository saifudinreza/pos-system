// ============================================================
// utils.js — Kumpulan fungsi bantu (helper functions)
//
// Analogi: Ini seperti "kotak peralatan" di bengkel —
// berisi berbagai alat kecil yang sering dipakai di mana-mana.
// Daripada bawa palu ke setiap ruangan, simpan saja di satu kotak
// dan panggil saat dibutuhkan.
// ============================================================

// --- FORMAT UANG (IDR) ---
// Mengubah angka → string Rupiah yang rapi
// Contoh: 25000 → "Rp 25.000"
// Analogi: seperti mesin kasir yang otomatis tampilin format harga
export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

// --- FORMAT TANGGAL ---
// Contoh: "2024-01-15T10:30:00Z" → "15 Jan 2024"
export function formatDate(dateString) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

// --- FORMAT TANGGAL + JAM ---
// Contoh: "2024-01-15T10:30:00Z" → "15 Jan 2024, 17.30"
export function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

// --- GABUNG CLASS TAILWIND ---
// Analogi: seperti tukang jahit yang pilih bahan — ambil yang ada, buang yang kosong
// Contoh: cn("text-red", isActive && "font-bold") → "text-red font-bold"
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

// --- STATUS ORDER → LABEL + WARNA ---
// Mengembalikan teks dan kelas warna Tailwind sesuai status order
// Analogi: seperti lampu sinyal lalu lintas — setiap warna punya arti
export function getOrderStatusConfig(status) {
  const map = {
    pending:   { label: "Menunggu Bayar", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    paid:      { label: "Lunas",          color: "bg-green-100 text-green-800 border-green-300" },
    cancelled: { label: "Dibatalkan",     color: "bg-red-100 text-red-800 border-red-300" },
  };
  return map[status] ?? { label: status, color: "bg-gray-100 text-gray-800 border-gray-300" };
}

// --- STATUS TRANSAKSI → LABEL + WARNA ---
// Midtrans mengembalikan status berbeda dari status order
export function getTransactionStatusConfig(status) {
  const map = {
    pending:    { label: "Menunggu",   color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
    settlement: { label: "Berhasil",   color: "bg-green-100 text-green-800 border-green-300" },
    expire:     { label: "Kadaluarsa", color: "bg-gray-100 text-gray-800 border-gray-300" },
    cancel:     { label: "Dibatalkan", color: "bg-red-100 text-red-800 border-red-300" },
    deny:       { label: "Ditolak",    color: "bg-red-100 text-red-800 border-red-300" },
  };
  return map[status] ?? { label: status, color: "bg-gray-100 text-gray-800 border-gray-300" };
}

// --- ROLE USER → LABEL ---
export function getRoleLabel(role) {
  const map = {
    admin:     "Admin",
    kasir:     "Kasir",
    user:      "Pelanggan",
    developer: "Developer",
  };
  return map[role] ?? role;
}

// --- EXTRACT PESAN ERROR DARI RESPONSE AXIOS ---
// Backend Laravel mengembalikan error dalam berbagai format,
// fungsi ini menyatukannya jadi satu string yang bisa ditampilkan
// Analogi: seperti penterjemah yang mengubah berbagai bahasa jadi satu bahasa
export function getErrorMessage(error) {
  // Validation error Laravel (422): { errors: { field: ["msg"] } }
  if (error?.response?.data?.errors) {
    const errors = error.response.data.errors;
    return Object.values(errors).flat().join(", ");
  }
  // Error biasa dengan message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  // Error jaringan (tidak ada respons dari server)
  if (error?.message) {
    return error.message;
  }
  return "Terjadi kesalahan, coba lagi.";
}

// --- SINGKAT ANGKA BESAR ---
// Contoh: 2500000 → "2,5jt" | 150000 → "150rb"
export function compactNumber(num) {
  if (!num) return "0";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "jt";
  if (num >= 1_000)     return (num / 1_000).toFixed(0) + "rb";
  return String(num);
}

// --- BUAT QUERY STRING DARI OBJECT ---
// Analogi: seperti mengisi formulir pencarian — tiap field jadi bagian URL
// Contoh: { page: 1, search: "ayam" } → "?page=1&search=ayam"
// Nilai kosong (null, undefined, "") otomatis dibuang
export function buildQueryString(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== "") {
      qs.append(key, val);
    }
  });
  const str = qs.toString();
  return str ? `?${str}` : "";
}
