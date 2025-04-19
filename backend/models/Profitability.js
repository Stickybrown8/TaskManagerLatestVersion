const mongoose = require('mongoose');

const ProfitabilitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  hourlyRate: {
    type: Number,
    required: true,
    min: 0
  },
  targetHours: {
    type: Number,
    default: 0,
    min: 0
  },
  spentHours: {
    type: Number,
    default: 0,
    min: 0
  },
  revenue: {
    type: Number,
    default: 0,
    min: 0
  },
  profitabilityPercentage: {
    type: Number,
    default: 0
  },
  remainingHours: {
    type: Number,
    default: 0
  },
  isProfitable: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  }
});

// Middleware pour mettre à jour la date de dernière modification
ProfitabilitySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});

// Méthode pour calculer la rentabilité
ProfitabilitySchema.methods.calculateProfitability = function() {
  // Calculer le revenu basé sur le taux horaire et les heures passées
  this.revenue = this.hourlyRate * this.spentHours;
  
  // Calculer le pourcentage de rentabilité
  if (this.targetHours > 0) {
    // Si les heures cibles sont définies, calculer par rapport à celles-ci
    this.profitabilityPercentage = ((this.revenue / (this.targetHours * this.hourlyRate)) - 1) * 100;
  } else {
    // Sinon, utiliser une valeur par défaut (0% signifie rentabilité neutre)
    this.profitabilityPercentage = 0;
  }
  
  // Déterminer si le client est rentable
  this.isProfitable = this.profitabilityPercentage >= 0;
  
  // Calculer les heures restantes pour atteindre la rentabilité
  if (this.isProfitable) {
    this.remainingHours = 0; // Déjà rentable
  } else {
    // Calculer combien d'heures supplémentaires sont nécessaires pour atteindre la rentabilité
    // Formule: (targetHours * hourlyRate - revenue) / hourlyRate
    this.remainingHours = Math.max(0, (this.targetHours * this.hourlyRate - this.revenue) / this.hourlyRate);
  }
};

module.exports = mongoose.model('Profitability', ProfitabilitySchema);
