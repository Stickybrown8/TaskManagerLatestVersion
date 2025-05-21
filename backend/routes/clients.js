/*
 * ROUTES DE GESTION DES CLIENTS - /workspaces/TaskManagerLatestVersion/backend/routes/clients.js
 *
 * Explication simple:
 * Ce fichier contient toutes les fonctions qui permettent de gérer les clients dans l'application.
 * Il définit comment créer un nouveau client, voir la liste des clients, modifier leurs informations
 * ou les supprimer. C'est comme un carnet d'adresses intelligent qui s'occupe de toutes les 
 * opérations liées aux clients.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des clients,
 * incluant des opérations CRUD avec transactions MongoDB et vérification d'authentification.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux clients,
 * utilisé par le frontend pour afficher et manipuler les données des clients.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les modèles Client, Task et Profitability pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Utilise mongoLogger pour journaliser les erreurs et événements importants
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend qui gèrent les clients
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir tous les outils dont on a besoin pour gérer les clients.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification, des modèles Mongoose et des utilitaires pour la journalisation et les transactions.
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Client = require('../models/Client');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
const Profitability = require('../models/Profitability');
// === Fin : Importation des dépendances ===

// === Début : Route pour récupérer tous les clients ===
// Explication simple : Cette fonction permet de voir la liste de tous les clients qui appartiennent à l'utilisateur connecté.
// Explication technique : Endpoint GET qui récupère tous les documents de la collection Client filtrés par l'identifiant de l'utilisateur authentifié, avec gestion des erreurs.
// Obtenir tous les clients
router.get('/', verifyToken, async (req, res) => {
  try {
    const clients = await Client.find({ userId: req.userId });
    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des clients', error: error.message });
  }
});
// === Fin : Route pour récupérer tous les clients ===

// === Début : Route pour récupérer un client spécifique ===
// Explication simple : Cette fonction permet de voir les détails d'un seul client quand on connaît son numéro d'identification.
// Explication technique : Endpoint GET paramétré qui récupère un document Client spécifique par son ID, avec vérification du propriétaire et gestion des cas où le client n'existe pas.
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
// === Fin : Route pour récupérer un client spécifique ===

// === Début : Route pour créer un nouveau client ===
// Explication simple : Cette fonction permet d'ajouter un nouveau client dans notre liste, avec toutes ses informations et même des données sur combien il nous rapporte.
// Explication technique : Endpoint POST qui crée un nouveau document Client et optionnellement un document Profitability associé, en utilisant une transaction MongoDB pour garantir l'intégrité des données.
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
// === Fin : Route pour créer un nouveau client ===

// === Début : Route pour mettre à jour un client existant ===
// Explication simple : Cette fonction permet de modifier les informations d'un client qui existe déjà dans notre liste.
// Explication technique : Endpoint PUT paramétré qui met à jour un document Client existant identifié par son ID, avec vérification du propriétaire et retour du document mis à jour.
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
// === Fin : Route pour mettre à jour un client existant ===

// === Début : Route pour supprimer un client et ses données associées ===
// Explication simple : Cette fonction permet d'effacer complètement un client et toutes les tâches qui lui sont liées, comme quand on fait un grand nettoyage.
// Explication technique : Endpoint DELETE paramétré qui supprime un client, ses tâches et ses données de rentabilité en utilisant une transaction MongoDB, avec vérification post-transaction pour s'assurer de la suppression complète.
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
// === Fin : Route pour supprimer un client et ses données associées ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend toutes nos fonctions disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
