# Guide de déploiement – Application de suivi des tâches clients avec gamification

Ce guide pas-à-pas vous explique comment déployer l’application, que vous soyez débutant ou confirmé.  
**À jour pour : Backend + Frontend sur Render, MongoDB Atlas pour la base de données.**

---

## Table des matières

1. [Prérequis](#prérequis)
2. [Déploiement de la base de données avec MongoDB Atlas](#déploiement-de-la-base-de-données-avec-mongodb-atlas)
3. [Déploiement du backend avec Render](#déploiement-du-backend-avec-render)
4. [Déploiement du frontend avec Render](#déploiement-du-frontend-avec-render)
5. [Configuration finale et connexion des services](#configuration-finale-et-connexion-des-services)
6. [Vérification et test de l’application](#vérification-et-test-de-lapplication)
7. [Dépannage](#dépannage)

---

## Prérequis

Avant de commencer, créez un compte gratuit sur chacune de ces plateformes :

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (base de données cloud)
- [Render](https://render.com/) (hébergement Backend & Frontend)
- [GitHub](https://github.com/join) (pour stocker et déployer votre code)

Téléchargez/cloner le code source depuis GitHub.

---

## Déploiement de la base de données avec MongoDB Atlas

1. **Créer un compte MongoDB Atlas**  
   Inscrivez-vous puis connectez-vous.

2. **Créer un cluster**  
   - Choisissez l’option "Shared" (gratuite)
   - Sélectionnez un fournisseur cloud (AWS, GCP, Azure) & région proche
   - Démarrez la création du cluster (quelques minutes)

3. **Ajouter un utilisateur à la base**  
   - Menu "Database Access" > "Add New Database User"
   - Créez un utilisateur/mot de passe sécurisé (à conserver)
   - Rôle : "Read and Write to Any Database"

4. **Configurer l’accès réseau**  
   - Menu "Network Access" > "Add IP Address"
   - Sélectionnez "Allow Access from Anywhere" (0.0.0.0/0) pour les tests/démo
   - Validez

5. **Récupérer la chaîne de connexion**  
   - Menu "Clusters" > "Connect" > "Connect your application"
   - Copiez la chaîne, remplacez `<username>`, `<password>` et `myFirstDatabase` par vos valeurs, par exemple :  
     `mongodb+srv://user:motdepasse@cluster0.mongodb.net/task_manager?retryWrites=true&w=majority`
   - Gardez cette URL : elle sera utilisée sur Render

---

## Déploiement du backend avec Render

1. **Créer un service Web Backend**
   - Connectez-vous à [Render](https://render.com/)
   - Cliquez sur “New” > “Web Service”
   - Connectez votre GitHub si besoin, sélectionnez ce dépôt

2. **Configuration du service**
   - **Name** : `task-manager-backend` (ou autre)
   - **Environment** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free

3. **Variables d’environnement**
   - Dans “Environment Variables” ajoutez :
     - `PORT` : `8080` (ou laissez vide pour port automatique)
     - `MONGO_URI` : (votre chaîne MongoDB Atlas)
     - `JWT_SECRET` : (une chaîne secrète longue et aléatoire)

4. **Déployer**
   - Cliquez sur “Create Web Service”
   - Attendez la fin du déploiement et notez l’URL publique du backend (ex : `https://task-manager-backend.onrender.com`)

---

## Déploiement du frontend avec Render

1. **Créer un service Web Frontend**
   - Depuis Render, “New” > “Web Service”
   - Sélectionnez à nouveau votre dépôt GitHub

2. **Configuration du service**
   - **Name** : `task-manager-frontend` (ou autre)
   - **Root Directory** : `frontend`
   - **Environment** : Node
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npx serve -s build` (ou équivalent pour servir une app React)
   - **Plan** : Free

3. **Variables d’environnement**
   - Dans “Environment Variables” ajoutez :
     - `REACT_APP_API_URL` : (URL de votre backend Render, ex : `https://task-manager-backend.onrender.com`)

4. **Déployer**
   - Cliquez sur “Create Web Service”
   - Attendez la fin du déploiement et notez l’URL publique du frontend (ex : `https://task-manager-frontend.onrender.com`)

---

## Configuration finale et connexion des services

1. **Vérifiez que le backend fonctionne**  
   Rendez-vous sur l’URL Render du backend, vous devriez obtenir un message JSON indiquant que l’API fonctionne.

2. **Vérifiez le frontend**  
   Accédez à l’URL Render du frontend. Essayez la création de compte, la connexion, la gestion des clients/tâches/objectifs, etc.

3. **Si besoin, modifiez les variables d’environnement**  
   Pour corriger une URL ou un secret, allez dans les settings du service Render, modifiez, et redéployez.

---

## Vérification et test de l’application

1. **Création de compte & connexion**
2. **Gestion des clients** : ajout, modification, suppression
3. **Gestion des tâches** : création, suivi, priorisation 80/20, chronométrage (timer)
4. **Objectifs** : définition, progression, lien avec les tâches
5. **Rentabilité** : vérifiez les dashboards (global et par client), taux horaire, alertes, filtres par date
6. **Gamification** : points, badges, notifications, streaks

---

## Dépannage

- **Le frontend ne peut pas se connecter au backend**
  - Vérifiez l’URL dans `REACT_APP_API_URL`
  - Vérifiez que le backend est “Healthy” sur Render
  - Consultez les logs Render (Backend et Frontend)

- **Problèmes MongoDB**
  - Vérifiez la chaîne `MONGO_URI`
  - L’utilisateur MongoDB a-t-il le bon rôle ?
  - L’IP est-elle bien autorisée (“Network Access”) ?

- **Performance**
  - Les plans gratuits Render/MongoDB sont limités : prévoir upgrade si besoin

- **Variables d’environnement**
  - Un oubli, une faute de frappe ou un oubli de redéploiement peut empêcher l’app de fonctionner

---

## Félicitations !

Votre application de suivi des tâches clients avec gamification, rentabilité avancée et timer intelligent est maintenant accessible partout.  
Partagez l’URL, utilisez-la, ou personnalisez-la selon vos besoins !

Pour toute question ou problème, ouvrez une issue sur GitHub ou contactez : contact@digitalmarketing-beyond.com