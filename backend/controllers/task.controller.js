/*
 * CONTRÔLEUR TÂCHES - backend/controllers/task.controller.js
 *
 * Explication simple:
 * Ce fichier contient toute la logique du cœur métier de l'application - les tâches.
 * Il gère la création, modification, complétion avec gamification et suppressions sophistiquées.
 *
 * Explication technique:
 * Contrôleur MVC le plus complexe du projet, intégrant gamification, métriques clients dynamiques,
 * transactions MongoDB avancées et vérifications de compatibilité système.
 */

// === Imports ===
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client');
const mongoLogger = require('../utils/mongoLogger');

// === Fonction 1: Récupérer toutes les tâches ===
const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).populate('clientId', 'name');
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches', error: error.message });
  }
};

// === Fonction 2: Récupérer une tâche spécifique ===
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId }).populate('clientId', 'name');
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de la tâche', error: error.message });
  }
};

// === Fonction 3: Créer une nouvelle tâche ===
const createTask = async (req, res) => {
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
    
    // 3. Mettre à jour le client (incrémenter compteur de tâches)
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
};

// === Fonction 4: Mettre à jour une tâche (ULTRA-COMPLEXE) ===
const updateTask = async (req, res) => {
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
    
    // 3. LOGIQUE SOPHISTIQUÉE : Si le statut ou le client a changé, mettre à jour les métriques
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
};

// === Fonction 5: Marquer une tâche comme terminée (GAMIFICATION) ===
const completeTask = async (req, res) => {
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
    
    // 3. GAMIFICATION : Ajouter des points et expérience
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
};

// === Fonction 6: Supprimer une tâche ===
const deleteTask = async (req, res) => {
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
};

// === Exports (6 fonctions - test route ignorée) ===
module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  completeTask,
  deleteTask
};