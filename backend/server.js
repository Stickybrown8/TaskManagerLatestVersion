/*
 * FICHIER PRINCIPAL DU SERVEUR - backend/server.js
 *
 * Explication simple:
 * Ce fichier est le cerveau de notre application. C'est lui qui démarre le serveur,
 * connecte la base de données, et dirige toutes les demandes vers le bon endroit,
 * comme un chef d'orchestre qui coordonne tous les musiciens. Il s'assure aussi que
 * tout fonctionne de manière sécurisée et gère les erreurs qui pourraient survenir.
 *
 * Explication technique:
 * Point d'entrée principal de l'application backend Node.js utilisant Express.js,
 * responsable de l'initialisation du serveur HTTP, de la connexion à MongoDB,
 * de la configuration des middlewares de sécurité et du montage des routes API.
 *
 * Où ce fichier est utilisé:
 * Appelé directement par les commandes de démarrage (npm start, npm run dev)
 * et est le point de départ de toute l'application backend.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise la configuration dans .env pour les variables d'environnement
 * - Importe la fonction connectDB depuis config/db.js
 * - Importe et monte tous les fichiers de routes depuis le dossier routes/
 * - Utilise mongoLogger depuis utils/mongoLogger.js pour la journalisation
 * - Point d'entrée référencé dans package.json pour les scripts de démarrage
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner le serveur, comme quand tu prépares tous tes crayons et cahiers avant de commencer tes devoirs.
// Explication technique : Importation des modules Node.js nécessaires - dotenv pour les variables d'environnement, express pour le framework web, cors pour la gestion des requêtes cross-origin, helmet pour la sécurité HTTP, et d'autres utilitaires de sécurité et de connexion.
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDB } = require('./config/db');
const mongoLogger = require('./utils/mongoLogger');
const mongoose = require('mongoose');
// === Fin : Importation des dépendances ===

// === Début : Importation des routes ===
// Explication simple : On importe les cartes qui indiquent vers où diriger les visiteurs selon ce qu'ils demandent, comme des panneaux d'indication dans un grand magasin.
// Explication technique : Importation des modules de routage Express organisés par domaine fonctionnel (tâches, utilisateurs, clients, authentification, timers), qui définissent les endpoints API disponibles.
// Routes
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const authRoutes = require('./routes/auth');
const timerRoutes = require('./routes/timers');
// === Fin : Importation des routes ===

// === Début : Initialisation de l'application Express ===
// Explication simple : On crée notre serveur et on définit sur quelle porte il va écouter les visiteurs, comme quand on prépare une salle pour accueillir des invités.
// Explication technique : Création de l'instance Express et définition du port d'écoute à partir des variables d'environnement ou utilisation d'une valeur par défaut (5000).
const app = express();
const PORT = process.env.PORT || 5000;
// === Fin : Initialisation de l'application Express ===

// === Début : Configuration des middlewares de sécurité ===
// Explication simple : On met en place des gardiens qui vérifient que les visiteurs ne font rien de dangereux, comme les agents de sécurité à l'entrée d'un concert.
// Explication technique : Application de middlewares Express pour renforcer la sécurité - helmet pour les en-têtes HTTP, cors pour gérer les requêtes cross-origin, parsers JSON et URL avec limites de taille, et mongoSanitize pour prévenir les injections NoSQL.
// Sécurité et middleware
app.use(helmet()); // Sécurité des headers HTTP
// === CORS ULTRA-AGRESSIF ===
app.use('*', (req, res, next) => {
  console.log('🚀 ULTRA-CORS pour:', req.method, req.originalUrl);

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', '*');
  res.header('Access-Control-Allow-Headers', '*');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('🚀 OPTIONS intercepté - réponse 200');
    return res.status(200).json({ success: true });
  }

  next();
});
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Prévention des injections NoSQL
// === Fin : Configuration des middlewares de sécurité ===

// === Début : Connexion à MongoDB ===
// Explication simple : On établit le lien avec notre base de données et on vérifie que tout va bien, comme quand tu branches ton ordinateur à l'électricité avant de l'utiliser.
// Explication technique : Établissement asynchrone de la connexion à MongoDB via la fonction connectDB, avec gestion des erreurs adaptative selon l'environnement (développement/production) et journalisation des problèmes.
// Connexion à MongoDB avec gestion améliorée
connectDB().then(connected => {
  if (!connected && process.env.NODE_ENV === 'production') {
    mongoLogger.error('Impossible de se connecter à MongoDB en production');
    process.exit(1);
  }
});
// === Fin : Connexion à MongoDB ===

// === Début : Montage des routes API ===
// Explication simple : On connecte toutes les routes à notre serveur, comme quand on installe les différents stands dans un parc d'attractions pour que les visiteurs puissent s'y rendre.
// Explication technique : Configuration du routage Express en associant les modules de routes importés à leurs préfixes d'URL respectifs, définissant ainsi la structure de l'API REST.
// Routes API
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/timers', timerRoutes);
// === Fin : Montage des routes API ===

// === Début : Route de vérification d'état ===
// Explication simple : Cette route permet de vérifier si notre serveur et notre base de données fonctionnent bien, comme quand tu appuies sur un bouton "test" pour voir si une machine marche.
// Explication technique : Endpoint de diagnostic qui expose l'état de la connexion MongoDB via la propriété readyState de mongoose, ainsi que des métriques de base comme la durée de fonctionnement du serveur.
// Route de vérification d'état MongoDB
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = {
    0: 'déconnecté',
    1: 'connecté',
    2: 'connexion en cours',
    3: 'déconnexion en cours'
  };

  res.json({
    status: 'ok',
    mongodb: {
      state: states[mongoState] || 'inconnu',
      connected: mongoState === 1
    },
    uptime: process.uptime()
  });
});
// === Fin : Route de vérification d'état ===

// === Début : Middleware de gestion des erreurs ===
// Explication simple : Ce code attrape les erreurs qui surviennent et les note dans un journal pour qu'on puisse comprendre ce qui s'est passé, comme un policier qui fait un rapport d'accident.
// Explication technique : Middleware Express de gestion globale des erreurs qui capture les exceptions non traitées, les journalise via mongoLogger et retourne une réponse d'erreur standardisée, avec masquage des détails techniques en production.
// Middleware d'erreurs
app.use((err, req, res, next) => {
  mongoLogger.error('Erreur non gérée', {
    error: err.message,
    stack: err.stack,
    path: req.originalUrl
  });

  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});
// === Fin : Middleware de gestion des erreurs ===

// === Début : Middleware de capture des erreurs détaillées ===
// Explication simple : Ce code donne plus de détails sur les erreurs, en expliquant exactement ce qui s'est passé, mais seulement aux développeurs - un peu comme quand un médecin explique une maladie en termes compliqués aux autres médecins, mais simplement aux patients.
// Explication technique : Second middleware de gestion d'erreurs qui fournit des réponses plus détaillées avec des informations structurées, incluant le code HTTP, le code d'erreur personnalisé et, en développement uniquement, la stack trace complète pour le débogage.
// Middleware pour capturer les erreurs détaillées
app.use((err, req, res, next) => {
  // Journaliser l'erreur
  console.error('Erreur non gérée:', {
    route: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack
  });

  // Format de réponse standardisé pour les erreurs
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    errorCode: err.code || 'SERVER_ERROR',
    // Ne pas exposer la stack trace en production
    details: process.env.NODE_ENV === 'production' ? undefined : {
      stack: err.stack,
      ...err
    }
  });
});
// === Fin : Middleware de capture des erreurs détaillées ===

// === Début : Gestion des routes non trouvées ===
// Explication simple : Ce code s'occupe des visiteurs qui cherchent quelque chose qui n'existe pas, comme un guide qui dit poliment "Désolé, cette attraction n'existe pas dans notre parc" quand quelqu'un demande quelque chose qui n'est pas sur la carte.
// Explication technique : Middleware catch-all placé en dernier qui intercepte toutes les requêtes ne correspondant à aucune route définie et retourne une réponse 404 standardisée avec des informations sur la route demandée.
// Gestionnaire pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.originalUrl}`,
    errorCode: 'NOT_FOUND'
  });
});
// === Fin : Gestion des routes non trouvées ===

// === Début : Démarrage du serveur ===
// Explication simple : Cette ligne démarre vraiment le serveur et nous dit qu'il est prêt à recevoir des visiteurs, comme quand on allume l'enseigne "Ouvert" d'un magasin.
// Explication technique : Démarrage du serveur HTTP sur le port configuré, avec journalisation de l'événement de démarrage via mongoLogger pour confirmation de la disponibilité de l'application.
app.listen(PORT, () => {
  mongoLogger.info(`Serveur démarré sur le port ${PORT}`);
});
// === Fin : Démarrage du serveur ===