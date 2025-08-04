# 🕐 ClockPilot - Système de Gestion des Temps

![ClockPilot Banner](./attached_assets/clockpilot-banner.png)

ClockPilot est une solution complète de gestion des temps et de planification pour les entreprises, conçue pour assurer la conformité avec la réglementation française du travail tout en offrant une interface utilisateur moderne et intuitive.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Utilisation](#utilisation)
- [Architecture](#architecture)
- [Tests](#tests)
- [Déploiement](#déploiement)
- [Contributing](#contributing)
- [Support](#support)

## ✨ Fonctionnalités

### 🔐 Authentification & Autorisation
- Système JWT sécurisé avec refresh tokens
- Gestion des rôles (Admin, Manager, Employee)
- Protection des routes et API endpoints

### 👥 Gestion des Employés
- CRUD complet avec pagination avancée
- Système de filtrage multi-critères
- Export Excel/PDF des données
- Gestion des départements et hiérarchies

### 📅 Planning & Horaires
- Planification visuelle par calendrier
- Auto-génération des plannings
- Validation workflow avec approbations
- Détection automatique des conflits

### ⏱️ Saisie des Temps
- Interface intuitive de pointage
- Calcul automatique des heures travaillées
- Gestion des pauses et heures supplémentaires
- Validation des contraintes légales françaises

### ⚖️ Conformité Légale
- Respect des limites légales (10h/jour, 48h/semaine)
- Gestion des temps de repos obligatoires (11h minimum)
- Alertes automatiques sur les dépassements
- Pauses obligatoires pour journées > 6h

### 📊 Reporting & Analytics
- Tableaux de bord personnalisables
- Statistiques détaillées par employé/département
- Export des rapports en multiple formats
- Suivi des anomalies et alertes

## 🔧 Prérequis

### Développement
- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **npm** >= 8.0.0

### Production
- **Docker** >= 20.10
- **Docker Compose** >= 2.0
- **Nginx** (recommandé pour reverse proxy)

## 🚀 Installation

### 1. Cloner le repository
```bash
git clone https://github.com/votre-org/clockpilot.git
cd clockpilot
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration de la base de données
```bash
# Créer la base de données PostgreSQL
createdb clockpilot_dev

# Appliquer les migrations
npm run db:push
```

### 4. Configuration des variables d'environnement
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables selon votre environnement
nano .env
```

### 5. Démarrer l'application
```bash
# Mode développement
npm run dev

# Mode production
npm run build
npm start
```

L'application sera accessible sur `http://localhost:5000`

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` basé sur `.env.example` :

```bash
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/clockpilot
PGHOST=localhost
PGPORT=5432
PGUSER=clockpilot_user
PGPASSWORD=your_secure_password
PGDATABASE=clockpilot

# JWT & Sécurité
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret-key
BCRYPT_ROUNDS=12

# Application
NODE_ENV=development
PORT=5000

# Stockage d'objets (optionnel)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=clockpilot-bucket
PRIVATE_OBJECT_DIR=/private
PUBLIC_OBJECT_SEARCH_PATHS=/public

# Monitoring (production)
SENTRY_DSN=https://your-sentry-dsn
LOG_LEVEL=info
```

### Configuration de la base de données

Le système utilise Drizzle ORM avec PostgreSQL. Les migrations sont gérées automatiquement :

```bash
# Générer les migrations
npm run db:generate

# Appliquer les migrations
npm run db:push

# Interface d'administration
npm run db:studio
```

## 📱 Utilisation

### Interface Utilisateur

1. **Connexion** : Accédez à l'application et connectez-vous avec vos identifiants
2. **Dashboard** : Vue d'ensemble des activités et statistiques
3. **Saisie des temps** : Enregistrez vos heures de travail quotidiennes
4. **Planning** : Consultez et gérez vos horaires
5. **Rapports** : Accédez aux statistiques et exports

### API REST

L'API est documentée avec Swagger/OpenAPI à l'adresse `/api/docs`

Endpoints principaux :
- `POST /api/auth/login` - Authentification
- `GET /api/employees` - Liste des employés
- `POST /api/time-entries` - Création d'entrée de temps
- `GET /api/planning` - Consultation du planning

## 🏗️ Architecture

```
clockpilot/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Hooks React personnalisés
│   │   ├── lib/            # Utilitaires et configuration
│   │   └── contexts/       # Context React
├── server/                 # Backend Express.js
│   ├── routes.ts           # Routes API
│   ├── storage.ts          # Couche d'accès aux données
│   ├── db.ts              # Configuration base de données
│   └── businessLogic.ts    # Logique métier
├── shared/                 # Types et schémas partagés
│   └── schema.ts          # Schémas Drizzle
├── tests/                  # Tests automatisés
└── docs/                   # Documentation
```

### Stack Technologique

**Frontend :**
- React 18 avec Vite
- TypeScript pour la sécurité des types
- TanStack Query pour la gestion d'état
- Tailwind CSS + shadcn/ui pour l'interface
- Wouter pour le routing

**Backend :**
- Express.js avec TypeScript
- Drizzle ORM pour la base de données
- JWT pour l'authentification
- Zod pour la validation des données
- WebSocket pour les notifications temps réel

**Base de données :**
- PostgreSQL pour les données principales
- Redis pour le cache (optionnel)

## 🧪 Tests

Suite de tests complète avec couverture de code 70%+ :

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
```

### Types de tests
- **Tests unitaires** : Logique métier et utilitaires
- **Tests d'intégration** : API endpoints et flows complets
- **Tests de composants** : Interface utilisateur React
- **Tests E2E** : Parcours utilisateur complets

## 🚢 Déploiement

### Docker (Recommandé)

```bash
# Build de l'image
docker build -t clockpilot .

# Démarrage avec docker-compose
docker-compose up -d
```

### Déploiement manuel

```bash
# Build de l'application
npm run build

# Démarrage en production
NODE_ENV=production npm start
```

### Configuration Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Sécurité

- Authentification JWT avec rotation des tokens
- Protection CSRF et XSS
- Rate limiting sur les API
- Validation stricte des entrées
- Headers de sécurité avec Helmet.js
- Logs d'audit complets

## 📝 Scripts Disponibles

```bash
# Développement
npm run dev              # Démarrage en mode développement
npm run build           # Build de production
npm start              # Démarrage de production

# Base de données
npm run db:generate    # Générer les migrations
npm run db:push       # Appliquer les migrations
npm run db:studio     # Interface d'administration
npm run seed:db       # Données de démonstration

# Tests
npm run test          # Tous les tests
npm run test:coverage # Tests avec couverture
npm run test:e2e      # Tests end-to-end

# Utilitaires
npm run lint          # Vérification du code
npm run format        # Formatage automatique
npm run backup:db     # Sauvegarde de la base
```

## 🤝 Contributing

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amazing-feature`)
3. Committez vos changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrez une Pull Request

### Standards de code
- TypeScript strict mode
- ESLint + Prettier pour le formatage
- Tests obligatoires pour les nouvelles fonctionnalités
- Documentation des API avec JSDoc

## 📞 Support

- **Documentation** : [docs/](./docs/)
- **Issues** : [GitHub Issues](https://github.com/votre-org/clockpilot/issues)
- **Email** : support@clockpilot.com
- **Wiki** : [GitHub Wiki](https://github.com/votre-org/clockpilot/wiki)

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

**ClockPilot** - Simplifions la gestion des temps 🚀