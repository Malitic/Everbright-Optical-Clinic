# Use PHP 8.2 with Apache
FROM php:8.2-apache

# Install system dependencies
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
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy backend files
COPY backend/ /var/www/html/

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Copy frontend files
COPY frontend--/ /var/www/html/frontend/

# Install Node.js dependencies and build frontend
WORKDIR /var/www/html/frontend
RUN npm install && npm run build

# Copy built frontend to public directory
RUN cp -r dist/* /var/www/html/public/

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

# Configure Apache
RUN a2enmod rewrite
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf

# Create startup script to handle PORT environment variable
RUN echo '#!/bin/bash\n\
# Set Apache to listen on Railway PORT\n\
if [ -n "$PORT" ]; then\n\
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf\n\
    sed -i "s/*:80/*:$PORT/" /etc/apache2/sites-available/000-default.conf\n\
fi\n\
exec apache2-foreground' > /usr/local/bin/start-apache.sh \
    && chmod +x /usr/local/bin/start-apache.sh

# Expose port (Railway will override this)
EXPOSE 80

# Start Apache with PORT handling
CMD ["/usr/local/bin/start-apache.sh"]
