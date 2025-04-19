const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Timer = require('../models/Timer');
const Task = require('../models/Task');

// Obtenir tous les timers de l'utilisateur
router.get('/', verifyToken, async (req, res) => {
  try {
    const timers = await Timer.find({ userId: req.userId })
      .populate('taskId', 'title')
      .populate('clientId', 'name');
    res.status(200).json(timers);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des timers', error: error.message });
  }
});

// Obtenir un timer spécifique
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const timer = await Timer.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    })
      .populate('taskId', 'title')
      .populate('clientId', 'name');
    
    if (!timer) {
      return res.status(404).json({ message: 'Timer non trouvé' });
    }
    
    res.status(200).json(timer);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du timer', error: error.message });
  }
});

// Démarrer un nouveau timer
router.post('/start', verifyToken, async (req, res) => {
  try {
    const { taskId, clientId, description } = req.body;
    
    // Vérifier s'il y a déjà un timer actif
    const activeTimer = await Timer.findOne({ 
      userId: req.userId,
      endTime: null
    });
    
    if (activeTimer) {
      return res.status(400).json({ message: 'Un timer est déjà actif. Arrêtez-le avant d\'en démarrer un nouveau.' });
    }
    
    // Créer un nouveau timer
    const newTimer = new Timer({
      userId: req.userId,
      taskId,
      clientId,
      description,
      startTime: Date.now(),
      endTime: null,
      duration: 0,
      createdAt: Date.now()
    });
    
    await newTimer.save();
    
    res.status(201).json({ message: 'Timer démarré avec succès', timer: newTimer });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors du démarrage du timer', error: error.message });
  }
});

// Arrêter un timer actif
router.put('/stop/:id', verifyToken, async (req, res) => {
  try {
    const timer = await Timer.findOne({ 
      _id: req.params.id, 
      userId: req.userId,
      endTime: null
    });
    
    if (!timer) {
      return res.status(404).json({ message: 'Timer actif non trouvé' });
    }
    
    // Arrêter le timer
    const endTime = Date.now();
    timer.endTime = endTime;
    timer.duration = (endTime - timer.startTime) / 1000 / 60 / 60; // Convertir en heures
    
    await timer.save();
    
    // Mettre à jour le temps passé sur la tâche si une tâche est associée
    if (timer.taskId) {
      const task = await Task.findById(timer.taskId);
      if (task) {
        task.actualTime = (task.actualTime || 0) + timer.duration;
        await task.save();
      }
    }
    
    res.status(200).json({ message: 'Timer arrêté avec succès', timer });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'arrêt du timer', error: error.message });
  }
});

// Supprimer un timer
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedTimer = await Timer.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!deletedTimer) {
      return res.status(404).json({ message: 'Timer non trouvé' });
    }
    
    res.status(200).json({ message: 'Timer supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression du timer', error: error.message });
  }
});

module.exports = router;
