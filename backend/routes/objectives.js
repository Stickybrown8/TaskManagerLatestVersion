const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Objective = require('../models/Objective');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
const Client = require('../models/Client');

// Obtenir tous les objectifs
router.get('/', verifyToken, async (req, res) => {
  try {
    const objectives = await Objective.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(objectives);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs', error: error.message });
  }
});

// Obtenir les objectifs d'un client spécifique
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const objectives = await Objective.find({ 
      userId: req.userId,
      clientId: req.params.clientId 
    });
    res.status(200).json(objectives);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs du client', error: error.message });
  }
});

// Obtenir un objectif par ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const objective = await Objective.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).populate('clientId', 'name');
    
    if (!objective) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    res.status(200).json(objective);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'objectif', error: error.message });
  }
});

// Créer un nouvel objectif
router.post('/', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { title, description, clientId, targetValue, currentValue, unit, dueDate, category } = req.body;
    
    // 1. Vérifier si le client existe
    const client = await Client.findOne({ 
      _id: clientId, 
      userId: req.userId 
    }).session(session);
    
    if (!client) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // 2. Créer l'objectif
    const newObjective = new Objective({
      title,
      description,
      clientId,
      targetValue,
      currentValue: currentValue || 0,
      unit: unit || '%',
      createdBy: req.userId,
      dueDate,
      category,
      createdAt: Date.now(),
      isCompleted: false
    });
    
    // Calculer la progression initiale
    if (newObjective.targetValue > 0) {
      newObjective.progress = Math.min(100, Math.round((newObjective.currentValue / newObjective.targetValue) * 100));
    }
    
    await newObjective.save({ session });
    
    // 3. Mettre à jour le client - incrémenter le compteur d'objectifs
    client.objectivesCount = (client.objectivesCount || 0) + 1;
    client.lastActivity = Date.now();
    await client.save({ session });
    
    // 4. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ 
      success: true,
      message: 'Objectif créé avec succès', 
      objective: newObjective 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur création objectif', { 
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ message: 'Erreur lors de la création de l\'objectif', error: error.message });
  }
});

// Mettre à jour un objectif
router.put('/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { title, description, clientId, targetValue, currentValue, unit, dueDate, category, isCompleted } = req.body;
    
    // 1. Vérifier si l'objectif existe
    const existingObjective = await Objective.findOne({
      _id: req.params.id,
      createdBy: req.userId
    }).session(session);
    
    if (!existingObjective) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    // Capturer l'ancien clientId et statut pour vérifier les changements
    const oldClientId = existingObjective.clientId.toString();
    const wasCompleted = existingObjective.isCompleted;
    
    // 2. Mettre à jour l'objectif
    const updatedObjective = await Objective.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { 
        title, 
        description, 
        clientId, 
        targetValue, 
        currentValue, 
        unit, 
        dueDate, 
        category,
        isCompleted,
        updatedAt: Date.now(),
        completedAt: isCompleted ? Date.now() : null
      },
      { new: true, session }
    );
    
    // 3. Recalculer la progression
    if (updatedObjective.targetValue > 0) {
      updatedObjective.progress = Math.min(100, Math.round((updatedObjective.currentValue / updatedObjective.targetValue) * 100));
      await updatedObjective.save({ session });
    }
    
    // 4. Gérer les changements de client si nécessaire
    if (clientId.toString() !== oldClientId) {
      // Décrémenter le compteur d'objectifs de l'ancien client
      await Client.findByIdAndUpdate(
        oldClientId,
        { 
          $inc: { objectivesCount: -1 },
          lastActivity: Date.now()
        },
        { session }
      );
      
      // Incrémenter le compteur d'objectifs du nouveau client
      await Client.findByIdAndUpdate(
        clientId,
        { 
          $inc: { objectivesCount: 1 },
          lastActivity: Date.now()
        },
        { session }
      );
    } else if (isCompleted !== wasCompleted) {
      // Mettre à jour le client si le statut de complétion a changé
      await Client.findByIdAndUpdate(
        clientId,
        { 
          $inc: { 
            objectivesCompleted: isCompleted ? 1 : -1,
            objectivesPending: isCompleted ? -1 : 1
          },
          lastActivity: Date.now()
        },
        { session }
      );
    }
    
    // 5. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      success: true,
      message: 'Objectif mis à jour avec succès', 
      objective: updatedObjective 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur mise à jour objectif', { 
      error: error.message,
      objectiveId: req.params.id
    });
    
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'objectif', error: error.message });
  }
});

// Supprimer un objectif - Ajouter transaction
router.delete('/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Trouver l'objectif avant suppression
    const objectiveToDelete = await Objective.findOne({ 
      _id: req.params.id, 
      createdBy: req.userId 
    }).session(session);
    
    if (!objectiveToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    // 2. Conserver le clientId pour la mise à jour
    const clientId = objectiveToDelete.clientId;
    const wasCompleted = objectiveToDelete.isCompleted;
    
    // 3. Supprimer l'objectif
    await Objective.findByIdAndDelete(req.params.id).session(session);
    
    // 4. Mettre à jour les compteurs du client
    const clientUpdate = {
      $inc: { objectivesCount: -1 },
      lastActivity: Date.now()
    };
    
    // Si l'objectif était complété, décrémenter aussi objectivesCompleted
    if (wasCompleted) {
      clientUpdate.$inc.objectivesCompleted = -1;
    } else {
      clientUpdate.$inc.objectivesPending = -1;
    }
    
    await Client.findByIdAndUpdate(clientId, clientUpdate, { session });
    
    // 5. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      success: true,
      message: 'Objectif supprimé avec succès' 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur suppression objectif', { 
      error: error.message,
      objectiveId: req.params.id
    });
    
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'objectif', error: error.message });
  }
});

module.exports = router;
