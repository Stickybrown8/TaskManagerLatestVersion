# Task Manager – Suivi des tâches clients & Gamification

**Dernière mise à jour : 25 avril 2025**  
Projet développé par [Stickybrown8](https://github.com/Stickybrown8)

---

## ✨ Présentation

Task Manager est une application web moderne pensée pour les freelances et professionnels souhaitant suivre efficacement leurs clients, tâches et objectifs, tout en rendant cette gestion plus motivante grâce à la gamification.

L’application facilite le pilotage de la rentabilité, l’analyse d’impact (80/20), la gestion par objectifs, et met l’accent sur l’expérience utilisateur avec badges, points, notifications et effets visuels.  
Elle inclut un système avancé de timer et de calcul automatique du taux horaire effectif par client, réinitialisé chaque début de mois, avec alertes et visualisation des seuils de rentabilité.

---

## 🚀 Fonctionnalités principales

- **Gestion des clients**
  - Création, modification, suppression de fiches clients
  - Historique des actions par client
  - Définition du forfait client (ex : 1000 €/mois) et du taux horaire objectif (ex : 100 €/h minimum)

- **Gestion des tâches**
  - Ajout, modification, suppression, marquage terminé
  - Priorisation (analyse 80/20), sous-tâches, filtres avancés

- **Timer intelligent & suivi de rentabilité mensuel**
  - Démarrage d’un chronomètre dédié à chaque tâche/client
  - Calcul automatique du temps passé et du taux horaire effectif, réinitialisé chaque 1er du mois
  - Affichage couleur du taux horaire : vert (rentable), rouge (sous le seuil)
  - Alerte automatique si le nombre d’heures max pour rester rentable est dépassé (notification visuelle/sonore)
  - Notifications pour ajuster la charge de travail ou prévenir le client
  - Vue graphique et détail du temps passé sur la période sélectionnée

- **Tableau de bord de rentabilité avancé**
  - Résumé global : heures passées, heures restantes, rentabilité totale
  - Liste de tous les clients avec leur rentabilité actuelle
  - Filtrage par date personnalisable (mois, semaine, plage libre…)

- **Vue de rentabilité par client**
  - Statistiques détaillées : taux horaire effectif, budget mensuel, revenus générés, pourcentage de rentabilité
  - Graphiques d’évolution (ex : temps passé par jour)
  - Liste détaillée des entrées de temps (tâche, durée, facturable, montant)
  - Filtre par plage de dates (ex : visualiser sur un mois, une semaine ou une période personnalisée)

- **Gestion des objectifs**
  - Définition d’objectifs par client (valeur cible, progression, unité, échéance)
  - Suivi en temps réel et visualisation des progrès
  - Lien/délien de tâches à un objectif
  - Vue spéciale pour les objectifs à fort impact

- **Gamification & engagement**
  - Points d’action, niveaux, badges (rares, communs), défis
  - Effets visuels (confettis, notifications), effets sonores
  - Streak de connexion quotidienne, progression visible, récompenses rentabilité

- **Sécurité & expérience**
  - Authentification JWT sécurisée
  - Gestion des droits via tokens
  - Interface responsive, expérience utilisateur optimisée

---

## 🏗️ Stack technique

- **Frontend** :  
  - React (TypeScript)
  - Styled Components, React Context/Redux, Axios
  - Déployé sur Render (https://render.com)

- **Backend** :  
  - Node.js, Express.js (TypeScript & JavaScript)
  - MongoDB Atlas (base de données cloud)
  - Authentification JWT, API RESTful
  - Déployé sur Render (https://render.com)

- **Autres outils** :
  - Vercel (optionnel pour tests ou démo rapide)
  - Dotenv, ESLint, Prettier, Husky, etc.

---

## 📂 Structure du projet

```
TaskManagerLatestVersion/
│
├── backend/
│   ├── routes/           # Routes Express (tasks, clients, objectives, gamification, profitability, etc.)
│   ├── models/           # Modèles Mongoose (User, Client, Task, Objective, Profitability, Badge...)
│   ├── middleware/       # Auth, gestion des droits
│   ├── server.js         # Point d'entrée du backend
│   └── ...               # Autres fichiers backend
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Composants React (UI, widgets, dashboards, popups…)
│   │   ├── pages/        # Pages principales (Tableau de bord, Rentabilité client, etc.)
│   │   ├── services/     # Services API (objectifs, rentabilité, gamification, auth…)
│   │   ├── store/        # Stores, context, initial states
│   │   └── ...           # Autres
│   └── ...               # Config, assets, etc.
│
├── guide_deploiement.md  # Guide pas-à-pas pour le déploiement cloud
└── README.md             # (Vous êtes ici)
```

---

## ✏️ Prise en main rapide

### 1. Cloner le projet

```bash
git clone https://github.com/Stickybrown8/TaskManagerLatestVersion.git
cd TaskManagerLatestVersion
```

### 2. Configuration des variables d’environnement

Créer les fichiers `.env` à la racine du backend et du frontend (voir guide_deploiement.md pour le détail des variables : API_URL, MONGO_URI, JWT_SECRET, etc.)

### 3. Lancer en local

#### Backend

```bash
cd backend
npm install
npm run dev
```

#### Frontend

```bash
cd frontend
npm install
npm start
```

L’application sera accessible à l’adresse [http://localhost:3000](http://localhost:3000)

---

## ☁️ Déploiement cloud (Render)

Voir `guide_deploiement.md` pour le pas-à-pas détaillé (screenshots inclus).

Résumé :

1. **MongoDB Atlas** : Créer un cluster cloud gratuit, configurer les accès et récupérer la chaîne de connexion.
2. **Render (Backend)** :  
   - Nouveau Web Service → connecter GitHub → choisir ce repo → Node → npm install & npm start
   - Ajouter les variables d’environnement (PORT, MONGO_URI, JWT_SECRET)
3. **Render (Frontend)** :  
   - Nouveau Web Service → connecter GitHub → choisir ce repo → React → npm install & npm run build
   - Ajouter la variable `REACT_APP_API_URL` pointant vers l’URL de l’API backend Render

---

## 🧑‍💻 Fonctionnalités détaillées

### Timer intelligent & rentabilité mensuelle

- **Démarrage/arrêt du chronomètre** sur chaque tâche/client
- **Calcul automatique du taux horaire effectif**, réinitialisé chaque 1er du mois
- **Code couleur et alertes** :  
  - Taux > objectif (ex : 100 €/h) → vert  
  - Taux < objectif → rouge + alerte visuelle/sonore
- **Alerte si le temps maximum est dépassé**  
  - Exemple : pour un client à 1000 €/mois, objectif 100 €/h :  
    - Si tu travailles 5h, taux = 200 €/h (vert)  
    - Si tu travailles 20h, taux = 50 €/h (rouge, alerte, notification)
- **Notifications** pour t’informer de la rentabilité en temps réel et ajuster ta charge de travail.
- **Affichage par mois** : le timer et les calculs sont réinitialisés automatiquement chaque début de mois pour un suivi précis.

### Tableau de bord de rentabilité

- **Vue globale** : Statistiques de rentabilité pour tous les clients sur la période de ton choix (mois, semaine, plage personnalisée)
- **Détail par client** :  
  - Taux horaire effectif, budget mensuel, revenus générés, rentabilité, graphiques d’évolution, liste détaillée des temps passés
  - Filtre par dates personnalisables

### Gestion des clients et tâches

- Ajout, édition, suppression de clients/tâches
- Affectation des tâches à des clients
- Marquage terminé, priorisation, sous-tâches, filtres multiples
- Popup chronomètre (suivi du temps, drag & resize)

### Objectifs & progression

- Définir des objectifs par client : titre, description, valeur cible, unité, échéance, catégorie
- Suivi de progression en temps réel
- Lien/délien tâches ↔ objectifs

### Gamification

- Points, badges, niveaux, effets visuels et sonores
- Streak quotidien, défis à relever
- Notifications de progression, page “gamification” dédiée
- Récompenses spécifiques pour la rentabilité

---

## 🧪 Vérification & tests

Après déploiement :

- Testez la création de compte et la connexion
- Ajoutez/éditez/supprimez des clients et tâches
- Définissez des objectifs, liez des tâches, vérifiez la progression
- Testez le suivi de rentabilité, l’analyse d’impact (80/20)
- Profitez des effets gamification (points, badges, confettis, sons…)
- **Utilisez le timer** pour vérifier les alertes de taux horaire et la rentabilité mensuelle
- **Consultez le tableau de bord** (global et clients) et filtrez par date pour visualiser vos résultats

---

## 🛠️ Dépannage

- **Lenteur** : Les plans gratuits de Render et MongoDB Atlas ont des limitations, passer à une offre payante si besoin.
- **Erreurs de connexion** : Vérifier la configuration des variables d’environnement.
- **Problème d’authentification** : Vérifier le JWT_SECRET et les headers envoyés par le frontend.

---

## 📄 Licence

Ce projet est open source sous licence MIT.

---

## 🙋‍♂️ Contact & feedback

Pour toute question, suggestion ou bug, ouvrez une issue sur GitHub  
Ou contactez : contact@digitalmarketing-beyond.com

---

## ⭐ TODO / Roadmap

- [ ] Ajout d’un mode “multi-utilisateur” pour agences
- [ ] Statistiques avancées (export PDF/CSV)
- [ ] Intégration calendrier (Google/Outlook)
- [ ] Notifications email/push
- [ ] Traduction multilingue

---

## 🔗 Ressources

- [Guide de déploiement complet](./guide_deploiement.md)
- [Historique des commits](https://github.com/Stickybrown8/TaskManagerLatestVersion/commits)
- [Render](https://render.com)
- [MongoDB Atlas](https://www.mongodb.com/atlas)
