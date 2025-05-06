const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
const Profitability = require('../models/Profitability');

// Obtenir tous les clients
router.get('/', verifyToken, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des clients', error: error.message });
  }
});

// Obtenir un client par ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, userId: req.userId });
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du client', error: error.message });
  }
});

// Créer un nouveau client - Ajouter la transaction
router.post('/', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, description, status, contacts, notes, tags, logo, profitability } = req.body;
    
    // 1. Créer le client
    const newClient = new Client({
      userId: req.userId,
      name,
      description,
      status: status || 'actif',
      contacts: contacts || [],
      notes: notes || '',
      tags: tags || [],
      logo: logo || '',
      metrics: {
        tasksCompleted: 0,
        tasksInProgress: 0,
        tasksPending: 0,
        lastActivity: Date.now()
      },
      createdAt: Date.now()
    });
    
    await newClient.save({ session });
    
    // 2. Créer les données de rentabilité si fournies
    if (profitability && profitability.hourlyRate) {
      const newProfitability = new Profitability({
        userId: req.userId,
        clientId: newClient._id,
        hourlyRate: profitability.hourlyRate,
        targetHours: profitability.targetHours || 0,
        actualHours: 0,
        revenue: profitability.monthlyBudget || 0,
        profit: 0,
        profitability: 0,
        updatedAt: Date.now()
      });
      
      await newProfitability.save({ session });
    }
    
    // 3. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(201).json({ 
      success: true,
      message: 'Client créé avec succès', 
      client: newClient 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur création client', {
      error: error.message,
      body: req.body
    });
    
    res.status(500).json({ message: 'Erreur lors de la création du client', error: error.message });
  }
});

// Mettre à jour un client
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, company, notes } = req.body;
    
    const updatedClient = await Client.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { name, email, phone, company, notes, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!updatedClient) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    res.status(200).json({ message: 'Client mis à jour avec succès', client: updatedClient });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du client', error: error.message });
  }
});

// Supprimer un client et toutes ses tâches associées
router.delete('/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Trouver et supprimer le client
    const deletedClient = await Client.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    }).session(session);
    
    if (!deletedClient) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // 2. Supprimer toutes les tâches liées au client
    const deletedTasks = await Task.deleteMany({
      clientId: req.params.id,
      userId: req.userId
    }).session(session);
    
    // 3. Supprimer les données de rentabilité associées
    await Profitability.findOneAndDelete({
      clientId: req.params.id,
      userId: req.userId
    }).session(session);
    
    // 4. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    // 5. Vérification post-transaction
    const verifyClient = await Client.findById(req.params.id);
    const verifyTasks = await Task.countDocuments({ clientId: req.params.id });
    
    if (verifyClient || verifyTasks > 0) {
      mongoLogger.warn('Vérification post-suppression client échouée', { 
        clientId: req.params.id,
        clientExists: !!verifyClient,
        remainingTasks: verifyTasks
      });
    }
    
    res.status(200).json({ 
      message: 'Client et toutes ses tâches supprimés avec succès',
      tasksCount: deletedTasks.deletedCount 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur suppression client', { 
      error: error.message,
      clientId: req.params.id
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la suppression du client', 
      error: error.message 
    });
  }
});

module.exports = router;
