const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
});

module.exports = mongoose.model('User', UserSchema);
