#!/bin/bash

# ========================
# ClockPilot Production Deployment Script
# ========================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_FILE="$PROJECT_ROOT/deployment.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
ClockPilot Deployment Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    --help                  Show this help message
    --backup-only          Only create a backup, don't deploy
    --rollback             Rollback to previous version
    --check-only           Only run health checks
    --force                Force deployment without confirmations
    --staging              Deploy to staging environment
    --production          Deploy to production environment (default)

EXAMPLES:
    $0                     Deploy to production with confirmations
    $0 --force             Deploy to production without confirmations
    $0 --staging           Deploy to staging environment
    $0 --backup-only       Create backup only
    $0 --rollback          Rollback to previous version
    $0 --check-only        Run health checks only

PREREQUISITES:
    - Docker and docker-compose installed
    - .env.production file configured
    - Database connection available
    - Sufficient disk space for backups

EOF
}

# Parse command line arguments
BACKUP_ONLY=false
ROLLBACK=false
CHECK_ONLY=false
FORCE=false
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --backup-only)
            BACKUP_ONLY=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --staging)
            ENVIRONMENT="staging"
            shift
            ;;
        --production)
            ENVIRONMENT="production"
            shift
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Slack notification function
send_slack_notification() {
    local message="$1"
    local status="$2"  # success, warning, error
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color=""
        local emoji=""
        
        case $status in
            success)
                color="good"
                emoji="✅"
                ;;
            warning)
                color="warning"
                emoji="⚠️"
                ;;
            error)
                color="danger"
                emoji="🚨"
                ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"text\": \"$emoji ClockPilot Deployment - $message\",
                    \"fields\": [
                        {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                        {\"title\": \"Timestamp\", \"value\": \"$(date)\", \"short\": true},
                        {\"title\": \"Host\", \"value\": \"$(hostname)\", \"short\": true}
                    ]
                }]
            }" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || warn "Failed to send Slack notification"
    fi
}

# SSL certificate check
check_ssl_certificates() {
    info "Checking SSL certificates..."
    
    if [ -f "$SSL_CERT_PATH" ] && [ -f "$SSL_KEY_PATH" ]; then
        # Check certificate expiration
        cert_expiry=$(openssl x509 -in "$SSL_CERT_PATH" -noout -enddate | cut -d= -f2)
        expiry_timestamp=$(date -d "$cert_expiry" +%s)
        current_timestamp=$(date +%s)
        days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ $days_until_expiry -lt 30 ]; then
            warn "SSL certificate expires in $days_until_expiry days"
            send_slack_notification "SSL certificate expires in $days_until_expiry days" "warning"
        else
            log "SSL certificate valid for $days_until_expiry days"
        fi
        
        # Verify certificate and key match
        cert_hash=$(openssl x509 -noout -modulus -in "$SSL_CERT_PATH" | openssl md5)
        key_hash=$(openssl rsa -noout -modulus -in "$SSL_KEY_PATH" | openssl md5)
        
        if [ "$cert_hash" != "$key_hash" ]; then
            error "SSL certificate and key do not match!"
        fi
        
        log "SSL certificates validated successfully"
    else
        warn "SSL certificates not found, skipping SSL check"
    fi
}

# Database migration check and execution
run_migrations() {
    info "Running database migrations..."
    
    # Check if database is accessible
    if ! npm run db:test > /dev/null 2>&1; then
        error "Database connection failed"
    fi
    
    # Run migrations
    if npm run db:push; then
        log "Database migrations completed successfully"
    else
        error "Database migrations failed"
    fi
}

# Cache warming
warm_cache() {
    info "Warming application cache..."
    
    # Wait for application to be ready
    sleep 10
    
    # Warm critical endpoints
    cache_endpoints=(
        "/api/health"
        "/api/auth/status"
        "/api/employees"
        "/api/planning"
    )
    
    for endpoint in "${cache_endpoints[@]}"; do
        curl -s "$BASE_URL$endpoint" > /dev/null 2>&1 || warn "Failed to warm cache for $endpoint"
    done
    
    log "Cache warming completed"
}

# Health checks
run_health_checks() {
    info "Running comprehensive health checks..."
    
    # Check application health
    if ! curl -f -s "$BASE_URL/api/health" > /dev/null; then
        error "Application health check failed"
    fi
    
    # Check database health
    if ! curl -f -s "$BASE_URL/api/health/database" > /dev/null; then
        error "Database health check failed"
    fi
    
    # Check critical services
    services=("app" "postgres" "redis")
    
    for service in "${services[@]}"; do
        if docker-compose ps $service | grep -q "Up"; then
            log "Service $service is running"
        else
            error "Service $service is not running"
        fi
    done
    
    log "All health checks passed"
}

# Backup function
create_backup() {
    info "Creating backup before deployment..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    if ! ./scripts/backup-db.sh; then
        error "Database backup failed"
    fi
    
    # Application backup
    tar -czf "$BACKUP_DIR/app_backup_$TIMESTAMP.tar.gz" \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=logs \
        --exclude=uploads \
        --exclude=backups \
        "$PROJECT_ROOT"
    
    log "Backup created: app_backup_$TIMESTAMP.tar.gz"
}

# Rollback function
rollback_deployment() {
    info "Rolling back to previous version..."
    
    # Find latest backup
    latest_backup=$(ls -t "$BACKUP_DIR"/app_backup_*.tar.gz 2>/dev/null | head -n1)
    
    if [ -z "$latest_backup" ]; then
        error "No backup found for rollback"
    fi
    
    # Stop services
    docker-compose down
    
    # Restore from backup
    tar -xzf "$latest_backup" -C /tmp/
    rsync -av --exclude=node_modules /tmp/$(basename "$PROJECT_ROOT")/ "$PROJECT_ROOT/"
    
    # Restore dependencies
    npm install --production
    
    # Start services
    docker-compose up -d
    
    # Verify rollback
    sleep 30
    run_health_checks
    
    log "Rollback completed successfully"
    send_slack_notification "Rollback completed successfully" "success"
}

# Main deployment function
deploy() {
    info "Starting ClockPilot deployment to $ENVIRONMENT..."
    send_slack_notification "Deployment started" "warning"
    
    # Pre-deployment checks
    if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE" = false ]; then
        read -p "Are you sure you want to deploy to PRODUCTION? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Deployment cancelled by user"
            exit 0
        fi
    fi
    
    # Environment validation
    if [ ! -f ".env.$ENVIRONMENT" ]; then
        error "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Copy environment file
    cp ".env.$ENVIRONMENT" .env
    
    # Validate environment
    if ! ./scripts/check-env.sh; then
        error "Environment validation failed"
    fi
    
    # SSL certificate check
    check_ssl_certificates
    
    # Create backup
    create_backup
    
    # Pull latest code
    info "Pulling latest code..."
    git pull origin main
    
    # Install dependencies
    info "Installing dependencies..."
    npm ci --production
    
    # Build application
    info "Building application..."
    npm run build
    
    # Run migrations
    run_migrations
    
    # Stop old containers
    info "Stopping old containers..."
    docker-compose down
    
    # Build and start new containers
    info "Building and starting new containers..."
    docker-compose build --no-cache
    docker-compose up -d
    
    # Wait for services to be ready
    info "Waiting for services to start..."
    sleep 30
    
    # Run health checks
    run_health_checks
    
    # Warm cache
    warm_cache
    
    # Final verification
    info "Running final verification..."
    sleep 10
    run_health_checks
    
    log "Deployment completed successfully!"
    send_slack_notification "Deployment completed successfully" "success"
    
    # Cleanup old backups (keep last 10)
    ls -t "$BACKUP_DIR"/app_backup_*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true
}

# Main execution
main() {
    cd "$PROJECT_ROOT"
    
    # Load environment
    if [ -f ".env" ]; then
        source .env
    fi
    
    info "ClockPilot Deployment Script - Environment: $ENVIRONMENT"
    
    # Execute based on options
    if [ "$CHECK_ONLY" = true ]; then
        run_health_checks
        exit 0
    elif [ "$BACKUP_ONLY" = true ]; then
        create_backup
        exit 0
    elif [ "$ROLLBACK" = true ]; then
        rollback_deployment
        exit 0
    else
        deploy
    fi
}

# Error handling
trap 'error "Deployment failed with exit code $?"' ERR

# Run main function
main "$@"
FORCE=false
ENVIRONMENT="production"

while [[ $# -gt 0 ]]; do
    case $1 in
        --help)
            show_help
            exit 0
            ;;
        --backup-only)
            BACKUP_ONLY=true
            shift
            ;;
        --rollback)
            ROLLBACK=true
            shift
            ;;
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --staging)
            ENVIRONMENT="staging"
            shift
            ;;
        --production)
            ENVIRONMENT="production"
            shift
            ;;
        *)
            error "Unknown option: $1. Use --help for usage information."
            ;;
    esac
done

# Set compose file based on environment
if [ "$ENVIRONMENT" = "staging" ]; then
    COMPOSE_FILE="docker-compose.yml"
else
    COMPOSE_FILE="docker-compose.prod.yml"
fi

# Initial checks
initial_checks() {
    log "Starting initial checks..."
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        error "Not in ClockPilot project directory"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "docker-compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        error ".env.$ENVIRONMENT file not found. Please create it from .env.$ENVIRONMENT.template"
    fi
    
    # Check disk space (need at least 2GB)
    available_space=$(df -BG "$PROJECT_ROOT" | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 2 ]; then
        warn "Low disk space: ${available_space}GB available. Recommended: 2GB+"
        if [ "$FORCE" = false ]; then
            read -p "Continue anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    fi
    
    log "Initial checks completed successfully"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        source "$PROJECT_ROOT/.env.$ENVIRONMENT"
        
        if [ -n "$DATABASE_URL" ]; then
            log "Creating database backup..."
            backup_file="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"
            
            # Extract database connection details
            db_host=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\).*/\1/p')
            db_port=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
            db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
            db_user=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
            
            # Try docker-compose exec first, fallback to direct connection
            if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q Up; then
                docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$db_user" "$db_name" > "$backup_file"
            else
                warn "Database container not running, skipping database backup"
            fi
            
            if [ -f "$backup_file" ] && [ -s "$backup_file" ]; then
                log "Database backup created: $backup_file"
            else
                warn "Database backup failed or empty"
            fi
        fi
    fi
    
    # Application backup (current version)
    if [ -d "$PROJECT_ROOT/.git" ]; then
        log "Creating application version backup..."
        git rev-parse HEAD > "$BACKUP_DIR/app_version_$TIMESTAMP.txt"
        git diff --name-only > "$BACKUP_DIR/app_changes_$TIMESTAMP.txt"
    fi
    
    # Environment backup
    if [ -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
        cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$BACKUP_DIR/env_backup_$TIMESTAMP"
        log "Environment backup created"
    fi
    
    log "Backup completed successfully"
}

# Build application
build_application() {
    log "Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest changes if in git repository
    if [ -d ".git" ] && [ "$FORCE" = false ]; then
        read -p "Pull latest changes from git? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git pull
        fi
    fi
    
    # Build Docker images
    log "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Run security scan if available
    if command -v docker scan &> /dev/null; then
        log "Running security scan..."
        docker scan clockpilot-app || warn "Security scan failed, continuing anyway"
    fi
    
    log "Application build completed"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    cd "$PROJECT_ROOT"
    
    # Stop current containers
    log "Stopping current containers..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    log "Running database migrations..."
    docker-compose -f "$COMPOSE_FILE" exec -T app npm run db:push || warn "Database migration failed"
    
    log "Application deployment completed"
}

# Health checks
run_health_checks() {
    log "Running health checks..."
    
    cd "$PROJECT_ROOT"
    
    # Wait for application to be fully ready
    sleep 10
    
    # Check if containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q Up; then
        error "Some containers are not running"
    fi
    
    # Check health endpoints
    app_port=$(docker-compose -f "$COMPOSE_FILE" port app 5000 | cut -d: -f2)
    if [ -n "$app_port" ]; then
        # Liveness check
        if curl -f "http://localhost:$app_port/api/health/live" &> /dev/null; then
            log "✓ Liveness check passed"
        else
            error "✗ Liveness check failed"
        fi
        
        # Readiness check
        if curl -f "http://localhost:$app_port/api/health/ready" &> /dev/null; then
            log "✓ Readiness check passed"
        else
            error "✗ Readiness check failed"
        fi
        
        # Database check
        if curl -f "http://localhost:$app_port/api/health/ready" | grep -q "database.*pass"; then
            log "✓ Database check passed"
        else
            warn "⚠ Database check failed"
        fi
        
        # Redis check (optional)
        if curl -f "http://localhost:$app_port/api/health/ready" | grep -q "redis"; then
            log "✓ Redis check passed"
        else
            info "ℹ Redis check skipped (not configured)"
        fi
    else
        error "Cannot determine application port"
    fi
    
    log "Health checks completed"
}

# Rollback function
rollback_deployment() {
    log "Starting rollback..."
    
    cd "$PROJECT_ROOT"
    
    # Stop current containers
    docker-compose -f "$COMPOSE_FILE" down
    
    # Find latest backup
    latest_backup=$(ls -t "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -n1)
    latest_env_backup=$(ls -t "$BACKUP_DIR"/env_backup_* 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        log "Restoring database from: $latest_backup"
        # Restore database logic here
        warn "Database restore not implemented yet - please restore manually"
    fi
    
    if [ -n "$latest_env_backup" ]; then
        log "Restoring environment from: $latest_env_backup"
        cp "$latest_env_backup" "$PROJECT_ROOT/.env.$ENVIRONMENT"
    fi
    
    # Start with previous configuration
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log "Rollback completed"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep last 10 backups of each type
    find "$BACKUP_DIR" -name "db_backup_*.sql" -type f | sort -r | tail -n +11 | xargs rm -f
    find "$BACKUP_DIR" -name "app_version_*.txt" -type f | sort -r | tail -n +11 | xargs rm -f
    find "$BACKUP_DIR" -name "env_backup_*" -type f | sort -r | tail -n +11 | xargs rm -f
    
    log "Backup cleanup completed"
}

# Print deployment summary
deployment_summary() {
    log "=== DEPLOYMENT SUMMARY ==="
    log "Environment: $ENVIRONMENT"
    log "Timestamp: $TIMESTAMP"
    log "Compose file: $COMPOSE_FILE"
    log "Backup directory: $BACKUP_DIR"
    log "Log file: $LOG_FILE"
    
    # Show running containers
    echo ""
    info "Running containers:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Show application URLs
    echo ""
    app_port=$(docker-compose -f "$COMPOSE_FILE" port app 5000 2>/dev/null | cut -d: -f2)
    if [ -n "$app_port" ]; then
        info "Application URLs:"
        info "  Application: http://localhost:$app_port"
        info "  Health: http://localhost:$app_port/api/health/live"
        info "  Metrics: http://localhost:$app_port/metrics"
    fi
    
    grafana_port=$(docker-compose -f "$COMPOSE_FILE" port grafana 3000 2>/dev/null | cut -d: -f2)
    if [ -n "$grafana_port" ]; then
        info "  Grafana: http://localhost:$grafana_port"
    fi
    
    log "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
}

# Main execution
main() {
    log "Starting ClockPilot deployment to $ENVIRONMENT environment"
    
    # Create log file
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    
    # Handle different modes
    if [ "$CHECK_ONLY" = true ]; then
        initial_checks
        run_health_checks
        exit 0
    fi
    
    if [ "$ROLLBACK" = true ]; then
        if [ "$FORCE" = false ]; then
            read -p "Are you sure you want to rollback? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
        rollback_deployment
        run_health_checks
        deployment_summary
        exit 0
    fi
    
    # Regular deployment
    initial_checks
    create_backup
    
    if [ "$BACKUP_ONLY" = true ]; then
        log "Backup-only mode: completed"
        exit 0
    fi
    
    # Confirmation for production deployment
    if [ "$ENVIRONMENT" = "production" ] && [ "$FORCE" = false ]; then
        echo ""
        warn "This will deploy to PRODUCTION environment!"
        read -p "Are you sure you want to continue? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "Deployment cancelled by user"
            exit 1
        fi
    fi
    
    build_application
    deploy_application
    run_health_checks
    cleanup_backups
    deployment_summary
    
    log "Deployment completed successfully!"
}

# Run main function
main "$@"