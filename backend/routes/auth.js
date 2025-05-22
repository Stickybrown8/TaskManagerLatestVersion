/*
 * ROUTES D'AUTHENTIFICATION - backend/routes/auth.js
 * Version temporaire pour faire démarrer le serveur
 */

const express = require('express');
const router = express.Router();

// Import des routes utilisateurs existantes
const userRoutes = require('./users');

// Redirection vers les routes users existantes
router.use('/', userRoutes);

module.exports = router;