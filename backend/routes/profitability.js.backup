/*
 * ROUTES DE RENTABILITÉ - backend/routes/profitability.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui concerne la rentabilité des clients dans l'application.
 * Il permet de calculer si un client nous rapporte de l'argent en comparant combien on le
 * facture et combien de temps on passe sur ses tâches. C'est comme une calculatrice qui
 * nous dit si on gagne ou perd de l'argent avec chaque client.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des données de rentabilité,
 * incluant des opérations CRUD avec transactions MongoDB et calculs financiers dynamiques.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives à la rentabilité des clients,
 * utilisé par le frontend pour afficher et manipuler les métriques financières.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les modèles Profitability, Task et Client pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Utilise mongoLogger pour journaliser les erreurs et événements importants
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend de reporting financier et tableaux de bord
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils dont on a besoin pour gérer les calculs de rentabilité.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification, des modèles Mongoose et des utilitaires pour la journalisation et les transactions.
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Profitability = require('../models/Profitability');
const Task = require('../models/Task');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
// === Fin : Importation des dépendances ===

// === Début : Route pour récupérer la rentabilité de tous les clients ===
// Explication simple : Cette fonction permet de voir une liste qui montre si chacun de nos clients nous rapporte de l'argent ou non.
// Explication technique : Endpoint GET qui récupère tous les documents de la collection Profitability filtrés par l'identifiant de l'utilisateur authentifié, avec un populate sur le champ clientId pour obtenir les noms des clients.
// Obtenir la rentabilité de tous les clients
router.get('/', verifyToken, async (req, res) => {
  try {
    const profitabilityData = await Profitability.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(profitabilityData);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des données de rentabilité', error: error.message });
  }
});
// === Fin : Route pour récupérer la rentabilité de tous les clients ===

// === Début : Route pour récupérer la rentabilité d'un client spécifique ===
// Explication simple : Cette fonction permet de voir si un client en particulier nous rapporte de l'argent, combien de temps on a passé sur ses projets et combien on lui a facturé.
// Explication technique : Endpoint GET paramétré qui récupère un document Profitability spécifique filtré par l'identifiant de l'utilisateur authentifié et l'identifiant du client fourni, avec un populate pour enrichir les données.
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
// === Fin : Route pour récupérer la rentabilité d'un client spécifique ===

// === Début : Route pour mettre à jour ou créer des données de rentabilité ===
// Explication simple : Cette fonction permet soit de créer un nouveau calcul de rentabilité pour un client, soit de modifier un calcul existant en changeant les informations comme le taux horaire ou le budget, puis elle recalcule si on gagne ou perd de l'argent.
// Explication technique : Endpoint POST paramétré qui exécute un "upsert" (update or insert) sur un document Profitability, utilisant une transaction MongoDB pour garantir l'intégrité entre les collections et effectuant des calculs financiers dynamiques avant enregistrement.
// Mettre à jour ou créer des données de rentabilité pour un client
router.post('/client/:clientId', verifyToken, async (req, res) => {
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
    
    // 3. Créer ou mettre à jour les données de rentabilité
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
    
    // 4. Calculs de rentabilité
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
});
// === Fin : Route pour mettre à jour ou créer des données de rentabilité ===

// === Début : Route pour mettre à jour les heures automatiquement ===
// Explication simple : Cette fonction compte automatiquement tout le temps passé sur les tâches terminées d'un client et met à jour le calcul de rentabilité pour savoir si ce client nous rapporte toujours de l'argent.
// Explication technique : Endpoint PUT paramétré qui agrège les durées des tâches complétées pour un client spécifique, met à jour les métriques de rentabilité et recalcule tous les indicateurs financiers dans une transaction atomique.
// Mettre à jour les heures réelles basées sur les tâches terminées
router.put('/update-hours/:clientId', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Calculer le total des heures passées sur les tâches pour ce client
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
    
    // 3. Mettre à jour les heures et recalculer la rentabilité
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
});
// === Fin : Route pour mettre à jour les heures automatiquement ===

// === Début : Exportation du routeur ===
// Explication simple : On rend disponible toutes nos fonctions pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
