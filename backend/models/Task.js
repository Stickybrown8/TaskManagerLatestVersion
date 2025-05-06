const mongoose = require('mongoose');

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

// Ajout d'index pour améliorer les performances
TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ clientId: 1, status: 1 });
TaskSchema.index({ dueDate: 1 });

// Ajouter à la fin du fichier, avant l'export du modèle

// Création d'index pour les requêtes fréquentes
TaskSchema.index({ userId: 1, status: 1 }); // Pour filtrer par statut et utilisateur
TaskSchema.index({ clientId: 1, status: 1 }); // Pour filtrer par client et statut
TaskSchema.index({ dueDate: 1 }); // Pour trier par date d'échéance

module.exports = mongoose.model('Task', TaskSchema);
