#!/bin/bash

# ========================
# Script de déploiement ClockPilot
# ========================

set -e  # Exit on any error

# Configuration
PROJECT_NAME="clockpilot"
DOCKER_REGISTRY="${DOCKER_REGISTRY:-}"
VERSION="${VERSION:-latest}"
ENVIRONMENT="${ENVIRONMENT:-production}"
BACKUP_ENABLED="${BACKUP_ENABLED:-true}"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérification des prérequis
check_prerequisites() {
    log "Vérification des prérequis..."
    
    command -v docker >/dev/null 2>&1 || { error "Docker est requis mais non installé."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { error "Docker Compose est requis mais non installé."; exit 1; }
    
    # Vérifier la version de Docker Compose
    docker-compose version | grep -q "v2\." || warning "Docker Compose v2 recommandé"
    
    success "Prérequis validés"
}

# Sauvegarde de la base de données
backup_database() {
    if [ "$BACKUP_ENABLED" = "true" ]; then
        log "Création d'une sauvegarde de la base de données..."
        
        # Créer le dossier de sauvegarde
        mkdir -p ./backups
        
        # Nom du fichier de sauvegarde
        BACKUP_FILE="./backups/${PROJECT_NAME}_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        # Créer la sauvegarde
        if docker-compose exec -T postgres pg_dump -U clockpilot_user -d clockpilot > "$BACKUP_FILE" 2>/dev/null; then
            success "Sauvegarde créée: $BACKUP_FILE"
        else
            warning "Impossible de créer la sauvegarde (base peut-être non initialisée)"
        fi
    else
        log "Sauvegarde désactivée"
    fi
}

# Build des images Docker
build_images() {
    log "Construction des images Docker..."
    
    if [ -n "$DOCKER_REGISTRY" ]; then
        # Build avec registry
        docker build -t "${DOCKER_REGISTRY}/${PROJECT_NAME}:${VERSION}" .
        docker build -t "${DOCKER_REGISTRY}/${PROJECT_NAME}:latest" .
    else
        # Build local
        docker build -t "${PROJECT_NAME}:${VERSION}" .
        docker build -t "${PROJECT_NAME}:latest" .
    fi
    
    success "Images construites avec succès"
}

# Push vers le registry (si configuré)
push_images() {
    if [ -n "$DOCKER_REGISTRY" ]; then
        log "Push des images vers le registry..."
        
        docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}:${VERSION}"
        docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}:latest"
        
        success "Images poussées vers le registry"
    else
        log "Pas de registry configuré, skip du push"
    fi
}

# Mise à jour des services
deploy_services() {
    log "Déploiement des services..."
    
    # Arrêt gracieux des anciens services
    docker-compose down --timeout 30
    
    # Nettoyage des images inutilisées
    docker image prune -f
    
    # Variables d'environnement pour le déploiement
    export NODE_ENV="$ENVIRONMENT"
    export VERSION="$VERSION"
    
    # Démarrage des nouveaux services
    docker-compose up -d --remove-orphans
    
    success "Services déployés"
}

# Vérification de santé
health_check() {
    log "Vérification de santé des services..."
    
    # Attendre que les services démarrent
    sleep 30
    
    # Vérifier le statut des conteneurs
    if ! docker-compose ps | grep -q "Up"; then
        error "Certains services ne sont pas démarrés"
        docker-compose logs --tail=50
        exit 1
    fi
    
    # Test de l'API
    MAX_RETRIES=30
    RETRY_COUNT=0
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        if curl -f -s http://localhost/api/health > /dev/null 2>&1; then
            success "API opérationnelle"
            break
        fi
        
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "Tentative $RETRY_COUNT/$MAX_RETRIES - En attente de l'API..."
        sleep 10
    done
    
    if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
        error "L'API n'est pas accessible après $MAX_RETRIES tentatives"
        docker-compose logs app
        exit 1
    fi
}

# Migration de la base de données
run_migrations() {
    log "Exécution des migrations de base de données..."
    
    # Attendre que la base soit disponible
    docker-compose exec app npx drizzle-kit push || {
        warning "Migrations échouées, tentative de récupération..."
        docker-compose restart app
        sleep 10
        docker-compose exec app npx drizzle-kit push
    }
    
    success "Migrations terminées"
}

# Nettoyage post-déploiement
cleanup() {
    log "Nettoyage post-déploiement..."
    
    # Supprimer les images dangereuses
    docker image prune -f
    
    # Supprimer les volumes inutilisés (seulement si explicitement demandé)
    if [ "$CLEANUP_VOLUMES" = "true" ]; then
        warning "Suppression des volumes inutilisés..."
        docker volume prune -f
    fi
    
    # Garder seulement les 5 dernières sauvegardes
    if [ "$BACKUP_ENABLED" = "true" ]; then
        find ./backups -name "${PROJECT_NAME}_backup_*.sql" -type f -mtime +7 -delete 2>/dev/null || true
    fi
    
    success "Nettoyage terminé"
}

# Rollback en cas d'échec
rollback() {
    error "Déploiement échoué, tentative de rollback..."
    
    # Arrêter les nouveaux services
    docker-compose down
    
    # Restaurer la dernière sauvegarde si disponible
    if [ "$BACKUP_ENABLED" = "true" ]; then
        LATEST_BACKUP=$(ls -t ./backups/${PROJECT_NAME}_backup_*.sql 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            log "Restauration de la sauvegarde: $LATEST_BACKUP"
            docker-compose up -d postgres
            sleep 10
            docker-compose exec -T postgres psql -U clockpilot_user -d clockpilot < "$LATEST_BACKUP"
        fi
    fi
    
    # Redémarrer avec l'ancienne version
    VERSION="previous" docker-compose up -d
    
    error "Rollback terminé - Vérifiez les logs pour diagnostiquer le problème"
    exit 1
}

# Fonction principale
main() {
    log "Début du déploiement ClockPilot v$VERSION en mode $ENVIRONMENT"
    
    # Trap pour gérer les erreurs
    trap rollback ERR
    
    check_prerequisites
    backup_database
    build_images
    push_images
    deploy_services
    run_migrations
    health_check
    cleanup
    
    success "🚀 Déploiement terminé avec succès!"
    log "L'application est accessible sur http://localhost"
    log "Documentation API: http://localhost/api/docs"
}

# Affichage de l'aide
show_help() {
    cat << EOF
Script de déploiement ClockPilot

Usage: $0 [OPTIONS]

Options:
    -e, --environment ENV     Environnement de déploiement (production, staging) [défaut: production]
    -v, --version VERSION     Version à déployer [défaut: latest]
    -r, --registry REGISTRY   Registry Docker pour les images
    -b, --no-backup          Désactiver la sauvegarde automatique
    -c, --cleanup-volumes    Nettoyer les volumes Docker inutilisés
    -h, --help               Afficher cette aide

Variables d'environnement:
    ENVIRONMENT              Environnement de déploiement
    VERSION                  Version à déployer
    DOCKER_REGISTRY          Registry Docker
    BACKUP_ENABLED           Activer les sauvegardes (true/false)
    CLEANUP_VOLUMES          Nettoyer les volumes (true/false)

Exemples:
    # Déploiement simple
    $0

    # Déploiement avec version spécifique
    $0 -v 1.2.3

    # Déploiement en staging sans sauvegarde
    $0 -e staging -b

    # Déploiement avec registry personnalisé
    $0 -r my-registry.com/clockpilot -v 1.0.0
EOF
}

# Gestion des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -r|--registry)
            DOCKER_REGISTRY="$2"
            shift 2
            ;;
        -b|--no-backup)
            BACKUP_ENABLED="false"
            shift
            ;;
        -c|--cleanup-volumes)
            CLEANUP_VOLUMES="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Exécution du script principal
main "$@"