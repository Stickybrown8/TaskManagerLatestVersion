const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Task = require('../models/Task');

// Obtenir les tâches à fort impact (principe 80/20)
router.get('/high-impact', verifyToken, async (req, res) => {
  try {
    // Récupérer toutes les tâches non terminées
    const tasks = await Task.find({ 
      userId: req.userId,
      status: { $ne: 'completed' }
    }).sort({ impactScore: -1 }).populate('clientId', 'name');
    
    // Calculer le seuil pour les 20% des tâches à plus fort impact
    const threshold = Math.ceil(tasks.length * 0.2);
    const highImpactTasks = tasks.slice(0, threshold);
    
    res.status(200).json(highImpactTasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches à fort impact', error: error.message });
  }
});

// Analyser l'impact des tâches par client
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.userId,
      clientId: req.params.clientId
    }).sort({ impactScore: -1 });
    
    // Calculer des statistiques d'impact
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const averageImpact = tasks.reduce((sum, task) => sum + (task.impactScore || 0), 0) / totalTasks;
    
    // Identifier les tâches à fort impact
    const threshold = Math.ceil(totalTasks * 0.2);
    const highImpactTasks = tasks.slice(0, threshold);
    
    res.status(200).json({
      statistics: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        averageImpact
      },
      highImpactTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'analyse d\'impact des tâches', error: error.message });
  }
});

// Mettre à jour le score d'impact d'une tâche
router.put('/task/:taskId', verifyToken, async (req, res) => {
  try {
    const { impactScore } = req.body;
    
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.taskId, userId: req.userId },
      { impactScore, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    res.status(200).json({ message: 'Score d\'impact mis à jour avec succès', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du score d\'impact', error: error.message });
  }
});

module.exports = router;
