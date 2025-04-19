const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Profitability = require('../models/Profitability');
const Task = require('../models/Task');
const Client = require('../models/Client');

// Obtenir la rentabilité de tous les clients
router.get('/', verifyToken, async (req, res) => {
  try {
    const profitabilityData = await Profitability.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(profitabilityData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rentabilité', error: error.message });
  }
});

// Obtenir la rentabilité d'un client spécifique
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const profitability = await Profitability.findOne({ 
      userId: req.userId,
      clientId: req.params.clientId 
    }).populate('clientId', 'name');
    
    if (!profitability) {
      return res.status(404).json({ message: 'Données de rentabilité non trouvées pour ce client' });
    }
    
    res.status(200).json(profitability);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rentabilité', error: error.message });
  }
});

// Mettre à jour ou créer des données de rentabilité pour un client
router.post('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const { hourlyRate, targetHours, actualHours, revenue } = req.body;
    
    // Vérifier si le client existe
    const client = await Client.findOne({ _id: req.params.clientId, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // Rechercher des données de rentabilité existantes
    let profitability = await Profitability.findOne({ 
      userId: req.userId,
      clientId: req.params.clientId 
    });
    
    if (profitability) {
      // Mettre à jour les données existantes
      profitability.hourlyRate = hourlyRate || profitability.hourlyRate;
      profitability.targetHours = targetHours || profitability.targetHours;
      profitability.actualHours = actualHours || profitability.actualHours;
      profitability.revenue = revenue || profitability.revenue;
      profitability.updatedAt = Date.now();
    } else {
      // Créer de nouvelles données de rentabilité
      profitability = new Profitability({
        userId: req.userId,
        clientId: req.params.clientId,
        hourlyRate: hourlyRate || 0,
        targetHours: targetHours || 0,
        actualHours: actualHours || 0,
        revenue: revenue || 0,
        createdAt: Date.now()
      });
    }
    
    // Calculer la rentabilité
    const cost = profitability.hourlyRate * profitability.actualHours;
    profitability.profit = profitability.revenue - cost;
    profitability.profitability = profitability.revenue > 0 ? (profitability.profit / profitability.revenue) * 100 : 0;
    profitability.remainingHours = profitability.targetHours - profitability.actualHours;
    
    await profitability.save();
    
    res.status(200).json({ 
      message: 'Données de rentabilité mises à jour avec succès', 
      profitability 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des données de rentabilité', error: error.message });
  }
});

// Mettre à jour les heures réelles basées sur les tâches terminées
router.put('/update-hours/:clientId', verifyToken, async (req, res) => {
  try {
    // Calculer le total des heures passées sur les tâches pour ce client
    const tasks = await Task.find({ 
      userId: req.userId,
      clientId: req.params.clientId,
      status: 'completed'
    });
    
    const totalHours = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
    
    // Mettre à jour les données de rentabilité
    let profitability = await Profitability.findOne({ 
      userId: req.userId,
      clientId: req.params.clientId 
    });
    
    if (!profitability) {
      return res.status(404).json({ message: 'Données de rentabilité non trouvées pour ce client' });
    }
    
    profitability.actualHours = totalHours;
    
    // Recalculer la rentabilité
    const cost = profitability.hourlyRate * profitability.actualHours;
    profitability.profit = profitability.revenue - cost;
    profitability.profitability = profitability.revenue > 0 ? (profitability.profit / profitability.revenue) * 100 : 0;
    profitability.remainingHours = profitability.targetHours - profitability.actualHours;
    profitability.updatedAt = Date.now();
    
    await profitability.save();
    
    res.status(200).json({ 
      message: 'Heures réelles mises à jour avec succès', 
      profitability 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour des heures réelles', error: error.message });
  }
});

module.exports = router;
