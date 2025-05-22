/*
 * ROUTES DE GESTION DES TÂCHES - /workspaces/TaskManagerLatestVersion/backend/routes/tasks.js
 *
 * Explication simple:
 * Ce fichier définit les chemins d'accès pour gérer les tâches dans l'application.
 * Maintenant il délègue toute la logique métier complexe au contrôleur task.controller.js.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des tâches,
 * refactorisé selon le pattern MVC en déléguant la logique métier au contrôleur.
 * Cœur métier de l'application avec gamification et métriques sophistiquées.
 *
 * Connexions avec d'autres fichiers:
 * - Délègue au contrôleur task.controller.js pour toute la logique métier
 * - Utilise le middleware auth.js pour la vérification des tokens
 * - Monté dans le serveur principal (server.js/app.js)
 */

// === Imports ===
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const taskController = require('../controllers/task.controller');

// === Routes délégant au contrôleur ===

// GET / - Récupérer toutes les tâches (avec populate client)
router.get('/', verifyToken, taskController.getAllTasks);

// GET /:id - Récupérer une tâche spécifique (avec populate client)
router.get('/:id', verifyToken, taskController.getTaskById);

// POST / - Créer une nouvelle tâche (avec vérification MongoDB + transaction + métriques client)
router.post('/', verifyToken, taskController.createTask);

// PUT /:id - Mettre à jour une tâche (logique ultra-complexe avec métriques dynamiques)
router.put('/:id', verifyToken, taskController.updateTask);

// PUT /:id/complete - Marquer une tâche comme terminée (avec gamification complète)
router.put('/:id/complete', verifyToken, taskController.completeTask);

// DELETE /:id - Supprimer une tâche (avec mise à jour métriques intelligentes)
router.delete('/:id', verifyToken, taskController.deleteTask);

// Route de test ignorée - logique déplacée si nécessaire
// GET /test - Test timer service (route simple non critique)

// === Export ===
module.exports = router;