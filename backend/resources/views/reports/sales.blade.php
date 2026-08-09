<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Penjualan</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { text-align: center; font-size: 16px; }
        .period { text-align: center; color: #666; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #4F46E5; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .total { font-weight: bold; text-align: right; margin-top: 10px; }
        .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Penjualan</h1>
    <p class="period">Periode: {{ $date_from }} s/d {{ $date_to }}</p>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>Order Number</th>
                <th>Customer</th>
                <th>Metode Bayar</th>
                <th>Total</th>
                <th>COGS</th>
                <th>Laba</th>
                <th>Margin</th>
                <th>Tanggal</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $i => $t)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $t->order->order_number }}</td>
                <td>{{ $t->order->user->name }}</td>
                <td>{{ $t->payment_method ?? '-' }}</td>
                <td>Rp {{ number_format($t->amount, 0, ',', '.') }}</td>
                <td>Rp {{ number_format($t->cogs, 0, ',', '.') }}</td>
                <td>Rp {{ number_format($t->profit, 0, ',', '.') }}</td>
                <td>{{ $t->margin }}%</td>
                <td>{{ $t->paid_at->format('d M Y H:i') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <p class="total">
        Total Revenue: Rp {{ number_format($summary['total_revenue'], 0, ',', '.') }} &nbsp;|&nbsp;
        Total COGS: Rp {{ number_format($summary['total_cogs'], 0, ',', '.') }} &nbsp;|&nbsp;
        Laba Kotor: Rp {{ number_format($summary['gross_profit'], 0, ',', '.') }} &nbsp;|&nbsp;
        Margin: {{ $summary['profit_margin'] }}%
    </p>

    <p class="footer">Digenerate pada: {{ $generated_at }}</p>
</body>
</html>