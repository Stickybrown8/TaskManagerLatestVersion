const mongoose = require('mongoose');

const TimerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // en secondes
    default: 0
  },
  isRunning: {
    type: Boolean,
    default: true
  },
  pausedAt: {
    type: Date
  },
  totalPausedTime: {
    type: Number, // en secondes
    default: 0
  },
  breaks: [{
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number // en secondes
    }
  }],
  tags: [{
    type: String
  }],
  billable: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode pour démarrer le chronomètre
TimerSchema.methods.start = function() {
  if (this.isRunning) return;
  
  const now = new Date();
  
  // Si le chronomètre était en pause, ajouter le temps de pause
  if (this.pausedAt) {
    const pauseDuration = Math.floor((now - this.pausedAt) / 1000);
    this.totalPausedTime += pauseDuration;
    
    // Ajouter cette pause à l'historique des pauses
    this.breaks.push({
      startTime: this.pausedAt,
      endTime: now,
      duration: pauseDuration
    });
    
    this.pausedAt = null;
  }
  
  this.isRunning = true;
};

// Méthode pour mettre en pause le chronomètre
TimerSchema.methods.pause = function() {
  this.pausedAt = new Date();
  this.isRunning = false;
  return this;
};

// Méthode pour arrêter le chronomètre
TimerSchema.methods.stop = function() {
  this.endTime = new Date();
  this.isRunning = false;
  
  // Calculer la durée
  if (!this.duration) {
    const start = new Date(this.startTime).getTime();
    const end = new Date(this.endTime).getTime();
    this.duration = Math.round((end - start) / 1000); // en secondes
  }
  
  return this;
};

// Méthode pour obtenir la durée actuelle
TimerSchema.methods.getCurrentDuration = function() {
  if (!this.isRunning && this.duration > 0) {
    return this.duration;
  }
  
  const now = new Date();
  let totalDuration = Math.floor((now - this.startTime) / 1000);
  
  // Soustraire le temps total de pause
  totalDuration -= this.totalPausedTime;
  
  // Si le chronomètre est en pause, soustraire le temps de la pause actuelle
  if (!this.isRunning && this.pausedAt) {
    const pauseDuration = Math.floor((now - this.pausedAt) / 1000);
    totalDuration -= pauseDuration;
  }
  
  return totalDuration;
};

// Méthode pour reprendre un timer en pause
TimerSchema.methods.resume = function() {
  if (this.pausedAt) {
    // Calculer le temps de pause
    const pauseStart = new Date(this.pausedAt).getTime();
    const pauseEnd = Date.now();
    const pauseDuration = Math.round((pauseEnd - pauseStart) / 1000);
    
    // Ajouter au temps total de pause
    this.totalPausedTime = (this.totalPausedTime || 0) + pauseDuration;
    
    // Ajouter une entrée dans le tableau des pauses
    this.breaks.push({
      startTime: this.pausedAt,
      endTime: new Date(),
      duration: pauseDuration
    });
    
    // Réinitialiser pausedAt
    this.pausedAt = null;
    this.isRunning = true;
  }
  
  return this;
};

// Ajout d'index pour améliorer les performances
TimerSchema.index({ startTime: 1 });
TimerSchema.index({ userId: 1, isRunning: 1 });

module.exports = mongoose.model('Timer', TimerSchema);
