/*
 * CONTRÔLEUR RENTABILITÉ - backend/controllers/profitability.controller.js
 *
 * Explication simple:
 * Ce fichier contient toute la logique financière pour calculer si les clients rapportent
 * de l'argent. Il fait des calculs comme profit, pourcentage de rentabilité et temps restant.
 *
 * Explication technique:
 * Contrôleur MVC avec logique financière sophistiquée, pattern upsert, agrégations de données,
 * calculs automatiques et transactions pour garantir l'intégrité des données financières.
 */

// === Imports ===
const Profitability = require('../models/Profitability');
const Task = require('../models/Task');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');

// === Fonction 1: Récupérer toutes les données de rentabilité ===
const getAllProfitability = async (req, res) => {
  try {
    const profitabilityData = await Profitability.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(profitabilityData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rentabilité', error: error.message });
  }
};

// === Fonction 2: Récupérer la rentabilité d'un client spécifique ===
const getProfitabilityByClient = async (req, res) => {
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
};

// === Fonction 3: Mettre à jour ou créer des données de rentabilité (UPSERT) ===
const updateOrCreateProfitability = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { hourlyRate, targetHours, actualHours, revenue } = req.body;
    
    // 1. Vérifier si le client existe
    const client = await Client.findOne({ 
      _id: req.params.clientId, 
      userId: req.userId 
    }).session(session);
    
    if (!client) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    
    // 2. Rechercher des données de rentabilité existantes
    let profitability = await Profitability.findOne({ 
      userId: req.userId,
      clientId: req.params.clientId 
    }).session(session);
    
    // 3. Créer ou mettre à jour les données de rentabilité (PATTERN UPSERT)
    if (!profitability) {
      profitability = new Profitability({
        userId: req.userId,
        clientId: req.params.clientId,
        hourlyRate,
        targetHours,
        actualHours,
        revenue
      });
    } else {
      profitability.hourlyRate = hourlyRate;
      profitability.targetHours = targetHours;
      profitability.actualHours = actualHours;
      profitability.revenue = revenue;
      profitability.updatedAt = Date.now();
    }
    
    // 4. CALCULS FINANCIERS SOPHISTIQUÉS
    const cost = profitability.hourlyRate * profitability.actualHours;
    profitability.profit = profitability.revenue - cost;
    profitability.profitability = profitability.revenue > 0 ? (profitability.profit / profitability.revenue) * 100 : 0;
    profitability.remainingHours = profitability.targetHours - profitability.actualHours;
    
    await profitability.save({ session });
    
    // 5. Mettre à jour le client avec les dernières informations de rentabilité
    client.lastProfitabilityUpdate = Date.now();
    await client.save({ session });
    
    // 6. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      message: 'Données de rentabilité mises à jour avec succès', 
      profitability 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur mise à jour rentabilité', { 
      error: error.message,
      clientId: req.params.clientId
    });
    
    res.status(500).json({ message: 'Erreur lors de la mise à jour des données de rentabilité', error: error.message });
  }
};

// === Fonction 4: Mettre à jour les heures automatiquement (ULTRA-SOPHISTIQUÉ) ===
const updateHours = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. AGRÉGATION : Calculer le total des heures passées sur les tâches pour ce client
    const tasks = await Task.find({ 
      userId: req.userId,
      clientId: req.params.clientId,
      status: 'completed'
    }).session(session);
    
    const totalHours = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0);
    
    // 2. Mettre à jour les données de rentabilité
    let profitability = await Profitability.findOne({ 
      userId: req.userId,
      clientId: req.params.clientId 
    }).session(session);
    
    if (!profitability) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Données de rentabilité non trouvées pour ce client' });
    }
    
    // 3. RECALCULS AUTOMATIQUES DE TOUS LES INDICATEURS FINANCIERS
    profitability.actualHours = totalHours;
    
    const cost = profitability.hourlyRate * profitability.actualHours;
    profitability.profit = profitability.revenue - cost;
    profitability.profitability = profitability.revenue > 0 ? (profitability.profit / profitability.revenue) * 100 : 0;
    profitability.remainingHours = profitability.targetHours - profitability.actualHours;
    profitability.updatedAt = Date.now();
    
    await profitability.save({ session });
    
    // 4. Mettre à jour le client
    await Client.findByIdAndUpdate(
      req.params.clientId,
      { lastProfitabilityUpdate: Date.now() },
      { session }
    );
    
    // 5. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({ 
      message: 'Heures et rentabilité mises à jour avec succès', 
      profitability 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur mise à jour heures rentabilité', { 
      error: error.message,
      clientId: req.params.clientId
    });
    
    res.status(500).json({ message: 'Erreur lors de la mise à jour des heures et de la rentabilité', error: error.message });
  }
};

// === Exports ===
module.exports = {
  getAllProfitability,
  getProfitabilityByClient,
  updateOrCreateProfitability,
  updateHours
};