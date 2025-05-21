/*
 * ROUTES D'ANALYSE D'IMPACT DES TÂCHES - backend/routes/taskImpact.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui concerne l'évaluation de l'importance des tâches.
 * Il permet d'identifier les tâches les plus importantes (principe 80/20), 
 * d'analyser l'impact des tâches par client et de modifier leur score d'importance.
 * C'est comme un outil qui te dit sur quoi tu devrais te concentrer en priorité.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour l'analyse d'impact des tâches,
 * implémentant le principe de Pareto pour prioriser les tâches à fort impact et
 * fournir des métriques d'impact par client.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives à l'analyse d'impact des tâches,
 * utilisé par le frontend pour afficher les tâches prioritaires et les statistiques d'impact.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le modèle Task pour accéder aux données des tâches
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend de tableau de bord et de priorisation des tâches
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour gérer nos routes d'impact des tâches.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification et du modèle Task pour interagir avec la collection de tâches dans MongoDB.
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Task = require('../models/Task');
// === Fin : Importation des dépendances ===

// === Début : Route pour récupérer les tâches à fort impact ===
// Explication simple : Cette fonction identifie les 20% des tâches qui sont les plus importantes, selon le principe que 20% de nos actions produisent 80% des résultats.
// Explication technique : Endpoint GET qui récupère toutes les tâches non terminées, les trie par score d'impact décroissant et renvoie seulement le top 20% selon la règle de Pareto, avec des informations enrichies sur les clients.
// Obtenir les tâches à fort impact (principe 80/20)
router.get('/high-impact', verifyToken, async (req, res) => {
  try {
    // Récupérer toutes les tâches non terminées
    const tasks = await Task.find({ 
      userId: req.userId,
      status: { $ne: 'completed' }
    }).sort({ impactScore: -1 }).populate('clientId', 'name');
    
    // Calculer le seuil pour les 20% des tâches à plus fort impact
    const threshold = Math.ceil(tasks.length * 0.2);
    const highImpactTasks = tasks.slice(0, threshold);
    
    res.status(200).json(highImpactTasks);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des tâches à fort impact', error: error.message });
  }
});
// === Fin : Route pour récupérer les tâches à fort impact ===

// === Début : Route pour analyser l'impact des tâches par client ===
// Explication simple : Cette fonction examine toutes les tâches d'un client particulier et calcule des statistiques pour voir comment se passent ses projets et quelles sont les tâches les plus importantes encore à faire.
// Explication technique : Endpoint GET paramétré qui récupère les tâches d'un client spécifique, calcule des métriques d'agrégation (taux de complétion, impact moyen) et identifie les tâches prioritaires selon la règle de Pareto.
// Analyser l'impact des tâches par client
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const tasks = await Task.find({ 
      userId: req.userId,
      clientId: req.params.clientId
    }).sort({ impactScore: -1 });
    
    // Calculer des statistiques d'impact
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const averageImpact = tasks.reduce((sum, task) => sum + (task.impactScore || 0), 0) / totalTasks;
    
    // Identifier les tâches à fort impact
    const threshold = Math.ceil(totalTasks * 0.2);
    const highImpactTasks = tasks.slice(0, threshold);
    
    res.status(200).json({
      statistics: {
        totalTasks,
        completedTasks,
        completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        averageImpact
      },
      highImpactTasks
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'analyse d\'impact des tâches', error: error.message });
  }
});
// === Fin : Route pour analyser l'impact des tâches par client ===

// === Début : Route pour mettre à jour le score d'impact d'une tâche ===
// Explication simple : Cette fonction permet de changer l'importance d'une tâche en lui donnant un nouveau score d'impact, comme quand tu changes la priorité de quelque chose dans ta liste de choses à faire.
// Explication technique : Endpoint PUT paramétré qui met à jour l'attribut impactScore d'une tâche spécifique, avec vérification du propriétaire et retour du document mis à jour.
// Mettre à jour le score d'impact d'une tâche
router.put('/task/:taskId', verifyToken, async (req, res) => {
  try {
    const { impactScore } = req.body;
    
    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.taskId, userId: req.userId },
      { impactScore, updatedAt: Date.now() },
      { new: true }
    );
    
    if (!updatedTask) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }
    
    res.status(200).json({ message: 'Score d\'impact mis à jour avec succès', task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour du score d\'impact', error: error.message });
  }
});
// === Fin : Route pour mettre à jour le score d'impact d'une tâche ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend toutes nos fonctions disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
