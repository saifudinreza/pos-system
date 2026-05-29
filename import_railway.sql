-- ============================================================
-- Import Data KasirAI ke Railway MySQL
-- Jalankan query-query ini SATU PER SATU di Railway MySQL Query Box
-- ============================================================

-- STEP 1: Cek kondisi Railway dulu
SELECT id, name, email, role, tenant_id FROM users;
SELECT id, name FROM tenants;

-- ============================================================
-- STEP 2: Buat tenant untuk nabila (kalau belum ada)
-- Kalau sudah ada tenant, skip ini dan catat ID-nya
-- ============================================================
INSERT INTO tenants (name, slug, subscription_plan, created_at, updated_at)
VALUES ('KasirAI Store', 'kasirai-store', 'pro', NOW(), NOW());

-- STEP 3: Catat ID tenant yang baru dibuat
-- Jalankan ini untuk lihat ID-nya:
SELECT id, name FROM tenants ORDER BY id DESC LIMIT 1;

-- ============================================================
-- STEP 4: Update user nabila agar terhubung ke tenant
-- Ganti TENANT_ID_DISINI dengan ID dari step 3
-- ============================================================
UPDATE users
SET tenant_id = LAST_INSERT_ID(), role = 'admin', subscription_plan = 'pro'
WHERE email = 'nabila@gmail.com';

-- ============================================================
-- STEP 5: Insert Categories (6 kategori)
-- Ganti @tid dengan tenant_id yang benar
-- ============================================================
SET @tid = (SELECT tenant_id FROM users WHERE email = 'nabila@gmail.com');

INSERT INTO categories (tenant_id, name, slug, is_active, created_at, updated_at) VALUES
(@tid, 'Kopi',          'kopi',          1, NOW(), NOW()),
(@tid, 'Non-Kopi',      'non-kopi',      1, NOW(), NOW()),
(@tid, 'Minuman Segar', 'minuman-segar', 1, NOW(), NOW()),
(@tid, 'Makanan Berat', 'makanan-berat', 1, NOW(), NOW()),
(@tid, 'Snack & Pastry','snack-pastry',  1, NOW(), NOW()),
(@tid, 'Paket Hemat',   'paket-hemat',   1, NOW(), NOW());

-- Cek ID kategori yang baru dibuat:
SELECT id, name FROM categories WHERE tenant_id = @tid;

-- ============================================================
-- STEP 6: Insert Products (20 produk)
-- Ganti @c1..@c6 dengan ID kategori dari step 5
-- ============================================================
SET @c1 = (SELECT id FROM categories WHERE tenant_id = @tid AND slug = 'kopi');
SET @c2 = (SELECT id FROM categories WHERE tenant_id = @tid AND slug = 'non-kopi');
SET @c3 = (SELECT id FROM categories WHERE tenant_id = @tid AND slug = 'minuman-segar');
SET @c4 = (SELECT id FROM categories WHERE tenant_id = @tid AND slug = 'makanan-berat');
SET @c5 = (SELECT id FROM categories WHERE tenant_id = @tid AND slug = 'snack-pastry');
SET @c6 = (SELECT id FROM categories WHERE tenant_id = @tid AND slug = 'paket-hemat');

INSERT INTO products (tenant_id, category_id, name, sku, price, stock, stock_alert, is_active, created_at, updated_at) VALUES
-- Kopi
(@tid, @c1, 'Espresso',        'KPI-001', 20000, 100, 10, 1, NOW(), NOW()),
(@tid, @c1, 'Americano',       'KPI-002', 25000, 100, 10, 1, NOW(), NOW()),
(@tid, @c1, 'Cappuccino',      'KPI-003', 30000, 100, 10, 1, NOW(), NOW()),
(@tid, @c1, 'Caffe Latte',     'KPI-004', 32000, 100, 10, 1, NOW(), NOW()),
(@tid, @c1, 'V60 Manual Brew', 'KPI-005', 38000,  50, 10, 1, NOW(), NOW()),
-- Non-Kopi
(@tid, @c2, 'Matcha Latte',    'NKP-001', 32000,  80, 10, 1, NOW(), NOW()),
(@tid, @c2, 'Taro Latte',      'NKP-002', 30000,  80, 10, 1, NOW(), NOW()),
(@tid, @c2, 'Cokelat Panas',   'NKP-003', 28000,  80, 10, 1, NOW(), NOW()),
(@tid, @c2, 'Chai Latte',      'NKP-004', 30000,  50, 10, 1, NOW(), NOW()),
-- Minuman Segar
(@tid, @c3, 'Lemon Tea',          'MNS-001', 22000, 100, 10, 1, NOW(), NOW()),
(@tid, @c3, 'Es Teh Manis',       'MNS-002', 15000, 100, 10, 1, NOW(), NOW()),
(@tid, @c3, 'Brown Sugar Milk',   'MNS-003', 28000,  80, 10, 1, NOW(), NOW()),
-- Makanan Berat
(@tid, @c4, 'Roti Bakar Keju',    'MKB-001', 25000,  50, 10, 1, NOW(), NOW()),
(@tid, @c4, 'Nasi Goreng',        'MKB-002', 35000,  50, 10, 1, NOW(), NOW()),
(@tid, @c4, 'Sandwich Keju',      'MKB-003', 30000,  40, 10, 1, NOW(), NOW()),
-- Snack & Pastry
(@tid, @c5, 'Croissant',          'SNK-001', 28000,  30, 10, 1, NOW(), NOW()),
(@tid, @c5, 'Banana Cake',        'SNK-002', 25000,  30, 10, 1, NOW(), NOW()),
(@tid, @c5, 'Cookies',            'SNK-003', 20000,  50, 10, 1, NOW(), NOW()),
-- Paket Hemat
(@tid, @c6, 'Paket Kopi + Roti',      'PKT-001', 45000, 999, 10, 1, NOW(), NOW()),
(@tid, @c6, 'Paket Matcha + Cake',    'PKT-002', 50000, 999, 10, 1, NOW(), NOW());

-- Verifikasi:
SELECT COUNT(*) as total_products FROM products WHERE tenant_id = @tid;
SELECT COUNT(*) as total_categories FROM categories WHERE tenant_id = @tid;
