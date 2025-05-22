/*
 * ROUTES DE GESTION DES OBJECTIFS - /workspaces/TaskManagerLatestVersion/backend/routes/objectives.js
 *
 * Explication simple:
 * Ce fichier définit les chemins d'accès pour gérer les objectifs dans l'application.
 * Maintenant il délègue toute la logique avancée au contrôleur objective.controller.js.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des objectifs,
 * refactorisé selon le pattern MVC en déléguant la logique métier complexe au contrôleur.
 *
 * Connexions avec d'autres fichiers:
 * - Délègue au contrôleur objective.controller.js pour toute la logique métier
 * - Utilise le middleware auth.js pour la vérification des tokens
 * - Monté dans le serveur principal (server.js/app.js)
 */

// === Imports ===
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const objectiveController = require('../controllers/objective.controller');

// === Routes délégant au contrôleur ===

// GET / - Récupérer tous les objectifs (avec populate client)
router.get('/', verifyToken, objectiveController.getAllObjectives);

// GET /client/:clientId - Récupérer les objectifs d'un client spécifique (route métier)
router.get('/client/:clientId', verifyToken, objectiveController.getObjectivesByClient);

// GET /:id - Récupérer un objectif spécifique (avec populate client)
router.get('/:id', verifyToken, objectiveController.getObjectiveById);

// POST / - Créer un nouvel objectif (avec transaction et calculs)
router.post('/', verifyToken, objectiveController.createObjective);

// PUT /:id - Mettre à jour un objectif (logique ultra-complexe)
router.put('/:id', verifyToken, objectiveController.updateObjective);

// DELETE /:id - Supprimer un objectif (avec mise à jour compteurs)
router.delete('/:id', verifyToken, objectiveController.deleteObjective);

// === Export ===
module.exports = router;