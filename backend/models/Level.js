/*
 * MODÈLE DE NIVEAU - backend/models/Level.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurés les niveaux dans l'application.
 * Il décrit les différents paliers que les utilisateurs peuvent atteindre,
 * l'expérience nécessaire pour chaque niveau et les récompenses obtenues.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "levels" dans MongoDB,
 * définissant la structure et les validations pour les documents de niveau utilisateur.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent la progression des utilisateurs et l'attribution
 * des récompenses lorsqu'ils montent de niveau.
 *
 * Connexions avec d'autres fichiers:
 * - Probablement référencé dans le modèle User pour suivre le niveau actuel des utilisateurs
 * - Utilisé dans les contrôleurs de progression ou de gamification
 * - Peut être lié aux services qui calculent l'expérience et déclenchent les montées de niveau
 * - Interagit avec les composants frontend qui affichent la progression et les récompenses
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle de niveaux.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les niveaux ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'un niveau doit contenir, comme son numéro, son nom, l'expérience nécessaire et les cadeaux qu'il débloque.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données et les contraintes pour la collection de niveaux de progression.
// Schéma niveau
const LevelSchema = new Schema({
  level: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  experienceRequired: {
    type: Number,
    required: true
  },
  rewards: {
    actionPoints: {
      type: Number,
      default: 0
    },
    features: [{
      type: String
    }],
    themes: [{
      type: String
    }],
    avatars: [{
      type: String
    }]
  },
  icon: {
    type: String
  }
});
// === Fin : Définition du schéma de données pour les niveaux ===

// === Début : Optimisation des performances avec des index ===
// Explication simple : On crée un raccourci pour que l'ordinateur trouve plus vite les niveaux quand on cherche par leur numéro.
// Explication technique : Création d'un index MongoDB via Mongoose pour optimiser les requêtes sur le champ level, améliorant ainsi les performances des opérations de recherche.
// Création d'index pour améliorer les performances
LevelSchema.index({ level: 1 });
// === Fin : Optimisation des performances avec des index ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Level" basé sur le schéma défini, ce qui permet d'interagir avec la collection "levels" dans MongoDB.
module.exports = mongoose.model('Level', LevelSchema);
// === Fin : Exportation du modèle ===
