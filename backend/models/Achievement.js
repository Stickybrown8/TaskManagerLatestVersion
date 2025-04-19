const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schéma achievement (réalisation)
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

module.exports = mongoose.model('Achievement', AchievementSchema);
