const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

// Création d'index pour améliorer les performances
LevelSchema.index({ level: 1 });

module.exports = mongoose.model('Level', LevelSchema);
