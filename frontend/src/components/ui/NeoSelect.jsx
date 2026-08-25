"use client";
// NeoSelect, Dropdown select neobrutalist
// Analogi: seperti menu pilihan di formulir, border tegas, tidak ada rounded tipis

/**
 * NeoSelect, dropdown select neobrutalist dengan label & error opsional.
 *
 * Props:
 *   label    : teks label di atas select (opsional)
 *   error    : pesan error, kalau terisi, border jadi merah
 *   className: class Tailwind untuk WRAPPER (flex flex-col)
 *   options  : [{ value, label }], pilihan dropdown
 *   id       : dihubungkan ke htmlFor label
 *   required : tanda * di label + atribut required
 *   ...props : diteruskan ke <select> (value, onChange, disabled, dsb.)
 */
export default function NeoSelect({ label, error, className = "", options = [], id, required, ...props }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-brand-black">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        required={required}
        className={`
          w-full px-3 py-2.5 text-sm font-medium bg-white
          border-2 outline-none transition-colors appearance-none
          ${error ? "border-red-500" : "border-brand-black focus:border-brand-yellow"}
        `}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
