const express = require('express');
const router = express.Router();
// Correction ici - changer auth en verifyToken
const { verifyToken } = require('../middleware/auth');
const Timer = require('../models/Timer');
const Task = require('../models/Task');
const mongoose = require('mongoose');
const Profitability = require('../models/Profitability');
const Client = require('../models/Client');
const mongoLogger = require('../utils/mongoLogger');

// GET /api/timers - Récupérer tous les timers
router.get('/', verifyToken, async (req, res) => {
  try {
    const timers = await Timer.find({ userId: req.userId }).sort({ startTime: -1 });
    res.json(timers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// GET /api/timers/:id - Récupérer un timer spécifique
router.get('/:id', verifyToken, async (req, res) => {
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
});

// POST /api/timers - Créer un nouveau timer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { description, clientId, taskId, billable } = req.body;
    
    // Vérifier que clientId existe
    if (!clientId) {
      return res.status(400).json({ msg: 'clientId est requis' });
    }
    
    const timer = new Timer({
      userId: req.userId,  // Changer user en userId
      description,
      clientId,
      taskId,
      billable,
      startTime: new Date()
    });
    
    await timer.save();
    res.json(timer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});

// PUT /api/timers/stop/:id - Arrêter un timer
router.put('/stop/:id', verifyToken, async (req, res) => {
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
});

// PATCH /api/timers/:id/stop - Utiliser une transaction
router.patch('/:id/stop', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Trouver et mettre à jour le timer
    const timer = await Timer.findOne({ 
      _id: req.params.id, 
      userId: req.userId,
      endTime: null  // Seulement les timers en cours
    }).session(session);
    
    if (!timer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Timer non trouvé ou déjà arrêté' });
    }
    
    const now = new Date();
    timer.endTime = now;
    timer.duration = Math.round((now - timer.startTime) / 1000);  // En secondes
    await timer.save({ session });
    
    // 2. Si le timer est lié à un client, mettre à jour sa profitabilité
    if (timer.clientId && timer.billable) {
      // Convertir les secondes en heures pour la profitabilité
      const hoursSpent = timer.duration / 3600;
      
      // Chercher des données de profitabilité existantes
      let profitability = await Profitability.findOne({
        userId: req.userId,
        clientId: timer.clientId
      }).session(session);
      
      if (profitability) {
        // Mettre à jour les heures passées
        profitability.actualHours += hoursSpent;
        
        // Recalculer les métriques de rentabilité
        const cost = profitability.hourlyRate * profitability.actualHours;
        profitability.profit = profitability.revenue - cost;
        profitability.profitability = profitability.revenue > 0 ? 
          (profitability.profit / profitability.revenue) * 100 : 0;
        profitability.remainingHours = profitability.targetHours - profitability.actualHours;
        profitability.updatedAt = now;
        
        await profitability.save({ session });
      }
      
      // 3. Mettre à jour la dernière activité du client
      await Client.findByIdAndUpdate(
        timer.clientId,
        { lastActivity: now },
        { session }
      );
    }
    
    // 4. Si le timer est lié à une tâche, mettre à jour son temps actuel
    if (timer.taskId && timer.duration > 0) {
      const task = await Task.findById(timer.taskId).session(session);
      
      if (task) {
        // Convertir les secondes en minutes pour la tâche
        const minutesSpent = Math.round(timer.duration / 60);
        task.actualTime = (task.actualTime || 0) + minutesSpent;
        await task.save({ session });
      }
    }
    
    // 5. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.json(timer);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur arrêt timer', {
      error: error.message,
      timerId: req.params.id
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de l\'arrêt du timer', 
      error: error.message 
    });
  }
});

// DELETE /api/timers/:id - Supprimer un timer
router.delete('/:id', verifyToken, async (req, res) => {
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
});

module.exports = router;
