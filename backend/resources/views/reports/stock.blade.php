<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Laporan Stok</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12px; }
        h1 { text-align: center; font-size: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #4F46E5; color: white; padding: 8px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f9; }
        .low { color: #dc2626; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 10px; color: #999; text-align: right; }
    </style>
</head>
<body>
    <h1>Laporan Stok Produk</h1>

    <table>
        <thead>
            <tr>
                <th>No</th>
                <th>SKU</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Stok</th>
                <th>Alert</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($products as $i => $p)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $p->sku }}</td>
                <td>{{ $p->name }}</td>
                <td>{{ $p->category->name }}</td>
                <td>{{ $p->stock }}</td>
                <td>{{ $p->stock_alert }}</td>
                <td class="{{ $p->stock <= $p->stock_alert ? 'low' : '' }}">
                    {{ $p->stock <= $p->stock_alert ? 'Stok Menipis' : 'Normal' }}
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <p class="footer">Digenerate pada: {{ $generated_at }}</p>
</body>
</html>