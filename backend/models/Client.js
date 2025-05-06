const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schéma client
const ClientSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['actif', 'inactif', 'archivé'],
    default: 'actif'
  },
  contacts: [{
    name: {
      type: String,
      required: true
    },
    role: {
      type: String
    },
    email: {
      type: String
    },
    phone: {
      type: String
    },
    isMain: {
      type: Boolean,
      default: false
    }
  }],
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  metrics: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    tasksInProgress: {
      type: Number,
      default: 0
    },
    tasksPending: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
});

// Ajouter des validateurs

ClientSchema.path('name').validate(function(value) {
  return value && value.length >= 2;
}, 'Le nom du client doit contenir au moins 2 caractères');

ClientSchema.pre('save', function(next) {
  // Nettoyer les valeurs avant enregistrement
  if (this.name) this.name = this.name.trim();
  if (this.description) this.description = this.description.trim();
  
  // S'assurer que lastActivity est toujours défini
  if (!this.lastActivity) this.lastActivity = new Date();
  
  next();
});

// Ajout d'index pour améliorer les performances
ClientSchema.index({ name: 1 });
ClientSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Client', ClientSchema);
