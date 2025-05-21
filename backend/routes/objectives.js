/*
 * ROUTES DE GESTION DES OBJECTIFS - /workspaces/TaskManagerLatestVersion/backend/routes/objectives.js
 *
 * Explication simple:
 * Ce fichier contient toutes les fonctions qui permettent de gérer les objectifs dans l'application.
 * Il définit comment créer un nouvel objectif, voir la liste des objectifs, modifier leur progression
 * ou les supprimer. Les objectifs sont des buts importants qu'on veut atteindre pour un client,
 * avec un pourcentage de progression et une date limite.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des objectifs,
 * incluant des opérations CRUD avec transactions MongoDB et vérification d'authentification.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux objectifs,
 * utilisé par le frontend pour afficher et manipuler les données des objectifs.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les modèles Objective et Client pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Utilise mongoLogger pour journaliser les erreurs et événements importants
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend qui gèrent les objectifs
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils dont on a besoin pour gérer les objectifs.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification, des modèles Mongoose et des utilitaires pour la journalisation et les transactions.
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Objective = require('../models/Objective');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
const Client = require('../models/Client');
// === Fin : Importation des dépendances ===

// === Début : Route pour récupérer tous les objectifs ===
// Explication simple : Cette fonction permet de voir la liste de tous les objectifs qui appartiennent à l'utilisateur connecté, en incluant aussi le nom du client pour chaque objectif.
// Explication technique : Endpoint GET qui récupère tous les documents de la collection Objective filtrés par l'identifiant de l'utilisateur authentifié, avec un populate sur le champ clientId pour obtenir les noms des clients.
// Obtenir tous les objectifs
router.get('/', verifyToken, async (req, res) => {
  try {
    const objectives = await Objective.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(objectives);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des objectifs', error: error.message });
  }
});
// === Fin : Route pour récupérer tous les objectifs ===

// === Début : Route pour récupérer les objectifs d'un client spécifique ===
// Explication simple : Cette fonction permet de voir tous les objectifs liés à un seul client, comme une liste de missions pour ce client particulier.
// Explication technique : Endpoint GET paramétré qui récupère les documents Objective filtrés à la fois par l'identifiant de l'utilisateur authentifié et par l'identifiant du client fourni dans l'URL.
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
// === Fin : Route pour récupérer les objectifs d'un client spécifique ===

// === Début : Route pour récupérer un objectif spécifique ===
// Explication simple : Cette fonction permet de voir les détails d'un seul objectif quand on connaît son numéro d'identification, en incluant aussi le nom du client associé.
// Explication technique : Endpoint GET paramétré qui récupère un document Objective spécifique par son ID avec vérification du propriétaire, et effectue un populate sur le champ clientId pour obtenir le nom du client.
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
// === Fin : Route pour récupérer un objectif spécifique ===

// === Début : Route pour créer un nouvel objectif ===
// Explication simple : Cette fonction permet d'ajouter un nouvel objectif dans notre liste, en vérifiant d'abord que le client existe, puis en calculant le pourcentage de progression initial et en mettant à jour les compteurs du client.
// Explication technique : Endpoint POST qui crée un nouveau document Objective, utilisant une transaction MongoDB pour garantir l'intégrité des données lors de la mise à jour simultanée des compteurs dans la collection Client.
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
// === Fin : Route pour créer un nouvel objectif ===

// === Début : Route pour mettre à jour un objectif existant ===
// Explication simple : Cette fonction permet de modifier les informations d'un objectif qui existe déjà, en recalculant sa progression et en mettant à jour les compteurs du client si l'objectif change de statut ou de client.
// Explication technique : Endpoint PUT paramétré qui met à jour un document Objective existant, avec gestion des transactions MongoDB pour maintenir l'intégrité des données lors de modifications qui affectent également les compteurs dans la collection Client.
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
// === Fin : Route pour mettre à jour un objectif existant ===

// === Début : Route pour supprimer un objectif ===
// Explication simple : Cette fonction permet d'effacer complètement un objectif, tout en mettant à jour les compteurs du client pour qu'ils restent exacts, comme quand on retire un livre d'une étagère et qu'on met à jour le nombre total de livres.
// Explication technique : Endpoint DELETE paramétré qui supprime un document Objective, utilisant une transaction MongoDB pour garantir que les compteurs associés dans la collection Client sont correctement décrémentés selon l'état de l'objectif supprimé.
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
// === Fin : Route pour supprimer un objectif ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend toutes nos fonctions disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
