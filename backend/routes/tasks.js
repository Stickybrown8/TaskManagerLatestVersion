const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client'); // Ajout de l'importation du modèle Client

// Obtenir toutes les tâches
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches', error: error.message });
  }
});

// Obtenir une tâche par ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId }).populate('clientId', 'name');
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la tâche', error: error.message });
  }
});

// Créer une nouvelle tâche
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, clientId, dueDate, priority, category, estimatedTime, impactScore } = req.body;
    
    const newTask = new Task({
      userId: req.userId,
      clientId,
      title,
      description,
      dueDate,
      priority,
      category,
      status: 'à faire',
      estimatedTime,
      actualTime: 0,
      impactScore: impactScore || 0,
      createdAt: Date.now()
    });
    
    await newTask.save();

    if (newTask.clientId) {
      // Mettre à jour les métriques du client
      try {
        await Client.findByIdAndUpdate(newTask.clientId, {
          $inc: { 'metrics.tasksPending': 1 },
          'metrics.lastActivity': Date.now()
        });
        console.log(`Métriques du client ${newTask.clientId} mises à jour`);
      } catch (err) {
        console.error("Erreur lors de la mise à jour des métriques client:", err);
        // Ne pas faire échouer toute la requête si cette partie échoue
      }
    }

    res.status(201).json({ message: 'Tâche créée avec succès', task: newTask });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de la tâche', error: error.message });
  }
});

// Mettre à jour une tâche
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, clientId, dueDate, priority, category, status, estimatedTime, actualTime, impactScore } = req.body;
    
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        title, 
        description, 
        clientId, 
        dueDate, 
        priority, 
        category, 
        status, 
        estimatedTime, 
        actualTime, 
        impactScore,
        updatedAt: Date.now() 
      },
      { new: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    res.status(200).json({ message: 'Tâche mise à jour avec succès', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la tâche', error: error.message });
  }
});

// Marquer une tâche comme terminée
router.put('/:id/complete', verifyToken, async (req, res) => {
  try {
    const { actualTime } = req.body;
    
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // Mettre à jour la tâche
    task.status = 'completed';
    task.completedAt = Date.now();
    task.actualTime = actualTime || task.actualTime;
    await task.save();
    
    // Ajouter des points à l'utilisateur
    const pointsEarned = Math.floor(10 + (task.impactScore || 0) * 2);
    const expEarned = Math.floor(20 + (task.impactScore || 0) * 3);
    
    const user = await User.findById(req.userId);
    user.points += pointsEarned;
    user.experience += expEarned;
    
    // Vérifier si l'utilisateur monte de niveau
    const nextLevelExp = user.level * 100;
    if (user.experience >= nextLevelExp) {
      user.level += 1;
    }
    
    await user.save();
    
    res.status(200).json({ 
      message: 'Tâche marquée comme terminée', 
      task, 
      rewards: {
        points: pointsEarned,
        experience: expEarned,
        levelUp: user.experience >= nextLevelExp
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la complétion de la tâche', error: error.message });
  }
});

// Supprimer une tâche
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!deletedTask) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    res.status(200).json({ message: 'Tâche supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la tâche', error: error.message });
  }
});

module.exports = router;
