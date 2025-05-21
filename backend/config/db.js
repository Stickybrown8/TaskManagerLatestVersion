/*
 * CONFIGURATION DE LA BASE DE DONNÉES - backend/config/db.js
 * 
 * Explication simple:
 * Ce fichier s'occupe de connecter l'application à la base de données MongoDB.
 * Il essaie plusieurs fois si la connexion échoue et surveille si tout fonctionne bien.
 * 
 * Explication technique:
 * Module Node.js qui configure et établit la connexion à MongoDB Atlas via Mongoose.
 * Implémente un mécanisme de reconnexion automatique, de journalisation et de surveillance des performances.
 * 
 * Où ce fichier est utilisé:
 * Au démarrage de l'application, pour établir la connexion à la base de données avant de lancer le serveur.
 * 
 * Connexions avec d'autres fichiers:
 * - Utilise les utilitaires mongoLogger.js et mongoMonitor.js pour la journalisation et la surveillance
 * - Charge les variables d'environnement depuis .env ou .env.production
 * - Utilisé par le fichier principal de l'application (server.js ou app.js) lors du démarrage
 */

// === Début : Importation des dépendances ===
// Explication simple : On prépare tous les outils dont on a besoin pour se connecter à la base de données.
// Explication technique : Importation des modules nécessaires - Mongoose pour l'ODM MongoDB, dotenv pour les variables d'environnement, et des utilitaires personnalisés pour la journalisation et le monitoring.
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const mongoLogger = require('../utils/mongoLogger');
const setupMongoMonitoring = require('../utils/mongoMonitor');
// === Fin : Importation des dépendances ===

// === Début : Chargement des variables d'environnement ===
// Explication simple : On cherche le fichier qui contient les mots de passe et adresses secrets.
// Explication technique : Configuration conditionnelle de dotenv pour charger les variables d'environnement depuis un fichier spécifique selon l'environnement d'exécution.
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });
// === Fin : Chargement des variables d'environnement ===

// === Début : Configuration des options de connexion MongoDB ===
// Explication simple : On prépare les réglages pour que la connexion à la base de données soit la meilleure possible.
// Explication technique : Définition des options de configuration Mongoose pour optimiser la connexion MongoDB, avec des paramètres de timeout pour gérer les délais de connexion.
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};
// === Fin : Configuration des options de connexion MongoDB ===

// === Début : Fonction de connexion à la base de données ===
// Explication simple : Cette fonction essaie de se connecter à la base de données et réessaie si ça ne marche pas.
// Explication technique : Fonction asynchrone qui tente d'établir une connexion à MongoDB avec un mécanisme de backoff exponentiel pour les tentatives de reconnexion, limité à un nombre maximum de tentatives.
const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    mongoLogger.info('Tentative de connexion à MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    
    // === Début : Configuration des écouteurs d'événements de connexion ===
    // Explication simple : On met en place des détecteurs qui nous préviennent si la connexion est réussie, échoue ou se coupe.
    // Explication technique : Mise en place des gestionnaires d'événements (event listeners) pour surveiller l'état de la connexion MongoDB et réagir aux changements d'état.
    mongoose.connection.on('connected', () => {
      mongoLogger.info(`MongoDB connecté: ${conn.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      mongoLogger.error('Erreur MongoDB:', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      mongoLogger.warn('MongoDB déconnecté - attente avant reconnexion...');
      // Tenter de se reconnecter après un délai
      setTimeout(() => {
        mongoLogger.info('Tentative de reconnexion...');
        connectDB();
      }, 5000);
    });
    // === Fin : Configuration des écouteurs d'événements de connexion ===
    
    // === Début : Configuration de la surveillance des requêtes ===
    // Explication simple : On active un système qui note chaque question posée à la base de données pour voir si tout va bien.
    // Explication technique : Activation du mode debug de Mongoose pour journaliser les opérations de base de données et configuration de l'instrumentation pour la surveillance des performances.
    mongoose.set('debug', (collectionName, method, query, doc) => {
      mongoLogger.debug(`MongoDB ${collectionName}.${method}`, {
        query,
        docSize: doc ? JSON.stringify(doc).length : 0
      });
    });
    
    const mongoMonitor = setupMongoMonitoring();
    // === Fin : Configuration de la surveillance des requêtes ===
    
    mongoLogger.info(`MongoDB connecté avec succès: ${conn.connection.host}`);
    return true;
  } catch (error) {
    // === Début : Gestion des erreurs de connexion ===
    // Explication simple : Si la connexion échoue, on note l'erreur et on essaie à nouveau plusieurs fois.
    // Explication technique : Bloc de gestion d'erreur qui implémente une logique de retry avec temporisation entre les tentatives, et une gestion différenciée selon l'environnement en cas d'échec définitif.
    mongoLogger.error('Erreur de connexion MongoDB:', { 
      error: error.message,
      retryCount,
      maxRetries
    });
    
    if (retryCount < maxRetries) {
      mongoLogger.info(`Nouvelle tentative (${retryCount + 1}/${maxRetries}) dans 5 secondes...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      mongoLogger.error('Nombre maximum de tentatives atteint, connexion impossible');
      // En production, on ne veut pas arrêter l'application brutalement
      if (process.env.NODE_ENV === 'production') {
        return false;
      } else {
        process.exit(1);
      }
    }
    // === Fin : Gestion des erreurs de connexion ===
  }
};
// === Fin : Fonction de connexion à la base de données ===

// === Début : Exportation du module ===
// Explication simple : On rend notre fonction disponible pour que d'autres fichiers puissent l'utiliser.
// Explication technique : Exportation de l'objet contenant la fonction connectDB pour permettre son utilisation dans d'autres modules via le système de modules CommonJS.
module.exports = { connectDB };
// === Fin : Exportation du module ===
