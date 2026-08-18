<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Export Excel laporan stok — dipakai ReportController::downloadStock().
 *
 * Berisi satu baris per produk: no, SKU, nama, kategori, stok, alert dan
 * status (Stok Menipis / Normal). Implements: FromCollection, WithHeadings,
 * WithStyles.
 */
class StockReportExport implements FromCollection, WithHeadings, WithStyles
{
    /**
     * @param \Illuminate\Support\Collection $products daftar produk yang akan diexport
     */
    public function __construct(private $products) {}

    /**
     * Bangun baris-baris data produk untuk Excel.
     */
    public function collection()
    {
        return $this->products->map(fn($product, $i) => [
            'no'          => $i + 1,
            'sku'         => $product->sku,
            'name'        => $product->name,
            'category'    => $product->category->name,
            'stock'       => $product->stock,
            'stock_alert' => $product->stock_alert,
            // Stok menipis kalau stok <= batas alert
            'status'      => $product->stock <= $product->stock_alert ? 'Stok Menipis' : 'Normal',
        ]);
    }

    /**
     * Header kolom di baris pertama Excel.
     */
    public function headings(): array
    {
        return ['No', 'SKU', 'Nama Produk', 'Kategori', 'Stok', 'Alert', 'Status'];
    }

    /**
     * Styling: baris pertama (header) di-bold.
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}