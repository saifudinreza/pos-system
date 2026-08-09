#!/bin/bash
set -e

# Buat .env dari environment variables Railway
cat > /var/www/html/.env << EOF
APP_NAME="${APP_NAME:-KasirAI}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL:-https://localhost}"

DB_CONNECTION=mysql
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE}"
DB_USERNAME="${DB_USERNAME}"
DB_PASSWORD="${DB_PASSWORD}"

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=database
FILESYSTEM_DISK=public

MIDTRANS_SERVER_KEY="${MIDTRANS_SERVER_KEY}"
MIDTRANS_CLIENT_KEY="${MIDTRANS_CLIENT_KEY}"
MIDTRANS_IS_PRODUCTION="${MIDTRANS_IS_PRODUCTION:-false}"

GROQ_API_KEY="${GROQ_API_KEY}"
GROQ_MODEL="${GROQ_MODEL:-llama-3.3-70b-versatile}"

OPENROUTER_API_KEY="${OPENROUTER_API_KEY}"
OPENROUTER_MODEL="${OPENROUTER_MODEL:-meta-llama/llama-3.1-8b-instruct:free}"

AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
AWS_DEFAULT_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
AWS_BUCKET="${AWS_BUCKET}"
AWS_ENDPOINT="${AWS_ENDPOINT}"
AWS_URL="${AWS_URL}"
AWS_USE_PATH_STYLE_ENDPOINT="${AWS_USE_PATH_STYLE_ENDPOINT:-false}"

R2_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
R2_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
R2_BUCKET="${R2_BUCKET}"
R2_ENDPOINT="${R2_ENDPOINT}"
R2_PUBLIC_URL="${R2_PUBLIC_URL}"
EOF

echo "✅ .env created"

# Buat folder storage yang dibutuhkan Laravel
mkdir -p /var/www/html/storage/app/public/products
mkdir -p /var/www/html/storage/framework/cache
mkdir -p /var/www/html/storage/framework/sessions
mkdir -p /var/www/html/storage/framework/views
mkdir -p /var/www/html/storage/logs
mkdir -p /var/www/html/bootstrap/cache

# Set permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Buat storage symlink: public/storage → storage/app/public
# Ini wajib agar gambar yang diupload bisa diakses via URL
rm -rf /var/www/html/public/storage
ln -sf /var/www/html/storage/app/public /var/www/html/public/storage
echo "✅ Storage symlink created: public/storage → storage/app/public"

# Clear cache lama lalu cache ulang
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
echo "✅ Config & routes cached"

# Jalankan migration
php artisan migrate --force 2>&1 || echo "⚠️ Migration warning (non-fatal)"
echo "✅ Laravel ready"

# Jalankan queue worker di background — proyek ini memakai job queue untuk
# kirim WhatsApp (webhook Midtrans) & panggilan AI (Groq/OpenRouter) supaya
# tidak menahan worker PHP-FPM. QUEUE_CONNECTION=database memakai tabel `jobs`.
export QUEUE_CONNECTION=database
php artisan queue:work --tries=3 --timeout=300 > /var/log/queue-worker.log 2>&1 &
echo "✅ Queue worker started"

# Start PHP-FPM di background
php-fpm -D
echo "✅ PHP-FPM started"

# Tulis nginx config langsung (hindari masalah cache/template)
export PORT="${PORT:-80}"
cat > /etc/nginx/sites-available/default << NGINXEOF
server {
    listen $PORT;
    server_name _;
    root /var/www/html/public;
    index index.php index.html;

    client_max_body_size 10M;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$realpath_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
NGINXEOF
echo "✅ Starting Nginx on port $PORT"

# Pastikan symlink sites-enabled ada
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Validate Nginx config (tampilkan ke stdout supaya Railway bisa tangkap)
nginx -t 2>&1

# Start Nginx di foreground
exec nginx -g "daemon off;"
