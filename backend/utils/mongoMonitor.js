/*
 * MONITEUR DE PERFORMANCES MONGODB - backend/utils/mongoMonitor.js
 *
 * Explication simple:
 * Ce fichier est comme un détective qui surveille notre base de données MongoDB.
 * Il observe toutes les questions qu'on pose à la base de données et note celles qui
 * prennent trop de temps à répondre. C'est comme quand tu chronomètres quelque chose
 * pour voir si c'est trop lent, et si oui, tu le notes dans un carnet spécial.
 *
 * Explication technique:
 * Module utilitaire qui configure un système de monitoring pour les requêtes MongoDB
 * via Mongoose, avec capture des requêtes lentes et journalisation détaillée en
 * environnement de développement.
 *
 * Où ce fichier est utilisé:
 * Importé au démarrage de l'application pour configurer la surveillance des performances
 * de la base de données et aider au débogage des problèmes de performance.
 *
 * Connexions avec d'autres fichiers:
 * - Dépend de mongoose pour l'interaction avec MongoDB
 * - Utilise mongoLogger.js pour la journalisation des événements
 * - Est importé par le fichier principal de l'application (app.js/server.js)
 * - Peut être utilisé par des outils de diagnostic ou des routes d'administration
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend les outils dont on a besoin : mongoose pour parler à la base de données et mongoLogger pour écrire nos observations.
// Explication technique : Importation du module mongoose pour l'accès aux événements de la connexion MongoDB et du logger personnalisé pour la journalisation des métriques de performance.
const mongoose = require('mongoose');
const mongoLogger = require('./mongoLogger');
// === Fin : Importation des dépendances ===

// === Début : Initialisation de la mémoire pour les requêtes lentes ===
// Explication simple : On crée une boîte vide pour y mettre toutes les requêtes trop lentes qu'on va découvrir.
// Explication technique : Déclaration d'un tableau qui servira de buffer circulaire pour stocker les métadonnées des requêtes ayant dépassé le seuil de performance défini.
// Liste pour stocker les requêtes lentes
const slowQueries = [];
// === Fin : Initialisation de la mémoire pour les requêtes lentes ===

// === Début : Fonction principale de configuration du monitoring ===
// Explication simple : Cette fonction est comme un surveillant qui va observer toutes les activités de la base de données et noter celles qui sont problématiques.
// Explication technique : Fonction de configuration qui initialise les écouteurs d'événements Mongoose pour capturer les informations de débogage et les métriques de performance des requêtes.
// Configurer le monitoring MongoDB
const setupMongoMonitoring = () => {
  // === Début : Configuration du mode débogage en développement ===
  // Explication simple : Si on est en train de développer l'application (pas en production), on active un mode spécial qui nous montre toutes les requêtes à la base de données.
  // Explication technique : Configuration conditionnelle du mode debug de Mongoose en environnement de développement, avec un callback personnalisé qui utilise le logger pour enregistrer les détails de chaque opération.
  // Activer le debug mode en développement uniquement
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      mongoLogger.debug(`MongoDB ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        doc: doc ? '✅' : '❌'
      });
    });
  }
  // === Fin : Configuration du mode débogage en développement ===

  // === Début : Surveillance des requêtes lentes ===
  // Explication simple : On met en place un chronomètre qui mesure combien de temps prend chaque question posée à la base de données. Si une question prend plus de 100 millisecondes (un dixième de seconde), on la note comme "lente" et on l'ajoute à notre liste.
  // Explication technique : Configuration d'un écouteur sur l'événement 'query' de la connexion Mongoose qui mesure la durée d'exécution de chaque requête et enregistre celles qui dépassent le seuil de 100ms, avec limitation de la taille du buffer à 100 entrées.
  // Monitorer les requêtes lentes
  mongoose.connection.on('query', (query) => {
    const start = Date.now();
    
    query.once('end', () => {
      const duration = Date.now() - start;
      
      // Enregistrer les requêtes qui prennent plus de 100ms
      if (duration > 100) {
        const slowQuery = {
          collection: query.model.collection.name,
          operation: query.op,
          query: JSON.stringify(query.conditions),
          duration: duration
        };
        
        slowQueries.push(slowQuery);
        
        // Limiter la taille de la liste
        if (slowQueries.length > 100) {
          slowQueries.shift();
        }
        
        mongoLogger.warn(`Requête MongoDB lente (${duration}ms)`, slowQuery);
      }
    });
  });
  // === Fin : Surveillance des requêtes lentes ===

  // === Début : Retour des fonctions utilitaires ===
  // Explication simple : On donne deux outils aux autres parties de l'application : un pour voir la liste des requêtes lentes, et un autre pour effacer cette liste si besoin.
  // Explication technique : Retour d'un objet contenant deux méthodes - une pour récupérer une copie du tableau des requêtes lentes et une autre pour vider ce tableau, permettant de gérer le monitoring depuis d'autres parties de l'application.
  return {
    getSlowQueries: () => [...slowQueries],
    clearSlowQueries: () => {
      slowQueries.length = 0;
    }
  };
  // === Fin : Retour des fonctions utilitaires ===
};
// === Fin : Fonction principale de configuration du monitoring ===

// === Début : Exportation du module ===
// Explication simple : On rend notre fonction de surveillance disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Exportation de la fonction de configuration comme point d'entrée unique du module, permettant son initialisation lors du démarrage de l'application.
module.exports = setupMongoMonitoring;
// === Fin : Exportation du module ===