const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Objective = require('../models/Objective');

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
  try {
    const { title, description, clientId, targetValue, currentValue, unit, dueDate, category } = req.body;
    
    const newObjective = new Objective({
      userId: req.userId,
      clientId,
      title,
      description,
      targetValue,
      currentValue: currentValue || 0,
      unit,
      dueDate,
      category,
      createdAt: Date.now(),
      isCompleted: false
    });
    
    await newObjective.save();
    res.status(201).json({ message: 'Objectif créé avec succès', objective: newObjective });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création de l\'objectif', error: error.message });
  }
});

// Mettre à jour un objectif
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { title, description, clientId, targetValue, currentValue, unit, dueDate, category, isCompleted } = req.body;
    
    const updatedObjective = await Objective.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
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
      { new: true }
    );
    
    if (!updatedObjective) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    res.status(200).json({ message: 'Objectif mis à jour avec succès', objective: updatedObjective });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de l\'objectif', error: error.message });
  }
});

// Supprimer un objectif
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedObjective = await Objective.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });
    
    if (!deletedObjective) {
      return res.status(404).json({ message: 'Objectif non trouvé' });
    }
    
    res.status(200).json({ message: 'Objectif supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'objectif', error: error.message });
  }
});

module.exports = router;
