/*
 * MODÈLE DES RÉALISATIONS (ACHIEVEMENTS)- backend/models/Achievement.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurées les réalisations (achievements) dans l'application,
 * comme les badges ou trophées qu'un utilisateur peut gagner en accomplissant certaines tâches.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "achievements" dans MongoDB,
 * définissant la structure et les validations pour les documents de réalisation.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent la création, la récupération et la mise à jour des réalisations des utilisateurs.
 *
 * Connexions avec d'autres fichiers:
 * - Fait référence au modèle Badge (via rewards.badge)
 * - Utilisé dans les contrôleurs d'achievements (achievement.controller.js)
 * - Peut être référencé dans le modèle User pour suivre les réalisations obtenues par les utilisateurs
 * - Probablement utilisé dans des services de gamification pour attribuer des réalisations
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle de réalisations.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les réalisations ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'une réalisation doit contenir, comme son nom, sa description et ses conditions d'obtention.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs obligatoires, les types de données, les valeurs par défaut et les relations avec d'autres collections.
const AchievementSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['progression', 'unique', 'secret'],
    default: 'progression'
  },
  requirements: {
    type: {
      type: String,
      required: true
    },
    target: {
      type: Number,
      required: true
    },
    current: {
      type: Number,
      default: 0
    }
  },
  rewards: {
    experience: {
      type: Number,
      default: 0
    },
    badge: {
      type: Schema.Types.ObjectId,
      ref: 'Badge'
    }
  },
  isSecret: {
    type: Boolean,
    default: false
  }
});
// === Fin : Définition du schéma de données pour les réalisations ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Achievement" basé sur le schéma défini, ce qui permet d'interagir avec la collection "achievements" dans MongoDB.
module.exports = mongoose.model('Achievement', AchievementSchema);
// === Fin : Exportation du modèle ===
