const express = require('express');
const router = express.Router();
// Correction ici - changer auth en verifyToken
const { verifyToken } = require('../middleware/auth');
const Timer = require('../models/Timer');
const Task = require('../models/Task');

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
