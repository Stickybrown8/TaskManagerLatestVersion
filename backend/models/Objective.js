const mongoose = require('mongoose');

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

// Middleware pour mettre à jour la date de modification
ObjectiveSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Méthode pour mettre à jour la progression
ObjectiveSchema.methods.updateProgress = function() {
  if (this.targetValue > 0) {
    this.progress = Math.min(100, Math.round((this.currentValue / this.targetValue) * 100));
  }
};

module.exports = mongoose.model('Objective', ObjectiveSchema);
