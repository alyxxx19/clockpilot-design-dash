# Screenshots Documentation

Ce dossier contient toutes les captures d'écran pour la documentation utilisateur de ClockPilot.

## Structure

```
docs/screenshots/
├── login/
│   ├── login-page.png
│   ├── login-error.png
│   └── login-success.png
├── employee/
│   ├── dashboard.png
│   ├── planning-month.png
│   ├── time-tracking.png
│   ├── manual-entry.png
│   ├── reports.png
│   └── profile.png
├── admin/
│   ├── dashboard.png
│   ├── employees-list.png
│   ├── employee-create.png
│   ├── validation.png
│   └── export-dialog.png
├── gifs/
│   ├── punch-process.gif
│   ├── drag-drop-planning.gif
│   ├── validation-flow.gif
│   └── export-generation.gif
└── README.md
```

## Spécifications

- **Format**: PNG optimisé
- **Résolution**: 1200x800px
- **Compression**: Optimisée pour web
- **Annotations**: Flèches et numéros pour les éléments importants

## Liste des captures

### Pages de connexion
- [ ] `login/login-page.png` - Page de connexion principale
- [ ] `login/login-error.png` - Message d'erreur de connexion
- [ ] `login/login-success.png` - Redirection après connexion

### Interface employé
- [ ] `employee/dashboard.png` - Tableau de bord employé
- [ ] `employee/planning-month.png` - Vue planning mensuel
- [ ] `employee/time-tracking.png` - Interface pointage temps réel
- [ ] `employee/manual-entry.png` - Formulaire saisie manuelle
- [ ] `employee/reports.png` - Page rapports avec graphiques
- [ ] `employee/profile.png` - Page profil utilisateur

### Interface administrateur
- [ ] `admin/dashboard.png` - Tableau de bord admin
- [ ] `admin/employees-list.png` - Liste des employés
- [ ] `admin/employee-create.png` - Création d'employé
- [ ] `admin/validation.png` - Workflow de validation
- [ ] `admin/export-dialog.png` - Dialog d'export

### GIFs animés
- [ ] `gifs/punch-process.gif` - Processus de pointage complet
- [ ] `gifs/drag-drop-planning.gif` - Drag & drop dans le planning
- [ ] `gifs/validation-flow.gif` - Flux de validation des heures
- [ ] `gifs/export-generation.gif` - Génération d'export

## Données de démonstration

Les captures utilisent des données réalistes :

### Employés
- Jean Dupont (Développeur Senior)
- Marie Martin (Designer UX/UI)
- Pierre Durand (Chef de projet)
- Claire Rousseau (Chargée de communication)

### Projets
- Application Mobile ClockPilot
- Site Web Corporate
- API Integration
- Formation équipe

### Départements
- Développement (15 employés)
- Design (8 employés)
- Marketing (5 employés)
- RH (3 employés)

## Génération automatique

Les screenshots sont générés automatiquement via le script :
```bash
npm run screenshots:generate
```

Ce script utilise Playwright pour :
1. Se connecter avec des comptes de test
2. Naviguer vers chaque page
3. Injecter des données de démonstration
4. Prendre les captures aux bonnes dimensions
5. Optimiser les images
6. Générer les GIFs pour les workflows

## Mise à jour

Les captures doivent être mises à jour à chaque :
- Changement d'interface majeur
- Nouvelle fonctionnalité
- Modification du design
- Mise à jour de la documentation

## Optimisation

- Compression PNG avec `pngquant`
- GIFs optimisés avec `gifsicle`
- Taille maximale : 500KB par image
- Palette de couleurs réduite pour les GIFs