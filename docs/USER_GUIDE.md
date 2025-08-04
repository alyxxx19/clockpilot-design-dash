# 📖 ClockPilot - Guide Utilisateur

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Première connexion](#première-connexion)
3. [Dashboard](#dashboard)
4. [Saisie des temps](#saisie-des-temps)
5. [Planning](#planning)
6. [Gestion des employés](#gestion-des-employés)
7. [Rapports et exports](#rapports-et-exports)
8. [Profil utilisateur](#profil-utilisateur)
9. [FAQ](#faq)
10. [Dépannage](#dépannage)

## Vue d'ensemble

ClockPilot est votre solution complète pour la gestion des temps de travail. Cette application vous permet de :

- ⏱️ Enregistrer vos heures de travail quotidiennes
- 📅 Consulter votre planning
- 📊 Visualiser vos statistiques personnelles
- 📝 Gérer vos équipes (pour les managers)
- 📋 Générer des rapports détaillés

## Première connexion

### 1. Accès à l'application

Rendez-vous sur l'URL fournie par votre administrateur (exemple : `https://clockpilot.votre-entreprise.com`)

![Écran de connexion](./screenshots/login.png)

### 2. Connexion

1. Saisissez votre **email professionnel**
2. Entrez votre **mot de passe** temporaire (fourni par votre administrateur)
3. Cliquez sur **Se connecter**

### 3. Premier démarrage

Lors de votre première connexion, vous serez invité à :
- Changer votre mot de passe temporaire
- Compléter votre profil (photo, informations personnelles)
- Configurer vos préférences (notifications, langue)

## Dashboard

![Dashboard principal](./screenshots/dashboard.png)

Le tableau de bord vous donne une vue d'ensemble de votre activité :

### Widgets disponibles

1. **Temps du jour** : Vos heures travaillées aujourd'hui
2. **Semaine en cours** : Progression hebdomadaire
3. **Pointage rapide** : Boutons d'entrée/sortie
4. **Planning** : Aperçu de vos prochains créneaux
5. **Statistiques** : Graphiques de performance
6. **Notifications** : Messages importants

### Actions rapides

- 🟢 **Pointer l'arrivée** : Clic sur "Commencer la journée"
- 🔴 **Pointer la sortie** : Clic sur "Terminer la journée"
- ⏸️ **Pause** : Clic sur "Pause déjeuner"
- 📝 **Saisie manuelle** : Bouton "Ajouter une entrée"

## Saisie des temps

![Interface de saisie](./screenshots/time-entry.png)

### Méthodes de saisie

#### 1. Pointage automatique
- Utilisez les boutons du dashboard pour pointer en temps réel
- Le système calcule automatiquement vos heures

#### 2. Saisie manuelle
1. Cliquez sur **"Nouvelle entrée"**
2. Sélectionnez la **date**
3. Renseignez l'**heure de début** et l'**heure de fin**
4. Indiquez la **durée de pause** (en minutes)
5. Ajoutez des **notes** si nécessaire
6. Cliquez sur **"Enregistrer"**

### Validation des données

Le système vérifie automatiquement :
- ✅ **Cohérence des horaires** : L'heure de fin doit être après l'heure de début
- ✅ **Limites légales** : Respect des 10h/jour et 48h/semaine
- ✅ **Pauses obligatoires** : 20 minutes minimum pour les journées > 6h
- ⚠️ **Alertes automatiques** : Notifications en cas de dépassement

### États des entrées

- 🟡 **Brouillon** : Entrée créée mais non soumise
- 🔵 **Soumise** : En attente de validation
- 🟢 **Validée** : Approuvée par votre manager
- 🔴 **Rejetée** : Nécessite des corrections

## Planning

![Vue planning](./screenshots/planning.png)

### Consultation du planning

1. Accédez à l'onglet **"Planning"**
2. Choisissez la vue : **Jour** / **Semaine** / **Mois**
3. Naviguez avec les flèches ou le calendrier

### Fonctionnalités

- 📅 **Vue calendrier** : Visualisation claire de vos créneaux
- 🔄 **Changements** : Demander une modification de planning
- 📱 **Notifications** : Alertes pour les prochains créneaux
- 📊 **Statistiques** : Heures planifiées vs réalisées

### Types de créneaux

- 🟢 **Travail normal** : Créneaux standards
- 🟠 **Heures supplémentaires** : Au-delà de 35h/semaine
- 🔴 **Nuit/Weekend** : Créneaux particuliers
- 🟣 **Formation** : Temps de formation
- 🟤 **Télétravail** : Travail à domicile

## Gestion des employés (Managers)

![Gestion équipe](./screenshots/team-management.png)

*Section accessible uniquement aux managers et administrateurs*

### Liste des employés

1. Accédez à **"Équipe"** dans le menu
2. Consultez la liste de vos collaborateurs
3. Utilisez les filtres pour rechercher :
   - Par nom/prénom
   - Par département
   - Par statut (actif/inactif)
   - Par type de contrat

### Actions disponibles

- 👁️ **Consulter** : Voir le détail d'un employé
- ✏️ **Modifier** : Mettre à jour les informations
- 📊 **Statistiques** : Performances individuelles
- ✅ **Valider les temps** : Approuver les saisies
- 📧 **Notifications** : Envoyer des messages

### Validation des temps

1. Cliquez sur **"Temps à valider"**
2. Consultez les entrées en attente
3. Vérifiez la cohérence des données
4. **Approuvez** ou **Rejetez** avec commentaire

## Rapports et exports

![Interface rapports](./screenshots/reports.png)

### Types de rapports

#### 1. Rapports personnels
- **Feuille de temps mensuelle** : Détail de vos heures
- **Récapitulatif annuel** : Bilan de l'année
- **Heures supplémentaires** : Décompte détaillé

#### 2. Rapports d'équipe (Managers)
- **Présences équipe** : Vue d'ensemble mensuelle
- **Statistiques département** : Analyses par service
- **Plannings vs réalisé** : Écarts de planning

### Génération d'exports

1. Sélectionnez le **type de rapport**
2. Choisissez la **période** (date de début/fin)
3. Sélectionnez les **employés** (si applicable)
4. Choisissez le **format** :
   - 📊 **Excel** : Pour analyses poussées
   - 📄 **PDF** : Pour impression/archivage
   - 📧 **Email** : Envoi automatique

### Filtres avancés

- 📅 **Période** : Jour, semaine, mois, année, personnalisée
- 👥 **Équipes** : Un ou plusieurs départements
- 📊 **Métriques** : Heures normales, supplémentaires, absences
- 🏷️ **Statuts** : Validé, en attente, brouillon

## Profil utilisateur

![Profil utilisateur](./screenshots/profile.png)

### Informations personnelles

Mise à jour de vos données :
- **Photo de profil**
- **Coordonnées** (email, téléphone)
- **Adresse**
- **Informations bancaires** (pour les remboursements)

### Préférences

- 🌐 **Langue** : Français, anglais, espagnol
- 🕐 **Fuseau horaire** : Ajustement automatique
- 📧 **Notifications** : Email, push, SMS
- 🎨 **Thème** : Clair, sombre, automatique

### Sécurité

- 🔒 **Changement de mot de passe**
- 📱 **Authentification à deux facteurs** (2FA)
- 📋 **Historique des connexions**
- 🔐 **Sessions actives**

## FAQ

### Questions générales

**Q : Comment puis-je récupérer mon mot de passe oublié ?**
R : Cliquez sur "Mot de passe oublié" sur la page de connexion et suivez les instructions par email.

**Q : Puis-je saisir mes temps en retard ?**
R : Oui, mais selon la politique de votre entreprise, une validation manager peut être requise.

**Q : Comment modifier une entrée déjà validée ?**
R : Contactez votre manager qui peut "déverrouiller" l'entrée pour modification.

**Q : L'application fonctionne-t-elle sur mobile ?**
R : Oui, ClockPilot est entièrement responsive et optimisé pour mobile.

### Questions techniques

**Q : Que faire si l'application est lente ?**
R : Vérifiez votre connexion internet. Si le problème persiste, contactez le support technique.

**Q : Mes données sont-elles sauvegardées ?**
R : Oui, toutes les données sont automatiquement sauvegardées et chiffrées.

**Q : Puis-je utiliser l'application hors ligne ?**
R : Certaines fonctionnalités de consultation sont disponibles hors ligne, mais la saisie nécessite une connexion.

### Questions sur les calculs

**Q : Comment sont calculées les heures supplémentaires ?**
R : Au-delà de 35h/semaine selon le code du travail français. Les heures de nuit et weekend peuvent avoir des majorations spécifiques.

**Q : Que se passe-t-il si je dépasse 10h par jour ?**
R : Le système génère une alerte automatique. Selon votre convention collective, une validation exceptionnelle peut être requise.

**Q : Comment fonctionnent les pauses obligatoires ?**
R : Pour toute journée > 6h, une pause d'au moins 20 minutes est légalement obligatoire et vérifiée par le système.

## Dépannage

### Problèmes de connexion

**Symptôme** : Impossible de se connecter
**Solutions** :
1. Vérifiez vos identifiants (email/mot de passe)
2. Essayez de réinitialiser votre mot de passe
3. Videz le cache de votre navigateur
4. Contactez votre administrateur

**Symptôme** : Déconnexion fréquente
**Solutions** :
1. Vérifiez la stabilité de votre connexion internet
2. Désactivez les extensions de navigateur
3. Mettez à jour votre navigateur

### Problèmes de saisie

**Symptôme** : Impossible d'enregistrer une entrée
**Solutions** :
1. Vérifiez la cohérence des horaires
2. Contrôlez les limites légales
3. Ajoutez les pauses obligatoires
4. Contactez votre manager si l'entrée nécessite une validation

**Symptôme** : Calculs d'heures incorrects
**Solutions** :
1. Vérifiez les heures de début/fin
2. Contrôlez la durée des pauses
3. Consultez votre contrat pour les spécificités
4. Signalez le problème au support

### Problèmes d'affichage

**Symptôme** : Interface déformée
**Solutions** :
1. Actualisez la page (F5)
2. Changez le niveau de zoom du navigateur
3. Essayez un autre navigateur
4. Vérifiez les extensions installées

**Symptôme** : Données manquantes
**Solutions** :
1. Vérifiez les filtres appliqués
2. Changez la période consultée
3. Contrôlez vos droits d'accès
4. Actualisez la page

### Contact support

📧 **Email** : support@clockpilot.com
📞 **Téléphone** : 01 23 45 67 89
🕒 **Horaires** : 9h-18h du lundi au vendredi
💬 **Chat** : Disponible dans l'application

**Informations à fournir** :
- Votre nom et entreprise
- Description détaillée du problème
- Étapes pour reproduire l'erreur
- Captures d'écran si possible
- Navigateur et version utilisés

---

*Ce guide est mis à jour régulièrement. Version actuelle : 1.0 - Janvier 2024*