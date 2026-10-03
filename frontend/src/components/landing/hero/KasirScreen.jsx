// ============================================================
// KasirScreen.jsx, isi layar iPad di hero
//
// Tiruan statis halaman /kasir (Mode Kasir): navbar hitam, bar
// shift, grid produk, dan panel keranjang. Semua ukuran memakai
// satuan em dengan font dasar 1.45cqw, jadi tampilan ikut
// mengecil/membesar sesuai lebar layar perangkat tanpa JS.
// Dekoratif saja (aria-hidden), teks alt ada di DeviceStage.
// ============================================================

import LogoMark from "@/components/brand/LogoMark";

// Data demo, rapi dan realistis (bukan data "test")
const CATEGORIES = ["Semua", "Kopi", "Non-Kopi", "Makanan", "Camilan"];

const PRODUCTS = [
  { name: "Kopi Susu Gula Aren", price: "Rp 18.000", stock: 42, drink: true },
  { name: "Americano",           price: "Rp 15.000", stock: 36, drink: true },
  { name: "Es Teh Manis",        price: "Rp 6.000",  stock: 80, drink: true },
  { name: "Matcha Latte",        price: "Rp 22.000", stock: 3,  drink: true },
  { name: "Nasi Goreng Spesial", price: "Rp 25.000", stock: 18 },
  { name: "Mie Ayam",            price: "Rp 17.000", stock: 22 },
  { name: "Roti Bakar Cokelat",  price: "Rp 15.000", stock: 14 },
  { name: "Kentang Goreng",      price: "Rp 12.000", stock: 0 },
];

const CART = [
  { name: "Kopi Susu Gula Aren", price: "Rp 18.000", qty: 2, total: "36.000" },
  { name: "Nasi Goreng Spesial", price: "Rp 25.000", qty: 1, total: "25.000" },
  { name: "Es Teh Manis",        price: "Rp 6.000",  qty: 2, total: "12.000" },
];

const CupIcon = () => (
  <svg className="w-[34%] h-[34%]" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 8h12v6a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5z" />
    <path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H17" />
    <path d="M8 3v2M11 3v2M14 3v2" />
  </svg>
);

const BowlIcon = () => (
  <svg className="w-[34%] h-[34%]" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12h18a9 9 0 0 1-18 0z" />
    <path d="M8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4" />
  </svg>
);

const hardShadow = { boxShadow: "0.15em 0.15em 0 #0A0A0A" };

export default function KasirScreen() {
  return (
    <div aria-hidden="true" className="h-full flex flex-col bg-brand-cream text-brand-black font-grotesk text-[length:1.45cqw] leading-normal select-none">
      {/* Navbar kasir */}
      <div className="h-[3.6em] shrink-0 bg-brand-black text-white flex items-center justify-between px-[1.3em]">
        <div className="flex items-center gap-[0.8em]">
          <LogoMark size="2.1em" title="" />
          <span className="font-bold text-[1.05em]">KasirAI</span>
          <span className="bg-brand-yellow text-brand-black font-mono font-bold text-[0.62em] px-[0.6em] py-[0.2em]">MODE KASIR</span>
        </div>
        <div className="flex items-center gap-[0.9em] text-[0.72em]">
          <span className="font-mono text-white/50">14.32</span>
          <span className="font-semibold text-white/70">Rina</span>
          <span className="font-bold border-[0.15em] border-white/20 px-[0.8em] py-[0.4em]">← Dashboard</span>
          <span className="font-bold border-[0.15em] border-white/20 px-[0.8em] py-[0.4em] text-white/70">Keluar</span>
        </div>
      </div>

      {/* Bar shift */}
      <div className="shrink-0 bg-green-50 border-b-[0.15em] border-brand-black px-[1.3em] py-[0.45em] flex justify-between items-center text-[0.7em] font-bold">
        <div className="flex items-center gap-[0.8em]">
          <span className="w-[0.65em] h-[0.65em] rounded-full bg-green-500" />
          <span>Shift Pagi</span>
          <span className="font-mono text-brand-black/50">07:00–15:00</span>
          <span className="text-brand-black/40">|</span>
          <span className="font-mono text-brand-black/60">Buka: 07:02</span>
          <span className="text-brand-black/40">|</span>
          <span className="text-brand-black/60">Order: 24</span>
        </div>
        <div className="flex gap-[0.5em] text-[0.9em]">
          <span className="border-[0.1em] border-brand-black/30 px-[0.6em] py-[0.25em]">Riwayat Shift</span>
          <span className="bg-brand-black text-white px-[0.6em] py-[0.25em]">Tutup Shift</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Kolom produk */}
        <div className="flex-1 min-w-0 flex flex-col border-r-[0.15em] border-brand-black">
          <div className="shrink-0 bg-white border-b-[0.15em] border-brand-black px-[1em] pt-[0.9em] pb-[0.8em] flex flex-col gap-[0.7em]">
            <div className="flex gap-[0.6em]">
              <div className="flex-1 border-[0.15em] border-brand-black px-[0.8em] py-[0.55em] text-[0.8em] text-brand-black/40" style={hardShadow}>
                Cari produk atau SKU...
              </div>
              <div className="border-[0.15em] border-brand-black px-[0.9em] py-[0.55em] text-[0.8em] font-bold" style={hardShadow}>
                Produk
              </div>
            </div>
            <div className="flex gap-[0.6em]">
              {CATEGORIES.map((c, i) => (
                <span
                  key={c}
                  className={`border-[0.15em] border-brand-black px-[0.8em] py-[0.35em] text-[0.7em] font-bold ${i === 0 ? "bg-brand-yellow" : "bg-white"}`}
                  style={hardShadow}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden p-[1em] grid grid-cols-4 gap-[0.9em] content-start">
            {PRODUCTS.map((p) => {
              const out = p.stock === 0;
              const low = p.stock > 0 && p.stock <= 5;
              return (
                <div
                  key={p.name}
                  className={`relative bg-white border-[0.15em] border-brand-black rounded-[0.8em] overflow-hidden ${out ? "opacity-40" : ""}`}
                  style={{ boxShadow: out ? "none" : "0.22em 0.22em 0 #0A0A0A" }}
                >
                  <div className="relative aspect-[4/3] bg-brand-cream flex items-center justify-center">
                    {p.drink ? <CupIcon /> : <BowlIcon />}
                    {low && (
                      <span className="absolute top-[0.5em] right-[0.5em] bg-orange-400 border-[0.1em] border-orange-600 text-white text-[0.5em] font-bold px-[0.6em] py-[0.2em] rounded-full">
                        TIPIS
                      </span>
                    )}
                    {out && (
                      <span className="absolute inset-0 bg-brand-black/50 flex items-center justify-center text-white text-[0.6em] font-bold tracking-[0.15em]">
                        HABIS
                      </span>
                    )}
                  </div>
                  <div className="px-[0.7em] pt-[0.55em] pb-[0.6em] flex flex-col gap-[0.15em]">
                    <span className="text-[0.72em] font-bold truncate">{p.name}</span>
                    <span className="text-[0.72em] font-bold font-mono">{p.price}</span>
                    <span className={`text-[0.58em] font-mono ${out ? "text-red-500" : low ? "text-orange-500" : "text-brand-black/30"}`}>
                      {out ? "Stok habis" : `Stok: ${p.stock}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel keranjang */}
        <div className="w-[22em] shrink-0 bg-white flex flex-col">
          <div className="shrink-0 bg-brand-black text-white px-[1em] py-[0.8em] flex justify-between items-center">
            <div className="flex items-center gap-[0.6em]">
              <span className="font-bold text-[0.85em]">Keranjang</span>
              <span className="bg-brand-yellow text-brand-black font-mono font-bold text-[0.6em] px-[0.5em] py-[0.15em]">5 item</span>
            </div>
            <span className="text-[0.6em] text-white/40 border-[0.1em] border-white/15 px-[0.6em] py-[0.15em]">Kosongkan</span>
          </div>

          <div className="flex-1 min-h-0 px-[0.9em] py-[0.3em]">
            {CART.map((c) => (
              <div key={c.name} className="flex items-center gap-[0.5em] py-[0.7em] border-b-[0.1em] border-brand-black/10">
                <div className="flex-1 min-w-0">
                  <div className="text-[0.72em] font-bold truncate">{c.name}</div>
                  <div className="text-[0.6em] font-mono text-brand-black/50">{c.price}</div>
                </div>
                <span className="w-[1.6em] h-[1.6em] border-[0.15em] border-brand-black flex items-center justify-center text-[0.7em] font-bold">−</span>
                <span className="w-[1.4em] text-center text-[0.72em] font-bold font-mono">{c.qty}</span>
                <span className="w-[1.6em] h-[1.6em] border-[0.15em] border-brand-black flex items-center justify-center text-[0.7em] font-bold">+</span>
                <span className="w-[4.6em] text-right text-[0.72em] font-bold font-mono">{c.total}</span>
              </div>
            ))}
          </div>

          <div className="shrink-0 bg-brand-cream border-t-[0.15em] border-brand-black px-[1em] py-[0.9em] flex flex-col gap-[0.7em]">
            <div className="bg-white border-[0.15em] border-brand-black px-[0.7em] py-[0.5em] text-[0.65em] font-mono text-brand-black/60">
              0812-3456-7890
            </div>
            <div className="border-t-[0.15em] border-brand-black pt-[0.5em] flex flex-col gap-[0.25em] text-[0.72em]">
              <div className="flex justify-between text-brand-black/60"><span>Subtotal</span><span className="font-mono">Rp 73.000</span></div>
              <div className="flex justify-between text-brand-black/60"><span>PPN 11%</span><span className="font-mono">Rp 8.030</span></div>
              <div className="flex justify-between font-bold text-[1.25em] border-t-[0.08em] border-brand-black/30 pt-[0.3em] mt-[0.1em]">
                <span>TOTAL</span><span className="font-mono">Rp 81.030</span>
              </div>
            </div>
            <div className="flex gap-[0.6em]">
              <span className="flex-1 text-center bg-white border-[0.15em] border-brand-black py-[0.7em] text-[0.75em] font-bold" style={hardShadow}>TUNAI</span>
              <span className="flex-1 text-center bg-brand-yellow border-[0.15em] border-brand-black py-[0.7em] text-[0.75em] font-bold" style={{ boxShadow: "0.22em 0.22em 0 #0A0A0A" }}>DIGITAL</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
