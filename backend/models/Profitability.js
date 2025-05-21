/*
 * MODÈLE DE RENTABILITÉ - backend/models/Profitability.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurées les données de rentabilité dans l'application.
 * Il permet de calculer si un client est rentable en comparant les heures travaillées, 
 * le taux horaire et les revenus générés, comme un comptable qui surveille si on gagne 
 * ou perd de l'argent sur un projet.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "profitabilities" dans MongoDB,
 * définissant la structure, les validations et les méthodes pour les documents de rentabilité client.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent le calcul et l'affichage des données de rentabilité
 * des clients et projets dans les tableaux de bord et rapports.
 *
 * Connexions avec d'autres fichiers:
 * - Fait référence au modèle User (pour associer la rentabilité à un utilisateur)
 * - Fait référence au modèle Client (pour calculer la rentabilité d'un client spécifique)
 * - Utilisé dans les contrôleurs de rentabilité (profitability.controller.js)
 * - Probablement utilisé dans les services d'analyse financière et de reporting
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir l'outil dont on a besoin pour créer notre modèle de rentabilité.
// Explication technique : Importation du module mongoose pour définir le schéma et le modèle MongoDB.
const mongoose = require('mongoose');
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour la rentabilité ===
// Explication simple : On crée un plan qui décrit toutes les informations nécessaires pour calculer si un client nous rapporte de l'argent ou non.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les valeurs par défaut et les validations pour la collection de rentabilité.
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
// === Fin : Définition du schéma de données pour la rentabilité ===

// === Début : Mise à jour automatique de la date de modification ===
// Explication simple : Chaque fois qu'on change quelque chose dans les données de rentabilité, on note automatiquement quand ce changement a été fait.
// Explication technique : Middleware Mongoose 'pre-save' qui s'exécute avant chaque opération de sauvegarde pour mettre à jour le champ 'lastUpdated' avec la date et l'heure actuelles.
// Middleware pour mettre à jour la date de dernière modification
ProfitabilitySchema.pre('save', function(next) {
  this.lastUpdated = Date.now();
  next();
});
// === Fin : Mise à jour automatique de la date de modification ===

// === Début : Méthode de calcul de rentabilité ===
// Explication simple : Cette fonction est comme une calculatrice qui détermine si on gagne ou perd de l'argent sur un client, et combien il nous reste à travailler pour être rentable.
// Explication technique : Méthode d'instance personnalisée qui calcule les différentes métriques de rentabilité (revenu, pourcentage, heures restantes) en fonction des taux horaires et des heures travaillées.
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
// === Fin : Méthode de calcul de rentabilité ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Profitability" basé sur le schéma défini, ce qui permet d'interagir avec la collection "profitabilities" dans MongoDB.
module.exports = mongoose.model('Profitability', ProfitabilitySchema);
// === Fin : Exportation du modèle ===
