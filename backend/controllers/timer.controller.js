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
const Task = require('../models/Task');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
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
    const timers = await Timer.find({ userId: req.userId })
      .populate('clientId', 'name')
      .populate('taskId', 'title')
      .sort({ startTime: -1 });
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
    const timer = await Timer.findById(req.params.id)
      .populate('clientId', 'name')
      .populate('taskId', 'title');
    
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
    
    // Mettre à jour l'activité du client
    await Client.findByIdAndUpdate(clientId, { lastActivity: Date.now() });
    
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

// === Début : Fonction pour arrêter un chronomètre AMÉLIORÉE ===
// Explication simple : Arrête le chrono, calcule le temps passé et met à jour la tâche
// Explication technique : Transaction MongoDB pour garantir l'intégrité des données entre Timer et Task
const stopTimer = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const timer = await Timer.findById(req.params.id).session(session);
    
    if (!timer) {
      await session.abortTransaction();
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      await session.abortTransaction();
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    // Vérifier si le timer n'est pas déjà arrêté
    if (timer.endTime) {
      await session.abortTransaction();
      return res.status(400).json({ msg: 'Timer déjà arrêté' });
    }
    
    timer.endTime = new Date();
    
    // Utiliser la durée fournie ou calculer
    if (req.body.duration !== undefined) {
      timer.duration = req.body.duration;
    } else {
      const start = new Date(timer.startTime).getTime();
      const end = new Date(timer.endTime).getTime();
      timer.duration = Math.round((end - start) / 1000); // Durée en secondes
    }
    
    await timer.save({ session });
    
    // NOUVEAU : Mettre à jour timeSpent de la tâche si elle existe
    if (timer.taskId) {
      const task = await Task.findById(timer.taskId).session(session);
      
      if (task) {
        // Ajouter les minutes travaillées
        const minutesWorked = Math.round(timer.duration / 60);
        const previousTime = task.timeSpent || 0;
        task.timeSpent = previousTime + minutesWorked;
        
        await task.save({ session });
        
        console.log(`Task ${task._id} mise à jour : +${minutesWorked} minutes (${previousTime} → ${task.timeSpent} minutes)`);
        
        // Logger l'activité
        mongoLogger.info('Timer arrêté et tâche mise à jour', {
          timerId: timer._id,
          taskId: task._id,
          minutesAdded: minutesWorked,
          totalMinutes: task.timeSpent
        });
      }
    }
    
    // NOUVEAU : Mettre à jour l'activité du client et déclencher le recalcul de rentabilité
    if (timer.clientId) {
      await Client.findByIdAndUpdate(
        timer.clientId,
        { lastActivity: Date.now() },
        { session }
      );
      
      // Appeler la mise à jour de la rentabilité (sera fait après la transaction)
      req.updateProfitabilityNeeded = {
        clientId: timer.clientId,
        userId: timer.userId
      };
    }
    
    await session.commitTransaction();
    
    // Récupérer le timer avec les données populées pour la réponse
    const populatedTimer = await Timer.findById(timer._id)
      .populate('clientId', 'name')
      .populate('taskId', 'title');
    
    res.json({
      timer: populatedTimer,
      minutesAdded: Math.round(timer.duration / 60),
      message: 'Timer arrêté avec succès'
    });
    
    // NOUVEAU : Déclencher la mise à jour de rentabilité après la réponse
    if (req.updateProfitabilityNeeded) {
      // Appel asynchrone sans attendre la réponse
      const { clientId, userId } = req.updateProfitabilityNeeded;
      updateClientProfitability(clientId, userId).catch(err => {
        console.error('Erreur mise à jour rentabilité:', err);
      });
    }
    
  } catch (err) {
    await session.abortTransaction();
    console.error('Erreur arrêt timer:', err.message);
    res.status(500).json({ 
      msg: 'Erreur serveur', 
      error: err.message 
    });
  } finally {
    session.endSession();
  }
};
// === Fin : Fonction pour arrêter un chronomètre ===

// === Début : Fonction helper pour mettre à jour la rentabilité ===
// Explication simple : Met à jour automatiquement les calculs de rentabilité après un timer
// Explication technique : Appel asynchrone au contrôleur de rentabilité pour recalculer les métriques
const updateClientProfitability = async (clientId, userId) => {
  try {
    const profitabilityController = require('./profitability.controller');
    
    // Créer un objet req/res factice pour appeler updateHours
    const fakeReq = {
      userId,
      params: { clientId }
    };
    
    const fakeRes = {
      status: () => ({ json: () => {} }),
      json: () => {}
    };
    
    await profitabilityController.updateHours(fakeReq, fakeRes);
    console.log(`Rentabilité mise à jour pour le client ${clientId}`);
  } catch (error) {
    console.error('Erreur mise à jour rentabilité:', error);
  }
};
// === Fin : Fonction helper pour mettre à jour la rentabilité ===

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