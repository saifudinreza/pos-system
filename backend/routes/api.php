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

// =============================================================
// PUBLIC ROUTES — tidak perlu login
// =============================================================
Route::post('/register',      [AuthController::class, 'register']);
Route::post('/login',         [AuthController::class, 'login']);
Route::get('/check-tenant',   [AuthController::class, 'checkTenant']);

// Media proxy — serve gambar dari R2/storage tanpa butuh auth
Route::get('/media/{path}', function (string $path) {
    $disk = env('R2_ACCESS_KEY_ID') ? 'r2' : 'public';
    if (! \Illuminate\Support\Facades\Storage::disk($disk)->exists($path)) {
        abort(404);
    }
    return \Illuminate\Support\Facades\Storage::disk($disk)->response($path);
})->where('path', '.*');
// ↑ Dua endpoint ini bebas diakses siapa saja tanpa token


// =============================================================
// PROTECTED ROUTES — wajib login (ada token Sanctum)
// =============================================================
Route::middleware('auth:sanctum')->group(function () {
    // ↑ Semua route di dalam sini wajib kirim header:
    // Authorization: Bearer {token}
    // Kalau tidak ada token → otomatis return 401

    // ----- AUTH -----
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);

    // ----- SUBSCRIPTION -----
    Route::get('/subscription',          [SubscriptionController::class, 'status']);
    Route::post('/subscription/initiate', [SubscriptionController::class, 'initiate']);
    // ↑ /me = ambil data user yang sedang login


    // ----- PRODUCTS (semua role bisa lihat) -----
    Route::get('/products',        [ProductController::class, 'index']);
    Route::get('/products/{id}',   [ProductController::class, 'show']);
    // ↑ Customer dan kasir perlu lihat daftar produk


    // ----- CATEGORIES (semua role bisa lihat) -----
    Route::get('/categories',      [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);


    // ----- ORDERS (customer & kasir bisa buat order) -----
    Route::post('/orders',              [OrderController::class, 'store']);
    Route::get('/orders/{id}',          [OrderController::class, 'show']);
    Route::get('/orders/my/history',    [OrderController::class, 'myOrders']);
    // ↑ Customer lihat riwayat order sendiri


    // ----- TRANSACTIONS -----
    Route::post('/transactions',           [TransactionController::class, 'create']);
    Route::get('/transactions/{id}',       [TransactionController::class, 'show']);
    Route::get('/transactions/my/history', [TransactionController::class, 'myTransactions']);
    // ↑ Customer lihat riwayat pembayaran sendiri


    // =============================================================
    // KASIR ROUTES — kasir, admin & developer bisa akses
    // =============================================================
    Route::middleware('role:admin,kasir,developer')->group(function () {
        Route::get('/orders',                              [OrderController::class, 'index']);
        Route::patch('/orders/{id}/status',               [OrderController::class, 'updateStatus']);
        Route::get('/transactions',                       [TransactionController::class, 'index']);
        Route::patch('/transactions/{id}/cancel',         [TransactionController::class, 'cancelTransaction']);

        // ----- SHIFT MANAGEMENT -----
        Route::get('/shifts',                             [ShiftController::class, 'index']);
        Route::get('/shifts/current',                     [ShiftController::class, 'current']);
        Route::post('/shifts/open',                       [ShiftController::class, 'open']);
        Route::post('/shifts/{id}/close',                 [ShiftController::class, 'close']);
        Route::get('/shifts/{id}/report',                 [ShiftController::class, 'report']);
    });


    // =============================================================
    // ADMIN + KASIR + DEVELOPER — CRUD produk & kategori (dengan limit per plan)
    // =============================================================
    Route::middleware('role:admin,kasir,developer')->group(function () {
        // ----- PRODUCTS CRUD -----
        Route::post('/products',           [ProductController::class, 'store']);
        Route::put('/products/{id}',       [ProductController::class, 'update']);
        Route::delete('/products/{id}',    [ProductController::class, 'destroy']);

        // ----- CATEGORIES CRUD -----
        Route::post('/categories',         [CategoryController::class, 'store']);
        Route::put('/categories/{id}',     [CategoryController::class, 'update']);
        Route::delete('/categories/{id}',  [CategoryController::class, 'destroy']);

    });

    // =============================================================
    // ADMIN + DEVELOPER — laporan & AI logs
    // =============================================================
    Route::middleware('role:admin,developer')->group(function () {
        // ----- REPORTS -----
        Route::get('/reports/sales',           [ReportController::class, 'sales']);
        Route::get('/reports/stock',           [ReportController::class, 'stock']);
        Route::get('/reports/sales/download',  [ReportController::class, 'downloadSales']);
        Route::get('/reports/stock/download',  [ReportController::class, 'downloadStock']);

        // ----- AI LOGS & STATS -----
        Route::get('/ai/logs',  [AiController::class, 'logs']);
        Route::get('/ai/stats', [AiController::class, 'stats']);
    });


    // =============================================================
    // DEVELOPER ONLY ROUTES — hanya developer yang bisa akses
    // =============================================================
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

    // ----- AI ASSISTANT (admin & developer saja — pro/enterprise subscribers) -----
    Route::middleware('role:admin,developer')->group(function () {
        Route::get('/ai/usage-today',    [AiController::class, 'usageToday']);
        Route::post('/ai/query',         [AiController::class, 'query']);
        Route::post('/ai/predict-stock', [AiController::class, 'predictStock']);
        Route::post('/ai/recommend',     [AiController::class, 'recommend']);
    });
});


// =============================================================
// WEBHOOK — dipanggil Midtrans dari server mereka
// =============================================================
Route::post('/webhook/midtrans',              [TransactionController::class,  'webhook']);
Route::post('/webhook/midtrans-subscription', [SubscriptionController::class, 'webhook']);
// ↑ PENTING: route ini di LUAR middleware auth:sanctum
// Karena yang manggil adalah server Midtrans, bukan user kita
// Midtrans tidak punya token Sanctum kita
// Keamanannya dijaga dengan verifikasi signature di controller