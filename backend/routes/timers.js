/*
 * ROUTES DE GESTION DES CHRONOMÈTRES - backend/routes/timers.js
 *
 * Explication simple:
 * Ce fichier fait maintenant office de simple "répartiteur" qui dirige chaque demande
 * vers la bonne fonction du contrôleur. C'est comme un standard téléphonique qui 
 * transfère les appels au bon service.
 *
 * Explication technique:
 * Routes Express.js refactorisées utilisant le pattern MVC avec délégation complète
 * de la logique métier vers timer.controller.js, ne conservant que la définition
 * des endpoints et l'authentification.
 */

// === Début : Importation des dépendances ===
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const timerController = require('../controllers/timer.controller');
// === Fin : Importation des dépendances ===

// === Début : Routes déléguées au contrôleur ===
// Route de test pour la connexion timer
router.get('/test', verifyToken, timerController.testConnection);

// GET /api/timers - Récupérer tous les timers
router.get('/', verifyToken, timerController.getAllTimers);

// GET /api/timers/:id - Récupérer un timer spécifique
router.get('/:id', verifyToken, timerController.getTimerById);

// POST /api/timers - Créer un nouveau timer
router.post('/', verifyToken, timerController.createTimer);

// PUT /api/timers/stop/:id - Arrêter un timer
router.put('/stop/:id', verifyToken, timerController.stopTimer);

// DELETE /api/timers/:id - Supprimer un timer
router.delete('/:id', verifyToken, timerController.deleteTimer);
// === Fin : Routes déléguées au contrôleur ===

// === Début : Exportation du routeur ===
module.exports = router;
// === Fin : Exportation du routeur ===