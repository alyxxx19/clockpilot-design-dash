# Guide de Tests - ClockPilot

## Vue d'ensemble

ClockPilot dispose d'une suite complète de tests couvrant tous les aspects de l'application, avec Jest comme framework principal et une couverture minimum de 70% pour garantir la qualité du code.

## Structure des Tests

### 📁 Configuration de Base
- `jest.config.js` - Configuration multi-projets (backend/frontend)
- `tests/setup/backend.setup.ts` - Configuration et helpers pour tests backend
- `tests/setup/frontend.setup.ts` - Configuration MSW et helpers React Testing Library
- `tests/setup/env.setup.ts` - Variables d'environnement pour tests

### 🔧 Backend Tests (Node.js/Express)

#### API Tests - CRUD Operations
- **Employees API** (`server/employees.test.ts`)
  - ✅ CRUD complet avec pagination et filtrage
  - ✅ Validation des données et contraintes métier
  - ✅ Gestion des rôles et permissions
  - ✅ Statistiques et rapports

- **Planning API** (`server/planning.test.ts`)
  - ✅ Génération automatique avec contraintes légales françaises
  - ✅ Détection de conflits et chevauchements
  - ✅ Validation des limites : 10h/jour, 48h/semaine
  - ✅ Validation des périodes de repos minimum (11h)
  - ✅ Workflow de validation et notifications

- **Time Entries API** (`server/time-entries.test.ts`)
  - ✅ Suivi du temps avec validation en temps réel
  - ✅ Calcul automatique des heures supplémentaires
  - ✅ Détection d'anomalies (pauses manquantes, horaires suspects)
  - ✅ Comparaison planifié vs réalisé
  - ✅ Processus de validation par les managers

- **Projects & Tasks API** (`server/projects-tasks.test.ts`)
  - ✅ Gestion complète des projets avec budget et suivi
  - ✅ Tâches avec assignation et suivi de progression
  - ✅ Dashboard analytique pour admin et employés
  - ✅ Gestion des membres et rôles par projet

#### Business Logic Tests (`server/business-logic.test.ts`)
- ✅ **Calculs de Temps**
  - Heures travaillées avec gestion cross-midnight
  - Calcul des heures supplémentaires
  - Validation des pauses obligatoires

- ✅ **Contraintes Légales Françaises**
  - Limite quotidienne : 10 heures maximum
  - Limite hebdomadaire : 48 heures maximum
  - Repos minimum : 11 heures entre les shifts
  - Restrictions travail de nuit (22h-6h)

- ✅ **Détection d'Anomalies**
  - Pauses manquantes pour journées longues
  - Heures supplémentaires non autorisées
  - Travail weekend sans autorisation
  - Patterns de travail suspects

- ✅ **Détection de Conflits**
  - Chevauchements de créneaux
  - Conflits avec les congés
  - Violations des contraintes légales

#### Integration Flow Tests (`server/integration-flow.test.ts`)
- ✅ **Workflow Complet Planning → Time Entry → Validation**
  - Création planning par admin
  - Saisie temps par employé avec déviations mineures
  - Soumission pour validation
  - Validation/rejet par manager
  - Génération analytics comparatif

- ✅ **Gestion des Conflits et Erreurs**
  - Rollback automatique en cas d'échec bulk
  - Gestion des succès partiels
  - Recovery et notifications d'erreur

- ✅ **Tests de Performance**
  - Gestion de gros volumes de données (1000+ entrées)
  - Requêtes concurrentes
  - Temps de réponse < 1 seconde

#### Authentication Tests (`server/auth.test.ts`)
- ✅ Login/logout avec JWT
- ✅ Gestion des tokens refresh
- ✅ Protection des routes par rôle
- ✅ Gestion de l'expiration des tokens

### 🎨 Frontend Tests (React/TypeScript)

#### Component Tests
- **FilterBar** (`client/src/components/FilterBar.test.tsx`)
  - ✅ Gestion des filtres multiples (search, select, date, boolean)
  - ✅ Synchronisation URL pour persistance des filtres
  - ✅ Sauvegarde/chargement de sets de filtres
  - ✅ Reset et validation des entrées

- **TimeSlotGrid** (`client/src/components/TimeSlotGrid.test.tsx`)
  - ✅ Affichage grille temporelle interactive
  - ✅ Drag & drop pour modification créneaux
  - ✅ Gestion des overlaps visuels
  - ✅ Validation en temps réel des contraintes

#### Hook Tests
- **useAuth** (`client/src/hooks/useAuth.test.tsx`)
  - ✅ Gestion état d'authentification
  - ✅ Auto-refresh des tokens
  - ✅ Gestion des erreurs de connexion
  - ✅ Persistance localStorage

#### API Integration Tests
- ✅ Mock Service Worker (MSW) pour tests API
- ✅ Tests des hooks React Query
- ✅ Gestion des états de chargement et erreurs
- ✅ Optimistic updates et cache invalidation

## 🎯 Couverture et Objectifs

### Métriques de Couverture (Minimum 70%)
- **Branches**: 70%+ - Tests de toutes les conditions
- **Functions**: 70%+ - Tests de toutes les fonctions exportées
- **Lines**: 70%+ - Tests de la logique métier critique
- **Statements**: 70%+ - Tests des chemins d'exécution

### Zones Critiques Testées
- ✅ **Sécurité** - Authentification, autorisation, validation inputs
- ✅ **Conformité Légale** - Contraintes droit du travail français
- ✅ **Logique Métier** - Calculs temps, détection anomalies, conflits
- ✅ **API Robustesse** - Gestion erreurs, validation données
- ✅ **Performance** - Tests de charge, concurrence
- ✅ **UX Critique** - Workflows utilisateur complets

## 🚀 Exécution des Tests

### Commandes de Base
```bash
# Tous les tests
npm test

# Tests backend uniquement
npm run test:backend

# Tests frontend uniquement  
npm run test:frontend

# Tests avec couverture
npm run test:coverage

# Tests en mode watch
npm run test:watch
```

### Tests Spécifiques
```bash
# Tests d'un module spécifique
npm test -- --testPathPattern="employees"

# Tests avec pattern
npm test -- --testNamePattern="legal constraints"

# Tests verbose avec détails
npm test -- --verbose
```

### Rapports de Couverture
- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **Text Summary**: Affiché dans la console

## 🛠️ Outils et Technologies

### Framework de Test
- **Jest** - Framework principal avec support TypeScript
- **React Testing Library** - Tests composants React
- **Supertest** - Tests API HTTP
- **MSW (Mock Service Worker)** - Mock des APIs
- **@testing-library/user-event** - Simulation interactions utilisateur

### Mocks et Helpers
- **Database Mocking** - Mock complet de Drizzle ORM
- **Storage Helpers** - Données de test réutilisables
- **JWT Helpers** - Génération tokens pour tests
- **Time Helpers** - Manipulation dates/heures pour tests

### Configuration Jest Multi-Projets
- **Backend Project** - Tests Node.js avec ts-jest
- **Frontend Project** - Tests React avec jsdom
- **Shared Utilities** - Helpers communs et setup

## 📋 Checklist Tests par Feature

### ✅ Authentication
- [x] Login/logout flows
- [x] JWT token management
- [x] Role-based access control
- [x] Token refresh mechanism
- [x] Unauthorized error handling

### ✅ Employee Management
- [x] CRUD operations complete
- [x] Advanced filtering and search
- [x] Pagination and sorting
- [x] Input validation
- [x] Statistics and analytics

### ✅ Planning Management
- [x] Auto-generation with templates
- [x] Legal constraints validation
- [x] Conflict detection
- [x] Bulk operations
- [x] Approval workflow

### ✅ Time Tracking
- [x] Real-time entry validation
- [x] Overtime calculations
- [x] Anomaly detection
- [x] Planned vs actual analysis
- [x] Multi-level approval

### ✅ Projects & Tasks
- [x] Project lifecycle management
- [x] Task assignment and tracking
- [x] Progress monitoring
- [x] Budget tracking
- [x] Team collaboration

### ✅ Legal Compliance
- [x] French labor law constraints
- [x] Daily/weekly hour limits
- [x] Mandatory rest periods
- [x] Night work restrictions
- [x] Break requirements

## 🎯 Standards de Qualité

### Test Design Principles
- **Isolation** - Chaque test est indépendant
- **Repeatability** - Résultats constants
- **Fast Execution** - Suite complète < 30 secondes
- **Clear Naming** - Tests auto-documentés
- **Edge Cases** - Couverture des cas limites

### Mock Strategy
- **External APIs** - Toujours mockés avec MSW
- **Database** - Mockée avec fonctions Jest
- **File System** - Mockée pour tests upload
- **Time/Dates** - Contrôlées pour reproductibilité

### Error Testing
- **Network Failures** - Tests de résilience réseau
- **Database Errors** - Gestion pannes DB
- **Validation Errors** - Inputs malformés
- **Authorization Errors** - Accès non autorisé
- **Business Logic Errors** - Violations règles métier

Cette suite de tests garantit la fiabilité et la conformité de ClockPilot avec les exigences métier et légales, tout en maintenant une excellente expérience utilisateur.