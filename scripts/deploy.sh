#!/bin/bash

# ========================
# ClockPilot Deployment Script
# ========================

set -e

# Configuration
PROJECT_NAME="clockpilot"
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking deployment requirements..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check if environment file exists
    if [ ! -f ".env.production" ] && [ ! -f ".env" ]; then
        log_error "Environment file not found. Please create .env.production or .env file."
        exit 1
    fi
    
    log_info "Requirements check passed."
}

create_backup() {
    log_info "Creating backup before deployment..."
    
    mkdir -p $BACKUP_DIR
    
    # Backup database if running
    if docker-compose -f $DOCKER_COMPOSE_FILE ps postgres | grep -q "Up"; then
        log_info "Creating database backup..."
        docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_dump -U ${PGUSER:-clockpilot_user} -d ${PGDATABASE:-clockpilot} > "$BACKUP_DIR/pre_deploy_backup_$TIMESTAMP.sql"
        
        if [ $? -eq 0 ]; then
            log_info "Database backup created: pre_deploy_backup_$TIMESTAMP.sql"
        else
            log_warn "Database backup failed, but continuing with deployment..."
        fi
    else
        log_warn "Database not running, skipping backup."
    fi
    
    # Backup application data
    if [ -d "./uploads" ]; then
        log_info "Backing up uploads directory..."
        tar -czf "$BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz" uploads/
    fi
}

pull_latest_images() {
    log_info "Pulling latest images..."
    docker-compose -f $DOCKER_COMPOSE_FILE pull
}

deploy() {
    log_info "Starting deployment..."
    
    # Start services
    docker-compose -f $DOCKER_COMPOSE_FILE up -d --build
    
    # Wait for services to be healthy
    log_info "Waiting for services to become healthy..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "unhealthy\|starting"; then
            log_info "Services still starting... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        else
            log_info "All services are healthy!"
            break
        fi
    done
    
    if [ $attempt -gt $max_attempts ]; then
        log_error "Services failed to become healthy within expected time."
        return 1
    fi
}

run_health_checks() {
    log_info "Running health checks..."
    
    # Wait a bit for services to fully start
    sleep 5
    
    # Check application health
    local app_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health/ready || echo "000")
    
    if [ "$app_health" = "200" ]; then
        log_info "Application health check: PASSED"
    else
        log_error "Application health check: FAILED (HTTP $app_health)"
        return 1
    fi
    
    # Check database connectivity
    if docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_isready -U ${PGUSER:-clockpilot_user} &> /dev/null; then
        log_info "Database health check: PASSED"
    else
        log_error "Database health check: FAILED"
        return 1
    fi
    
    # Check Redis if configured
    if docker-compose -f $DOCKER_COMPOSE_FILE ps redis | grep -q "Up"; then
        if docker-compose -f $DOCKER_COMPOSE_FILE exec -T redis redis-cli ping | grep -q "PONG"; then
            log_info "Redis health check: PASSED"
        else
            log_error "Redis health check: FAILED"
            return 1
        fi
    fi
    
    log_info "All health checks passed!"
}

rollback() {
    log_error "Deployment failed! Initiating rollback..."
    
    # Stop current deployment
    docker-compose -f $DOCKER_COMPOSE_FILE down
    
    # Restore from backup if available
    local latest_backup=$(ls -t $BACKUP_DIR/pre_deploy_backup_*.sql 2>/dev/null | head -n1)
    
    if [ -n "$latest_backup" ]; then
        log_info "Restoring database from backup: $latest_backup"
        # Start only database for restore
        docker-compose -f $DOCKER_COMPOSE_FILE up -d postgres
        sleep 10
        
        # Restore database
        docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres psql -U ${PGUSER:-clockpilot_user} -d ${PGDATABASE:-clockpilot} < "$latest_backup"
        
        log_info "Database restored from backup."
    fi
    
    # Try to start previous version
    log_info "Attempting to start previous version..."
    docker-compose -f docker-compose.yml up -d
    
    log_error "Rollback completed. Please check the application status."
}

cleanup() {
    log_info "Cleaning up old images..."
    docker image prune -f
    
    # Clean old backups (keep last 7 days)
    find $BACKUP_DIR -name "pre_deploy_backup_*.sql" -mtime +7 -delete
    find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete
}

show_status() {
    log_info "Deployment completed successfully!"
    echo ""
    echo "Services status:"
    docker-compose -f $DOCKER_COMPOSE_FILE ps
    echo ""
    echo "Application URL: https://your-domain.com"
    echo "Monitoring: https://your-domain.com:3001 (Grafana)"
    echo ""
    echo "Logs can be viewed with:"
    echo "  docker-compose -f $DOCKER_COMPOSE_FILE logs -f app"
}

# Main execution
main() {
    log_info "Starting ClockPilot deployment process..."
    
    check_requirements
    
    create_backup
    
    pull_latest_images
    
    if deploy; then
        if run_health_checks; then
            cleanup
            show_status
        else
            rollback
            exit 1
        fi
    else
        rollback
        exit 1
    fi
    
    log_info "Deployment process completed successfully!"
}

# Help function
show_help() {
    echo "ClockPilot Deployment Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help, -h        Show this help message"
    echo "  --backup-only     Create backup only, don't deploy"
    echo "  --no-backup       Skip backup creation"
    echo "  --rollback        Rollback to previous version"
    echo ""
    echo "Environment variables:"
    echo "  PGUSER           PostgreSQL username (default: clockpilot_user)"
    echo "  PGDATABASE       PostgreSQL database (default: clockpilot)"
    echo ""
}

# Parse command line arguments
case "$1" in
    --help|-h)
        show_help
        exit 0
        ;;
    --backup-only)
        check_requirements
        create_backup
        exit 0
        ;;
    --rollback)
        rollback
        exit 0
        ;;
    --no-backup)
        SKIP_BACKUP=1
        ;;
esac

# Run main function if no special flags
if [ -z "$1" ] || [ "$1" = "--no-backup" ]; then
    main
fi