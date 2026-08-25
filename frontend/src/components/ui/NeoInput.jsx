"use client";
// NeoInput, Input field neobrutalist
// Analogi: seperti kolom isian di formulir resmi, tepi tegas, jelas mana yang aktif

/**
 * NeoInput, input text neobrutalist dengan label & pesan error opsional.
 *
 * Props:
 *   label    : teks label di atas input (opsional)
 *   error    : pesan error, kalau terisi, border jadi merah + teks merah di bawah
 *   className: class Tailwind untuk WRAPPER (flex flex-col)
 *   type     : type input (default: "text")
 *   id       : dihubungkan ke htmlFor label (aksesibilitas)
 *   required : menampilkan tanda * di label + atribut required di input
 *   ...props : diteruskan ke <input> (value, onChange, placeholder, dsb.)
 */
export default function NeoInput({
  label, error, className = "", type = "text",
  id, required, ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-brand-black">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        required={required}
        className={`
          w-full px-3 py-2.5 text-sm font-medium bg-white
          border-2 rounded-md outline-none transition-colors
          placeholder:text-brand-black/30
          ${error
            ? "border-red-500 focus:border-red-600"
            : "border-brand-black focus:border-brand-yellow"
          }
        `}
        style={{ boxShadow: "2px 2px 0 #0A0A0A" }}
        {...props}
      />
      {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
    </div>
  );
}
