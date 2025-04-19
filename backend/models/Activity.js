const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

// Création d'index pour améliorer les performances
ActivitySchema.index({ userId: 1 });
ActivitySchema.index({ timestamp: 1 });
ActivitySchema.index({ userId: 1, timestamp: 1 });

module.exports = mongoose.model('Activity', ActivitySchema);
