// ─── Contact & social config — ganti sesuai data bisnis kamu ────
const CONTACT = {
  email:     "donojomi@gmail.com",
  whatsapp:  "6281294508057", // ganti dengan nomor WA kamu (format: 62xxx tanpa +)
  instagram: "https://instagram.com/zareddicted_",   // ganti dengan akun Instagram kamu
};

// ─── SVG Icons ──────────────────────────────────────────────────
const IconMail = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconWhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.11 1.523 5.836L.057 23.999l6.336-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.808 9.808 0 0 1-4.99-1.366l-.359-.213-3.72.857.882-3.622-.234-.372A9.796 9.796 0 0 1 2.182 12c0-5.413 4.405-9.818 9.818-9.818 5.413 0 9.818 4.405 9.818 9.818 0 5.413-4.405 9.818-9.818 9.818z" />
  </svg>
);

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);

const IconMapPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

// ─── Footer link groups ──────────────────────────────────────────
const LINK_GROUPS = [
  {
    title: "Produk",
    links: [
      { label: "Fitur",      href: "#fitur" },
      { label: "Harga",      href: "#harga" },
      { label: "Cara Kerja", href: "#cara-kerja" },
    ],
  },
  {
    title: "Dukungan",
    links: [
      { label: "FAQ",          href: "#" },
      { label: "Dokumentasi",  href: "#" },
      { label: "Status",       href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Kebijakan Privasi", href: "#" },
      { label: "Syarat & Ketentuan", href: "#" },
    ],
  },
];

export default function LandingFooter() {
  return (
    <footer className="bg-brand-black text-white">

      {/* ── Top accent bar ────────────────────────────────── */}
      <div className="h-1.5 bg-brand-yellow" />

      {/* ── CTA strip ────────────────────────────────────── */}
      <div className="border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-lg font-grotesk">
              Ada pertanyaan tentang KasirAI?
            </p>
            <p className="text-white/50 text-sm mt-0.5">
              Hubungi kami langsung — kami siap membantu bisnis kamu.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a
              href={`mailto:${CONTACT.email}`}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-white/30 text-sm font-bold hover:border-brand-yellow hover:text-brand-yellow transition-colors rounded-md"
            >
              <IconMail />
              Email Kami
            </a>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20KasirAI`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 border-2 border-green-400 text-sm font-bold hover:bg-green-400 transition-colors rounded-md"
              style={{ boxShadow: "2px 2px 0 #16a34a" }}
            >
              <IconWhatsApp />
              WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* ── Main footer grid ─────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">

          {/* Brand column — spans 2 on lg */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">

            {/* Logo */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 bg-brand-yellow border-2 border-white flex items-center justify-center font-black text-xl text-brand-black leading-none rounded-md"
                style={{ boxShadow: "3px 3px 0 #FFE500" }}
              >
                K
              </div>
              <span className="font-black text-2xl tracking-tight font-grotesk">
                KasirAI
              </span>
            </div>

            {/* Tagline */}
            <p className="text-white/50 text-sm font-medium leading-relaxed max-w-sm mb-6">
              Platform kasir + AI untuk bisnis retail & UMKM Indonesia.
              Kelola penjualan, stok, dan laporan — semuanya dalam satu tempat.
            </p>

            {/* Contact info */}
            <div className="space-y-2.5 mb-6">
              <a
                href={`mailto:${CONTACT.email}`}
                className="flex items-center gap-2.5 text-sm text-white/60 hover:text-brand-yellow transition-colors group"
              >
                <span className="w-7 h-7 bg-white/10 border border-white/20 rounded flex items-center justify-center group-hover:bg-brand-yellow group-hover:text-brand-black group-hover:border-brand-yellow transition-colors">
                  <IconMail />
                </span>
                {CONTACT.email}
              </a>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-sm text-white/60 hover:text-green-400 transition-colors group"
              >
                <span className="w-7 h-7 bg-white/10 border border-white/20 rounded flex items-center justify-center group-hover:bg-green-500 group-hover:text-white group-hover:border-green-400 transition-colors">
                  <IconWhatsApp />
                </span>
                Chat via WhatsApp
              </a>
              <div className="flex items-center gap-2.5 text-sm text-white/40">
                <span className="w-7 h-7 bg-white/5 border border-white/10 rounded flex items-center justify-center">
                  <IconMapPin />
                </span>
                Indonesia 🇮🇩
              </div>
            </div>

            {/* Social media */}
            <div className="flex gap-2">
              {[
                { label: "Instagram", icon: <IconInstagram />, href: CONTACT.instagram, hoverCls: "hover:bg-pink-500 hover:border-pink-400" },
                { label: "WhatsApp",  icon: <IconWhatsApp />,  href: `https://wa.me/${CONTACT.whatsapp}`, hoverCls: "hover:bg-green-500 hover:border-green-400" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`w-9 h-9 bg-white/10 border border-white/20 rounded flex items-center justify-center text-white/60 hover:text-white transition-all ${s.hoverCls}`}
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h4 className="font-black text-xs uppercase tracking-widest text-white/40 mb-5 font-mono">
                {group.title}
              </h4>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-medium text-white/60 hover:text-white hover:translate-x-0.5 transition-all inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────── */}
      <div className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/35 font-medium text-center sm:text-left">
            © {new Date().getFullYear()} KasirAI by Saifudin Reza. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {/* System status */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-white/35">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Sistem berjalan normal
            </div>
            {/* Made with love */}
            <span className="text-xs text-white/20 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
