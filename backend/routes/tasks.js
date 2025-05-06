const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client');
const { verifyToken } = require('../middleware/auth');
const mongoLogger = require('../utils/mongoLogger');

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

// Exemple de route avec transaction pour créer une tâche
router.post('/', verifyToken, async (req, res) => {
  // Vérifier si MongoDB supporte les transactions
  if (!mongoose.connection.db.admin().serverInfo?.version) {
    mongoLogger.warn('Impossible de vérifier la version MongoDB pour les transactions');
  } else {
    const version = mongoose.connection.db.admin().serverInfo.version.split('.');
    if (parseInt(version[0]) < 4) {
      mongoLogger.error('MongoDB < 4.0 détecté, transactions non supportées');
      return res.status(500).json({
        success: false,
        message: 'Le serveur MongoDB ne supporte pas les transactions'
      });
    }
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { title, description, clientId, priority, dueDate, category, estimatedTime } = req.body;
    
    // 1. Vérifier si le client existe
    const client = await Client.findById(clientId).session(session);
    if (!client) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Client non trouvé'
      });
    }
    
    // 2. Créer la tâche
    const task = new Task({
      title,
      description,
      userId: req.userId,
      clientId,
      priority: priority || 'moyenne',
      dueDate,
      category: category || 'autre',
      estimatedTime,
      status: 'pending',
      createdAt: Date.now()
    });
    
    await task.save({ session });
    mongoLogger.info('Tâche créée', { taskId: task._id, userId: req.userId });
    
    // 3. Mettre à jour le client (par exemple, incrémenter un compteur de tâches)
    client.taskCount = (client.taskCount || 0) + 1;
    client.lastActivity = Date.now();
    await client.save({ session });
    
    // 4. Confirmer la transaction
    await session.commitTransaction();
    session.endSession();
    
    // 5. Vérification post-transaction
    const savedTask = await Task.findById(task._id)
      .populate('clientId', 'name')
      .lean();
    
    if (!savedTask) {
      mongoLogger.error('Tâche non retrouvée après sauvegarde', { taskId: task._id });
      return res.status(500).json({
        success: false,
        message: 'La tâche a été créée mais n\'a pas pu être récupérée'
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Tâche créée avec succès',
      task: savedTask
    });
    
  } catch (error) {
    // Annuler la transaction en cas d'erreur
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur création tâche', { 
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la tâche',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
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
