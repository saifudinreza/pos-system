// NeoTable — Tabel data neobrutalist
// Analogi: seperti buku kas di meja kasir — baris-kolom rapi dengan header tegas

export default function NeoTable({ columns, data, isLoading, emptyText = "Tidak ada data" }) {
  const rows = Array.isArray(data) ? data : [];
  return (
    <div className="border-2 border-brand-black overflow-hidden" style={{ boxShadow: "4px 4px 0 #0A0A0A" }}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {/* Header tabel */}
          <thead>
            <tr className="bg-brand-black text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-black text-xs uppercase tracking-wider whitespace-nowrap"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              // Loading state
              <tr>
                <td colSpan={columns.length} className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-3 border-brand-black border-t-brand-yellow rounded-full animate-spin" />
                  <p className="mt-2 text-sm font-semibold text-brand-black/50">Memuat data...</p>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              // Empty state
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-brand-black/40 font-semibold">
                  {emptyText}
                </td>
              </tr>
            ) : (
              // Data rows
              rows.map((row, i) => (
                <tr
                  key={row.id ?? i}
                  className={`border-b border-brand-black/10 hover:bg-brand-yellow/10 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-brand-gray/50"}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-brand-black/80">
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
