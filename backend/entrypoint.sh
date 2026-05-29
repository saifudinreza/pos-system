#!/bin/bash

# Buat file .env dari environment variables Railway
cat > /var/www/html/.env << EOF
APP_NAME="${APP_NAME:-POS System}"
APP_ENV="${APP_ENV:-production}"
APP_KEY="${APP_KEY}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_URL="${APP_URL}"

DB_CONNECTION=mysql
DB_HOST="${DB_HOST}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE}"
DB_USERNAME="${DB_USERNAME}"
DB_PASSWORD="${DB_PASSWORD}"

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_CONNECTION=sync

MIDTRANS_SERVER_KEY="${MIDTRANS_SERVER_KEY}"
MIDTRANS_CLIENT_KEY="${MIDTRANS_CLIENT_KEY}"
MIDTRANS_IS_PRODUCTION="${MIDTRANS_IS_PRODUCTION:-false}"

GROQ_API_KEY="${GROQ_API_KEY}"
GROQ_MODEL="${GROQ_MODEL:-llama-3.3-70b-versatile}"
EOF

# Cache config Laravel
php artisan config:cache
php artisan route:cache

# Jalankan migration
php artisan migrate --force

# Start Apache
apache2-foreground