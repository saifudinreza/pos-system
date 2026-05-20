<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class SalesReportExport implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    public function __construct(
        private $transactions,
        private string $dateFrom,
        private string $dateTo
    ) {}

    public function collection()
    {
        // ↑ Data yang akan diexport ke Excel
        return $this->transactions->map(fn($t, $i) => [
            'no'             => $i + 1,
            'order_number'   => $t->order->order_number,
            'customer'       => $t->order->user->name,
            'payment_method' => $t->payment_method ?? '-',
            'amount'         => $t->amount,
            'paid_at'        => $t->paid_at->format('d M Y H:i'),
        ]);
    }

    public function headings(): array
    {
        return ['No', 'Order Number', 'Customer', 'Metode Bayar', 'Total (Rp)', 'Tanggal'];
        // ↑ Header kolom di baris pertama Excel
    }

    public function title(): string
    {
        return 'Laporan ' . $this->dateFrom . ' - ' . $this->dateTo;
        // ↑ Nama sheet di Excel
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
            // ↑ Baris pertama (header) di-bold
        ];
    }
}