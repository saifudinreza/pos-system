<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AiController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\ShiftController;
use App\Http\Controllers\Api\InsightController;
use App\Http\Controllers\Api\CustomerController;

// =============================================================
// ============ PUBLIC (TANPA LOGIN) ============
// =============================================================
// Route di bawah ini bebas diakses siapa saja tanpa token Sanctum.

// ---------- AUTH (login/register/reset password) ----------
// throttling: 5 percobaan per menit per IP — anti brute-force password
Route::post('/register',      [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/login',         [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/reset-password',  [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');
Route::get('/check-tenant',   [AuthController::class, 'checkTenant']);

// ---------- MEDIA PROXY ----------
// Media proxy — serve gambar dari R2/storage tanpa butuh auth
Route::get('/media/{path}', function (string $path) {
    $disk = !empty(config('filesystems.disks.r2.key')) ? 'r2' : 'public';
    if (! \Illuminate\Support\Facades\Storage::disk($disk)->exists($path)) {
        abort(404);
    }
    return \Illuminate\Support\Facades\Storage::disk($disk)->response($path);
})->where('path', '.*');
// ↑ Endpoint ini bebas diakses siapa saja tanpa token (URL R2 tidak pernah
//   diekspos langsung ke browser — gambar produk selalu lewat proxy ini)


// =============================================================
// ============ PROTECTED (WAJIB LOGIN) ============
// =============================================================
Route::middleware('auth:sanctum')->group(function () {
    // ↑ Semua route di dalam sini wajib kirim header:
    // Authorization: Bearer {token}
    // Kalau tidak ada token → otomatis return 401

    // ============ AUTH ============
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
    // ↑ /me = ambil data user yang sedang login

    // ============ SUBSCRIPTION ============
    // Kelola langganan plan (status, initiate pembayaran Midtrans, batal pending)
    Route::get('/subscription',          [SubscriptionController::class, 'status']);
    Route::post('/subscription/initiate', [SubscriptionController::class, 'initiate']);
    Route::post('/subscription/cancel-pending', [SubscriptionController::class, 'cancelPending']);


    // ============ KATALOG (produk & kategori — semua role bisa lihat) ============
    // ----- PRODUCTS -----
    Route::get('/products',        [ProductController::class, 'index']);
    Route::get('/products/{id}',   [ProductController::class, 'show']);
    // ↑ Customer dan kasir perlu lihat daftar produk

    // ----- CATEGORIES -----
    Route::get('/categories',      [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);


    // ============ ORDER & TRANSAKSI (customer & kasir) ============
    // ----- ORDERS -----
    Route::post('/orders',              [OrderController::class, 'store']);
    Route::get('/orders/{id}',          [OrderController::class, 'show']);
    Route::get('/orders/my/history',    [OrderController::class, 'myOrders']);
    // ↑ Customer lihat riwayat order sendiri

    // ----- TRANSACTIONS -----
    Route::post('/transactions',           [TransactionController::class, 'create']);
    Route::get('/transactions/{id}',       [TransactionController::class, 'show']);
    Route::get('/transactions/my/history', [TransactionController::class, 'myTransactions']);
    // ↑ Customer lihat riwayat pembayaran sendiri


    // ============ KASIR (POS) — kasir, admin & developer ============
    Route::middleware('role:admin,kasir,developer')->group(function () {
        // ----- ORDER & PEMBAYARAN -----
        Route::get('/orders',                              [OrderController::class, 'index']);
        Route::patch('/orders/{id}/status',               [OrderController::class, 'updateStatus']);
        Route::get('/transactions',                       [TransactionController::class, 'index']);
        Route::patch('/transactions/{id}/cancel',         [TransactionController::class, 'cancelTransaction']);
        Route::post('/transactions/cash',                 [TransactionController::class, 'payCash']);
        // ↑ Pembayaran tunai langsung settlement (tanpa Midtrans) — untuk kasir POS

        // ----- SHIFT MANAGEMENT -----
        Route::get('/shifts',                             [ShiftController::class, 'index']);
        Route::get('/shifts/current',                     [ShiftController::class, 'current']);
        Route::post('/shifts/open',                       [ShiftController::class, 'open']);
        Route::post('/shifts/{id}/close',                 [ShiftController::class, 'close']);
        Route::get('/shifts/{id}/report',                 [ShiftController::class, 'report']);
    });


    // ============ CRUD PRODUK & KATEGORI (admin, kasir & developer) ============
    // Write operation — dengan limit baca per plan (free 50/15, pro/enterprise unlimited)
    Route::middleware('role:admin,kasir,developer')->group(function () {
        // ----- PRODUCTS CRUD -----
        Route::post('/products',           [ProductController::class, 'store']);
        Route::put('/products/{id}',       [ProductController::class, 'update']);
        Route::delete('/products/{id}',    [ProductController::class, 'destroy']);
        Route::post('/products/{id}/restock',   [ProductController::class, 'restock']);
        Route::get('/products/{id}/movements',  [ProductController::class, 'movements']);
        // ↑ movements = riwayat ledger pergerakan stok produk

        // ----- CATEGORIES CRUD -----
        Route::post('/categories',         [CategoryController::class, 'store']);
        Route::put('/categories/{id}',     [CategoryController::class, 'update']);
        Route::delete('/categories/{id}',  [CategoryController::class, 'destroy']);

    });


    // ============ LAPORAN, INSIGHT & CUSTOMER (admin & developer) ============
    Route::middleware('role:admin,developer')->group(function () {
        // ----- REPORTS -----
        Route::get('/reports/sales',           [ReportController::class, 'sales']);
        Route::get('/reports/stock',           [ReportController::class, 'stock']);
        Route::get('/reports/forecast',        [ReportController::class, 'forecast']);
        Route::get('/reports/sales/download',  [ReportController::class, 'downloadSales']);
        Route::get('/reports/stock/download',  [ReportController::class, 'downloadStock']);
        // ↑ download = export PDF & Excel (gated: plan free dapat 403)

        // ----- AI INSIGHTS -----
        Route::get('/insights',            [InsightController::class, 'index']);
        Route::post('/insights/generate',  [InsightController::class, 'generate'])
            ->middleware('throttle:5,1');
        // ↑ generate memanggil LLM (ada biaya token) → dibatasi 5x/menit

        // ----- CUSTOMERS (CRM) -----
        Route::get('/customers',       [CustomerController::class, 'index']);
        Route::get('/customers/{id}',  [CustomerController::class, 'show']);

        // ----- AI LOGS & STATS -----
        Route::get('/ai/logs',  [AiController::class, 'logs']);
        Route::get('/ai/stats', [AiController::class, 'stats']);
    });


    // ============ DEVELOPER ONLY ============
    // Manajemen user, tenant & subscription lintas tenant — hanya developer
    Route::middleware('role:developer')->group(function () {
        // ----- USER MANAGEMENT -----
        Route::get('/users',                [UserController::class, 'index']);
        Route::post('/users',               [UserController::class, 'store']);
        Route::get('/users/{id}',           [UserController::class, 'show']);
        Route::put('/users/{id}',           [UserController::class, 'update']);
        Route::delete('/users/{id}',        [UserController::class, 'destroy']);
        Route::patch('/users/{id}/toggle',  [UserController::class, 'toggleActive']);
        Route::patch('/users/{id}/role',    [UserController::class, 'patchRole']);

        // ----- TENANT MANAGEMENT -----
        Route::get('/dev/tenants',          [TenantController::class, 'index']);
        Route::get('/dev/tenants/{id}',     [TenantController::class, 'show']);
        Route::put('/dev/tenants/{id}',     [TenantController::class, 'update']);
        Route::delete('/dev/tenants/{id}',  [TenantController::class, 'destroy']);

        // ----- DEVELOPER SUBSCRIPTION MANAGEMENT -----
        Route::get('/dev/subscriptions',                       [SubscriptionController::class, 'devIndex']);
        Route::patch('/dev/subscriptions/{userId}/plan',       [SubscriptionController::class, 'devUpdatePlan']);
        Route::patch('/dev/subscriptions/{userId}/toggle',     [SubscriptionController::class, 'devToggleStatus']);
    });


    // ============ AI ASSISTANT (admin, kasir & developer) ============
    // Kuota diatur per plan: free = 5 prompt/bulan, pro = 10 prompt/hari,
    // enterprise = 50 prompt/hari. throttle:10,1 = max 10 request AI per
    // MENIT per user (anti-burst/anti-script).
    Route::middleware('role:admin,kasir,developer')->group(function () {
        Route::get('/ai/usage-today',    [AiController::class, 'usageToday']);
        Route::get('/ai/jobs/{id}',      [AiController::class, 'jobStatus']);

        // usage-today & jobs sengaja TIDAK ikut throttle — sidebar/polling memanggilnya
        // tiap dibuka, sedangkan POST submit AI tetap di-throttle di bawah.
        Route::middleware('throttle:10,1')->group(function () {
            Route::post('/ai/query',         [AiController::class, 'query']);
            Route::post('/ai/predict-stock', [AiController::class, 'predictStock']);
            Route::post('/ai/recommend',     [AiController::class, 'recommend']);
        });
    });
});


// =============================================================
// ============ WEBHOOK (dipanggil server Midtrans) ============
// =============================================================
Route::post('/webhook/midtrans',              [TransactionController::class,  'webhook']);
Route::post('/webhook/midtrans-subscription', [SubscriptionController::class, 'webhook']);
// ↑ PENTING: route ini di LUAR middleware auth:sanctum
// Karena yang manggil adalah server Midtrans, bukan user kita
// Midtrans tidak punya token Sanctum kita
// Keamanannya dijaga dengan verifikasi signature di controller