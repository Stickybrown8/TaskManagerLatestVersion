/*
 * MODÈLE DE BADGE - backend/models/Badge.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurés les badges dans l'application.
 * Les badges sont comme des médailles virtuelles que les utilisateurs peuvent 
 * gagner en accomplissant certaines actions ou en atteignant des objectifs.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "badges" dans MongoDB,
 * définissant la structure et les validations pour les documents de badge.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent la création, l'attribution et la récupération
 * des badges pour les utilisateurs.
 *
 * Connexions avec d'autres fichiers:
 * - Référencé dans le modèle Achievement (pour les récompenses)
 * - Référencé dans le modèle Activity (pour suivre l'obtention des badges)
 * - Utilisé dans les contrôleurs de badge (badge.controller.js)
 * - Probablement utilisé dans les services de gamification pour attribuer des badges
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle de badges.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les badges ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'un badge doit contenir, comme son nom, sa description et sa rareté.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les valeurs par défaut et les validations pour la collection de badges.
// Schéma badge
const BadgeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  icon: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['commun', 'rare', 'épique', 'légendaire'],
    default: 'commun'
  },
  requirements: {
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    category: {
      type: String
    },
    timeframe: {
      type: String
    }
  },
  rewards: {
    experience: {
      type: Number,
      default: 0
    },
    actionPoints: {
      type: Number,
      default: 0
    },
    unlocks: [{
      type: String
    }]
  }
});
// === Fin : Définition du schéma de données pour les badges ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Badge" basé sur le schéma défini, ce qui permet d'interagir avec la collection "badges" dans MongoDB.
module.exports = mongoose.model('Badge', BadgeSchema);
// === Fin : Exportation du modèle ===
