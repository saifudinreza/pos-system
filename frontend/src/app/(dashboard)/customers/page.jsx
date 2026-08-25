"use client";

// ============================================================
// CustomersPage, Daftar pelanggan (CRM) + riwayat belanja
//
// Pelanggan ter-capture otomatis saat kasir mengisi nomor HP
// di POS (struk WhatsApp). Halaman ini melihat siapa saja yang
// sudah belanja, seberapa sering, dan total belanjanya.
//
// Alur data:
//   GET /api/customers          → daftar + ringkasan (orders & total spent)
//   GET /api/customers/{id}     → detail + riwayat order terbaru
//
// Role: admin & developer.
// ============================================================
import { useState, useEffect } from "react";
import { Search, RefreshCw, UsersRound } from "lucide-react";
import customerService from "@/services/customerService";
import NeoButton from "@/components/ui/NeoButton";
import NeoTable  from "@/components/ui/NeoTable";
import NeoBadge  from "@/components/ui/NeoBadge";
import NeoModal  from "@/components/ui/NeoModal";
import { formatCurrency, getOrderStatusConfig } from "@/lib/utils";

// Nomor HP tersimpan format 628xx → tampilkan 08xx untuk dibaca orang
/** formatPhone, Ubah format nomor HP internal (628xx) jadi tampilan user (08xx). */
function formatPhone(phone) {
  if (!phone) return ", ";
  if (phone.startsWith("62")) return "0" + phone.slice(2);
  return phone;
}

export default function CustomersPage() {
  // ── State ──
  const [customers, setCustomers] = useState([]);
  const [search,    setSearch]    = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [detail,    setDetail]    = useState(null);   // data detail pelanggan
  const [detailLoading, setDetailLoading] = useState(false);

  /**
   * fetchCustomers, Ambil daftar pelanggan; kalau ada kata kunci search,
   * dikirim ke backend (nama/HP). Dipanggil saat halaman dibuka & tombol Cari.
   */
  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await customerService.getAll(search ? { search } : {});
      setCustomers(res.data ?? []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  /**
   * openDetail, Buka modal detail pelanggan. Modal langsung tampil dengan
   * data dasar (skeleton order), lalu isi riwayat order diambil dari
   * GET /api/customers/{id}.
   */
  const openDetail = async (customer) => {
    setDetailLoading(true);
    setDetail({ ...customer, orders: [], summary: null });
    try {
      const res = await customerService.getById(customer.id);
      setDetail(res);
    } catch {
      alert("Gagal memuat detail pelanggan.");
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Definisi kolom tabel ──
  const columns = [
    {
      key: "name",
      label: "Nama",
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-yellow border-2 border-brand-black flex items-center justify-center font-black text-xs shrink-0">
            {(v ?? formatPhone(row.phone) ?? "?")[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">{v ?? "Tanpa nama"}</p>
            <p className="text-[10px] font-mono text-brand-black/40 leading-tight">{formatPhone(row.phone)}</p>
          </div>
        </div>
      ),
    },
    { key: "orders_count", label: "Total Belanja", render: (v) => <span className="font-bold text-sm">{v}</span> },
    {
      key: "total_spent",
      label: "Total Nilai",
      render: (v) => <span className="font-black text-sm font-mono">{formatCurrency(v)}</span>,
    },
    { key: "last_order_at", label: "Terakhir Belanja", render: (v) => <span className="text-xs text-brand-black/60">{v ?? ", "}</span> },
    {
      key: "id",
      label: "Aksi",
      render: (id, row) => (
        <NeoButton size="sm" variant="secondary" onClick={() => openDetail(row)}>Lihat Detail</NeoButton>
      ),
    },
  ];

    // ── Render: header + pencarian → tabel → modal detail ──
  return (
    <div className="space-y-5 rounded-md">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-brand-yellow border-2 border-brand-black flex items-center justify-center" style={{ boxShadow: "2px 2px 0 #0A0A0A" }}>
            <UsersRound size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-black font-grotesk">Pelanggan</h2>
            <p className="text-xs text-brand-black/40 font-mono mt-0.5">
              {customers.length} pelanggan terdata dari nomor HP struk
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-black/40" />
            <input
              className="w-full pl-9 pr-3 py-2.5 text-sm font-medium bg-white border-2 rounded-md outline-none border-brand-black focus:border-brand-yellow placeholder:text-brand-black/30"
              style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
              placeholder="Cari nama / nomor HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCustomers()}
            />
          </div>
          <NeoButton onClick={fetchCustomers} disabled={isLoading}>
            <RefreshCw size={14} className={`${isLoading ? "animate-spin" : ""} inline mr-1`} />
            Cari
          </NeoButton>
        </div>
      </div>

      {/* ── Tabel ── */}
      <NeoTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        emptyText="Belum ada pelanggan. Nomor HP yang diisi kasir di POS akan terdata otomatis."
      />

      {/* ── Modal detail pelanggan ── */}
      <NeoModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.name ?? "Detail Pelanggan"}
        footer={<NeoButton variant="ghost" onClick={() => setDetail(null)}>Tutup</NeoButton>}
      >
        {detail && (
          <div className="space-y-4">
            {/* Info singkat */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border-2 border-brand-black/15 p-3 rounded-md">
                <p className="text-[10px] font-black uppercase text-brand-black/40">No. HP</p>
                <p className="font-mono font-bold text-sm">{formatPhone(detail.phone)}</p>
              </div>
              <div className="border-2 border-brand-black/15 p-3 rounded-md">
                <p className="text-[10px] font-black uppercase text-brand-black/40">Terdaftar</p>
                <p className="font-bold text-sm">{detail.created_at}</p>
              </div>
              <div className="border-2 border-brand-black/15 p-3 rounded-md">
                <p className="text-[10px] font-black uppercase text-brand-black/40">Total Order (lunas)</p>
                <p className="font-bold text-sm">{detail.summary?.orders_count ?? ", "}</p>
              </div>
              <div className="border-2 border-brand-black/15 p-3 rounded-md">
                <p className="text-[10px] font-black uppercase text-brand-black/40">Total Belanja</p>
                <p className="font-black text-sm font-mono">{formatCurrency(detail.summary?.total_spent ?? 0)}</p>
              </div>
            </div>

            {/* Riwayat order */}
            <div>
              <h4 className="font-black text-sm mb-2">Riwayat Order</h4>
              {detailLoading ? (
                <div className="h-24 skeleton" />
              ) : detail.orders?.length === 0 ? (
                <p className="text-xs text-brand-black/40 py-4 text-center border-2 border-dashed border-brand-black/20 rounded-md">
                  Belum ada order tercatat.
                </p>
              ) : (
                <div className="divide-y-2 divide-brand-black/10 border-2 border-brand-black/15 rounded-md overflow-hidden">
                  {detail.orders?.map((o) => {
                    const st = getOrderStatusConfig(o.status);
                    return (
                      <div key={o.id} className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-brand-yellow/10 transition-colors">
                        <div className="min-w-0">
                          <p className="font-mono text-xs font-bold truncate">{o.order_number}</p>
                          <p className="text-[10px] text-brand-black/40">{o.created_at}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={`text-[10px] font-black px-2 py-0.5 border-2 rounded-sm font-mono ${st.color}`}>{st.label}</span>
                          <span className="font-black font-mono text-sm">{formatCurrency(o.total)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </NeoModal>
    </div>
  );
}
