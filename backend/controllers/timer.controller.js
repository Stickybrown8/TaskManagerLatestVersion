/*
 * CONTRÔLEUR DES CHRONOMÈTRES - backend/controllers/timer.controller.js
 *
 * Explication simple:
 * Ce fichier contient toutes les fonctions qui gèrent les chronomètres dans l'application.
 * C'est comme un chef d'orchestre qui sait comment démarrer, arrêter, afficher et supprimer
 * les chronomètres pour mesurer le temps de travail sur les tâches.
 *
 * Explication technique:
 * Contrôleur central qui encapsule toute la logique métier liée aux chronomètres,
 * avec gestion des validations, calculs de durée, vérifications d'ownership et
 * formatage des réponses API pour les routes timers.
 */

// === Début : Importation des dépendances ===
const Timer = require('../models/Timer');
const mongoose = require('mongoose');
// === Fin : Importation des dépendances ===

// === Début : Fonction de test de connexion ===
// Explication simple : Vérifie que tout fonctionne bien avec les timers
// Explication technique : Endpoint de diagnostic pour valider l'authentification et la disponibilité du service
const testConnection = async (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Connexion au service de timer réussie',
      userId: req.userId,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Erreur route test timer:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
};
// === Fin : Fonction de test de connexion ===

// === Début : Fonction pour récupérer tous les chronomètres ===
// Explication simple : Récupère la liste de tous tes chronomètres, du plus récent au plus ancien
// Explication technique : Récupération de tous les Timer de l'utilisateur avec tri chronologique inverse
const getAllTimers = async (req, res) => {
  try {
    const timers = await Timer.find({ userId: req.userId }).sort({ startTime: -1 });
    res.json(timers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};
// === Fin : Fonction pour récupérer tous les chronomètres ===

// === Début : Fonction pour récupérer un chronomètre spécifique ===
// Explication simple : Récupère les détails d'un chronomètre particulier, mais seulement si c'est le tien
// Explication technique : Récupération d'un Timer par ID avec double vérification existence et ownership
const getTimerById = async (req, res) => {
  try {
    const timer = await Timer.findById(req.params.id);
    
    if (!timer) {
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    res.json(timer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};
// === Fin : Fonction pour récupérer un chronomètre spécifique ===

// === Début : Fonction pour créer un nouveau chronomètre ===
// Explication simple : Démarre un nouveau chronomètre pour une tâche ou un client
// Explication technique : Création d'un Timer avec validation ObjectId, gestion des paramètres optionnels et logging détaillé
const createTimer = async (req, res) => {
  try {
    const { description, clientId, taskId, billable } = req.body;
    
    // Log de débogage
    console.log('Création timer - données reçues:', { 
      description, 
      clientId, 
      taskId, 
      billable, 
      userId: req.userId 
    });
    
    // Vérification des paramètres
    if (!clientId) {
      return res.status(400).json({ 
        msg: 'clientId est requis',
        received: req.body
      });
    }
    
    // Vérifier que le clientId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ 
        msg: 'clientId invalide',
        received: clientId
      });
    }
    
    // Création avec valeurs par défaut pour les champs optionnels
    const timer = new Timer({
      userId: req.userId,
      description: description || '',
      clientId,
      taskId: taskId || null,
      billable: billable !== undefined ? billable : true,
      startTime: new Date()
    });
    
    const savedTimer = await timer.save();
    console.log('Timer créé avec succès:', savedTimer._id);
    res.json(savedTimer);
  } catch (err) {
    console.error('Erreur détaillée lors de la création du timer:', err);
    
    // Réponse d'erreur améliorée
    res.status(500).json({ 
      msg: 'Erreur serveur', 
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
};
// === Fin : Fonction pour créer un nouveau chronomètre ===

// === Début : Fonction pour arrêter un chronomètre ===
// Explication simple : Arrête le chrono et calcule automatiquement le temps passé
// Explication technique : Mise à jour du Timer avec endTime et calcul automatique de durée en secondes
const stopTimer = async (req, res) => {
  try {
    const timer = await Timer.findById(req.params.id);
    
    if (!timer) {
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    timer.endTime = new Date();
    
    if (req.body.duration) {
      timer.duration = req.body.duration;
    } else {
      // Calculer la durée automatiquement
      const start = new Date(timer.startTime).getTime();
      const end = new Date(timer.endTime).getTime();
      timer.duration = Math.round((end - start) / 1000); // Durée en secondes
    }
    
    await timer.save();
    res.json(timer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};
// === Fin : Fonction pour arrêter un chronomètre ===

// === Début : Fonction pour supprimer un chronomètre ===
// Explication simple : Supprime complètement un chronomètre si tu as fait une erreur
// Explication technique : Suppression d'un Timer avec vérifications de sécurité ownership
const deleteTimer = async (req, res) => {
  try {
    const timer = await Timer.findById(req.params.id);
    
    if (!timer) {
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    await Timer.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Timer supprimé' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
};
// === Fin : Fonction pour supprimer un chronomètre ===

// === Début : Exportation des fonctions ===
module.exports = {
  testConnection,
  getAllTimers,
  getTimerById,
  createTimer,
  stopTimer,
  deleteTimer
};
// === Fin : Exportation des fonctions ===