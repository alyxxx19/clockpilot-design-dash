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