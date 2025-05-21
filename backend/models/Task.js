/*
 * MODÈLE DE TÂCHE - backend/models/Task.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurées les tâches dans l'application.
 * Il décrit toutes les informations qu'une tâche contient, comme son titre, sa description,
 * à quel client elle est associée, sa priorité et son statut d'avancement.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "tasks" dans MongoDB,
 * définissant la structure, les validations et les index pour les documents de tâche.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent la création, la modification et la récupération
 * des tâches pour les afficher dans l'interface utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Fait référence au modèle Client (pour associer des tâches à un client)
 * - Fait référence au modèle User (pour associer des tâches à leur créateur)
 * - Utilisé dans les contrôleurs de tâche (task.controller.js)
 * - Probablement référencé dans le modèle Objective (pour lier des tâches à un objectif)
 * - Utilisé dans les services de tableau de bord et de rapports
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir l'outil dont on a besoin pour créer notre modèle de tâches.
// Explication technique : Importation du module mongoose pour définir le schéma et le modèle MongoDB.
const mongoose = require('mongoose');
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les tâches ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'une tâche doit contenir, comme son titre, à qui elle est assignée, quand elle doit être terminée et son importance.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les valeurs par défaut et les contraintes pour la collection de tâches.
const TaskSchema = mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['basse', 'moyenne', 'haute', 'urgente'],
    default: 'moyenne'
  },
  status: {
    type: String,
    enum: ['à faire', 'en cours', 'terminée'],
    default: 'à faire'
  },
  category: {
    type: String,
    enum: ['campagne', 'landing page', 'rapport', 'email', 'réunion', 'tracking', 'CRO', 'autre'],
    default: 'autre'
  },
  actionPoints: {
    type: Number,
    default: 5
  },
  isHighImpact: {
    type: Boolean,
    default: false
  },
  impactScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  estimatedTime: {
    type: Number,  // en minutes
    default: 0
  },
  timeSpent: {
    type: Number,  // en minutes
    default: 0
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
// === Fin : Définition du schéma de données pour les tâches ===

// === Début : Optimisation des performances avec des index ===
// Explication simple : On crée des raccourcis pour que l'ordinateur trouve plus vite les tâches quand on cherche celles d'un utilisateur, d'un client ou qui doivent être finies bientôt.
// Explication technique : Création d'index MongoDB via Mongoose pour optimiser les requêtes fréquentes sur les champs userId/status, clientId/status et dueDate, améliorant ainsi les performances des opérations de recherche.
// Ajout d'index pour améliorer les performances
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ clientId: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });

// Ajouter à la fin du fichier, avant l'export du modèle

// Création d'index pour les requêtes fréquentes
TaskSchema.index({ userId: 1, status: 1 }); // Pour filtrer par statut et utilisateur
TaskSchema.index({ clientId: 1, status: 1 }); // Pour filtrer par client et statut
TaskSchema.index({ dueDate: 1 }); // Pour trier par date d'échéance
// === Fin : Optimisation des performances avec des index ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Task" basé sur le schéma défini, ce qui permet d'interagir avec la collection "tasks" dans MongoDB.
module.exports = mongoose.model('Task', TaskSchema);
// === Fin : Exportation du modèle ===
