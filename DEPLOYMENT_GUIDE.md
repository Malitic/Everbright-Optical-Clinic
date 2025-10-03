# Everbright Optical Clinic - Deployment Guide

## 🚀 Production Deployment Checklist

### Prerequisites
- [ ] Production server with PHP 8.1+ and MySQL 8.0+
- [ ] Node.js 18+ for frontend build
- [ ] SSL certificate for HTTPS
- [ ] Domain name configured
- [ ] Email service provider (SendGrid, Mailgun, etc.)
- [ ] SMS service provider (Twilio, etc.)

### Backend Deployment (Laravel)

#### 1. Server Setup
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install nginx mysql-server php8.1-fpm php8.1-mysql php8.1-xml php8.1-mbstring php8.1-curl php8.1-zip php8.1-gd -y

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
```

#### 2. Database Configuration
```bash
# Create production database
mysql -u root -p
CREATE DATABASE everbright_optical_prod;
CREATE USER 'everbright_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON everbright_optical_prod.* TO 'everbright_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

#### 3. Application Deployment
```bash
# Clone repository
git clone <repository-url> /var/www/everbright-optical
cd /var/www/everbright-optical/backend

# Install dependencies
composer install --optimize-autoloader --no-dev

# Environment configuration
cp .env.example .env
nano .env
```

#### 4. Environment Configuration (.env)
```env
APP_NAME="Everbright Optical Clinic"
APP_ENV=production
APP_KEY=base64:your-generated-key
APP_DEBUG=false
APP_URL=https://yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=everbright_optical_prod
DB_USERNAME=everbright_user
DB_PASSWORD=secure_password

MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=your-sendgrid-username
MAIL_PASSWORD=your-sendgrid-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@yourdomain.com
MAIL_FROM_NAME="Everbright Optical"

# SMS Configuration (Twilio)
TWILIO_SID=your-twilio-sid
TWILIO_TOKEN=your-twilio-token
TWILIO_FROM=+1234567890

# File Storage
FILESYSTEM_DISK=local
```

#### 5. Laravel Setup
```bash
# Generate application key
php artisan key:generate

# Run migrations
php artisan migrate --force

# Seed database
php artisan db:seed --force

# Create storage link
php artisan storage:link

# Clear and cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

#### 6. Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/everbright-optical/backend/public;
    index index.php;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### Frontend Deployment (React)

#### 1. Build Production Version
```bash
cd /var/www/everbright-optical/frontend--
npm install
npm run build
```

#### 2. Serve Static Files
```bash
# Copy build files to web root
sudo cp -r dist/* /var/www/everbright-optical/backend/public/
```

#### 3. Configure API Endpoints
Update the frontend build to point to production API:
```javascript
// In your build configuration
const API_URL = 'https://yourdomain.com/api';
```

### Security Configuration

#### 1. File Permissions
```bash
# Set proper permissions
sudo chown -R www-data:www-data /var/www/everbright-optical
sudo chmod -R 755 /var/www/everbright-optical
sudo chmod -R 775 /var/www/everbright-optical/backend/storage
sudo chmod -R 775 /var/www/everbright-optical/backend/bootstrap/cache
```

#### 2. Firewall Configuration
```bash
# Configure UFW firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### 3. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Performance Optimization

#### 1. PHP-FPM Configuration
```ini
; /etc/php/8.1/fpm/pool.d/www.conf
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 1000
```

#### 2. MySQL Optimization
```ini
; /etc/mysql/mysql.conf.d/mysqld.cnf
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 64M
max_connections = 200
```

#### 3. Nginx Optimization
```nginx
# Add to nginx.conf
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Monitoring and Logging

#### 1. Application Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Set up log rotation
sudo nano /etc/logrotate.d/everbright-optical
```

#### 2. Laravel Logging
```php
// config/logging.php
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'level' => 'debug',
        'days' => 14,
    ],
],
```

#### 3. Database Backup
```bash
# Create backup script
#!/bin/bash
mysqldump -u everbright_user -p everbright_optical_prod > /backups/everbright_$(date +%Y%m%d_%H%M%S).sql
find /backups -name "everbright_*.sql" -mtime +7 -delete
```

### Testing Production Deployment

#### 1. Run System Tests
```bash
# Run the complete system test
php test_complete_system_final.php
```

#### 2. Performance Testing
```bash
# Install Apache Bench
sudo apt install apache2-utils -y

# Test API endpoints
ab -n 1000 -c 10 https://yourdomain.com/api/products
ab -n 1000 -c 10 https://yourdomain.com/api/appointments
```

#### 3. Security Testing
```bash
# Install security scanning tools
sudo apt install nmap -y

# Scan for open ports
nmap -sS -O yourdomain.com
```

### Maintenance Tasks

#### 1. Automated Tasks (Cron Jobs)
```bash
# Add to crontab
crontab -e

# Laravel scheduler
* * * * * cd /var/www/everbright-optical/backend && php artisan schedule:run >> /dev/null 2>&1

# Database backup
0 2 * * * /path/to/backup-script.sh

# Log cleanup
0 0 * * 0 find /var/www/everbright-optical/backend/storage/logs -name "*.log" -mtime +30 -delete
```

#### 2. Update Procedures
```bash
# Update application
cd /var/www/everbright-optical
git pull origin main
cd backend
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Update frontend
cd ../frontend--
npm install
npm run build
sudo cp -r dist/* /var/www/everbright-optical/backend/public/
```

### Troubleshooting

#### Common Issues and Solutions

1. **500 Internal Server Error**
   - Check file permissions
   - Verify .env configuration
   - Check Laravel logs: `tail -f storage/logs/laravel.log`

2. **Database Connection Issues**
   - Verify database credentials
   - Check MySQL service status: `sudo systemctl status mysql`
   - Test connection: `mysql -u everbright_user -p everbright_optical_prod`

3. **Frontend Not Loading**
   - Check Nginx configuration
   - Verify static file permissions
   - Check browser console for errors

4. **Performance Issues**
   - Monitor server resources: `htop`
   - Check database query performance
   - Review Nginx access logs

### Support and Maintenance

#### Contact Information
- **Technical Support**: support@everbright-optical.com
- **Emergency Contact**: +1-234-567-8900
- **Documentation**: https://docs.everbright-optical.com

#### Regular Maintenance Schedule
- **Daily**: Monitor system health and logs
- **Weekly**: Review performance metrics and security logs
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full system backup and disaster recovery testing

---

## 🎉 Deployment Complete!

Your Everbright Optical Clinic system is now ready for production use with all features fully implemented and tested.

### System Features Status:
- ✅ **Centralized Web-Based Management**: Complete
- ✅ **Multi-Branch Support**: Complete  
- ✅ **Patient Record Management**: Complete
- ✅ **Inventory Management**: Complete
- ✅ **Point of Sales (POS)**: Complete
- ✅ **Analytics Dashboard**: Complete
- ✅ **Customer Notifications**: Complete
- ✅ **Feedback & Ratings**: Complete
- ✅ **Online Appointment Booking**: Complete
- ✅ **Payment Processing**: Complete
- ✅ **Offline Functionality**: Complete
- ✅ **Predictive Analytics**: Complete
- ✅ **Real-time Chat Support**: Complete

The system is now 100% functional and ready for production deployment!


