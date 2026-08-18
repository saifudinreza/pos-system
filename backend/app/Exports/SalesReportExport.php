<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Export Excel laporan penjualan — dipakai ReportController::downloadSales().
 *
 * Berisi per-transaksi: no, nomor order, customer, metode bayar, amount,
 * COGS, laba & margin, plus blok RINGKASAN (total revenue/COGS/laba/margin)
 * di bawah data. Implements: FromCollection, WithHeadings, WithTitle,
 * WithStyles.
 */
class SalesReportExport implements FromCollection, WithHeadings, WithTitle, WithStyles
{
    /**
     * @param \Illuminate\Support\Collection $transactions data transaksi (sudah di-enrich
     *        dengan cogs/profit/margin oleh ReportController)
     * @param string $dateFrom tanggal awal periode (untuk judul sheet)
     * @param string $dateTo   tanggal akhir periode (untuk judul sheet)
     * @param array  $summary  ringkasan total revenue/cogs/gross_profit/profit_margin
     */
    public function __construct(
        private $transactions,
        private string $dateFrom,
        private string $dateTo,
        private array $summary = []
    ) {}

    /**
     * Bangun baris-baris data yang akan diexport ke Excel
     * (baris transaksi + baris ringkasan di bawahnya).
     */
    public function collection()
    {
        // Data transaksi: satu baris per pembayaran
        $rows = $this->transactions->map(fn($transaction, $i) => [
            'no'             => $i + 1,
            'order_number'   => $transaction->order->order_number,
            'customer'       => $transaction->order->user->name,
            'payment_method' => $transaction->payment_method ?? '-',
            'amount'         => $transaction->amount,
            'cogs'           => $transaction->cogs,
            'profit'         => $transaction->profit,
            'margin'         => $transaction->margin . '%',
            'paid_at'        => $transaction->paid_at->format('d M Y H:i'),
        ])->values();

        // Baris ringkasan di bawah data transaksi
        $summary = $this->summary;
        $rows->push([null, null, null, null, null, null, null, null, null]);
        $rows->push(['RINGKASAN', null, null, null, null, null, null, null, null]);
        $rows->push(['Total Revenue', null, null, null, $summary['total_revenue'] ?? 0, null, null, null, null]);
        $rows->push(['Total COGS', null, null, null, $summary['total_cogs'] ?? 0, null, null, null, null]);
        $rows->push(['Laba Kotor', null, null, null, $summary['gross_profit'] ?? 0, null, null, null, null]);
        $rows->push(['Margin', null, null, null, ($summary['profit_margin'] ?? 0) . '%', null, null, null, null]);

        return $rows;
    }

    /**
     * Header kolom di baris pertama Excel.
     */
    public function headings(): array
    {
        return ['No', 'Order Number', 'Customer', 'Metode Bayar', 'Total (Rp)', 'COGS (Rp)', 'Laba (Rp)', 'Margin (%)', 'Tanggal'];
    }

    /**
     * Nama sheet di Excel.
     */
    public function title(): string
    {
        return 'Laporan ' . $this->dateFrom . ' - ' . $this->dateTo;
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