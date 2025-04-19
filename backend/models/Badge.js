const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schéma badge
const BadgeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  icon: {
    type: String,
    required: true
  },
  rarity: {
    type: String,
    enum: ['commun', 'rare', 'épique', 'légendaire'],
    default: 'commun'
  },
  requirements: {
    type: {
      type: String,
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    category: {
      type: String
    },
    timeframe: {
      type: String
    }
  },
  rewards: {
    experience: {
      type: Number,
      default: 0
    },
    actionPoints: {
      type: Number,
      default: 0
    },
    unlocks: [{
      type: String
    }]
  }
});

module.exports = mongoose.model('Badge', BadgeSchema);
