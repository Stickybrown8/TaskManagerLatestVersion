/*
 * MODÈLE DE CHRONOMÈTRE - backend/models/Timer.js
 *
 * Explication simple:
 * Ce fichier définit comment sont structurés les chronomètres dans l'application.
 * Il permet de suivre le temps passé sur différentes tâches et pour différents clients,
 * comme un chronomètre qui peut être démarré, mis en pause et arrêté avec un historique 
 * des interruptions.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "timers" dans MongoDB,
 * définissant la structure, les validations et les méthodes d'instance pour 
 * la gestion du suivi temporel des activités.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent le suivi du temps et la facturation du temps
 * passé sur des tâches, notamment pour les fonctionnalités de timetracking.
 *
 * Connexions avec d'autres fichiers:
 * - Fait référence au modèle User (pour associer les chronos à leur propriétaire)
 * - Fait référence au modèle Task (pour lier le temps à une tâche spécifique)
 * - Fait référence au modèle Client (pour suivre le temps passé par client)
 * - Utilisé dans les contrôleurs de chronométrage (timer.controller.js)
 * - Probablement utilisé dans les services de facturation et de reporting
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir l'outil dont on a besoin pour créer notre modèle de chronomètre.
// Explication technique : Importation du module mongoose pour définir le schéma et le modèle MongoDB.
const mongoose = require('mongoose');
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les chronomètres ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'un chronomètre doit contenir, comme qui l'utilise, sur quelle tâche, quand il a commencé et s'il est en marche ou non.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, les relations avec d'autres collections et les sous-documents pour les pauses.
const TimerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: false  // Rendre optionnel si nécessaire
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  description: {
    type: String,
    required: false  // Rendre optionnel
  },
  startTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  endTime: {
    type: Date,
    default: null,
    required: false
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
// === Fin : Définition du schéma de données pour les chronomètres ===

// === Début : Méthode pour démarrer le chronomètre ===
// Explication simple : Cette fonction permet de lancer ou relancer le chronomètre. Si le chronomètre était en pause, elle calcule combien de temps a duré la pause et l'enregistre.
// Explication technique : Méthode d'instance qui réactive un timer en pause, calcule la durée de la pause, l'ajoute au cumul des pauses et l'enregistre dans l'historique des interruptions.
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
// === Fin : Méthode pour démarrer le chronomètre ===

// === Début : Méthode pour mettre en pause le chronomètre ===
// Explication simple : Cette fonction arrête temporairement le chronomètre en notant à quel moment on a fait une pause.
// Explication technique : Méthode d'instance qui désactive le timer en enregistrant l'horodatage de début de pause et modifie l'état isRunning, avec retour chaînable de l'instance.
// Méthode pour mettre en pause le chronomètre
TimerSchema.methods.pause = function() {
  this.pausedAt = new Date();
  this.isRunning = false;
  return this;
};
// === Fin : Méthode pour mettre en pause le chronomètre ===

// === Début : Méthode pour arrêter le chronomètre ===
// Explication simple : Cette fonction arrête définitivement le chronomètre et calcule combien de temps total il a fonctionné.
// Explication technique : Méthode d'instance qui finalise la session de chronométrage en définissant l'heure de fin, calculant la durée totale en secondes et modifiant l'état à inactif.
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
// === Fin : Méthode pour arrêter le chronomètre ===

// === Début : Méthode pour obtenir la durée actuelle ===
// Explication simple : Cette fonction calcule combien de temps le chronomètre a fonctionné jusqu'à maintenant, en retirant toutes les pauses.
// Explication technique : Méthode d'instance qui retourne la durée effective en tenant compte du statut actuel, soustrayant les périodes de pause cumulées et la pause courante si applicable.
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
// === Fin : Méthode pour obtenir la durée actuelle ===

// === Début : Méthode pour reprendre un timer en pause ===
// Explication simple : Cette fonction redémarre le chronomètre après une pause, en enregistrant combien de temps a duré cette pause.
// Explication technique : Méthode d'instance qui réactive un timer mis en pause, calcule la durée de la pause courante, l'ajoute au cumul des pauses et dans l'historique des interruptions.
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
// === Fin : Méthode pour reprendre un timer en pause ===

// === Début : Optimisation des performances avec des index ===
// Explication simple : On crée des raccourcis pour que l'ordinateur trouve plus vite les chronomètres quand on cherche ceux d'un utilisateur, d'un client ou par date.
// Explication technique : Création d'index MongoDB via Mongoose pour optimiser les requêtes fréquentes sur les champs userId, clientId et startTime, améliorant ainsi les performances des opérations de recherche.
// Ajout d'index pour améliorer les performances
TimerSchema.index({ userId: 1 });
TimerSchema.index({ clientId: 1 });
TimerSchema.index({ startTime: -1 });
// === Fin : Optimisation des performances avec des index ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Timer" basé sur le schéma défini, ce qui permet d'interagir avec la collection "timers" dans MongoDB.
module.exports = mongoose.model('Timer', TimerSchema);
// === Fin : Exportation du modèle ===
