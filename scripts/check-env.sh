#!/bin/bash

# ClockPilot Environment Validator
# Checks all required environment variables

set -e

ENV_FILE=".env"
EXIT_CODE=0

echo "🔍 Validating ClockPilot environment configuration..."

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found!"
    echo "💡 Run './scripts/generate-env.sh' to create it"
    exit 1
fi

# Load environment variables
source "$ENV_FILE"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validation functions
check_required() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name${NC} - Required but not set"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✅ $var_name${NC} - Set"
    fi
}

check_optional() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}⚠️  $var_name${NC} - Optional, not set"
    else
        echo -e "${GREEN}✅ $var_name${NC} - Set"
    fi
}

check_url() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name${NC} - Required but not set"
        EXIT_CODE=1
    elif [[ "$var_value" =~ ^https?:// ]]; then
        echo -e "${GREEN}✅ $var_name${NC} - Valid URL"
    else
        echo -e "${RED}❌ $var_name${NC} - Invalid URL format"
        EXIT_CODE=1
    fi
}

check_database_url() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name${NC} - Required but not set"
        EXIT_CODE=1
    elif [[ "$var_value" =~ ^postgresql:// ]]; then
        echo -e "${GREEN}✅ $var_name${NC} - Valid PostgreSQL URL"
    else
        echo -e "${RED}❌ $var_name${NC} - Invalid PostgreSQL URL format"
        EXIT_CODE=1
    fi
}

check_numeric() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name${NC} - Required but not set"
        EXIT_CODE=1
    elif [[ "$var_value" =~ ^[0-9]+$ ]]; then
        echo -e "${GREEN}✅ $var_name${NC} - Valid number ($var_value)"
    else
        echo -e "${RED}❌ $var_name${NC} - Must be a number"
        EXIT_CODE=1
    fi
}

check_boolean() {
    local var_name=$1
    local var_value="${!var_name}"
    
    if [ -z "$var_value" ]; then
        echo -e "${YELLOW}⚠️  $var_name${NC} - Not set, defaults to false"
    elif [[ "$var_value" =~ ^(true|false)$ ]]; then
        echo -e "${GREEN}✅ $var_name${NC} - Valid boolean ($var_value)"
    else
        echo -e "${RED}❌ $var_name${NC} - Must be 'true' or 'false'"
        EXIT_CODE=1
    fi
}

check_secret_strength() {
    local var_name=$1
    local var_value="${!var_name}"
    local min_length=$2
    
    if [ -z "$var_value" ]; then
        echo -e "${RED}❌ $var_name${NC} - Required but not set"
        EXIT_CODE=1
    elif [ ${#var_value} -lt $min_length ]; then
        echo -e "${RED}❌ $var_name${NC} - Too short (${#var_value} chars, minimum $min_length)"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✅ $var_name${NC} - Strong secret (${#var_value} chars)"
    fi
}

echo ""
echo -e "${BLUE}📊 Base Configuration${NC}"
check_required NODE_ENV
check_numeric PORT
check_url BASE_URL

echo ""
echo -e "${BLUE}🗄️ Database Configuration${NC}"
check_database_url DATABASE_URL
check_required PGHOST
check_numeric PGPORT
check_required PGUSER
check_required PGPASSWORD
check_required PGDATABASE
check_numeric DATABASE_POOL_SIZE

echo ""
echo -e "${BLUE}🔐 Security Configuration${NC}"
check_secret_strength JWT_SECRET 32
check_secret_strength JWT_REFRESH_SECRET 32
check_secret_strength SESSION_SECRET 16

echo ""
echo -e "${BLUE}📧 Email Configuration${NC}"
check_required SMTP_HOST
check_numeric SMTP_PORT
check_required SMTP_USER
check_required SMTP_PASS
check_required EMAIL_FROM

echo ""
echo -e "${BLUE}☁️ Storage Configuration${NC}"
check_required S3_BUCKET
check_required S3_REGION
check_required S3_ACCESS_KEY
check_required S3_SECRET_KEY

echo ""
echo -e "${BLUE}📊 Monitoring Configuration${NC}"
check_optional SENTRY_DSN
check_optional GOOGLE_ANALYTICS_ID
check_optional MIXPANEL_TOKEN

echo ""
echo -e "${BLUE}🎚️ Feature Flags${NC}"
check_boolean ENABLE_GEOLOCATION
check_boolean ENABLE_OFFLINE_MODE
check_boolean ENABLE_PUSH_NOTIFICATIONS

echo ""
echo -e "${BLUE}🔑 External APIs${NC}"
check_optional GOOGLE_MAPS_API_KEY
check_optional CALENDLY_URL

echo ""
echo -e "${BLUE}📡 Redis Configuration${NC}"
check_optional REDIS_URL
check_optional REDIS_PASSWORD

echo ""
echo -e "${BLUE}🔔 Notification Settings${NC}"
check_boolean NOTIFICATION_EMAIL_ENABLED
check_boolean NOTIFICATION_PUSH_ENABLED
check_optional WEBHOOK_SECRET

echo ""
echo -e "${BLUE}📁 File Upload Settings${NC}"
check_numeric MAX_FILE_SIZE
check_required ALLOWED_FILE_TYPES

echo ""
echo -e "${BLUE}🚦 Rate Limiting${NC}"
check_numeric RATE_LIMIT_WINDOW_MS
check_numeric RATE_LIMIT_MAX_REQUESTS

echo ""
echo -e "${BLUE}🔒 SSL Configuration${NC}"
check_optional SSL_CERT_PATH
check_optional SSL_KEY_PATH

echo ""
echo -e "${BLUE}💾 Backup Configuration${NC}"
check_optional BACKUP_SCHEDULE
check_numeric BACKUP_RETENTION_DAYS
check_optional BACKUP_S3_BUCKET

echo ""
echo -e "${BLUE}⚡ Performance${NC}"
check_numeric CACHE_TTL
check_numeric MAX_CONNECTIONS
check_optional CLUSTER_WORKERS

echo ""

# Final status
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All environment variables are properly configured!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Next steps:${NC}"
    echo "   1. Test database connection: npm run db:test"
    echo "   2. Run migrations: npm run db:push"
    echo "   3. Start the application: npm run dev"
else
    echo -e "${RED}💥 Environment validation failed!${NC}"
    echo ""
    echo -e "${BLUE}🔧 To fix issues:${NC}"
    echo "   1. Update missing variables in .env"
    echo "   2. Run './scripts/generate-env.sh' to regenerate"
    echo "   3. Check the deployment documentation"
fi

echo ""
echo -e "${BLUE}📚 For more help:${NC}"
echo "   - Deployment guide: docs/DEPLOYMENT.md"
echo "   - Environment setup: scripts/generate-env.sh"
echo "   - Production checklist: docs/PRODUCTION.md"

exit $EXIT_CODE