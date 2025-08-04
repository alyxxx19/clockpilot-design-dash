#!/bin/bash

# ========================
# Script de sauvegarde de base de données ClockPilot
# ========================

set -e

# Configuration
PROJECT_NAME="clockpilot"
BACKUP_DIR="./backups"
DB_CONTAINER="clockpilot-postgres"
DB_NAME="clockpilot"
DB_USER="clockpilot_user"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_BUCKET="${S3_BUCKET:-}"
NOTIFICATION_WEBHOOK="${NOTIFICATION_WEBHOOK:-}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Créer le dossier de sauvegarde
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    log "Dossier de sauvegarde: $BACKUP_DIR"
}

# Vérifier que le conteneur PostgreSQL est en cours d'exécution
check_database() {
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        error "Le conteneur PostgreSQL '$DB_CONTAINER' n'est pas en cours d'exécution"
        exit 1
    fi
    
    # Test de connexion
    if ! docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        error "Impossible de se connecter à la base de données"
        exit 1
    fi
    
    success "Base de données accessible"
}

# Créer la sauvegarde
create_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${PROJECT_NAME}_backup_${timestamp}.sql"
    local backup_file_compressed="${backup_file}.gz"
    
    log "Création de la sauvegarde: $backup_file"
    
    # Sauvegarde complète avec schéma et données
    docker exec "$DB_CONTAINER" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --clean \
        --create \
        --if-exists \
        --format=plain > "$backup_file"
    
    if [ $? -eq 0 ]; then
        # Compression de la sauvegarde
        gzip "$backup_file"
        
        # Informations sur la sauvegarde
        local file_size=$(du -h "$backup_file_compressed" | cut -f1)
        success "Sauvegarde créée avec succès: $backup_file_compressed ($file_size)"
        
        echo "$backup_file_compressed"
    else
        error "Échec de la création de la sauvegarde"
        rm -f "$backup_file" "$backup_file_compressed"
        exit 1
    fi
}

# Créer une sauvegarde des données uniquement (pour les migrations)
create_data_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${PROJECT_NAME}_data_${timestamp}.sql"
    local backup_file_compressed="${backup_file}.gz"
    
    log "Création de la sauvegarde des données: $backup_file"
    
    # Sauvegarde des données uniquement
    docker exec "$DB_CONTAINER" pg_dump \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --data-only \
        --format=plain > "$backup_file"
    
    if [ $? -eq 0 ]; then
        gzip "$backup_file"
        
        local file_size=$(du -h "$backup_file_compressed" | cut -f1)
        success "Sauvegarde des données créée: $backup_file_compressed ($file_size)"
        
        echo "$backup_file_compressed"
    else
        error "Échec de la création de la sauvegarde des données"
        rm -f "$backup_file" "$backup_file_compressed"
        exit 1
    fi
}

# Upload vers S3 (si configuré)
upload_to_s3() {
    local backup_file="$1"
    
    if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
        log "Upload vers S3: s3://$S3_BUCKET/"
        
        local s3_key="clockpilot-backups/$(basename "$backup_file")"
        
        if aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key"; then
            success "Sauvegarde uploadée vers S3: s3://$S3_BUCKET/$s3_key"
        else
            warning "Échec de l'upload vers S3"
        fi
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log "Nettoyage des sauvegardes anciennes (> $RETENTION_DAYS jours)"
    
    # Sauvegardes locales
    find "$BACKUP_DIR" -name "${PROJECT_NAME}_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    find "$BACKUP_DIR" -name "${PROJECT_NAME}_data_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    
    # Nettoyage S3 (si configuré)
    if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
        local cutoff_date=$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3 ls "s3://$S3_BUCKET/clockpilot-backups/" | \
        awk '$1 < "'$cutoff_date'" {print $4}' | \
        while read -r file; do
            if [ -n "$file" ]; then
                aws s3 rm "s3://$S3_BUCKET/clockpilot-backups/$file"
                log "Suppression S3: $file"
            fi
        done
    fi
    
    success "Nettoyage terminé"
}

# Vérifier l'intégrité de la sauvegarde
verify_backup() {
    local backup_file="$1"
    
    log "Vérification de l'intégrité de la sauvegarde"
    
    # Vérifier que le fichier n'est pas vide
    if [ ! -s "$backup_file" ]; then
        error "Le fichier de sauvegarde est vide"
        return 1
    fi
    
    # Vérifier que la compression est valide
    if ! gzip -t "$backup_file" 2>/dev/null; then
        error "Le fichier de sauvegarde est corrompu"
        return 1
    fi
    
    # Vérifier le contenu SQL
    if ! zcat "$backup_file" | head -10 | grep -q "PostgreSQL database dump"; then
        error "Le contenu de la sauvegarde semble invalide"
        return 1
    fi
    
    success "Sauvegarde vérifiée avec succès"
    return 0
}

# Envoyer une notification
send_notification() {
    local status="$1"
    local message="$2"
    local backup_file="$3"
    
    if [ -n "$NOTIFICATION_WEBHOOK" ]; then
        local payload
        if [ "$status" = "success" ]; then
            local file_size=""
            if [ -n "$backup_file" ]; then
                file_size=" ($(du -h "$backup_file" | cut -f1))"
            fi
            
            payload="{
                \"text\": \"✅ Sauvegarde ClockPilot réussie\",
                \"attachments\": [{
                    \"color\": \"good\",
                    \"fields\": [{
                        \"title\": \"Statut\",
                        \"value\": \"Succès\",
                        \"short\": true
                    }, {
                        \"title\": \"Fichier\",
                        \"value\": \"$(basename "$backup_file")$file_size\",
                        \"short\": true
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": false
                    }]
                }]
            }"
        else
            payload="{
                \"text\": \"❌ Échec de la sauvegarde ClockPilot\",
                \"attachments\": [{
                    \"color\": \"danger\",
                    \"fields\": [{
                        \"title\": \"Erreur\",
                        \"value\": \"$message\",
                        \"short\": false
                    }, {
                        \"title\": \"Timestamp\",
                        \"value\": \"$(date)\",
                        \"short\": true
                    }]
                }]
            }"
        fi
        
        curl -s -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$NOTIFICATION_WEBHOOK" > /dev/null || true
    fi
}

# Restaurer une sauvegarde
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Fichier de sauvegarde non trouvé: $backup_file"
        exit 1
    fi
    
    warning "⚠️  ATTENTION: Cette opération va écraser la base de données actuelle!"
    read -p "Êtes-vous sûr de vouloir continuer? (oui/non): " confirm
    
    if [ "$confirm" != "oui" ]; then
        log "Restauration annulée"
        exit 0
    fi
    
    log "Restauration de la sauvegarde: $backup_file"
    
    # Arrêter l'application pendant la restauration
    docker-compose stop app
    
    # Restaurer la base
    if zcat "$backup_file" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres; then
        success "Restauration terminée avec succès"
        
        # Redémarrer l'application
        docker-compose start app
    else
        error "Échec de la restauration"
        exit 1
    fi
}

# Lister les sauvegardes disponibles
list_backups() {
    log "Sauvegardes disponibles dans $BACKUP_DIR:"
    
    if ls "$BACKUP_DIR"/${PROJECT_NAME}_backup_*.sql.gz 1> /dev/null 2>&1; then
        for backup in "$BACKUP_DIR"/${PROJECT_NAME}_backup_*.sql.gz; do
            local file_size=$(du -h "$backup" | cut -f1)
            local file_date=$(date -r "$backup" "+%Y-%m-%d %H:%M:%S")
            echo "  $(basename "$backup") - $file_size - $file_date"
        done
    else
        warning "Aucune sauvegarde trouvée"
    fi
}

# Affichage de l'aide
show_help() {
    cat << EOF
Script de sauvegarde ClockPilot

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    backup              Créer une sauvegarde complète (défaut)
    data-backup         Créer une sauvegarde des données uniquement
    restore FILE        Restaurer une sauvegarde
    list                Lister les sauvegardes disponibles
    cleanup             Nettoyer les anciennes sauvegardes

Options:
    -h, --help          Afficher cette aide

Variables d'environnement:
    RETENTION_DAYS      Nombre de jours de rétention [défaut: 7]
    S3_BUCKET          Bucket S3 pour l'upload des sauvegardes
    NOTIFICATION_WEBHOOK URL de webhook pour les notifications

Exemples:
    # Sauvegarde complète
    $0 backup

    # Sauvegarde des données uniquement
    $0 data-backup

    # Restaurer une sauvegarde
    $0 restore ./backups/clockpilot_backup_20240803_120000.sql.gz

    # Lister les sauvegardes
    $0 list
EOF
}

# Fonction principale
main() {
    local command="${1:-backup}"
    
    case "$command" in
        backup)
            log "Début de la sauvegarde complète"
            create_backup_dir
            check_database
            local backup_file=$(create_backup)
            if verify_backup "$backup_file"; then
                upload_to_s3 "$backup_file"
                cleanup_old_backups
                send_notification "success" "Sauvegarde créée avec succès" "$backup_file"
                success "Sauvegarde terminée: $backup_file"
            else
                send_notification "error" "Échec de la vérification de la sauvegarde"
                exit 1
            fi
            ;;
        data-backup)
            log "Début de la sauvegarde des données"
            create_backup_dir
            check_database
            local backup_file=$(create_data_backup)
            if verify_backup "$backup_file"; then
                upload_to_s3 "$backup_file"
                success "Sauvegarde des données terminée: $backup_file"
            else
                exit 1
            fi
            ;;
        restore)
            if [ -z "$2" ]; then
                error "Fichier de sauvegarde requis pour la restauration"
                show_help
                exit 1
            fi
            restore_backup "$2"
            ;;
        list)
            list_backups
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        -h|--help|help)
            show_help
            exit 0
            ;;
        *)
            error "Commande inconnue: $command"
            show_help
            exit 1
            ;;
    esac
}

# Gestion des signaux pour nettoyage
trap 'error "Script interrompu"; exit 1' INT TERM

# Exécution
main "$@"