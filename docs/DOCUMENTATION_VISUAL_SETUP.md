# Configuration de la Documentation Visuelle ClockPilot

Guide complet pour configurer et maintenir la documentation visuelle avec screenshots et animations.

## Vue d'ensemble

La documentation visuelle de ClockPilot comprend :
- **Screenshots haute qualité** de toutes les interfaces
- **Animations GIF** pour les workflows complexes
- **Annotations visuelles** pour guider les utilisateurs
- **Optimisation automatique** des images
- **Génération automatisée** via Playwright

## Structure des fichiers

```
docs/
├── USER_GUIDE.md              # Guide utilisateur principal avec images
├── DOCUMENTATION_VISUAL_SETUP.md # Ce fichier
└── screenshots/
    ├── README.md              # Documentation des screenshots
    ├── login/                 # Images de connexion
    │   ├── login-page.png
    │   ├── login-error.png
    │   └── login-success.png
    ├── employee/              # Interface employé
    │   ├── dashboard.png
    │   ├── planning-month.png
    │   ├── time-tracking.png
    │   ├── manual-entry.png
    │   ├── reports.png
    │   └── profile.png
    ├── admin/                 # Interface administrateur
    │   ├── dashboard.png
    │   ├── employees-list.png
    │   ├── employee-create.png
    │   ├── validation.png
    │   └── export-dialog.png
    └── gifs/                  # Animations
        ├── punch-process.gif
        ├── drag-drop-planning.gif
        ├── validation-flow.gif
        └── export-generation.gif

scripts/
├── generate-screenshots.ts    # Script Playwright principal
├── run-screenshots.js        # Orchestrateur de génération
├── optimize-images.js        # Optimisation des images
├── create-gif.js            # Création des GIFs
├── create-demo-images.py    # Images placeholder
└── create-demo-data.sql     # Données de démonstration
```

## Installation et prérequis

### 1. Dépendances Node.js

```bash
# Déjà installées dans le projet
npm install @playwright/test sharp imagemin imagemin-pngquant imagemin-gifsicle
```

### 2. Navigateurs Playwright

```bash
npx playwright install
npx playwright install-deps  # Linux uniquement
```

### 3. Outils d'optimisation (optionnel)

```bash
# ImageMagick pour conversions avancées
sudo apt-get install imagemagick  # Linux
brew install imagemagick          # macOS

# Gifsicle pour optimisation GIF
sudo apt-get install gifsicle     # Linux
brew install gifsicle             # macOS
```

### 4. Python pour images placeholder

```bash
pip install Pillow  # Pour create-demo-images.py
```

## Utilisation

### Génération complète automatique

```bash
# Script principal - génère tout automatiquement
node scripts/run-screenshots.js
```

Ce script :
1. Vérifie que le serveur ClockPilot est démarré
2. Lance la génération de screenshots avec Playwright
3. Optimise automatiquement les images
4. Génère les GIFs de workflow

### Scripts individuels

```bash
# Screenshots uniquement
npx tsx scripts/generate-screenshots.ts

# Optimisation images uniquement
node scripts/optimize-images.js

# GIFs uniquement
node scripts/create-gif.js

# Images placeholder (développement)
python3 scripts/create-demo-images.py
```

## Configuration des screenshots

### Paramètres par défaut

```typescript
// Dans generate-screenshots.ts
const VIEWPORT = { width: 1200, height: 800 };
const SCREENSHOT_DIR = 'docs/screenshots';
```

### Données de démonstration

Les screenshots utilisent des données réalistes définies dans :
- `scripts/create-demo-data.sql` - Données SQL pour la base
- `tests/e2e/fixtures/test-data.ts` - Données pour les tests

**Utilisateurs de démonstration :**
- `admin@clockpilot.com` / `admin123` (Administrateur)
- `employee@clockpilot.com` / `password123` (Employé)

### Annotations automatiques

Le script ajoute automatiquement :
- Flèches rouges pointant vers les éléments importants
- Numéros dans des badges rouges pour les étapes
- Surlignage des zones d'interaction

## Optimisation des images

### Spécifications

- **Format :** PNG optimisé avec pngquant
- **Résolution :** 1200x800px maximum
- **Compression :** 60-80% qualité, 500KB maximum
- **GIFs :** 64 couleurs, optimisation level 3

### Processus d'optimisation

```bash
# Compression PNG
pngquant --quality=60-80 input.png --output output.png

# Optimisation GIF
gifsicle --optimize=3 --colors=64 input.gif -o output.gif

# Redimensionnement
sharp().resize(1200, 800, { fit: 'inside' })
```

## Création de GIFs

### Workflows supportés

1. **punch-process.gif** - Processus de pointage complet
2. **drag-drop-planning.gif** - Modification du planning par glisser-déposer
3. **validation-flow.gif** - Flux de validation des heures
4. **export-generation.gif** - Génération d'export avec progression

### Méthodologie

```typescript
// Capturer une séquence d'actions
const frames = [];
for (const action of workflow) {
  await performAction(action);
  frames.push(await page.screenshot({ type: 'png' }));
  await page.waitForTimeout(500);
}

// Convertir en GIF
await createGifFromFrames(frames, 'output.gif', {
  delay: 100,
  colors: 64,
  optimize: true
});
```

## Maintenance et mise à jour

### Mise à jour automatique

```bash
# Après modification de l'interface
npm run screenshots:update

# Vérification de la qualité
npm run screenshots:verify
```

### Déclencheurs de mise à jour

Régénérer les screenshots après :
- Modification du design/UI
- Nouvelle fonctionnalité
- Changement de workflow
- Mise à jour majeure

### Validation qualité

Chaque screenshot doit respecter :
- ✅ Résolution 1200x800px
- ✅ Taille < 500KB
- ✅ Annotations visibles
- ✅ Données réalistes
- ✅ Interface complète visible

## Pipeline CI/CD

### GitHub Actions

```yaml
# .github/workflows/screenshots.yml
name: Update Documentation Screenshots

on:
  push:
    paths: ['client/**', 'server/**']

jobs:
  screenshots:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run dev &
      - run: sleep 10
      - run: node scripts/run-screenshots.js
      - uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: docs/screenshots/
```

### Intégration continue

Les screenshots sont mis à jour automatiquement :
- Sur les PRs modifiant l'interface
- Lors des releases
- Via webhook après déploiement

## Troubleshooting

### Erreurs courantes

**1. Serveur non accessible**
```bash
# Vérifier que ClockPilot est démarré
curl http://localhost:5000/health
npm run dev
```

**2. Elements non trouvés**
```bash
# Vérifier les data-testid dans le code
grep -r "data-testid" client/src/
```

**3. Images trop volumineuses**
```bash
# Réoptimiser manuellement
node scripts/optimize-images.js
```

**4. GIFs non générés**
```bash
# Vérifier ImageMagick
convert --version
gifsicle --version
```

### Debugging

```bash
# Mode debug Playwright
DEBUG=pw:api npx tsx scripts/generate-screenshots.ts

# Screenshots en mode visible
HEADED=true npx tsx scripts/generate-screenshots.ts

# Logs détaillés
VERBOSE=true node scripts/run-screenshots.js
```

## Bonnes pratiques

### Design cohérent

- Utiliser les mêmes données de démo
- Respecter la charte graphique ClockPilot
- Maintenir la cohérence entre screenshots

### Annotations efficaces

- Numéroter les étapes dans l'ordre logique
- Utiliser des flèches pour guider l'œil
- Surligner uniquement les éléments importants

### Performance

- Optimiser automatiquement toutes les images
- Utiliser le lazy loading pour les GIFs
- Servir les images depuis un CDN si possible

### Accessibilité

- Fournir un texte alternatif pour chaque image
- Décrire les animations dans le texte
- Maintenir un bon contraste dans les annotations

## Métriques et monitoring

### Taille des assets

```bash
# Vérifier la taille totale
du -sh docs/screenshots/

# Détail par type
find docs/screenshots/ -name "*.png" -exec ls -lh {} \; | awk '{sum+=$5} END {print "PNG total:", sum/1024/1024, "MB"}'
```

### Performance web

- Temps de chargement des pages de documentation
- Taille des bundles avec images
- Core Web Vitals sur les pages avec screenshots

### Utilisation

- Pages de documentation les plus consultées
- Screenshots les plus utiles
- Taux de completion des guides visuels

---

*Documentation mise à jour le 4 janvier 2025*