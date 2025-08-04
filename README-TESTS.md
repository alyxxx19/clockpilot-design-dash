# 🧪 Suite de Tests ClockPilot

## Vue d'ensemble

Cette suite de tests complète couvre les aspects critiques de l'application ClockPilot avec un objectif de couverture minimum de 70%.

## Architecture des Tests

### Backend (Jest + Supertest)
- **Location**: `server/*.test.ts`
- **Environment**: Node.js
- **Coverage**: Logique métier, API, authentification

### Frontend (Jest + React Testing Library)
- **Location**: `client/src/**/*.test.tsx`
- **Environment**: jsdom
- **Coverage**: Composants, hooks, pages

### Configuration
- **Jest Config**: `jest.config.js` - Configuration multi-projets
- **Setup Backend**: `tests/setup/backend.setup.ts`
- **Setup Frontend**: `tests/setup/frontend.setup.ts`

## Tests Implémentés

### 🔐 Authentification (`server/auth.test.ts`)
- ✅ Login avec credentials valides/invalides
- ✅ Validation format email
- ✅ Refresh token (valide/expiré/invalide)
- ✅ Logout réussi
- ✅ Protection middleware
- ✅ Autorisation par rôle (admin/employee)

### 📊 Logique Métier (`server/business-logic.test.ts`)
- ✅ Calcul heures travaillées (avec/sans pause, cross-midnight)
- ✅ Calcul heures supplémentaires
- ✅ Validation contraintes légales françaises:
  - Limite quotidienne (10h/jour)
  - Limite hebdomadaire (48h/semaine)
  - Pause obligatoire (20min pour 6h+)
  - Repos minimum (11h entre journées)
- ✅ Détection conflits planning:
  - Chevauchements de créneaux
  - Pauses insuffisantes
  - Dépassements légaux

### 🧩 Composants Frontend

#### FilterBar (`client/src/components/FilterBar.test.tsx`)
- ✅ Rendu champ recherche et boutons
- ✅ Gestion saisie recherche
- ✅ Ouverture/fermeture panneau filtres
- ✅ Filtres select, date, boolean
- ✅ Affichage et suppression chips de filtres actifs
- ✅ Changement tri et direction
- ✅ Réinitialisation filtres
- ✅ Sauvegarde jeux de filtres
- ✅ Navigation clavier
- ✅ Gestion cas limites (filtres vides)

#### TimeSlotGrid (`client/src/components/TimeSlotGrid.test.tsx`)
- ✅ Affichage entrées de temps par date
- ✅ Calcul et affichage heures travaillées
- ✅ Badges de statut (brouillon, soumis, validé)
- ✅ Sélection entrées de temps
- ✅ Édition/suppression avec confirmation
- ✅ États loading et vide
- ✅ Bouton ajout nouvelle entrée
- ✅ Affichage pauses et heures supplémentaires
- ✅ Navigation clavier
- ✅ Tri par heure de début

#### TimeEntryForm (`client/src/components/forms/TimeEntryForm.test.tsx`)
- ✅ Rendu champs formulaire
- ✅ Population données existantes
- ✅ Validation champs requis
- ✅ Validation logique temporelle
- ✅ Calcul automatique heures travaillées
- ✅ Détection heures supplémentaires et alertes légales
- ✅ Soumission formulaire
- ✅ Gestion annulation
- ✅ État loading
- ✅ Gestion erreurs API
- ✅ Navigation clavier
- ✅ Alertes pause réglementaire
- ✅ Gestion créneaux de nuit

### 🎣 Hooks

#### useAuth (`client/src/hooks/useAuth.test.tsx`)
- ✅ État loading initial
- ✅ Authentification avec token valide
- ✅ Gestion erreurs d'authentification
- ✅ Scénario sans token
- ✅ Gestion erreurs réseau

### 📄 Pages

#### TimeEntry (`client/src/pages/employee/TimeEntry.test.tsx`)
- ✅ Rendu page saisie des temps
- ✅ Sélection de date
- ✅ Ajout nouvelle entrée
- ✅ Sélection entrée existante
- ✅ Chargement entrées par date
- ✅ Gestion erreurs API
- ✅ État loading
- ✅ Accessibilité (headings)
- ✅ Navigation entre dates
- ✅ Validation formulaire

### 🔗 Tests d'Intégration (`server/integration.test.ts`)
- ✅ Health check API
- ✅ Flow complet authentification (register → login → access)
- ✅ Opérations CRUD employés
- ✅ Gestion erreurs (validation, 404, unauthorized)
- ✅ Tests performance (requêtes concurrentes, temps de réponse)

## Commandes de Test

```bash
# Exécuter tous les tests
npm run test

# Tests en mode watch
npm run test:watch

# Tests avec couverture
npm run test:coverage

# Tests backend uniquement
npm run test:backend

# Tests frontend uniquement
npm run test:frontend

# Tests CI/CD
npm run test:ci
```

## Configuration Mock Service Worker (MSW)

Le setup utilise MSW pour mocker les appels API dans les tests frontend:
- Endpoints d'authentification
- Endpoints employés
- Endpoints entrées de temps
- Gestion erreurs et états de loading

## Helpers de Test

### Backend
- `createTestUser()` - Utilisateur de test
- `createTestEmployee()` - Employé de test  
- `createTestTimeEntry()` - Entrée de temps de test

### Frontend
- `renderWithProviders()` - Wrapper avec QueryClient et Router
- `server` - Instance MSW pour mocks API
- Mocks localStorage et sessionStorage

## Couverture de Code

### Objectifs de Couverture (70% minimum)
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Exclusions de Couverture
- Fichiers de types TypeScript (*.d.ts)
- Points d'entrée (main.tsx, index.ts)
- Configuration Vite

## Bonnes Pratiques

### Tests Backend
- Utiliser des mocks pour la base de données
- Tester les cas d'erreur et de succès
- Valider la structure des réponses JSON
- Tester les middlewares d'authentification

### Tests Frontend
- Utiliser `data-testid` sur les éléments interactifs
- Tester les interactions utilisateur avec userEvent
- Utiliser `waitFor` pour les opérations async
- Mocker les composants complexes si nécessaire

### Tests d'Intégration
- Tester les flows complets utilisateur
- Valider les performances
- Tester la gestion d'erreurs bout en bout

## Maintenance

### Ajout de Nouveaux Tests
1. Créer le fichier `*.test.ts(x)` à côté du code source
2. Utiliser les helpers de setup appropriés
3. Suivre les patterns existants
4. Maintenir la couverture à 70%+

### Debugging Tests
- Utiliser `screen.debug()` pour inspecter le DOM
- Consulter les logs Jest pour les erreurs
- Utiliser `--verbose` pour plus de détails

## Intégration CI/CD

Les tests sont configurés pour:
- Exécution automatique en CI avec `npm run test:ci`
- Génération de rapports de couverture
- Détection des tests en échec
- Mode non-interactif pour les environnements CI