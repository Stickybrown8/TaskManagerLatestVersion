/*
 * ROUTES DE GESTION DES UTILISATEURS - backend/routes/users.js
 *
 * Explication simple:
 * Ce fichier définit maintenant uniquement les chemins d'accès pour les utilisateurs,
 * comme un panneau d'indication qui dit "pour s'inscrire, allez par là" et "pour se connecter, allez par ici".
 * La vraie logique de ce qui se passe est maintenant dans le contrôleur dédié.
 *
 * Explication technique:
 * Routes Express.js refactorisées selon le pattern MVC, délégant la logique métier
 * au contrôleur auth.controller.js. Ce fichier ne gère plus que le routage et l'application
 * des middlewares d'authentification.
 *
 * AVANT REFACTORISATION : 150+ lignes avec logique métier mélangée
 * APRÈS REFACTORISATION : 30 lignes, responsabilités séparées
 *
 * Connexions avec d'autres fichiers:
 * - Utilise auth.controller.js pour toute la logique d'authentification
 * - Utilise middleware/auth.js pour la protection des routes
 * - Monté dans server.js via app.use('/api/users', userRoutes)
 */

// === IMPORTATIONS ===
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');
const mongoLogger = require('../utils/mongoLogger');

// === MIDDLEWARE DE LOGGING ===
// Log toutes les requêtes sur les routes utilisateurs
router.use((req, res, next) => {
  mongoLogger.info(`Route utilisateur appelée`, {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip
  });
  next();
});

// === ROUTES D'AUTHENTIFICATION ===

/**
 * INSCRIPTION D'UN NOUVEL UTILISATEUR
 * POST /api/users/register
 * 
 * Avant: 50+ lignes de logique ici
 * Après: Délégation au contrôleur
 */
router.post('/register', authController.register);

/**
 * CONNEXION D'UN UTILISATEUR
 * POST /api/users/login
 * 
 * Avant: 30+ lignes de logique ici
 * Après: Délégation au contrôleur
 */
router.post('/login', authController.login);

/**
 * RÉCUPÉRATION DU PROFIL UTILISATEUR
 * GET /api/users/profile
 * 
 * Avant: 20+ lignes de logique ici
 * Après: Middleware d'auth + délégation au contrôleur
 */
router.get('/profile', verifyToken, authController.getProfile);

/**
 * MISE À JOUR DU PROFIL UTILISATEUR
 * PUT /api/users/profile
 * 
 * Nouvelle route gérée par le contrôleur
 */
router.put('/profile', verifyToken, authController.updateProfile);

/**
 * VÉRIFICATION DE LA VALIDITÉ DU TOKEN
 * GET /api/users/verify
 * 
 * Nouvelle route pour vérifier si un token est encore valide
 */
router.get('/verify', verifyToken, authController.verifyToken);

// === ROUTES FUTURES (PLACEHOLDERS) ===
// Ces routes pourront être ajoutées plus tard selon les besoins

/**
 * LISTE DE TOUS LES UTILISATEURS (ADMIN)
 * GET /api/users
 * TODO: Créer userController.getAllUsers()
 */
// router.get('/', verifyToken, verifyAdmin, userController.getAllUsers);

/**
 * RÉCUPÉRATION D'UN UTILISATEUR SPÉCIFIQUE (ADMIN)
 * GET /api/users/:id
 * TODO: Créer userController.getUserById()
 */
// router.get('/:id', verifyToken, verifyAdmin, userController.getUserById);

/**
 * SUPPRESSION D'UN UTILISATEUR (ADMIN)
 * DELETE /api/users/:id
 * TODO: Créer userController.deleteUser()
 */
// router.delete('/:id', verifyToken, verifyAdmin, userController.deleteUser);

// === GESTION D'ERREURS SPÉCIFIQUE AUX ROUTES UTILISATEURS ===
router.use((error, req, res, next) => {
  mongoLogger.error('Erreur dans les routes utilisateurs', {
    error: error.message,
    route: req.originalUrl,
    method: req.method
  });
  
  // Passer l'erreur au middleware global de gestion d'erreurs
  next(error);
});

// === EXPORTATION ===
module.exports = router;