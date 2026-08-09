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
        private string $dateTo,
        private array $summary = []
    ) {}

    public function collection()
    {
        // ↑ Data yang akan diexport ke Excel
        $rows = $this->transactions->map(fn($t, $i) => [
            'no'             => $i + 1,
            'order_number'   => $t->order->order_number,
            'customer'       => $t->order->user->name,
            'payment_method' => $t->payment_method ?? '-',
            'amount'         => $t->amount,
            'cogs'           => $t->cogs,
            'profit'         => $t->profit,
            'margin'         => $t->margin . '%',
            'paid_at'        => $t->paid_at->format('d M Y H:i'),
        ])->values();

        // ↑ Baris ringkasan di bawah data transaksi
        $summary = $this->summary;
        $rows->push([null, null, null, null, null, null, null, null, null]);
        $rows->push(['RINGKASAN', null, null, null, null, null, null, null, null]);
        $rows->push(['Total Revenue', null, null, null, $summary['total_revenue'] ?? 0, null, null, null, null]);
        $rows->push(['Total COGS', null, null, null, $summary['total_cogs'] ?? 0, null, null, null, null]);
        $rows->push(['Laba Kotor', null, null, null, $summary['gross_profit'] ?? 0, null, null, null, null]);
        $rows->push(['Margin', null, null, null, ($summary['profit_margin'] ?? 0) . '%', null, null, null, null]);

        return $rows;
    }

    public function headings(): array
    {
        return ['No', 'Order Number', 'Customer', 'Metode Bayar', 'Total (Rp)', 'COGS (Rp)', 'Laba (Rp)', 'Margin (%)', 'Tanggal'];
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
