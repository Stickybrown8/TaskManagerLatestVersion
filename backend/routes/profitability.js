/*
 * ROUTES DE RENTABILITÉ - /workspaces/TaskManagerLatestVersion/backend/routes/profitability.js
 *
 * Explication simple:
 * Ce fichier définit les chemins d'accès pour gérer la rentabilité des clients dans l'application.
 * Maintenant il délègue toute la logique financière au contrôleur profitability.controller.js.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion de la rentabilité,
 * refactorisé selon le pattern MVC en déléguant les calculs financiers au contrôleur.
 *
 * Connexions avec d'autres fichiers:
 * - Délègue au contrôleur profitability.controller.js pour toute la logique financière
 * - Utilise le middleware auth.js pour la vérification des tokens
 * - Monté dans le serveur principal (server.js/app.js)
 */

// === Imports ===
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const profitabilityController = require('../controllers/profitability.controller');

// === Routes délégant au contrôleur financier ===

// GET / - Récupérer la rentabilité de tous les clients (avec populate)
router.get('/', verifyToken, profitabilityController.getAllProfitability);

// GET /client/:clientId - Récupérer la rentabilité d'un client spécifique
router.get('/client/:clientId', verifyToken, profitabilityController.getProfitabilityByClient);

// POST /client/:clientId - Mettre à jour ou créer des données de rentabilité (pattern upsert + calculs)
router.post('/client/:clientId', verifyToken, profitabilityController.updateOrCreateProfitability);

// PUT /update-hours/:clientId - Mettre à jour les heures automatiquement (agrégation + recalculs)
router.put('/update-hours/:clientId', verifyToken, profitabilityController.updateHours);

// === Export ===
module.exports = router;