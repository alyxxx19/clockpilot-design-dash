#!/bin/bash

# ClockPilot Environment Generator
# Generates secure .env file with random secrets

set -e

ENV_FILE=".env"
BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"

echo "🔐 Generating ClockPilot production environment..."

# Backup existing .env if it exists
if [ -f "$ENV_FILE" ]; then
    echo "📁 Backing up existing .env to $BACKUP_FILE"
    cp "$ENV_FILE" "$BACKUP_FILE"
fi

# Generate secure random secrets
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

generate_jwt_secret() {
    openssl rand -base64 64 | tr -d "=+/" | cut -c1-64
}

# Read existing values or prompt for input
read_or_default() {
    local var_name=$1
    local default_value=$2
    local prompt_message=$3
    
    if [ -f "$BACKUP_FILE" ]; then
        existing_value=$(grep "^${var_name}=" "$BACKUP_FILE" 2>/dev/null | cut -d'=' -f2- || echo "")
        if [ -n "$existing_value" ]; then
            echo "$existing_value"
            return
        fi
    fi
    
    if [ -n "$prompt_message" ]; then
        read -p "$prompt_message [$default_value]: " input_value
        echo "${input_value:-$default_value}"
    else
        echo "$default_value"
    fi
}

# Generate secrets
JWT_SECRET=$(generate_jwt_secret)
JWT_REFRESH_SECRET=$(generate_jwt_secret)
SESSION_SECRET=$(generate_secret)
WEBHOOK_SECRET=$(generate_secret)

# Prompt for configuration
echo ""
echo "📋 Configuration Setup:"

NODE_ENV=$(read_or_default "NODE_ENV" "production" "Environment")
BASE_URL=$(read_or_default "BASE_URL" "https://clockpilot.com" "Base URL")
PORT=$(read_or_default "PORT" "5000" "Port")

echo ""
echo "🗄️ Database Configuration:"
DATABASE_URL=$(read_or_default "DATABASE_URL" "" "Database URL (postgresql://user:pass@host:5432/db)")
PGHOST=$(read_or_default "PGHOST" "localhost" "PostgreSQL Host")
PGPORT=$(read_or_default "PGPORT" "5432" "PostgreSQL Port")
PGUSER=$(read_or_default "PGUSER" "clockpilot" "PostgreSQL User")
PGPASSWORD=$(read_or_default "PGPASSWORD" "" "PostgreSQL Password")
PGDATABASE=$(read_or_default "PGDATABASE" "clockpilot" "PostgreSQL Database")

echo ""
echo "📧 Email Configuration:"
SMTP_HOST=$(read_or_default "SMTP_HOST" "smtp.gmail.com" "SMTP Host")
SMTP_PORT=$(read_or_default "SMTP_PORT" "587" "SMTP Port")
SMTP_USER=$(read_or_default "SMTP_USER" "" "SMTP Username")
SMTP_PASS=$(read_or_default "SMTP_PASS" "" "SMTP Password")
EMAIL_FROM=$(read_or_default "EMAIL_FROM" "noreply@clockpilot.com" "From Email")

echo ""
echo "☁️ Storage Configuration:"
S3_BUCKET=$(read_or_default "S3_BUCKET" "clockpilot-uploads" "S3 Bucket")
S3_REGION=$(read_or_default "S3_REGION" "eu-west-1" "S3 Region")
S3_ACCESS_KEY=$(read_or_default "S3_ACCESS_KEY" "" "S3 Access Key")
S3_SECRET_KEY=$(read_or_default "S3_SECRET_KEY" "" "S3 Secret Key")

echo ""
echo "📊 Monitoring Configuration:"
SENTRY_DSN=$(read_or_default "SENTRY_DSN" "" "Sentry DSN (optional)")
GOOGLE_ANALYTICS_ID=$(read_or_default "GOOGLE_ANALYTICS_ID" "" "Google Analytics ID (optional)")

echo ""
echo "🔑 External APIs:"
GOOGLE_MAPS_API_KEY=$(read_or_default "GOOGLE_MAPS_API_KEY" "" "Google Maps API Key (optional)")

# Create .env file
cat > "$ENV_FILE" << EOF
# Base Configuration
NODE_ENV=${NODE_ENV}
PORT=${PORT}
BASE_URL=${BASE_URL}

# Database Configuration
DATABASE_URL=${DATABASE_URL}
DATABASE_POOL_SIZE=20
PGHOST=${PGHOST}
PGPORT=${PGPORT}
PGUSER=${PGUSER}
PGPASSWORD=${PGPASSWORD}
PGDATABASE=${PGDATABASE}

# Authentication & Security (Auto-generated)
JWT_SECRET=${JWT_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Email Configuration
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=${SMTP_PORT}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
EMAIL_FROM=${EMAIL_FROM}

# Object Storage (S3)
S3_BUCKET=${S3_BUCKET}
S3_REGION=${S3_REGION}
S3_ACCESS_KEY=${S3_ACCESS_KEY}
S3_SECRET_KEY=${S3_SECRET_KEY}
DEFAULT_OBJECT_STORAGE_BUCKET_ID=
PRIVATE_OBJECT_DIR=
PUBLIC_OBJECT_SEARCH_PATHS=

# Monitoring & Analytics
SENTRY_DSN=${SENTRY_DSN}
GOOGLE_ANALYTICS_ID=${GOOGLE_ANALYTICS_ID}
MIXPANEL_TOKEN=

# Feature Flags
ENABLE_GEOLOCATION=true
ENABLE_OFFLINE_MODE=true
ENABLE_PUSH_NOTIFICATIONS=true

# External APIs
GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}
CALENDLY_URL=https://calendly.com/clockpilot/demo

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Notification Settings
NOTIFICATION_EMAIL_ENABLED=true
NOTIFICATION_PUSH_ENABLED=true
WEBHOOK_SECRET=${WEBHOOK_SECRET}

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,xlsx,csv

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/clockpilot.crt
SSL_KEY_PATH=/etc/ssl/private/clockpilot.key

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_S3_BUCKET=clockpilot-backups

# Performance
CACHE_TTL=3600
MAX_CONNECTIONS=100
CLUSTER_WORKERS=auto

# Generated on $(date)
EOF

# Set secure permissions
chmod 600 "$ENV_FILE"

echo ""
echo "✅ Environment file generated successfully!"
echo "📍 Location: $ENV_FILE"
echo "🔒 Permissions: 600 (owner read/write only)"
echo ""
echo "🔐 Generated secure secrets:"
echo "   - JWT_SECRET (64 chars)"
echo "   - JWT_REFRESH_SECRET (64 chars)" 
echo "   - SESSION_SECRET (32 chars)"
echo "   - WEBHOOK_SECRET (32 chars)"
echo ""
echo "⚠️  Remember to:"
echo "   1. Review and update the configuration"
echo "   2. Never commit .env to version control"
echo "   3. Backup your secrets securely"
echo "   4. Run './scripts/check-env.sh' to validate"