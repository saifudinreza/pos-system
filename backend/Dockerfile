FROM php:8.3-fpm-alpine

# ─── System dependencies ───────────────────────────────────────────────────
RUN apk add --no-cache \
    git curl unzip nginx supervisor \
    libpng-dev libzip-dev libxml2-dev \
    oniguruma-dev freetype-dev libjpeg-turbo-dev

# ─── PHP extensions ────────────────────────────────────────────────────────
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
 && docker-php-ext-install -j$(nproc) \
    pdo_mysql mbstring exif pcntl bcmath gd zip opcache

# ─── Composer ──────────────────────────────────────────────────────────────
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ─── Working directory ─────────────────────────────────────────────────────
WORKDIR /var/www/html

# ─── Copy & install dependencies ───────────────────────────────────────────
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

COPY . .
RUN composer dump-autoload --optimize --no-dev

# ─── Permissions ───────────────────────────────────────────────────────────
RUN mkdir -p storage/logs storage/framework/{cache,sessions,views} bootstrap/cache \
 && chown -R www-data:www-data storage bootstrap/cache \
 && chmod -R 775 storage bootstrap/cache

# ─── Config files ──────────────────────────────────────────────────────────
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/custom.ini
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
