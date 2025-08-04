# ClockPilot E2E Tests

Tests end-to-end complets pour ClockPilot utilisant Playwright.

## Structure

```
tests/e2e/
├── setup/
│   └── auth.setup.ts          # Configuration d'authentification
├── utils/
│   └── test-helpers.ts        # Utilitaires de test réutilisables
├── fixtures/
│   └── test-data.ts           # Données de test
├── auth.spec.ts               # Tests d'authentification
├── employee-flow.spec.ts      # Workflow employé
├── admin-flow.spec.ts         # Workflow administrateur
├── offline.spec.ts            # Tests mode hors ligne
└── README.md                  # Documentation
```

## Installation

```bash
# Installer Playwright
npm install @playwright/test --save-dev

# Installer les navigateurs
npx playwright install

# Installer les dépendances système (Linux)
npx playwright install-deps
```

## Commandes de test

```bash
# Lancer tous les tests E2E
npx playwright test

# Tests avec interface utilisateur
npx playwright test --ui

# Tests en mode visible (non-headless)
npx playwright test --headed

# Tests avec debugger
npx playwright test --debug

# Tests spécifiques
npx playwright test auth.spec.ts
npx playwright test employee-flow.spec.ts
npx playwright test admin-flow.spec.ts
npx playwright test offline.spec.ts

# Tests sur mobile uniquement
npx playwright test --project="Mobile Chrome"

# Voir le rapport
npx playwright show-report
```

## Configuration

### Variables d'environnement

```bash
# .env.test
BASE_URL=http://localhost:5000
DATABASE_URL=postgresql://user:pass@localhost:5432/clockpilot_test
JWT_SECRET=test-jwt-secret
SESSION_SECRET=test-session-secret
```

### Navigateurs testés

- **Desktop**: Chrome, Firefox, Safari, Edge
- **Mobile**: Chrome Mobile, Safari Mobile
- **Viewports**: 1280x720 (desktop), devices natifs (mobile)

## Structure des tests

### 1. Tests d'authentification (`auth.spec.ts`)

- ✅ Connexion employé valide
- ✅ Connexion admin valide
- ✅ Identifiants invalides
- ✅ Champs vides
- ✅ Déconnexion
- ✅ Expiration de session
- ✅ Redirection après connexion
- ✅ Option "Se souvenir de moi"
- ✅ États de chargement

### 2. Workflow employé (`employee-flow.spec.ts`)

- ✅ Tableau de bord employé
- ✅ Consultation du planning personnel
- ✅ Pointage entrée/sortie
- ✅ Saisie manuelle d'heures
- ✅ Filtres des temps saisis
- ✅ Rapports personnels
- ✅ Gestion des tâches
- ✅ Mise à jour du profil
- ✅ Mode hors ligne
- ✅ Notifications

### 3. Workflow administrateur (`admin-flow.spec.ts`)

- ✅ Tableau de bord admin
- ✅ Création d'employé
- ✅ Modification d'employé
- ✅ Génération de planning
- ✅ Validation des heures
- ✅ Rejet avec commentaire
- ✅ Export Excel/PDF
- ✅ Gestion des départements
- ✅ Gestion des projets
- ✅ Analyse des heures supplémentaires
- ✅ Paramètres système
- ✅ Conformité légale

### 4. Tests hors ligne (`offline.spec.ts`)

- ✅ Détection statut en ligne/hors ligne
- ✅ Queue d'actions hors ligne
- ✅ Synchronisation au retour en ligne
- ✅ Gestion des erreurs de sync
- ✅ Retry des actions échouées
- ✅ Sauvegarde locale des formulaires
- ✅ Données en cache
- ✅ Pointage hors ligne
- ✅ Indicateurs de fraîcheur des données
- ✅ Création de tâches hors ligne
- ✅ Intermittence réseau
- ✅ Persistance de la queue

## Données de test

### Utilisateurs

```typescript
// Employé
email: 'employee@clockpilot.com'
password: 'password123'

// Admin
email: 'admin@clockpilot.com'
password: 'admin123'
```

### Projets de test

- Application Mobile (APP-MOB-001)
- Site Web Corporate (WEB-CORP-001)
- API Integration (API-INT-001)

### Départements

- Développement (DEV)
- Design (DES)
- Marketing (MKT)
- RH (HR)

## Utilisation des helpers

```typescript
import { TestHelpers } from './utils/test-helpers';

test('exemple avec helpers', async ({ page }) => {
  const helpers = new TestHelpers(page);
  
  // Connexion rapide
  await helpers.loginAsEmployee();
  
  // Navigation et vérification
  await helpers.navigateAndVerify('/employee/planning');
  
  // Pointage
  await helpers.punchInOut('in');
  
  // Création d'entrée manuelle
  await helpers.createManualTimeEntry({
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    project: 'Application Mobile',
    description: 'Développement interface'
  });
});
```

## CI/CD Integration

Les tests sont intégrés dans GitHub Actions :

- **Push sur main/develop** : Tests complets
- **Pull requests** : Tests de validation
- **Nightly** : Tests de performance
- **Rapports** : Artéfacts automatiques

### Pipeline

1. Setup PostgreSQL + Redis
2. Installation des dépendances
3. Installation navigateurs Playwright
4. Build de l'application
5. Lancement des tests
6. Upload des rapports

## Debugging

### Screenshots automatiques

Les captures d'écran sont prises automatiquement :
- En cas d'échec de test
- Pour le debugging manuel

### Traces

Les traces Playwright sont activées :
- Sur premier retry d'un test échoué
- Consultation via `npx playwright show-trace`

### Logs

```bash
# Logs détaillés
DEBUG=pw:api npx playwright test

# Logs du navigateur
npx playwright test --headed --browser=chromium
```

## Bonnes pratiques

### 1. Test IDs

Utiliser systématiquement `data-testid` :

```html
<button data-testid="button-login">Se connecter</button>
<input data-testid="input-email" type="email" />
<div data-testid="user-menu">Menu utilisateur</div>
```

### 2. Attentes explicites

```typescript
// ✅ Bon
await expect(page.getByTestId('success-message')).toBeVisible();

// ❌ Mauvais
await page.waitForTimeout(1000);
```

### 3. Données isolées

Chaque test doit être indépendant :
- Pas de dépendances entre tests
- Nettoyage automatique
- Données de test dédiées

### 4. Mocking judicieux

```typescript
// Mock API externe seulement si nécessaire
await page.route('**/api/external/**', route => {
  route.fulfill({ status: 200, body: '{"status": "ok"}' });
});
```

## Rapports

### HTML Report

```bash
npx playwright show-report
```

Inclut :
- Screenshots des échecs
- Vidéos des tests
- Traces de débogage
- Métriques de performance

### CI Reports

- **JUnit XML** : Integration Jenkins/GitLab
- **JSON** : Données structurées
- **Allure** : Rapports avancés (optionnel)

## Performance

### Métriques surveillées

- Temps de chargement des pages
- Réactivité des interactions
- Taille des bundles
- Core Web Vitals

### Seuils

```typescript
// Performance budgets
expect(loadTime).toBeLessThan(2000); // 2s max
expect(bundleSize).toBeLessThan(500 * 1024); // 500KB max
```

## Maintenance

### Tests en échec

1. Vérifier les changements d'interface
2. Mettre à jour les sélecteurs
3. Ajuster les données de test
4. Valider la logique métier

### Mise à jour Playwright

```bash
# Mettre à jour Playwright
npm update @playwright/test

# Réinstaller les navigateurs
npx playwright install
```

### Revue périodique

- Tests obsolètes
- Couverture des nouvelles fonctionnalités
- Performance des tests
- Fiabilité des résultats