#!/bin/sh
set -e

echo "=== KasirAI Backend — Railway Startup ==="

# Buat direktori storage yang dibutuhkan Laravel
mkdir -p storage/logs \
         storage/framework/cache \
         storage/framework/sessions \
         storage/framework/views \
         storage/app/public/products \
         bootstrap/cache

# Set permissions
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Buat symbolic link storage → public/storage
# Gambar produk bisa diakses via /storage/products/xxx.jpg
php artisan storage:link --force 2>/dev/null || true

# Generate APP_KEY kalau belum ada
if [ -z "$APP_KEY" ]; then
  echo "WARNING: APP_KEY tidak di-set! Generate sementara..."
  php artisan key:generate --force
fi

# Cache konfigurasi untuk performa lebih baik di production
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Jalankan database migration
# --force: jalankan tanpa konfirmasi (wajib di production)
echo "=== Menjalankan database migration... ==="
php artisan migrate --force

# Buat log supervisor
mkdir -p /var/log/supervisor

echo "=== Startup selesai. Menjalankan Nginx + PHP-FPM... ==="

# Jalankan supervisor yang mengelola Nginx + PHP-FPM
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
