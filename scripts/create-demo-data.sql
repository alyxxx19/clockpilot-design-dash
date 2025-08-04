-- Script SQL pour créer des données de démonstration réalistes
-- Utilisé pour les screenshots de documentation

-- Nettoyer les données existantes
DELETE FROM time_entries;
DELETE FROM planning_entries;
DELETE FROM tasks;
DELETE FROM employees;
DELETE FROM departments;
DELETE FROM projects;
DELETE FROM users;

-- Créer les départements
INSERT INTO departments (id, name, code, description, created_at) VALUES
('dept-1', 'Développement', 'DEV', 'Équipe de développement logiciel', NOW()),
('dept-2', 'Design', 'DES', 'Équipe design et UX/UI', NOW()),
('dept-3', 'Marketing', 'MKT', 'Équipe marketing et communication', NOW()),
('dept-4', 'RH', 'HR', 'Ressources Humaines', NOW());

-- Créer les projets
INSERT INTO projects (id, name, code, description, client_name, start_date, end_date, budget, status, created_at) VALUES
('proj-1', 'Application Mobile ClockPilot', 'APP-MOB-001', 'Développement de l''application mobile ClockPilot', 'ClockPilot SAS', '2024-01-15', '2024-06-15', 150000, 'active', NOW()),
('proj-2', 'Site Web Corporate', 'WEB-CORP-001', 'Refonte du site web corporate', 'ClockPilot SAS', '2024-02-01', '2024-04-30', 75000, 'active', NOW()),
('proj-3', 'API Integration', 'API-INT-001', 'Intégration des APIs tierces', 'Client External', '2024-03-01', '2024-05-31', 100000, 'planning', NOW()),
('proj-4', 'Formation équipe', 'FORM-001', 'Formation interne équipe', 'ClockPilot SAS', '2024-01-01', '2024-12-31', 25000, 'active', NOW());

-- Créer les utilisateurs
INSERT INTO users (id, email, password_hash, role, first_name, last_name, profile_image_url, created_at, updated_at) VALUES
('user-admin', 'admin@clockpilot.com', '$2b$10$hash-admin', 'admin', 'Marie', 'Admin', '/uploads/avatars/admin.jpg', NOW(), NOW()),
('user-emp1', 'jean.dupont@clockpilot.com', '$2b$10$hash-emp1', 'employee', 'Jean', 'Dupont', '/uploads/avatars/jean.jpg', NOW(), NOW()),
('user-emp2', 'marie.martin@clockpilot.com', '$2b$10$hash-emp2', 'employee', 'Marie', 'Martin', '/uploads/avatars/marie.jpg', NOW(), NOW()),
('user-emp3', 'pierre.durand@clockpilot.com', '$2b$10$hash-emp3', 'employee', 'Pierre', 'Durand', '/uploads/avatars/pierre.jpg', NOW(), NOW()),
('user-emp4', 'claire.rousseau@clockpilot.com', '$2b$10$hash-emp4', 'employee', 'Claire', 'Rousseau', '/uploads/avatars/claire.jpg', NOW(), NOW());

-- Créer les employés
INSERT INTO employees (id, user_id, employee_number, department_id, position, hire_date, salary, weekly_hours, contract_type, status, phone, address, created_at, updated_at) VALUES
('emp-1', 'user-emp1', 'EMP001', 'dept-1', 'Développeur Senior', '2024-01-15', 45000, 35, 'CDI', 'active', '+33 6 12 34 56 78', '123 Rue de la République, 75001 Paris', NOW(), NOW()),
('emp-2', 'user-emp2', 'EMP002', 'dept-2', 'Designer UX/UI', '2024-01-20', 40000, 35, 'CDI', 'active', '+33 6 23 45 67 89', '456 Avenue des Champs, 75008 Paris', NOW(), NOW()),
('emp-3', 'user-emp3', 'EMP003', 'dept-1', 'Chef de projet', '2024-02-01', 50000, 35, 'CDI', 'active', '+33 6 34 56 78 90', '789 Boulevard Saint-Germain, 75007 Paris', NOW(), NOW()),
('emp-4', 'user-emp4', 'EMP004', 'dept-3', 'Chargée de communication', '2024-02-15', 35000, 35, 'CDD', 'active', '+33 6 45 67 89 01', '321 Rue de Rivoli, 75004 Paris', NOW(), NOW());

-- Créer les entrées de planning (semaine courante)
INSERT INTO planning_entries (id, employee_id, date, start_time, end_time, project_id, type, status, created_at, updated_at) VALUES
-- Lundi 15/01/2024
('plan-1', 'emp-1', '2024-01-15', '09:00', '17:00', 'proj-1', 'work', 'confirmed', NOW(), NOW()),
('plan-2', 'emp-2', '2024-01-15', '09:30', '17:30', 'proj-2', 'work', 'confirmed', NOW(), NOW()),
('plan-3', 'emp-3', '2024-01-15', '09:00', '17:00', 'proj-1', 'work', 'confirmed', NOW(), NOW()),
('plan-4', 'emp-4', '2024-01-15', '10:00', '18:00', 'proj-2', 'work', 'confirmed', NOW(), NOW()),

-- Mardi 16/01/2024
('plan-5', 'emp-1', '2024-01-16', '09:00', '17:00', 'proj-1', 'work', 'confirmed', NOW(), NOW()),
('plan-6', 'emp-2', '2024-01-16', '09:30', '17:30', 'proj-2', 'work', 'confirmed', NOW(), NOW()),
('plan-7', 'emp-3', '2024-01-16', '09:00', '17:00', 'proj-3', 'work', 'confirmed', NOW(), NOW()),
('plan-8', 'emp-4', '2024-01-16', '10:00', '18:00', 'proj-4', 'training', 'confirmed', NOW(), NOW()),

-- Mercredi 17/01/2024
('plan-9', 'emp-1', '2024-01-17', '09:00', '17:00', 'proj-1', 'work', 'confirmed', NOW(), NOW()),
('plan-10', 'emp-2', '2024-01-17', '09:30', '17:30', 'proj-2', 'work', 'confirmed', NOW(), NOW()),
('plan-11', 'emp-3', '2024-01-17', '09:00', '17:00', 'proj-1', 'work', 'confirmed', NOW(), NOW()),
('plan-12', 'emp-4', '2024-01-17', '10:00', '18:00', 'proj-2', 'work', 'confirmed', NOW(), NOW());

-- Créer les entrées de temps
INSERT INTO time_entries (id, employee_id, date, start_time, end_time, project_id, description, type, status, validated_by, validation_comment, created_at, updated_at) VALUES
-- Entrées approuvées
('time-1', 'emp-1', '2024-01-15', '09:00', '17:00', 'proj-1', 'Développement interface utilisateur principale', 'work', 'approved', 'user-admin', 'Heures conformes au planning', NOW(), NOW()),
('time-2', 'emp-2', '2024-01-15', '09:30', '17:30', 'proj-2', 'Design des maquettes homepage', 'work', 'approved', 'user-admin', 'Excellent travail', NOW(), NOW()),
('time-3', 'emp-3', '2024-01-15', '09:00', '17:00', 'proj-1', 'Coordination équipe et review code', 'work', 'approved', 'user-admin', 'Planning respecté', NOW(), NOW()),

-- Entrées en attente
('time-4', 'emp-1', '2024-01-16', '09:00', '18:00', 'proj-1', 'Développement API backend', 'work', 'pending', NULL, NULL, NOW(), NOW()),
('time-5', 'emp-2', '2024-01-16', '09:30', '17:30', 'proj-2', 'Intégration des composants React', 'work', 'pending', NULL, NULL, NOW(), NOW()),
('time-6', 'emp-4', '2024-01-16', '10:00', '19:00', 'proj-4', 'Formation Figma et outils design', 'training', 'pending', NULL, NULL, NOW(), NOW()),

-- Entrées rejetées
('time-7', 'emp-3', '2024-01-17', '09:00', '19:30', 'proj-1', 'Debug et tests unitaires', 'work', 'rejected', 'user-admin', 'Heures supplémentaires non autorisées. Revoir avec le planning.', NOW(), NOW());

-- Créer les tâches
INSERT INTO tasks (id, employee_id, project_id, title, description, priority, due_date, status, created_at, updated_at) VALUES
('task-1', 'emp-1', 'proj-1', 'Révision code interface', 'Réviser le code de l''interface utilisateur principale', 'high', '2024-01-20', 'todo', NOW(), NOW()),
('task-2', 'emp-2', 'proj-2', 'Maquettes responsive', 'Créer les maquettes responsive pour mobile', 'medium', '2024-01-25', 'in_progress', NOW(), NOW()),
('task-3', 'emp-3', 'proj-1', 'Tests d''intégration', 'Écrire et exécuter les tests d''intégration', 'high', '2024-01-22', 'completed', NOW(), NOW()),
('task-4', 'emp-4', 'proj-2', 'Contenu marketing', 'Rédiger le contenu pour la nouvelle homepage', 'medium', '2024-01-30', 'todo', NOW(), NOW()),
('task-5', 'emp-1', 'proj-3', 'Documentation API', 'Documenter les nouveaux endpoints API', 'low', '2024-02-05', 'todo', NOW(), NOW());

-- Créer des notifications
INSERT INTO notifications (id, user_id, type, title, message, priority, read, created_at) VALUES
('notif-1', 'user-emp1', 'planning_update', 'Planning mis à jour', 'Votre planning de la semaine prochaine a été modifié', 'medium', false, NOW() - INTERVAL '2 hours'),
('notif-2', 'user-emp1', 'time_entry_approved', 'Heures approuvées', 'Vos heures du 15/01/2024 ont été approuvées', 'low', true, NOW() - INTERVAL '1 day'),
('notif-3', 'user-emp3', 'time_entry_rejected', 'Heures rejetées', 'Vos heures du 17/01/2024 ont été rejetées. Raison: Heures supplémentaires non autorisées', 'high', false, NOW() - INTERVAL '30 minutes'),
('notif-4', 'user-admin', 'validation_pending', 'Validations en attente', '3 entrées de temps nécessitent votre validation', 'medium', false, NOW() - INTERVAL '1 hour'),
('notif-5', 'user-emp2', 'task_assigned', 'Nouvelle tâche', 'Une nouvelle tâche vous a été assignée: Maquettes responsive', 'medium', false, NOW() - INTERVAL '3 hours');

-- Créer des paramètres de l'entreprise
INSERT INTO settings (key, value, description, category, created_at, updated_at) VALUES
('company_name', 'ClockPilot Enterprise', 'Nom de l''entreprise', 'company', NOW(), NOW()),
('company_address', '123 Avenue des Champs-Élysées, 75008 Paris', 'Adresse de l''entreprise', 'company', NOW(), NOW()),
('company_phone', '+33 1 23 45 67 89', 'Téléphone de l''entreprise', 'company', NOW(), NOW()),
('default_weekly_hours', '35', 'Heures hebdomadaires par défaut', 'working_hours', NOW(), NOW()),
('overtime_threshold', '35', 'Seuil heures supplémentaires', 'working_hours', NOW(), NOW()),
('legal_compliance_fr', 'true', 'Conformité légale française', 'legal', NOW(), NOW()),
('rest_period_minutes', '20', 'Pause obligatoire en minutes', 'legal', NOW(), NOW()),
('max_daily_hours', '10', 'Maximum d''heures par jour', 'legal', NOW(), NOW()),
('max_weekly_hours', '48', 'Maximum d''heures par semaine', 'legal', NOW(), NOW());

COMMIT;