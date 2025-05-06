const express = require('express');
const router = express.Router();
// Correction ici - changer auth en verifyToken
const { verifyToken } = require('../middleware/auth');
const Timer = require('../models/Timer');
const Task = require('../models/Task');

// Ajouter cette route juste après les imports, avant les autres routes

// Route de test pour la connexion timer
router.get('/test', verifyToken, (req, res) => {
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
});

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
