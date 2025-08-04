#!/bin/bash

# ========================
# Script de peuplement de la base de données ClockPilot
# Génère des données de démonstration réalistes
# ========================

set -e

# Configuration
PROJECT_NAME="clockpilot"
DB_CONTAINER="clockpilot-postgres"
DB_NAME="clockpilot"
DB_USER="clockpilot_user"
ENVIRONMENT="${ENVIRONMENT:-development}"

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

# Vérifier l'environnement
check_environment() {
    if [ "$ENVIRONMENT" = "production" ]; then
        error "Ce script ne doit PAS être exécuté en production!"
        exit 1
    fi
    
    log "Environnement: $ENVIRONMENT"
}

# Vérifier la connexion à la base
check_database() {
    if ! docker ps | grep -q "$DB_CONTAINER"; then
        error "Le conteneur PostgreSQL '$DB_CONTAINER' n'est pas en cours d'exécution"
        exit 1
    fi
    
    if ! docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; then
        error "Impossible de se connecter à la base de données"
        exit 1
    fi
    
    success "Base de données accessible"
}

# Nettoyer les données existantes
clean_database() {
    warning "⚠️  Suppression des données existantes..."
    
    read -p "Êtes-vous sûr de vouloir supprimer toutes les données? (oui/non): " confirm
    if [ "$confirm" != "oui" ]; then
        log "Opération annulée"
        exit 0
    fi
    
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Désactiver les contraintes temporairement
SET session_replication_role = replica;

-- Supprimer les données dans l'ordre des dépendances
TRUNCATE time_entries CASCADE;
TRUNCATE planning CASCADE;
TRUNCATE notifications CASCADE;
TRUNCATE blacklisted_tokens CASCADE;
TRUNCATE employees CASCADE;
TRUNCATE departments CASCADE;
TRUNCATE users CASCADE;

-- Réactiver les contraintes
SET session_replication_role = DEFAULT;

-- Réinitialiser les séquences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE departments_id_seq RESTART WITH 1;
ALTER SEQUENCE employees_id_seq RESTART WITH 1;
ALTER SEQUENCE planning_id_seq RESTART WITH 1;
ALTER SEQUENCE notifications_id_seq RESTART WITH 1;
EOF
    
    success "Base de données nettoyée"
}

# Créer des utilisateurs et départements
create_base_data() {
    log "Création des données de base..."
    
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Insérer les départements
INSERT INTO departments (name, description, created_at, updated_at) VALUES
('Direction', 'Direction générale et management', NOW(), NOW()),
('Ressources Humaines', 'Gestion des ressources humaines', NOW(), NOW()),
('Développement', 'Équipe de développement logiciel', NOW(), NOW()),
('Marketing', 'Marketing et communication', NOW(), NOW()),
('Commercial', 'Équipe commerciale et ventes', NOW(), NOW()),
('Support', 'Support client et technique', NOW(), NOW()),
('Comptabilité', 'Service comptabilité et finance', NOW(), NOW());

-- Insérer les utilisateurs (mots de passe hashés avec bcrypt pour "password123")
INSERT INTO users (email, password_hash, first_name, last_name, role, created_at, updated_at) VALUES
('admin@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Admin', 'System', 'admin', NOW(), NOW()),
('manager.rh@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Marie', 'Dubois', 'manager', NOW(), NOW()),
('manager.dev@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Jean', 'Martin', 'manager', NOW(), NOW()),
('employee.dev1@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Sophie', 'Durand', 'employee', NOW(), NOW()),
('employee.dev2@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Pierre', 'Bernard', 'employee', NOW(), NOW()),
('employee.marketing@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Emma', 'Rousseau', 'employee', NOW(), NOW()),
('employee.support@clockpilot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeJvnE4Gd4TaUdoze', 'Lucas', 'Moreau', 'employee', NOW(), NOW());
EOF
    
    success "Données de base créées"
}

# Créer des employés
create_employees() {
    log "Création des employés..."
    
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Insérer les employés
INSERT INTO employees (user_id, first_name, last_name, email, department_id, contract_type, weekly_hours, hire_date, is_active, created_at, updated_at) VALUES
(1, 'Admin', 'System', 'admin@clockpilot.com', 1, 'CDI', 35, '2024-01-01', true, NOW(), NOW()),
(2, 'Marie', 'Dubois', 'manager.rh@clockpilot.com', 2, 'CDI', 35, '2024-01-15', true, NOW(), NOW()),
(3, 'Jean', 'Martin', 'manager.dev@clockpilot.com', 3, 'CDI', 35, '2024-02-01', true, NOW(), NOW()),
(4, 'Sophie', 'Durand', 'employee.dev1@clockpilot.com', 3, 'CDI', 35, '2024-02-15', true, NOW(), NOW()),
(5, 'Pierre', 'Bernard', 'employee.dev2@clockpilot.com', 3, 'CDD', 35, '2024-03-01', true, NOW(), NOW()),
(6, 'Emma', 'Rousseau', 'employee.marketing@clockpilot.com', 4, 'CDI', 28, '2024-03-15', true, NOW(), NOW()),
(7, 'Lucas', 'Moreau', 'employee.support@clockpilot.com', 6, 'CDI', 35, '2024-04-01', true, NOW(), NOW());

-- Ajouter quelques employés supplémentaires
INSERT INTO employees (first_name, last_name, email, department_id, contract_type, weekly_hours, hire_date, is_active, created_at, updated_at) VALUES
('Alice', 'Petit', 'alice.petit@clockpilot.com', 3, 'Stage', 35, '2024-05-01', true, NOW(), NOW()),
('Thomas', 'Roux', 'thomas.roux@clockpilot.com', 5, 'CDI', 35, '2024-05-15', true, NOW(), NOW()),
('Clara', 'Leroy', 'clara.leroy@clockpilot.com', 4, 'Freelance', 20, '2024-06-01', true, NOW(), NOW()),
('Antoine', 'Simon', 'antoine.simon@clockpilot.com', 7, 'CDI', 35, '2024-06-15', true, NOW(), NOW()),
('Camille', 'Michel', 'camille.michel@clockpilot.com', 2, 'CDI', 35, '2024-07-01', false, NOW(), NOW());
EOF
    
    success "Employés créés"
}

# Créer des plannings
create_planning() {
    log "Création des plannings..."
    
    # Générer des plannings pour les 30 derniers jours
    for i in {1..30}; do
        DATE=$(date -d "$i days ago" +%Y-%m-%d)
        DAY_OF_WEEK=$(date -d "$DATE" +%u)  # 1=Lundi, 7=Dimanche
        
        # Skip weekends (Saturday=6, Sunday=7)
        if [ $DAY_OF_WEEK -eq 6 ] || [ $DAY_OF_WEEK -eq 7 ]; then
            continue
        fi
        
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << EOF
-- Planning pour le $DATE
INSERT INTO planning (employee_id, date, start_time, end_time, break_duration, status, notes, created_at, updated_at)
SELECT 
    id,
    '$DATE'::date,
    CASE 
        WHEN id % 3 = 0 THEN '08:00'
        WHEN id % 3 = 1 THEN '09:00'
        ELSE '08:30'
    END::time,
    CASE 
        WHEN id % 3 = 0 THEN '17:00'
        WHEN id % 3 = 1 THEN '18:00'
        ELSE '17:30'
    END::time,
    CASE 
        WHEN weekly_hours >= 35 THEN 60
        ELSE 30
    END,
    'published',
    CASE 
        WHEN '$DAY_OF_WEEK' = '1' THEN 'Début de semaine'
        WHEN '$DAY_OF_WEEK' = '5' THEN 'Fin de semaine'
        ELSE 'Planning standard'
    END,
    NOW(),
    NOW()
FROM employees 
WHERE is_active = true AND id <= 10;
EOF
    done
    
    success "Plannings créés pour les 30 derniers jours"
}

# Créer des entrées de temps
create_time_entries() {
    log "Création des entrées de temps..."
    
    # Générer des entrées pour les 14 derniers jours
    for i in {1..14}; do
        DATE=$(date -d "$i days ago" +%Y-%m-%d)
        DAY_OF_WEEK=$(date -d "$DATE" +%u)
        
        # Skip weekends
        if [ $DAY_OF_WEEK -eq 6 ] || [ $DAY_OF_WEEK -eq 7 ]; then
            continue
        fi
        
        docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << EOF
-- Entrées de temps pour le $DATE
INSERT INTO time_entries (employee_id, date, start_time, end_time, break_duration, worked_hours, overtime_hours, status, notes, created_at, updated_at)
SELECT 
    e.id,
    '$DATE'::date,
    CASE 
        WHEN e.id % 4 = 0 THEN (p.start_time::interval + (random() * interval '15 minutes'))::time
        WHEN e.id % 4 = 1 THEN (p.start_time::interval - (random() * interval '10 minutes'))::time
        ELSE p.start_time
    END,
    CASE 
        WHEN e.id % 3 = 0 THEN (p.end_time::interval + (random() * interval '30 minutes'))::time
        WHEN e.id % 3 = 1 THEN (p.end_time::interval - (random() * interval '15 minutes'))::time
        ELSE p.end_time
    END,
    p.break_duration + (random() * 30)::int,
    EXTRACT(EPOCH FROM (p.end_time - p.start_time))/3600.0 - p.break_duration/60.0 + (random() - 0.5),
    CASE 
        WHEN EXTRACT(EPOCH FROM (p.end_time - p.start_time))/3600.0 > 8 THEN 
            EXTRACT(EPOCH FROM (p.end_time - p.start_time))/3600.0 - 8
        ELSE 0
    END,
    CASE 
        WHEN '$i' <= '3' THEN 'validated'
        WHEN '$i' <= '7' THEN 'submitted'
        ELSE 'draft'
    END,
    CASE 
        WHEN e.id % 5 = 0 THEN 'Journée productive'
        WHEN e.id % 5 = 1 THEN 'Réunions importantes'
        WHEN e.id % 5 = 2 THEN 'Formation en cours'
        WHEN e.id % 5 = 3 THEN 'Travail sur projet'
        ELSE NULL
    END,
    NOW(),
    NOW()
FROM employees e
JOIN planning p ON p.employee_id = e.id AND p.date = '$DATE'::date
WHERE e.is_active = true AND e.id <= 10;
EOF
    done
    
    success "Entrées de temps créées pour les 14 derniers jours"
}

# Créer des notifications
create_notifications() {
    log "Création des notifications..."
    
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Notifications système
INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at, updated_at) VALUES
(1, 'system', 'Bienvenue sur ClockPilot', 'Votre compte administrateur a été créé avec succès.', '{"welcome": true}', false, NOW() - interval '1 day', NOW() - interval '1 day'),
(2, 'planning', 'Nouveau planning disponible', 'Le planning de la semaine prochaine est maintenant disponible.', '{"week": "2024-W32"}', false, NOW() - interval '2 hours', NOW() - interval '2 hours'),
(3, 'time_entry', 'Rappel de saisie', 'N''oubliez pas de saisir vos heures pour hier.', '{"date": "2024-08-02"}', true, NOW() - interval '1 hour', NOW() - interval '30 minutes'),
(4, 'validation', 'Temps validés', 'Vos heures de la semaine dernière ont été validées.', '{"week": "2024-W31"}', false, NOW() - interval '3 hours', NOW() - interval '3 hours'),
(5, 'alert', 'Dépassement d''horaires', 'Attention: dépassement de 45h cette semaine.', '{"hours": 45, "limit": 48}', false, NOW() - interval '1 day', NOW() - interval '1 day');

-- Notifications pour tous les employés actifs
INSERT INTO notifications (user_id, type, title, message, is_read, created_at, updated_at)
SELECT 
    u.id,
    'announcement',
    'Nouvelle fonctionnalité disponible',
    'L''export PDF des feuilles de temps est maintenant disponible!',
    CASE WHEN u.id % 3 = 0 THEN true ELSE false END,
    NOW() - interval '6 hours',
    NOW() - interval '6 hours'
FROM users u
WHERE u.id <= 7;
EOF
    
    success "Notifications créées"
}

# Afficher un résumé
show_summary() {
    log "Génération du résumé des données créées..."
    
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
\echo '=================================='
\echo 'RÉSUMÉ DES DONNÉES CRÉÉES'
\echo '=================================='

\echo ''
\echo 'Départements:'
SELECT COUNT(*) as total, STRING_AGG(name, ', ') as noms FROM departments;

\echo ''
\echo 'Utilisateurs par rôle:'
SELECT role, COUNT(*) as total FROM users GROUP BY role ORDER BY role;

\echo ''
\echo 'Employés par département:'
SELECT d.name as departement, COUNT(e.id) as total_employes
FROM departments d
LEFT JOIN employees e ON d.id = e.department_id
GROUP BY d.name
ORDER BY total_employes DESC;

\echo ''
\echo 'Entrées de temps par statut:'
SELECT status, COUNT(*) as total FROM time_entries GROUP BY status ORDER BY status;

\echo ''
\echo 'Plannings créés:'
SELECT COUNT(*) as total_plannings, 
       MIN(date) as premiere_date, 
       MAX(date) as derniere_date 
FROM planning;

\echo ''
\echo 'Notifications:'
SELECT type, COUNT(*) as total, 
       SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as lues,
       SUM(CASE WHEN is_read THEN 0 ELSE 1 END) as non_lues
FROM notifications 
GROUP BY type 
ORDER BY type;

\echo ''
\echo '=================================='
\echo 'COMPTES DE TEST DISPONIBLES'
\echo '=================================='
\echo 'Email: admin@clockpilot.com | Mot de passe: password123 | Rôle: Admin'
\echo 'Email: manager.rh@clockpilot.com | Mot de passe: password123 | Rôle: Manager RH'
\echo 'Email: manager.dev@clockpilot.com | Mot de passe: password123 | Rôle: Manager Dev'
\echo 'Email: employee.dev1@clockpilot.com | Mot de passe: password123 | Rôle: Employé Dev'
\echo 'Email: employee.support@clockpilot.com | Mot de passe: password123 | Rôle: Support'
\echo '=================================='
EOF
}

# Affichage de l'aide
show_help() {
    cat << EOF
Script de peuplement de la base de données ClockPilot

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    seed                Peupler la base avec des données de démo (défaut)
    clean               Nettoyer toutes les données existantes
    summary             Afficher un résumé des données actuelles

Options:
    -h, --help          Afficher cette aide
    -f, --force         Forcer l'exécution sans confirmation

Variables d'environnement:
    ENVIRONMENT         Environnement (development, staging) [défaut: development]

Exemples:
    # Peuplement complet
    $0 seed

    # Nettoyage de la base
    $0 clean

    # Afficher le résumé
    $0 summary
EOF
}

# Fonction principale
main() {
    local command="${1:-seed}"
    
    case "$command" in
        seed)
            log "Début du peuplement de la base de données"
            check_environment
            check_database
            clean_database
            create_base_data
            create_employees
            create_planning
            create_time_entries
            create_notifications
            show_summary
            success "🌱 Base de données peuplée avec succès!"
            ;;
        clean)
            log "Nettoyage de la base de données"
            check_environment
            check_database
            clean_database
            success "Base de données nettoyée"
            ;;
        summary)
            check_database
            show_summary
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

# Gestion des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--force)
            # Pour les scripts automatisés
            export FORCE_YES=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            main "$@"
            exit 0
            ;;
    esac
done

# Exécution par défaut
main "$@"