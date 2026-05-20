<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StockReportExport implements FromCollection, WithHeadings, WithStyles
{
    public function __construct(private $products) {}

    public function collection()
    {
        return $this->products->map(fn($p, $i) => [
            'no'          => $i + 1,
            'sku'         => $p->sku,
            'name'        => $p->name,
            'category'    => $p->category->name,
            'stock'       => $p->stock,
            'stock_alert' => $p->stock_alert,
            'status'      => $p->stock <= $p->stock_alert ? 'Stok Menipis' : 'Normal',
        ]);
    }

    public function headings(): array
    {
        return ['No', 'SKU', 'Nama Produk', 'Kategori', 'Stok', 'Alert', 'Status'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }
}