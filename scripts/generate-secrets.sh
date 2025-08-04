#!/bin/bash

# ========================
# ClockPilot Production Secrets Generator
# ========================

set -e

echo "==== ClockPilot Production Secrets Generator ===="
echo ""
echo "This script will generate secure secrets for production deployment."
echo "Store these secrets securely and never commit them to version control."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if openssl is available
if ! command -v openssl &> /dev/null; then
    echo -e "${RED}Error: openssl is required but not installed.${NC}"
    echo "Please install openssl and try again."
    exit 1
fi

echo -e "${YELLOW}Generating secrets...${NC}"
echo ""

# Generate JWT Secret (64 characters)
JWT_SECRET=$(openssl rand -base64 48)
echo -e "${GREEN}JWT_SECRET:${NC}"
echo "$JWT_SECRET"
echo ""

# Generate Session Secret (64 characters)
SESSION_SECRET=$(openssl rand -base64 48)
echo -e "${GREEN}SESSION_SECRET:${NC}"
echo "$SESSION_SECRET"
echo ""

# Generate Redis Password (32 characters)
REDIS_PASSWORD=$(openssl rand -base64 24)
echo -e "${GREEN}REDIS_PASSWORD:${NC}"
echo "$REDIS_PASSWORD"
echo ""

# Generate Database Password (32 characters)
DB_PASSWORD=$(openssl rand -base64 24)
echo -e "${GREEN}DATABASE_PASSWORD:${NC}"
echo "$DB_PASSWORD"
echo ""

# Generate Admin Password (16 characters, user-friendly)
ADMIN_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)
echo -e "${GREEN}ADMIN_PASSWORD (for initial admin user):${NC}"
echo "$ADMIN_PASSWORD"
echo ""

# Optional: Generate additional secrets
echo -e "${YELLOW}Additional secrets (optional):${NC}"
echo ""

# VAPID Keys for push notifications (if needed)
VAPID_PRIVATE_KEY=$(openssl rand -base64 32)
VAPID_PUBLIC_KEY=$(openssl rand -base64 32)
echo -e "${GREEN}VAPID_PRIVATE_KEY:${NC}"
echo "$VAPID_PRIVATE_KEY"
echo ""
echo -e "${GREEN}VAPID_PUBLIC_KEY:${NC}"
echo "$VAPID_PUBLIC_KEY"
echo ""

# API Key for external integrations
API_KEY=$(openssl rand -hex 32)
echo -e "${GREEN}API_KEY (for external integrations):${NC}"
echo "$API_KEY"
echo ""

# Generate .env.production file
if [ "$1" = "--write-env" ]; then
    if [ -f ".env.production" ]; then
        echo -e "${YELLOW}Warning: .env.production already exists. Creating backup...${NC}"
        cp .env.production .env.production.backup.$(date +%Y%m%d_%H%M%S)
    fi
    
    echo -e "${YELLOW}Writing secrets to .env.production...${NC}"
    
    # Copy template if it exists
    if [ -f ".env.production.template" ]; then
        cp .env.production.template .env.production
        
        # Replace placeholders with generated secrets
        sed -i "s/REPLACE_WITH_64_CHAR_RANDOM_STRING.*/$JWT_SECRET/g" .env.production
        sed -i "s/REPLACE_WITH_REDIS_PASSWORD/$REDIS_PASSWORD/g" .env.production
        sed -i "s/REPLACE_WITH_SECURE_PASSWORD/$DB_PASSWORD/g" .env.production
        
        echo -e "${GREEN}✓ Secrets written to .env.production${NC}"
        echo -e "${YELLOW}Warning: Please review and update remaining placeholders in .env.production${NC}"
    else
        echo -e "${RED}Error: .env.production.template not found${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}Security Recommendations:${NC}"
echo "1. Store these secrets in a secure password manager"
echo "2. Never commit .env.production to version control"
echo "3. Set appropriate file permissions: chmod 600 .env.production"
echo "4. Use different secrets for different environments"
echo "5. Rotate secrets regularly (recommended: every 90 days)"
echo ""

echo -e "${GREEN}Secrets generation completed!${NC}"

# Optional: Set file permissions if .env.production was created
if [ -f ".env.production" ]; then
    chmod 600 .env.production
    echo -e "${GREEN}✓ Set secure permissions on .env.production${NC}"
fi