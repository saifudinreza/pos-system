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

// =============================================================
// PUBLIC ROUTES — tidak perlu login
// =============================================================
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);
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
    // KASIR ROUTES — hanya kasir & admin yang bisa akses
    // =============================================================
    Route::middleware('role:admin,kasir')->group(function () {
        // ↑ Kasir dan admin bisa akses semua route di sini

        Route::get('/orders',                    [OrderController::class, 'index']);
        // ↑ Lihat semua order (kasir butuh ini untuk proses transaksi)

        Route::patch('/orders/{id}/status',      [OrderController::class, 'updateStatus']);
        // ↑ Update status order: pending → paid / cancelled

        Route::get('/transactions',              [TransactionController::class, 'index']);
        // ↑ Lihat semua transaksi
    });


    // =============================================================
    // ADMIN ONLY ROUTES — hanya admin yang bisa akses
    // =============================================================
    Route::middleware('role:admin')->group(function () {
        // ↑ Kalau bukan admin → return 403 Forbidden

        // ----- PRODUCTS CRUD -----
        Route::post('/products',           [ProductController::class, 'store']);
        Route::put('/products/{id}',       [ProductController::class, 'update']);
        Route::delete('/products/{id}',    [ProductController::class, 'destroy']);
        // ↑ Hanya admin yang bisa tambah, edit, hapus produk

        // ----- CATEGORIES CRUD -----
        Route::post('/categories',         [CategoryController::class, 'store']);
        Route::put('/categories/{id}',     [CategoryController::class, 'update']);
        Route::delete('/categories/{id}',  [CategoryController::class, 'destroy']);

        // ----- USER MANAGEMENT -----
        Route::get('/users',               [UserController::class, 'index']);
        Route::get('/users/{id}',          [UserController::class, 'show']);
        Route::put('/users/{id}',          [UserController::class, 'update']);
        Route::patch('/users/{id}/toggle', [UserController::class, 'toggleActive']);
        // ↑ Toggle aktif/nonaktif user tanpa hapus data

        // ----- REPORTS -----
        Route::get('/reports/sales',           [ReportController::class, 'sales']);
        Route::get('/reports/stock',           [ReportController::class, 'stock']);
        Route::get('/reports/sales/download',  [ReportController::class, 'downloadSales']);
        Route::get('/reports/stock/download',  [ReportController::class, 'downloadStock']);
        // ↑ Download = return file PDF atau Excel (fitur tambahan)

        // ----- AI ASSISTANT -----
        Route::post('/ai/query',           [AiController::class, 'query']);
        Route::post('/ai/predict-stock',   [AiController::class, 'predictStock']);
        Route::post('/ai/recommend',       [AiController::class, 'recommend']);
        Route::get('/ai/logs',             [AiController::class, 'logs']);
        // ↑ Logs = riwayat semua pertanyaan AI + token yang dipakai
    });
});


// =============================================================
// WEBHOOK — dipanggil Midtrans dari server mereka
// =============================================================
Route::post('/webhook/midtrans', [TransactionController::class, 'webhook']);
// ↑ PENTING: route ini di LUAR middleware auth:sanctum
// Karena yang manggil adalah server Midtrans, bukan user kita
// Midtrans tidak punya token Sanctum kita
// Keamanannya dijaga dengan verifikasi signature di controller