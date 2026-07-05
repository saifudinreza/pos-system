# CLAUDE.md

Panduan untuk Claude Code (dan siapa pun) saat bekerja di repo ini.

## Ringkasan Proyek

**KasirAI** — aplikasi Point of Sale (POS) berbasis web untuk UMKM Indonesia, dengan AI Assistant, payment gateway, dan struk digital via WhatsApp. Dibangun oleh **Saifudin Reza** sebagai final project Full Stack Web Development Bootcamp 2026.

- Live demo: https://kasirai.vercel.app/
- Monorepo: `frontend/` (Next.js 14) + `backend/` (Laravel 11), masing-masing punya `package.json`/`composer.json` sendiri.

## Tech Stack

**Frontend** (`frontend/`)
- Next.js 14 (App Router), React 18
- Tailwind CSS 3.4 — custom neobrutalism design system
- Zustand 5 — state management (`src/stores`: authStore, cartStore, aiStore, subscriptionStore)
- Axios (`src/services/*.js`) — satu file service per resource, Bearer token interceptor
- Framer Motion (animasi), Recharts (dashboard chart), Lucide React (icon)
- Deploy: Vercel

**Backend** (`backend/`)
- Laravel 11 (PHP ^8.3), MySQL 8
- Laravel Sanctum — token auth
- Laravel Global Scope (`app/Scopes/TenantScope.php`) — isolasi data multi-tenant otomatis
- barryvdh/laravel-dompdf — export PDF, maatwebsite/excel — export xlsx
- midtrans/midtrans-php — payment gateway (per-tenant key)
- league/flysystem-aws-s3-v3 — Cloudflare R2 (S3-compatible) storage
- Deploy: Railway (Docker + Nginx + PHP-FPM)

**Layanan eksternal**
- AI: Groq (primary, LLaMA 3.3 70B) → OpenRouter (fallback, auto-switch via Cache circuit breaker saat rate limited)
- Payment: Midtrans Snap (QRIS, GoPay, OVO, VA, kartu kredit) — key per-tenant, server key dienkripsi di DB
- Storage: Cloudflare R2, diproksikan lewat backend (`/api/media/{path}`) — URL R2 tidak pernah terekspos ke browser
- WhatsApp: Fonnte API — dipanggil lewat Next.js API route server-side, token tidak pernah ke browser

## Struktur Direktori Penting

```
backend/
  app/Http/Controllers/Api/   AuthController, ProductController, CategoryController,
                              OrderController, TransactionController, ShiftController,
                              ReportController, AiController, UserController,
                              TenantController, SubscriptionController
  app/Models/                 User, Tenant, Product, Category, Order, OrderItem,
                              Transaction, Shift, Subscription, AiChatUsage, AiQueryLog
  app/Scopes/TenantScope.php  Global scope multi-tenant
  app/Services/               logika bisnis (mis. AI provider fallback)
  app/Http/Middleware/RoleMiddleware.php
  routes/api.php               semua endpoint REST
  config/ai.php                config provider Groq/OpenRouter

frontend/
  src/app/(auth)/              login, register
  src/app/(dashboard)/         dashboard, products, categories, orders, transactions,
                                reports, users, ai-monitoring, profile, upgrade
  src/app/kasir/                POS terminal (split-screen: grid produk + keranjang)
  src/services/                 satu file per resource, wrapper axios
  src/stores/                   authStore, cartStore, aiStore, subscriptionStore
  src/middleware.js             proteksi route Next.js
```

## Arsitektur Kunci (baca sebelum ubah bagian ini)

1. **Multi-tenant via Global Scope** — jangan tambah `WHERE tenant_id = ?` manual di query; `TenantScope` sudah otomatis aktif di semua model tenant-aware. `tenant_id = null` khusus role `developer` (bisa lihat lintas tenant).
2. **AI dual-provider** — Groq utama, fallback ke OpenRouter otomatis saat kena rate limit (cooldown 65 detik via `Cache::put('groq_rate_limited', ...)`). Jangan hardcode satu provider saja.
3. **Payment per-tenant (split payment)** — setiap tenant simpan `midtrans_server_key`/`midtrans_client_key` sendiri di tabel `tenants` (server key ter-enkripsi). Fallback ke `config('services.midtrans.server_key')` kalau tenant belum setting.
4. **Shift per-tenant, bukan per-user** — satu shift aktif dipakai bersama semua kasir dalam tenant yang sama. Transaksi diblokir di luar jam shift (realtime enforcement berbasis `start_time`/`end_time`).
5. **Media selalu lewat proxy backend** — jangan pernah expose URL R2 langsung ke frontend; gunakan `url('/api/media/' . $path)`.
6. **Role & akses**: `user` < `kasir` < `admin` < `developer`. Lihat tabel role di README untuk detail hak akses per fitur (POS, produk, laporan, konfigurasi Midtrans, AI, user management).

## Menjalankan Secara Lokal

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve

# Frontend
cd frontend
npm install
npm run dev
```

Env penting backend: `DB_*`, `GROQ_API_KEY`, `MIDTRANS_SERVER_KEY`/`MIDTRANS_CLIENT_KEY`/`MIDTRANS_IS_PRODUCTION`.
Env penting frontend: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`, `NEXT_PUBLIC_MIDTRANS_SNAP_URL`, `FONNTE_TOKEN`.

Ada juga `dev.ps1` di root untuk menjalankan kedua server sekaligus di Windows.

## Testing

- E2E testing pakai **TestSprite** (lihat `testsprite_tests/` di root & di `frontend/`).
- Backend: PHPUnit (`backend/tests`, jalankan `php artisan test` atau `vendor/bin/phpunit`).
- Sebelum melaporkan perubahan besar selesai, jalankan test yang relevan dan/atau `/verify` skill.

## Catatan Kerja

- Bahasa README & komentar produk: Bahasa Indonesia. Ikuti gaya ini untuk teks user-facing (label UI, pesan error ke pengguna).
- Proyek ini production — hindari perubahan yang merusak isolasi tenant, enkripsi key Midtrans, atau proxy media R2.
