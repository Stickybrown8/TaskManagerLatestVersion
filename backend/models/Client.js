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

module.exports = mongoose.model('Client', ClientSchema);
