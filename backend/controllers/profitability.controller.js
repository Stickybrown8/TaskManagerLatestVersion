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
const Timer = require('../models/Timer');
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
    
    // NOUVEAU : Recalculer spentHours basé sur le mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // Récupérer toutes les tâches terminées du mois
    const monthlyTasks = await Task.find({
      userId: req.userId,
      clientId: req.params.clientId,
      status: 'terminée',
      completedAt: { $gte: startOfMonth }
    });
    
    // Récupérer aussi les timers du mois (pour inclure le temps non finalisé)
    const monthlyTimers = await Timer.find({
      userId: req.userId,
      clientId: req.params.clientId,
      startTime: { $gte: startOfMonth }
    });
    
    // Calculer le temps total du mois
    const taskMinutes = monthlyTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const timerSeconds = monthlyTimers.reduce((sum, timer) => sum + (timer.duration || 0), 0);
    const totalHours = (taskMinutes / 60) + (timerSeconds / 3600);
    
    // Mettre à jour temporairement pour la réponse (sans sauvegarder)
    const profitabilityResponse = profitability.toObject();
    profitabilityResponse.spentHours = totalHours;
    profitabilityResponse.currentMonth = startOfMonth.toISOString();
    
    res.status(200).json(profitabilityResponse);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rentabilité', error: error.message });
  }
};

// === Fonction 3: Mettre à jour ou créer des données de rentabilité (UPSERT) ===
const updateOrCreateProfitability = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { hourlyRate, targetHours, revenue } = req.body;
    
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
        spentHours: 0, // Toujours commencer à 0
        revenue
      });
    } else {
      profitability.hourlyRate = hourlyRate || profitability.hourlyRate;
      profitability.targetHours = targetHours || profitability.targetHours;
      profitability.revenue = revenue || profitability.revenue;
      profitability.lastUpdated = Date.now();
    }
    
    // 4. Recalculer spentHours pour le mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyTasks = await Task.find({
      userId: req.userId,
      clientId: req.params.clientId,
      status: 'terminée',
      completedAt: { $gte: startOfMonth }
    }).session(session);
    
    const totalMinutes = monthlyTasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    profitability.spentHours = totalMinutes / 60;
    
    // 5. CALCULS FINANCIERS SOPHISTIQUÉS
    const cost = profitability.hourlyRate * profitability.spentHours;
    profitability.profitabilityPercentage = profitability.revenue > 0 ? 
      ((profitability.revenue - cost) / profitability.revenue) * 100 : 0;
    profitability.remainingHours = profitability.targetHours - profitability.spentHours;
    profitability.isProfitable = profitability.profitabilityPercentage > 0;
    
    await profitability.save({ session });
    
    // 6. Mettre à jour le client avec les dernières informations de rentabilité
    client.lastProfitabilityUpdate = Date.now();
    await client.save({ session });
    
    // 7. Valider la transaction
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

// === Fonction 4: Mettre à jour les heures automatiquement (AVEC FILTRAGE MENSUEL) ===
const updateHours = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Définir le début du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    // 1. AGRÉGATION : Calculer le total des heures passées sur les tâches TERMINÉES du mois
    const tasks = await Task.find({ 
      userId: req.userId,
      clientId: req.params.clientId,
      status: 'terminée',
      completedAt: { $gte: startOfMonth } // Seulement les tâches terminées ce mois-ci
    }).session(session);
    
    // Calculer aussi le temps des timers en cours (non terminés)
    const activeTimers = await Timer.find({
      userId: req.userId,
      clientId: req.params.clientId,
      startTime: { $gte: startOfMonth }
    }).session(session);
    
    // Calculer le temps total
    const taskMinutes = tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0);
    const timerSeconds = activeTimers.reduce((sum, timer) => sum + (timer.duration || 0), 0);
    const totalHours = (taskMinutes / 60) + (timerSeconds / 3600);
    
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
    profitability.spentHours = totalHours;
    
    const cost = profitability.hourlyRate * profitability.spentHours;
    profitability.profitabilityPercentage = profitability.revenue > 0 ? 
      ((profitability.revenue - cost) / profitability.revenue) * 100 : 0;
    profitability.remainingHours = profitability.targetHours - profitability.spentHours;
    profitability.isProfitable = profitability.profitabilityPercentage > 0;
    profitability.lastUpdated = Date.now();
    
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
    
    console.log(`Heures mises à jour pour le client ${req.params.clientId}: ${totalHours.toFixed(2)}h ce mois-ci`);
    
    res.status(200).json({ 
      message: 'Heures et rentabilité mises à jour avec succès', 
      profitability: {
        ...profitability.toObject(),
        monthlyBreakdown: {
          taskHours: (taskMinutes / 60).toFixed(2),
          timerHours: (timerSeconds / 3600).toFixed(2),
          totalHours: totalHours.toFixed(2),
          currentMonth: startOfMonth.toISOString()
        }
      }
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