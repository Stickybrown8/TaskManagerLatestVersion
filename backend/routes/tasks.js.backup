/*
 * ROUTES DE GESTION DES TÂCHES - backend/routes/tasks.js
 *
 * Explication simple:
 * Ce fichier contient toutes les fonctions qui permettent de gérer les tâches dans l'application.
 * Il définit comment créer, afficher, modifier et supprimer des tâches, ainsi que marquer une tâche 
 * comme terminée. Chaque changement de tâche met aussi à jour les statistiques du client concerné
 * et peut donner des points de récompense à l'utilisateur.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des tâches,
 * incluant des opérations CRUD avec transactions MongoDB, vérification d'authentification
 * et mise à jour des métriques associées aux clients et à la gamification.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux tâches,
 * utilisé par le frontend pour afficher et manipuler les tâches de l'utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les modèles Task, User et Client pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Utilise mongoLogger pour journaliser les erreurs et événements importants
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend qui gèrent les tâches et tableaux de bord
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils dont on a besoin pour gérer les tâches et se connecter à la base de données.
// Explication technique : Importation des modules Express pour le routage, Mongoose pour les transactions, des modèles de données et du middleware d'authentification.
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client');
const { verifyToken } = require('../middleware/auth');
const mongoLogger = require('../utils/mongoLogger');
// === Fin : Importation des dépendances ===

// === Début : Fonction utilitaire pour le débogage ===
// Explication simple : Cette fonction aide à comprendre pourquoi une tâche n'est pas valide, comme quand on vérifie pourquoi un puzzle ne s'assemble pas correctement.
// Explication technique : Fonction d'aide qui analyse et affiche les détails des erreurs de validation Mongoose, facilitant le débogage des problèmes de schéma et de données.
// Ajouter cette fonction de débogage juste après les imports

// Fonction de débogage pour les erreurs de validation
const logValidationError = (err) => {
  if (err.name === 'ValidationError') {
    console.error('Erreur de validation détaillée:');
    for (let field in err.errors) {
      console.error(`Champ: ${field}, Message: ${err.errors[field].message}, Valeur: ${err.errors[field].value}`);
    }
  }
};
// === Fin : Fonction utilitaire pour le débogage ===

// === Début : Route pour récupérer toutes les tâches ===
// Explication simple : Cette fonction montre la liste de toutes les tâches qui appartiennent à l'utilisateur, en incluant aussi le nom du client pour chaque tâche.
// Explication technique : Endpoint GET qui récupère tous les documents de la collection Task filtrés par l'identifiant de l'utilisateur authentifié, avec un populate sur le champ clientId.
// Obtenir toutes les tâches
router.get('/', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches', error: error.message });
  }
});
// === Fin : Route pour récupérer toutes les tâches ===

// === Début : Route pour récupérer une tâche spécifique ===
// Explication simple : Cette fonction permet de voir les détails d'une seule tâche quand on connaît son numéro d'identification.
// Explication technique : Endpoint GET paramétré qui récupère un document Task spécifique par son ID, avec vérification du propriétaire et populate sur le champ clientId.
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
// === Fin : Route pour récupérer une tâche spécifique ===

// === Début : Route pour créer une nouvelle tâche ===
// Explication simple : Cette fonction permet d'ajouter une nouvelle tâche dans la liste, en vérifiant d'abord que le client existe, puis en mettant à jour les compteurs du client.
// Explication technique : Endpoint POST qui crée un nouveau document Task, utilisant une transaction MongoDB pour garantir l'intégrité des données lors de la mise à jour simultanée des compteurs dans la collection Client.
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
// === Fin : Route pour créer une nouvelle tâche ===

// === Début : Route pour mettre à jour une tâche existante ===
// Explication simple : Cette fonction permet de modifier les informations d'une tâche qui existe déjà, et si son statut ou son client change, elle met aussi à jour les compteurs correspondants.
// Explication technique : Endpoint PUT paramétré qui met à jour un document Task existant, avec gestion des transactions MongoDB pour maintenir l'intégrité des données lors de modifications qui affectent également les compteurs dans la collection Client.
// Mettre à jour une tâche
router.put('/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { title, description, clientId, dueDate, priority, category, status, estimatedTime, actualTime, impactScore } = req.body;
    
    // 1. Vérifier si la tâche existe et obtenir ses données actuelles
    const existingTask = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).session(session);
    
    if (!existingTask) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // Capturer l'ancien statut et client pour vérifier les changements
    const oldStatus = existingTask.status;
    const oldClientId = existingTask.clientId.toString();
    
    // 2. Mettre à jour la tâche
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
      { new: true, session }
    );
    
    // 3. Si le statut ou le client a changé, mettre à jour les métriques
    if (status !== oldStatus || clientId.toString() !== oldClientId) {
      // Si changement de client
      if (clientId.toString() !== oldClientId) {
        // Décrémenter l'ancien client
        await Client.findByIdAndUpdate(
          oldClientId,
          { 
            $inc: { 
              [`metrics.tasks${oldStatus === 'pending' ? 'Pending' : 
                         oldStatus === 'in-progress' ? 'InProgress' : 
                         'Completed'}`]: -1 
            },
            lastActivity: Date.now()
          },
          { session }
        );
        
        // Incrémenter le nouveau client
        await Client.findByIdAndUpdate(
          clientId,
          { 
            $inc: { 
              [`metrics.tasks${status === 'pending' ? 'Pending' : 
                             status === 'in-progress' ? 'InProgress' : 
                             'Completed'}`]: 1 
            },
            lastActivity: Date.now()
          },
          { session }
        );
      } 
      // Si seulement changement de statut (même client)
      else if (status !== oldStatus) {
        const update = {
          lastActivity: Date.now(),
          $inc: {}
        };
        
        // Décrémenter l'ancien statut
        update.$inc[`metrics.tasks${oldStatus === 'pending' ? 'Pending' : 
                                   oldStatus === 'in-progress' ? 'InProgress' : 
                                   'Completed'}`] = -1;
        
        // Incrémenter le nouveau statut
        update.$inc[`metrics.tasks${status === 'pending' ? 'Pending' : 
                                   status === 'in-progress' ? 'InProgress' : 
                                   'Completed'}`] = 1;
        
        await Client.findByIdAndUpdate(clientId, update, { session });
      }
    }
    
    // 4. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    // 5. Vérification post-transaction (optionnelle)
    const verificationTask = await Task.findById(req.params.id);
    if (!verificationTask) {
      mongoLogger.warn('Vérification post-mise à jour échouée', { taskId: req.params.id });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Tâche mise à jour avec succès', 
      task: updatedTask 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur mise à jour tâche', { 
      error: error.message,
      taskId: req.params.id
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour de la tâche', 
      error: error.message 
    });
  }
});
// === Fin : Route pour mettre à jour une tâche existante ===

// === Début : Route pour marquer une tâche comme terminée ===
// Explication simple : Cette fonction marque une tâche comme terminée et récompense l'utilisateur avec des points et de l'expérience, un peu comme dans un jeu vidéo où tu gagnes des récompenses quand tu accomplis une mission.
// Explication technique : Endpoint PUT spécialisé qui change le statut d'une tâche à "completed", met à jour les métriques du client et attribue des points de gamification à l'utilisateur, avec une vérification de montée de niveau.
// Mettre à jour le statut d'une tâche (complétion)
router.put('/:id/complete', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { actualTime } = req.body;
    
    // 1. Mettre à jour la tâche
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { 
        status: 'completed', 
        completedAt: Date.now(),
        actualTime: actualTime || 0
      },
      { new: true, session }
    );
    
    if (!task) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // 2. Mettre à jour les statistiques du client
    await Client.findByIdAndUpdate(
      task.clientId,
      { 
        $inc: { 'metrics.tasksCompleted': 1, 'metrics.tasksInProgress': -1 },
        lastActivity: Date.now()
      },
      { session }
    );
    
    // 3. Ajouter des points de gamification
    const pointsEarned = Math.floor(10 + (task.impactScore || 0) * 2);
    const expEarned = Math.floor(20 + (task.impactScore || 0) * 3);
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { 
        $inc: { 
          points: pointsEarned,
          experience: expEarned
        }
      },
      { new: true, session }
    );
    
    // 4. Vérifier la montée de niveau
    let levelUp = false;
    if (user.experience >= user.level * 100) {
      user.level += 1;
      levelUp = true;
      await user.save({ session });
    }
    
    // 5. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    // 6. Vérification post-transaction
    const verifyTask = await Task.findById(task._id);
    if (!verifyTask || verifyTask.status !== 'completed') {
      mongoLogger.warn('Vérification post-complétion échouée', { taskId: task._id });
    }
    
    res.status(200).json({
      success: true,
      message: 'Tâche marquée comme terminée',
      task,
      rewards: {
        points: pointsEarned,
        experience: expEarned,
        levelUp
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur complétion tâche', { 
      error: error.message,
      taskId: req.params.id
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la complétion de la tâche',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});
// === Fin : Route pour marquer une tâche comme terminée ===

// === Début : Route pour supprimer une tâche ===
// Explication simple : Cette fonction permet d'effacer complètement une tâche de la liste, tout en mettant à jour les compteurs du client pour qu'ils restent exacts.
// Explication technique : Endpoint DELETE paramétré qui supprime un document Task, utilisant une transaction MongoDB pour garantir que les compteurs associés dans la collection Client sont correctement décrémentés selon le statut de la tâche supprimée.
// Supprimer une tâche
router.delete('/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // 1. Récupérer les informations de la tâche avant suppression
    const taskToDelete = await Task.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).session(session);
    
    if (!taskToDelete) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    // 2. Mettre à jour les métriques du client
    await Client.findByIdAndUpdate(
      taskToDelete.clientId,
      { 
        $inc: { 
          [`metrics.tasks${taskToDelete.status === 'pending' ? 'Pending' : 
                          taskToDelete.status === 'in-progress' ? 'InProgress' : 
                          'Completed'}`]: -1 
        },
        lastActivity: Date.now()
      },
      { session }
    );
    
    // 3. Supprimer la tâche
    await Task.findByIdAndDelete(req.params.id).session(session);
    
    // 4. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    // 5. Vérification post-transaction
    const verifyTask = await Task.findById(req.params.id);
    if (verifyTask) {
      mongoLogger.warn('Vérification post-suppression échouée', { taskId: req.params.id });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Tâche supprimée avec succès' 
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur suppression tâche', { 
      error: error.message,
      taskId: req.params.id
    });
    
    res.status(500).json({ 
      message: 'Erreur lors de la suppression de la tâche', 
      error: error.message 
    });
  }
});
// === Fin : Route pour supprimer une tâche ===

// === Début : Route de test pour le service de timer ===
// Explication simple : Cette fonction vérifie simplement si la connexion avec le service de chronométrage fonctionne bien, comme quand on teste une nouvelle clé pour voir si elle ouvre bien la porte.
// Explication technique : Endpoint GET de diagnostic qui renvoie une réponse simple pour vérifier que l'authentification fonctionne et que le service de timer est accessible, utile pour les tests d'intégration.
// Ajoutez une route de test pour le timer
router.get('/test', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Connexion au service de timer réussie' });
});
// === Fin : Route de test pour le service de timer ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend toutes nos fonctions disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
