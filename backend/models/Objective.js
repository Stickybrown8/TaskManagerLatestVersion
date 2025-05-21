/*
 * MODÈLE D'OBJECTIF - backend/models/Objective.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurés les objectifs dans l'application.
 * Les objectifs sont des buts importants à atteindre pour un client, avec un pourcentage 
 * de progression, une date limite et peuvent être liés à plusieurs tâches.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "objectives" dans MongoDB,
 * définissant la structure, les validations et les méthodes pour les documents d'objectif.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent la création, la modification et la récupération
 * des objectifs pour les afficher dans l'interface utilisateur et suivre la progression.
 *
 * Connexions avec d'autres fichiers:
 * - Fait référence au modèle Client (pour associer des objectifs à un client)
 * - Fait référence au modèle Task (pour lier des tâches à un objectif)
 * - Fait référence au modèle User (pour suivre qui a créé l'objectif)
 * - Utilisé dans les contrôleurs d'objectif (objective.controller.js)
 * - Probablement utilisé dans les services de rapports et de tableau de bord
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir l'outil dont on a besoin pour créer notre modèle d'objectifs.
// Explication technique : Importation du module mongoose pour définir le schéma et le modèle MongoDB.
const mongoose = require('mongoose');
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les objectifs ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'un objectif doit contenir, comme son titre, sa description, à quel client il appartient et quand il doit être atteint.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les valeurs par défaut et les contraintes pour la collection d'objectifs.
const ObjectiveSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  targetValue: {
    type: Number,
    default: 100
  },
  currentValue: {
    type: Number,
    default: 0
  },
  unit: {
    type: String,
    default: '%'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  isHighImpact: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['à faire', 'en cours', 'terminé', 'annulé'],
    default: 'à faire'
  },
  relatedTasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});
// === Fin : Définition du schéma de données pour les objectifs ===

// === Début : Mise à jour automatique de la date de modification ===
// Explication simple : Chaque fois qu'on change quelque chose dans l'objectif, on note automatiquement quand ce changement a été fait.
// Explication technique : Middleware Mongoose 'pre-save' qui s'exécute avant chaque opération de sauvegarde pour mettre à jour le champ 'updatedAt' avec la date et l'heure actuelles.
// Middleware pour mettre à jour la date de modification
ObjectiveSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});
// === Fin : Mise à jour automatique de la date de modification ===

// === Début : Méthode de calcul de progression ===
// Explication simple : Cette fonction calcule automatiquement quel pourcentage de l'objectif a été réalisé, comme une barre de progression dans un jeu.
// Explication technique : Méthode d'instance personnalisée qui calcule le pourcentage de progression en fonction des valeurs cible et actuelle, avec une limite maximale de 100%.
// Méthode pour mettre à jour la progression
ObjectiveSchema.methods.updateProgress = function() {
  if (this.targetValue > 0) {
    this.progress = Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
  }
};
// === Fin : Méthode de calcul de progression ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Objective" basé sur le schéma défini, ce qui permet d'interagir avec la collection "objectives" dans MongoDB.
module.exports = mongoose.model('Objective', ObjectiveSchema);
// === Fin : Exportation du modèle ===
