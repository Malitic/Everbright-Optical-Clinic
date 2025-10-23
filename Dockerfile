# Use PHP 8.2 with Apache
FROM php:8.2-apache

# Install system dependencies in one layer
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    zip \
    unzip \
    nodejs \
    npm \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for better caching
COPY backend/composer.json backend/composer.lock ./

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy backend files
COPY backend/ ./

# Copy frontend files
COPY frontend--/ ./frontend/

# Build frontend and copy to public directory in one step
RUN cd frontend && npm install && npm run build && cp -r dist/* ../public/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Configure Apache
RUN a2enmod rewrite
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Create startup script
RUN echo '#!/bin/bash\n\
if [ -n "$PORT" ]; then\n\
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf\n\
    sed -i "s/*:80/*:$PORT/" /etc/apache2/sites-available/000-default.conf\n\
fi\n\
exec apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

# Expose port
EXPOSE 80

# Start Apache
CMD ["/usr/local/bin/start-apache.sh"]
