# Fluxo Production Deployment Guide

Complete guide for deploying Fluxo to production with database, authentication, and full infrastructure setup.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Manual Deployment](#manual-deployment)
6. [CI/CD Setup](#cicd-setup)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Required Software
- Node.js 22.x or higher
- pnpm 10.x or higher
- MySQL 8.0 or higher
- Docker & Docker Compose (for containerized deployment)
- Git

### Required Accounts
- MySQL database (AWS RDS, PlanetScale, or self-hosted)
- Domain name (optional, for custom domain)
- SSL certificate (Let's Encrypt recommended)

---

## Environment Variables

### Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# ============================================
# APPLICATION
# ============================================
NODE_ENV=production
PORT=3000
VITE_APP_TITLE=Fluxo
VITE_APP_LOGO=/logo.png

# ============================================
# DATABASE
# ============================================
DATABASE_URL=mysql://username:password@host:3306/fluxo_production

# ============================================
# AUTHENTICATION
# ============================================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
COOKIE_DOMAIN=yourdomain.com
COOKIE_SECURE=true

# ============================================
# OAUTH (if using external auth)
# ============================================
OAUTH_SERVER_URL=https://auth.yourdomain.com
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret
OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback

# ============================================
# API INTEGRATIONS
# ============================================
# Hunter.io for email finding
HUNTER_API_KEY=your-hunter-api-key

# PeopleDataLabs for contact enrichment
PDL_API_KEY=your-pdl-api-key

# Clearbit for company data
CLEARBIT_API_KEY=your-clearbit-api-key

# Google Gemini for AI insights
GEMINI_API_KEY=your-gemini-api-key

# ============================================
# ANALYTICS
# ============================================
VITE_ANALYTICS_ENDPOINT=https://analytics.yourdomain.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# ============================================
# SECURITY
# ============================================
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE=/var/log/fluxo/app.log
```

### Generating Secure Secrets

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -hex 32
```

---

## Database Setup

### Option 1: AWS RDS (Recommended for Production)

1. **Create RDS MySQL Instance**
   ```bash
   aws rds create-db-instance \
     --db-instance-identifier fluxo-production \
     --db-instance-class db.t3.micro \
     --engine mysql \
     --engine-version 8.0.35 \
     --master-username admin \
     --master-user-password YOUR_SECURE_PASSWORD \
     --allocated-storage 20 \
     --vpc-security-group-ids sg-xxxxx \
     --db-subnet-group-name your-subnet-group \
     --backup-retention-period 7 \
     --preferred-backup-window "03:00-04:00" \
     --preferred-maintenance-window "mon:04:00-mon:05:00" \
     --enable-cloudwatch-logs-exports '["error","general","slowquery"]'
   ```

2. **Configure Security Group**
   - Allow inbound MySQL traffic (port 3306) from your application servers
   - Restrict access to specific IP ranges

3. **Create Database**
   ```sql
   CREATE DATABASE fluxo_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Option 2: PlanetScale (Serverless MySQL)

1. **Create Database**
   ```bash
   pscale database create fluxo-production --region us-east
   ```

2. **Create Production Branch**
   ```bash
   pscale branch create fluxo-production main
   ```

3. **Get Connection String**
   ```bash
   pscale connect fluxo-production main --port 3309
   ```

### Option 3: Self-Hosted MySQL

1. **Install MySQL 8.0**
   ```bash
   sudo apt update
   sudo apt install mysql-server
   sudo mysql_secure_installation
   ```

2. **Create Database and User**
   ```sql
   CREATE DATABASE fluxo_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'fluxo'@'%' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON fluxo_production.* TO 'fluxo'@'%';
   FLUSH PRIVILEGES;
   ```

3. **Configure MySQL for Production**
   Edit `/etc/mysql/mysql.conf.d/mysqld.cnf`:
   ```ini
   [mysqld]
   max_connections = 200
   innodb_buffer_pool_size = 1G
   innodb_log_file_size = 256M
   slow_query_log = 1
   slow_query_log_file = /var/log/mysql/slow.log
   long_query_time = 2
   ```

### Run Database Migrations

```bash
# Set production database URL
export DATABASE_URL="mysql://user:pass@host:3306/fluxo_production"

# Generate and run migrations
pnpm db:push

# Seed initial data (optional)
node server/seed-leads.mjs
```

---

## Docker Deployment

### Dockerfile

See `Dockerfile` in the repository root.

### Docker Compose

See `docker-compose.yml` for full stack deployment.

### Build and Deploy

```bash
# Build production image
docker build -t fluxo:latest .

# Run with docker-compose
docker-compose up -d

# Check logs
docker-compose logs -f app

# Scale application
docker-compose up -d --scale app=3
```

---

## Manual Deployment

### 1. Server Setup (Ubuntu 22.04)

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Clone and Build

```bash
# Clone repository
git clone https://github.com/Backerjr/Fluxo.git
cd Fluxo

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.production
nano .env.production  # Edit with your values

# Build application
pnpm build
```

### 3. Start with PM2

```bash
# Start application
pm2 start dist/index.js --name fluxo -i max

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 4. Configure Nginx

Create `/etc/nginx/sites-available/fluxo`:

```nginx
upstream fluxo_backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Root directory
    root /home/ubuntu/Fluxo/dist/public;
    index index.html;

    # API proxy
    location /api {
        proxy_pass http://fluxo_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/fluxo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. Setup SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## CI/CD Setup

### GitHub Actions Workflow

See `.github/workflows/deploy.yml` in the repository.

### Setup Secrets in GitHub

1. Go to repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `PRODUCTION_SERVER_HOST`
   - `PRODUCTION_SERVER_USER`
   - `PRODUCTION_SSH_KEY`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - All other environment variables from `.env.production`

---

## Monitoring & Maintenance

### Application Monitoring

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs fluxo

# Monitor resources
pm2 monit

# Restart application
pm2 restart fluxo

# Reload without downtime
pm2 reload fluxo
```

### Database Backup

```bash
# Create backup script
cat > /home/ubuntu/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

mysqldump -h your-db-host -u your-db-user -p'your-db-password' fluxo_production | gzip > $BACKUP_DIR/fluxo_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "fluxo_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /home/ubuntu/backup-db.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup-db.sh
```

### Log Rotation

Create `/etc/logrotate.d/fluxo`:

```
/var/log/fluxo/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Health Check Endpoint

The application includes a health check at `/api/health`:

```bash
# Check application health
curl https://yourdomain.com/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### Monitoring Tools (Optional)

- **Application Performance**: New Relic, Datadog, or Sentry
- **Server Monitoring**: Prometheus + Grafana
- **Uptime Monitoring**: UptimeRobot, Pingdom
- **Log Aggregation**: ELK Stack or Papertrail

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs fluxo --lines 100

# Check environment variables
pm2 env 0

# Restart application
pm2 restart fluxo
```

### Database Connection Issues

```bash
# Test database connection
mysql -h your-db-host -u your-db-user -p

# Check DATABASE_URL format
echo $DATABASE_URL
```

### High Memory Usage

```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart fluxo

# Adjust PM2 max memory restart
pm2 start dist/index.js --name fluxo --max-memory-restart 500M
```

---

## Security Checklist

- [ ] All environment variables are set correctly
- [ ] JWT secret is strong and unique
- [ ] Database uses strong password
- [ ] SSL certificate is installed and auto-renewing
- [ ] Firewall is configured (only ports 80, 443, 22 open)
- [ ] Database access is restricted to application servers
- [ ] Regular backups are scheduled
- [ ] Security headers are configured in Nginx
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured
- [ ] Dependencies are up to date (`pnpm audit`)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/Backerjr/Fluxo/issues
- Documentation: https://github.com/Backerjr/Fluxo

---

**Last Updated**: December 2024
