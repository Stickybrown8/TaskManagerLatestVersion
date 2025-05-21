/*
 * MODÈLE UTILISATEUR - backend/models/User.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurés les utilisateurs dans l'application.
 * Il contient toutes les informations sur un utilisateur: son nom, son email, son mot de passe,
 * ses préférences personnelles, et tous ses progrès dans le système de jeu (niveaux, badges, etc.).
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "users" dans MongoDB,
 * définissant la structure, les validations et les sous-documents pour les documents utilisateur.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent l'authentification, l'inscription, et toutes les opérations
 * liées aux utilisateurs comme la mise à jour du profil et la progression de gamification.
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé dans les contrôleurs d'authentification (auth.controller.js)
 * - Utilisé dans le middleware d'authentification (auth.js)
 * - Fait référence au modèle Badge (pour les badges gagnés)
 * - Fait référence au modèle Achievement (pour les réalisations)
 * - Référencé par de nombreux autres modèles (Task, Client, Activity, etc.)
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle d'utilisateur.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les utilisateurs ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'un utilisateur doit avoir, comme son adresse email, son mot de passe et son nom.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les validations et les sous-documents pour la collection d'utilisateurs.
// Schéma utilisateur
const UserSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // === Début : Sous-document pour les préférences utilisateur ===
  // Explication simple : Cette partie contient les choix personnels de l'utilisateur comme son image de profil et ses préférences d'affichage.
  // Explication technique : Sous-document imbriqué contenant les préférences de personnalisation et les paramètres utilisateur, avec des valeurs par défaut pour chaque option.
  profile: {
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    theme: {
      type: String,
      default: 'default'
    },
    settings: {
      notifications: {
        type: Boolean,
        default: true
      },
      language: {
        type: String,
        default: 'fr'
      },
      soundEffects: {
        type: Boolean,
        default: true
      }
    }
  },
  // === Fin : Sous-document pour les préférences utilisateur ===
  
  // === Début : Sous-document pour la progression dans le jeu ===
  // Explication simple : Cette partie garde en mémoire tous les progrès de l'utilisateur dans le système de jeu, comme son niveau, ses points et ses médailles.
  // Explication technique : Sous-document imbriqué contenant les métriques de gamification, les badges et réalisations obtenus par l'utilisateur, avec références vers d'autres collections.
  gamification: {
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    actionPoints: {
      type: Number,
      default: 0
    },
    totalPointsEarned: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    badges: [{
      badgeId: {
        type: Schema.Types.ObjectId,
        ref: 'Badge'
      },
      earnedAt: {
        type: Date,
        default: Date.now
      },
      displayed: {
        type: Boolean,
        default: true
      }
    }],
    achievements: [{
      achievementId: {
        type: Schema.Types.ObjectId,
        ref: 'Achievement'
      },
      earnedAt: {
        type: Date,
        default: Date.now
      },
      progress: {
        type: Number,
        default: 0
      }
    }]
  }
  // === Fin : Sous-document pour la progression dans le jeu ===
});
// === Fin : Définition du schéma de données pour les utilisateurs ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "User" basé sur le schéma défini, ce qui permet d'interagir avec la collection "users" dans MongoDB.
module.exports = mongoose.model('User', UserSchema);
// === Fin : Exportation du modèle ===
