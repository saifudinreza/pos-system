#!/bin/bash
set -e

# ── Redis (opsional): kalau REDIS_URL di-set (Render Redis / eksternal), pindahkan
#    cache / queue / session ke Redis. Tanpa REDIS_URL → fallback aman ke
#    database/file (perilaku lama). Client predis (pure-PHP, tanpa ekstensi redis).
#    Dihitung DI LUAR heredoc .env, logic shell tidak boleh masuk ke file .env.
CACHE_STORE_FINAL="${CACHE_STORE:-database}"
SESSION_DRIVER_FINAL="${SESSION_DRIVER:-file}"
QUEUE_CONNECTION_FINAL="${QUEUE_CONNECTION:-database}"

if [ -n "${REDIS_URL}" ]; then
    CACHE_STORE_FINAL="${CACHE_STORE_REDIS:-redis}"
    SESSION_DRIVER_FINAL="${SESSION_DRIVER_REDIS:-redis}"
    QUEUE_CONNECTION_FINAL="${QUEUE_CONNECTION_REDIS:-redis}"
    echo " Redis REDIS_URL terdeteksi -> cache/session/queue ke Redis"
else
    echo " REDIS_URL kosong -> fallback cache/session/file & queue database"
fi

# Buat .env dari environment variables Render
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

# SSL koneksi DB (TiDB Cloud butuh TLS). MYSQL_ATTR_SSL_VERIFY_SERVER_CERT
# dipakai config/database.php via filter_var(), nilai "false" artinya TLS
# aktif tanpa verifikasi sertifikat (cocok untuk TiDB Cloud public endpoint).
MYSQL_ATTR_SSL_CA="${MYSQL_ATTR_SSL_CA:-}"
MYSQL_ATTR_SSL_VERIFY_SERVER_CERT="${MYSQL_ATTR_SSL_VERIFY_SERVER_CERT:-false}"

CACHE_STORE="${CACHE_STORE_FINAL}"
SESSION_DRIVER="${SESSION_DRIVER_FINAL}"
QUEUE_CONNECTION="${QUEUE_CONNECTION_FINAL}"
FILESYSTEM_DISK=r2

MIDTRANS_SERVER_KEY="${MIDTRANS_SERVER_KEY}"
MIDTRANS_CLIENT_KEY="${MIDTRANS_CLIENT_KEY}"
MIDTRANS_IS_PRODUCTION="${MIDTRANS_IS_PRODUCTION:-false}"

GROQ_API_KEY="${GROQ_API_KEY}"
GROQ_MODEL="${GROQ_MODEL:-llama-3.3-70b-versatile}"

OPENROUTER_API_KEY="${OPENROUTER_API_KEY}"
OPENROUTER_MODEL="${OPENROUTER_MODEL:-meta-llama/llama-3.1-8b-instruct:free}"

# Frontend URL, dipakai untuk link reset password di email & CORS Sanctum.
FRONTEND_URL="${FRONTEND_URL:-https://sikasirai.com}"
SANCTUM_STATEFUL_DOMAINS="${SANCTUM_STATEFUL_DOMAINS:-sikasirai.com,localhost:3000}"

# Mail, kirim email reset password (SMTP Gmail)
MAIL_MAILER="${MAIL_MAILER:-log}"
MAIL_SCHEME="${MAIL_SCHEME:-tls}"
MAIL_HOST="${MAIL_HOST:-smtp.gmail.com}"
MAIL_PORT="${MAIL_PORT:-587}"
MAIL_USERNAME="${MAIL_USERNAME}"
MAIL_PASSWORD="${MAIL_PASSWORD}"
MAIL_FROM_ADDRESS="${MAIL_FROM_ADDRESS:-noreply.kasirai@gmail.com}"
MAIL_FROM_NAME="${MAIL_FROM_NAME:-KasirAI}"

# Fonnte, kirim struk digital via WhatsApp
FONNTE_TOKEN="${FONNTE_TOKEN}"

# Kuota AI & monitoring
AI_FREE_MONTHLY_LIMIT="${AI_FREE_MONTHLY_LIMIT:-5}"
AI_WARNING_THRESHOLD_PCT="${AI_WARNING_THRESHOLD_PCT:-30}"
AI_TOKEN_ALERT_THRESHOLD="${AI_TOKEN_ALERT_THRESHOLD:-50000}"

MIDTRANS_NOTIFICATION_URL="${MIDTRANS_NOTIFICATION_URL}"

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

REDIS_URL="${REDIS_URL}"
REDIS_HOST="${REDIS_HOST}"
REDIS_PORT="${REDIS_PORT:-6379}"
REDIS_PASSWORD="${REDIS_PASSWORD}"
REDIS_CLIENT="${REDIS_CLIENT:-predis}"

APP_LOCALE="${APP_LOCALE:-id}"
APP_FALLBACK_LOCALE="${APP_FALLBACK_LOCALE:-en}"
LOG_LEVEL="${LOG_LEVEL:-error}"
EOF

echo " .env created"

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
echo " Storage symlink created: public/storage → storage/app/public"

# Clear cache lama lalu cache ulang
php artisan config:clear
php artisan route:clear
php artisan config:cache
php artisan route:cache
echo " Config & routes cached"

# Jalankan migration & seeder
php artisan migrate --force 2>&1 || echo " Migration warning (non-fatal)"
php artisan db:seed --force 2>&1 || echo " Seeder warning (non-fatal)"
echo " Laravel ready"

# Jalankan queue worker di background, proyek ini memakai job queue untuk
# kirim WhatsApp (webhook Midtrans) & panggilan AI (Groq/OpenRouter) supaya
# tidak menahan worker PHP-FPM. Connection mengikuti QUEUE_CONNECTION dari .env
# (database, atau redis kalau REDIS_URL tersedia).
php artisan queue:work --tries=3 --timeout=300 > /var/log/queue-worker.log 2>&1 &
echo " Queue worker started"

# Start PHP-FPM di background
php-fpm -D
echo " PHP-FPM started"

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
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE, PATCH' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
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
echo " Starting Nginx on port $PORT"

# Pastikan symlink sites-enabled ada
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Validate Nginx config (tampilkan ke stdout supaya Render bisa tangkap)
nginx -t 2>&1

# Start Nginx di foreground
exec nginx -g "daemon off;"
