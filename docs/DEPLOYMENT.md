# ClockPilot Deployment Guide

Complete guide for deploying ClockPilot to production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [SSL Configuration](#ssl-configuration)
5. [Deployment Methods](#deployment-methods)
6. [Monitoring Setup](#monitoring-setup)
7. [Backup & Recovery](#backup--recovery)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum:**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

**Recommended:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- Load balancer for high availability

### Required Software

```bash
# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Node.js (for local development)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install additional tools
sudo apt-get update
sudo apt-get install -y git nginx certbot python3-certbot-nginx htop curl wget
```

## Environment Setup

### 1. Generate Environment Configuration

```bash
# Clone the repository
git clone https://github.com/your-org/clockpilot.git
cd clockpilot

# Make scripts executable
chmod +x scripts/*.sh

# Generate environment configuration
./scripts/generate-env.sh

# Validate configuration
./scripts/check-env.sh
```

### 2. Configure Environment Variables

Update `.env` with production values:

```bash
# Essential production settings
NODE_ENV=production
BASE_URL=https://your-domain.com
PORT=5000

# Database (use managed PostgreSQL service)
DATABASE_URL=postgresql://user:pass@your-db-host:5432/clockpilot

# Email (configure SMTP provider)
SMTP_HOST=smtp.your-provider.com
SMTP_USER=your-email@domain.com
SMTP_PASS=your-app-password

# Storage (use S3 or compatible service)
S3_BUCKET=your-production-bucket
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key

# Monitoring (optional but recommended)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Security Configuration

```bash
# Generate strong secrets (done automatically by generate-env.sh)
# Ensure firewall is properly configured
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# Configure fail2ban for SSH protection
sudo apt-get install fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Database Setup

### Option 1: Managed Database (Recommended)

Use a managed PostgreSQL service:
- **AWS RDS PostgreSQL**
- **Google Cloud SQL**
- **DigitalOcean Managed Databases**
- **Azure Database for PostgreSQL**

Benefits:
- Automated backups
- High availability
- Monitoring and alerting
- Automated maintenance

### Option 2: Self-Hosted Database

```bash
# Create database and user
sudo -u postgres psql -c "CREATE DATABASE clockpilot;"
sudo -u postgres psql -c "CREATE USER clockpilot WITH PASSWORD 'your-secure-password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE clockpilot TO clockpilot;"

# Run migrations
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

### Database Optimization

```sql
-- Performance tuning for PostgreSQL
-- Add to postgresql.conf

shared_preload_libraries = 'pg_stat_statements'
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

## SSL Configuration

### Option 1: Let's Encrypt (Free)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### Option 2: Custom SSL Certificate

```bash
# Place your certificates
sudo mkdir -p /etc/ssl/clockpilot
sudo cp your-cert.crt /etc/ssl/clockpilot/
sudo cp your-private-key.key /etc/ssl/clockpilot/
sudo chmod 600 /etc/ssl/clockpilot/*

# Update .env
SSL_CERT_PATH=/etc/ssl/clockpilot/your-cert.crt
SSL_KEY_PATH=/etc/ssl/clockpilot/your-private-key.key
```

### Nginx Configuration

```nginx
# /etc/nginx/sites-available/clockpilot
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static file caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/clockpilot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Deployment Methods

### Method 1: Docker Compose (Recommended)

```bash
# Production deployment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Monitor logs
docker-compose logs -f app

# Update deployment
git pull
docker-compose build
docker-compose up -d
```

### Method 2: PM2 (Node.js Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'clockpilot',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Method 3: Systemd Service

```bash
# Create service file
sudo tee /etc/systemd/system/clockpilot.service > /dev/null << EOF
[Unit]
Description=ClockPilot Application
After=network.target

[Service]
Type=simple
User=clockpilot
WorkingDirectory=/opt/clockpilot
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=clockpilot

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable clockpilot
sudo systemctl start clockpilot
sudo systemctl status clockpilot
```

## Monitoring Setup

### Application Monitoring

```bash
# Install monitoring tools
npm install -g clinic

# Performance monitoring
clinic doctor -- node server/index.js
clinic bubbleprof -- node server/index.js
clinic flame -- node server/index.js
```

### System Monitoring

```bash
# Install Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/latest/download/node_exporter-*linux-amd64.tar.gz
tar xvfz node_exporter-*linux-amd64.tar.gz
sudo mv node_exporter-*linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service > /dev/null << EOF
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter
```

### Log Management

```bash
# Configure log rotation
sudo tee /etc/logrotate.d/clockpilot > /dev/null << EOF
/opt/clockpilot/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 clockpilot clockpilot
    postrotate
        systemctl reload clockpilot
    endscript
}
EOF
```

## Backup & Recovery

### Database Backups

```bash
# Create backup script
cat > scripts/backup-db.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/opt/backups/clockpilot"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="clockpilot_backup_${DATE}.sql"

mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_DIR/$BACKUP_FILE"

# Upload to S3 (optional)
if [ -n "$BACKUP_S3_BUCKET" ]; then
    aws s3 cp "$BACKUP_DIR/${BACKUP_FILE}.gz" "s3://$BACKUP_S3_BUCKET/database/"
fi

# Clean old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
EOF

chmod +x scripts/backup-db.sh

# Schedule backups
echo "0 2 * * * /opt/clockpilot/scripts/backup-db.sh" | crontab -
```

### Application Backups

```bash
# Create application backup script
cat > scripts/backup-app.sh << 'EOF'
#!/bin/bash
set -e

BACKUP_DIR="/opt/backups/clockpilot"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/opt/clockpilot"

mkdir -p "$BACKUP_DIR"

# Backup application files
tar -czf "$BACKUP_DIR/app_backup_${DATE}.tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=logs \
    --exclude=uploads \
    "$APP_DIR"

echo "Application backup completed: app_backup_${DATE}.tar.gz"
EOF

chmod +x scripts/backup-app.sh
```

### Recovery Procedures

```bash
# Database recovery
gunzip clockpilot_backup_YYYYMMDD_HHMMSS.sql.gz
psql "$DATABASE_URL" < clockpilot_backup_YYYYMMDD_HHMMSS.sql

# Application recovery
tar -xzf app_backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/
cd /opt/clockpilot
npm install --production
npm run build
systemctl restart clockpilot
```

## Health Checks

### Application Health

```bash
# Health check script
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

HEALTH_URL="https://your-domain.com/api/health"
SLACK_WEBHOOK="your-slack-webhook-url"

response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$response" != "200" ]; then
    # Send alert to Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 ClockPilot health check failed! Status: $response\"}" \
        "$SLACK_WEBHOOK"
fi
EOF

chmod +x scripts/health-check.sh

# Run every 5 minutes
echo "*/5 * * * * /opt/clockpilot/scripts/health-check.sh" | crontab -
```

## Troubleshooting

### Common Issues

**1. Application won't start**
```bash
# Check logs
docker-compose logs app
# or
journalctl -u clockpilot -f

# Check environment
./scripts/check-env.sh

# Verify database connection
psql "$DATABASE_URL" -c "SELECT 1;"
```

**2. High memory usage**
```bash
# Check memory usage
free -h
docker stats

# Optimize Node.js
export NODE_OPTIONS="--max-old-space-size=1024"
```

**3. Database connection issues**
```bash
# Test connection
pg_isready -h your-db-host -p 5432

# Check connection pool
psql "$DATABASE_URL" -c "SELECT count(*) FROM pg_stat_activity;"
```

**4. SSL certificate issues**
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/your-domain.com/fullchain.pem -text -noout

# Renew certificate
certbot renew --dry-run
```

### Performance Optimization

```bash
# Enable Node.js production optimizations
export NODE_ENV=production
export NODE_OPTIONS="--optimize-for-size --max-old-space-size=460"

# Configure nginx caching
# Add to nginx config
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m use_temp_path=off;

location /api/ {
    proxy_cache app_cache;
    proxy_cache_valid 200 302 10m;
    proxy_cache_valid 404 1m;
}
```

### Security Hardening

```bash
# Regular security updates
sudo apt-get update && sudo apt-get upgrade

# Monitor security vulnerabilities
npm audit
npm audit fix

# Configure log monitoring
fail2ban-client status
tail -f /var/log/auth.log
```

## Production Checklist

- [ ] Environment variables configured and validated
- [ ] Database migrations applied
- [ ] SSL certificates installed and configured
- [ ] Nginx reverse proxy configured
- [ ] Monitoring and alerting setup
- [ ] Backup procedures implemented
- [ ] Health checks configured
- [ ] Security hardening applied
- [ ] Performance optimization completed
- [ ] Documentation updated

For additional support, refer to:
- [Production Setup Guide](PRODUCTION.md)
- [Security Guidelines](SECURITY.md)
- [Performance Tuning](PERFORMANCE.md)