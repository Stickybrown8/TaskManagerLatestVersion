/*
 * ROUTES DE GESTION DES CLIENTS - /workspaces/TaskManagerLatestVersion/backend/routes/clients.js
 *
 * Explication simple:
 * Ce fichier définit les chemins d'accès pour gérer les clients dans l'application.
 * Maintenant il délègue toute la logique au contrôleur client.controller.js pour une meilleure organisation.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des clients,
 * refactorisé selon le pattern MVC en déléguant la logique métier au contrôleur.
 *
 * Connexions avec d'autres fichiers:
 * - Délègue au contrôleur client.controller.js pour toute la logique
 * - Utilise le middleware auth.js pour la vérification des tokens
 * - Monté dans le serveur principal (server.js/app.js)
 */

// === Imports ===
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const clientController = require('../controllers/client.controller');

// === Routes délégant au contrôleur ===

// GET / - Récupérer tous les clients
router.get('/', verifyToken, clientController.getAllClients);

// GET /:id - Récupérer un client spécifique  
router.get('/:id', verifyToken, clientController.getClientById);

// POST / - Créer un nouveau client
router.post('/', verifyToken, clientController.createClient);

// PUT /:id - Mettre à jour un client
router.put('/:id', verifyToken, clientController.updateClient);

// DELETE /:id - Supprimer un client et ses données
router.delete('/:id', verifyToken, clientController.deleteClient);

// === Export ===
module.exports = router;