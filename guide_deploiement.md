# Guide de déploiement - Application de suivi des tâches clients avec gamification

Ce guide détaillé vous aidera à déployer votre application de suivi des tâches clients avec gamification, même si vous n'avez aucune expérience en déploiement. Nous utiliserons des services gratuits pour héberger chaque partie de l'application :

- **MongoDB Atlas** pour la base de données
- **Render** pour le backend (API)
- **Vercel** pour le frontend (interface utilisateur)

## Table des matières

1. [Prérequis](#prérequis)
2. [Déploiement de la base de données avec MongoDB Atlas](#déploiement-de-la-base-de-données-avec-mongodb-atlas)
3. [Déploiement du backend avec Render](#déploiement-du-backend-avec-render)
4. [Déploiement du frontend avec Vercel](#déploiement-du-frontend-avec-vercel)
5. [Configuration finale et connexion des services](#configuration-finale-et-connexion-des-services)
6. [Vérification et test de l'application](#vérification-et-test-de-lapplication)
7. [Dépannage](#dépannage)

## Prérequis

Avant de commencer, vous aurez besoin de créer des comptes gratuits sur les plateformes suivantes :

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
- [Render](https://render.com/)
- [Vercel](https://vercel.com/signup)
- [GitHub](https://github.com/join) (pour stocker votre code)

Vous aurez également besoin de télécharger le code source de l'application que nous avons développée.

## Déploiement de la base de données avec MongoDB Atlas

MongoDB Atlas est un service de base de données cloud qui offre un niveau gratuit parfait pour notre application.

### Étape 1 : Créer un compte MongoDB Atlas

1. Rendez-vous sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) et créez un compte gratuit.
2. Après avoir créé votre compte et vous être connecté, vous serez invité à créer votre premier cluster.

### Étape 2 : Créer un cluster gratuit

1. Sélectionnez l'option "Shared" (gratuite) pour votre cluster.
2. Choisissez un fournisseur cloud (AWS, Google Cloud ou Azure) et une région proche de vous géographiquement.
3. Laissez les autres paramètres par défaut et cliquez sur "Create Cluster".
4. La création du cluster peut prendre quelques minutes.

![Création d'un cluster MongoDB Atlas](https://example.com/images/mongodb-create-cluster.png)

### Étape 3 : Configurer l'accès à la base de données

1. Une fois le cluster créé, cliquez sur "Database Access" dans le menu de gauche.
2. Cliquez sur "Add New Database User".
3. Créez un utilisateur avec un nom d'utilisateur et un mot de passe sécurisé. Notez ces informations, vous en aurez besoin plus tard.
4. Attribuez le rôle "Read and Write to Any Database" à cet utilisateur.
5. Cliquez sur "Add User".

![Création d'un utilisateur MongoDB](https://example.com/images/mongodb-create-user.png)

### Étape 4 : Configurer l'accès réseau

1. Cliquez sur "Network Access" dans le menu de gauche.
2. Cliquez sur "Add IP Address".
3. Pour simplifier le déploiement, sélectionnez "Allow Access from Anywhere" (0.0.0.0/0).
   - Note : Dans un environnement de production réel, vous devriez restreindre l'accès à des adresses IP spécifiques.
4. Cliquez sur "Confirm".

![Configuration de l'accès réseau MongoDB](https://example.com/images/mongodb-network-access.png)

### Étape 5 : Obtenir la chaîne de connexion

1. Cliquez sur "Clusters" dans le menu de gauche.
2. Cliquez sur "Connect" pour votre cluster.
3. Sélectionnez "Connect your application".
4. Copiez la chaîne de connexion fournie. Elle ressemblera à ceci :
   ```
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
   ```
5. Remplacez `<username>` et `<password>` par les informations de l'utilisateur que vous avez créé.
6. Remplacez `myFirstDatabase` par `task_manager`.
7. Conservez cette chaîne de connexion, vous en aurez besoin pour configurer le backend.

![Obtention de la chaîne de connexion MongoDB](https://example.com/images/mongodb-connection-string.png)

## Déploiement du backend avec Render

Render est une plateforme cloud moderne qui offre un hébergement gratuit pour les applications web.

### Étape 1 : Créer un compte Render

1. Rendez-vous sur [Render](https://render.com/) et créez un compte gratuit.
2. Vous pouvez vous inscrire avec votre compte GitHub pour simplifier le processus.

### Étape 2 : Créer un nouveau service Web

1. Une fois connecté à votre tableau de bord Render, cliquez sur "New" puis "Web Service".
2. Connectez votre compte GitHub si ce n'est pas déjà fait.
3. Sélectionnez le dépôt contenant votre application.
4. Configurez le service :
   - **Name** : `task-manager-api` (ou un nom de votre choix)
   - **Environment** : Node
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
   - **Plan** : Free

![Création d'un service web sur Render](https://example.com/images/render-create-service.png)

### Étape 3 : Configurer les variables d'environnement

1. Faites défiler jusqu'à la section "Environment Variables".
2. Ajoutez les variables suivantes :
   - `PORT` : `8080`
   - `MONGO_URI` : [Votre chaîne de connexion MongoDB Atlas]
   - `JWT_SECRET` : [Une chaîne aléatoire pour sécuriser les jetons JWT]

![Configuration des variables d'environnement sur Render](https://example.com/images/render-env-variables.png)

### Étape 4 : Déployer le service

1. Cliquez sur "Create Web Service".
2. Render va automatiquement déployer votre application. Ce processus peut prendre quelques minutes.
3. Une fois le déploiement terminé, vous verrez un message de succès et une URL pour accéder à votre API (par exemple, `https://task-manager-api.onrender.com`).
4. Notez cette URL, vous en aurez besoin pour configurer le frontend.

![Déploiement réussi sur Render](https://example.com/images/render-deployment-success.png)

## Déploiement du frontend avec Vercel

Vercel est une plateforme optimisée pour le déploiement d'applications frontend, particulièrement adaptée aux applications React.

### Étape 1 : Créer un compte Vercel

1. Rendez-vous sur [Vercel](https://vercel.com/signup) et créez un compte gratuit.
2. Vous pouvez vous inscrire avec votre compte GitHub pour simplifier le processus.

### Étape 2 : Configurer le frontend pour le déploiement

1. Dans le code source de votre application, ouvrez le fichier `.env.production` dans le dossier `frontend`.
2. Modifiez la variable `REACT_APP_API_URL` pour qu'elle pointe vers l'URL de votre backend Render :
   ```
   REACT_APP_API_URL=https://task-manager-api.onrender.com
   ```
3. Enregistrez le fichier et poussez les modifications vers votre dépôt GitHub.

### Étape 3 : Importer le projet sur Vercel

1. Une fois connecté à votre tableau de bord Vercel, cliquez sur "New Project".
2. Importez votre dépôt GitHub contenant l'application.
3. Configurez le projet :
   - **Framework Preset** : Create React App
   - **Root Directory** : `frontend` (si votre frontend est dans un sous-dossier)
   - **Build Command** : `npm run build`
   - **Output Directory** : `build`

![Importation d'un projet sur Vercel](https://example.com/images/vercel-import-project.png)

### Étape 4 : Configurer les variables d'environnement

1. Faites défiler jusqu'à la section "Environment Variables".
2. Ajoutez la variable suivante :
   - `REACT_APP_API_URL` : [URL de votre backend Render]

![Configuration des variables d'environnement sur Vercel](https://example.com/images/vercel-env-variables.png)

### Étape 5 : Déployer le frontend

1. Cliquez sur "Deploy".
2. Vercel va automatiquement construire et déployer votre application. Ce processus peut prendre quelques minutes.
3. Une fois le déploiement terminé, vous verrez un message de succès et une URL pour accéder à votre application (par exemple, `https://task-manager.vercel.app`).

![Déploiement réussi sur Vercel](https://example.com/images/vercel-deployment-success.png)

## Configuration finale et connexion des services

### Étape 1 : Vérifier la connexion entre le frontend et le backend

1. Ouvrez votre application déployée sur Vercel dans un navigateur.
2. Essayez de vous inscrire ou de vous connecter.
3. Si tout est correctement configuré, vous devriez pouvoir créer un compte et vous connecter.

### Étape 2 : Initialiser les données de base (optionnel)

Si vous souhaitez pré-remplir votre application avec des données de démonstration, vous pouvez utiliser l'API pour créer des clients, des tâches et des objectifs de test.

## Vérification et test de l'application

Maintenant que votre application est déployée, prenez le temps de tester toutes les fonctionnalités pour vous assurer qu'elles fonctionnent correctement :

1. **Création de compte et connexion** : Créez un nouveau compte et connectez-vous.
2. **Gestion des clients** : Ajoutez, modifiez et supprimez des clients.
3. **Gestion des tâches** : Créez des tâches, marquez-les comme terminées, utilisez la priorisation 80/20.
4. **Objectifs clients** : Définissez des objectifs pour vos clients et suivez leur progression.
5. **Suivi de rentabilité** : Vérifiez que le suivi de rentabilité fonctionne correctement avec les taux horaires personnalisés.
6. **Chronométrage des tâches** : Testez la popup de chronométrage, assurez-vous qu'elle est redimensionnable et déplaçable.

## Dépannage

Si vous rencontrez des problèmes lors du déploiement ou de l'utilisation de l'application, voici quelques solutions aux problèmes courants :

### Le frontend ne peut pas se connecter au backend

1. Vérifiez que l'URL du backend dans les variables d'environnement du frontend est correcte.
2. Assurez-vous que le backend est en cours d'exécution sur Render.
3. Vérifiez les journaux du backend sur Render pour identifier d'éventuelles erreurs.

### Erreurs de base de données

1. Vérifiez que la chaîne de connexion MongoDB dans les variables d'environnement du backend est correcte.
2. Assurez-vous que l'utilisateur MongoDB a les autorisations nécessaires.
3. Vérifiez que l'accès réseau est correctement configuré dans MongoDB Atlas.

### L'application est lente

Les niveaux gratuits de Render et MongoDB Atlas ont des limitations de performances. Si votre application devient populaire, vous devrez peut-être passer à un plan payant pour améliorer les performances.

---

Félicitations ! Votre application de suivi des tâches clients avec gamification est maintenant déployée et accessible depuis n'importe où. Vous pouvez partager l'URL de votre application avec vos collaborateurs ou l'utiliser vous-même pour suivre vos clients et vos tâches de manière ludique et efficace.

Si vous avez des questions ou besoin d'aide supplémentaire, n'hésitez pas à nous contacter.
