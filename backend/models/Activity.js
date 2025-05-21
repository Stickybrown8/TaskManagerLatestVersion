/*
 * MODÈLE D'ACTIVITÉ UTILISATEUR - backend/models/Activity.js
 *
 * Explication simple:
 * Ce fichier définit comment sont enregistrées les actions des utilisateurs dans l'application.
 * C'est comme un journal qui note tout ce que fait un utilisateur: quand il termine une tâche,
 * gagne des points, obtient un badge, etc.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "activities" dans MongoDB,
 * définissant la structure et les relations pour suivre les événements liés aux utilisateurs.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui enregistrent les différentes actions des utilisateurs et 
 * pour générer les flux d'activité ou les historiques dans l'interface.
 *
 * Connexions avec d'autres fichiers:
 * - Fait référence aux modèles User, Task, Client et Badge
 * - Utilisé dans les contrôleurs d'activité (activity.controller.js)
 * - Probablement utilisé dans les services de gamification et de suivi utilisateur
 * - Pourrait être utilisé pour générer des notifications ou des rapports d'activité
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle d'activités.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les activités ===
// Explication simple : On crée un plan qui décrit toutes les informations à enregistrer quand un utilisateur fait quelque chose.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs obligatoires, les types de données, les valeurs par défaut et les relations avec d'autres collections.
// Schéma activité
const ActivitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  details: {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'Task'
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client'
    },
    badgeId: {
      type: Schema.Types.ObjectId,
      ref: 'Badge'
    },
    pointsEarned: {
      type: Number,
      default: 0
    },
    experienceEarned: {
      type: Number,
      default: 0
    },
    levelUp: {
      type: Boolean,
      default: false
    }
  }
});
// === Fin : Définition du schéma de données pour les activités ===

// === Début : Optimisation des performances avec des index ===
// Explication simple : On crée des raccourcis pour que l'ordinateur trouve plus vite les informations qu'on lui demande.
// Explication technique : Création d'index MongoDB via Mongoose pour optimiser les requêtes fréquentes sur les champs userId et timestamp, améliorant ainsi les performances des opérations de recherche.
// Création d'index pour améliorer les performances
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ timestamp: 1 });
ActivitySchema.index({ userId: 1, timestamp: 1 });
// === Fin : Optimisation des performances avec des index ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Activity" basé sur le schéma défini, ce qui permet d'interagir avec la collection "activities" dans MongoDB.
module.exports = mongoose.model('Activity', ActivitySchema);
// === Fin : Exportation du modèle ===
