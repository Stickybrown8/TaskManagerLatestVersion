/*
 * MIDDLEWARE D'AUTHENTIFICATION - backend/middleware/auth.js
 *
 * Explication simple:
 * Ce fichier vérifie si un utilisateur est bien connecté avant de le laisser accéder à certaines
 * parties de l'application. C'est comme un videur à l'entrée d'une boîte de nuit qui vérifie les cartes d'identité.
 *
 * Explication technique:
 * Middleware Express.js qui vérifie l'authenticité et la validité des JWT (JSON Web Tokens)
 * pour sécuriser les routes de l'API.
 *
 * Où ce fichier est utilisé:
 * Appliqué sur les routes de l'API qui nécessitent une authentification utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé par les fichiers de routes (routes/*.js) pour protéger les endpoints de l'API
 * - Utilise mongoLogger.js pour la journalisation des tentatives d'accès
 * - Interagit indirectement avec les contrôleurs qui gèrent les requêtes authentifiées
 * - Peut accéder au modèle User pour des vérifications supplémentaires (actuellement commenté)
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour vérifier si quelqu'un est bien connecté.
// Explication technique : Importation des modules nécessaires - jsonwebtoken pour la manipulation des JWT, mongoose pour la gestion des IDs MongoDB, et mongoLogger pour la journalisation structurée.
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
// === Fin : Importation des dépendances ===

// === Début : Configuration et variables d'environnement ===
// Explication simple : On prépare les règles de sécurité et on vérifie si on doit contrôler les entrées ou laisser tout le monde passer.
// Explication technique : Initialisation des constantes de configuration avec fallback vers des valeurs par défaut, et détermination du mode d'authentification basé sur les variables d'environnement.
const JWT_SECRET = process.env.JWT_SECRET || 'e34aaef4c604376cab0329dfa150e060a2e67601835e118ae6518a5754923e7d';
const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false'; // Activer par défaut
// === Fin : Configuration et variables d'environnement ===

// === Début : Fonction principale de vérification du token ===
// Explication simple : Cette fonction vérifie si un visiteur a le droit d'accéder à une zone protégée du site en contrôlant son badge numérique.
// Explication technique : Middleware Express asynchrone qui intercepte les requêtes, vérifie la présence et la validité d'un JWT et enrichit l'objet request avec l'identifiant de l'utilisateur authentifié.
const verifyToken = async (req, res, next) => {
  // === Début : Journalisation des requêtes entrantes ===
  // Explication simple : On note qui essaie d'entrer, avec quel appareil et ce qu'il veut faire.
  // Explication technique : Enregistrement des métadonnées de la requête entrante dans les logs pour faciliter le débogage et l'audit, en excluant les données sensibles.
  mongoLogger.debug('Requête API reçue', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  // === Fin : Journalisation des requêtes entrantes ===
  
  // === Début : Mode de transition sans authentification ===
  // Explication simple : Si on a décidé de ne pas vérifier les badges pour l'instant, on laisse tout le monde passer mais on le note.
  // Explication technique : Court-circuit conditionnel du processus d'authentification pour les environnements de développement ou de test, avec attribution d'un ID utilisateur factice.
  if (!AUTH_REQUIRED) {
    mongoLogger.warn('Mode sans authentification activé (NE PAS UTILISER EN PRODUCTION)', {
      path: req.originalUrl
    });
    req.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
    return next();
  }
  // === Fin : Mode de transition sans authentification ===
  
  // === Début : Extraction du token d'authentification ===
  // Explication simple : On cherche le badge numérique dans les poches du visiteur.
  // Explication technique : Récupération du JWT depuis les headers HTTP standardisés ou personnalisés, avec vérification de sa présence pour continuer le processus.
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    mongoLogger.warn('Accès sans token refusé', { path: req.originalUrl });
    return res.status(403).json({ 
      success: false,
      message: 'Aucun token fourni'
    });
  }
  // === Fin : Extraction du token d'authentification ===
  
  // === Début : Nettoyage du format du token ===
  // Explication simple : On enlève l'emballage autour du badge pour pouvoir le lire correctement.
  // Explication technique : Traitement du préfixe "Bearer " conforme aux standards d'authentification OAuth pour extraire uniquement la valeur du token JWT.
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  // === Fin : Nettoyage du format du token ===
  
  // === Début : Vérification et traitement du token ===
  // Explication simple : On vérifie si le badge est vrai et pas périmé, et si oui, on note qui est le visiteur.
  // Explication technique : Décodage et vérification cryptographique du JWT avec gestion des exceptions pour les tokens invalides ou expirés, et enrichissement de la requête avec les données d'identité.
  try {
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    
    // Vérifier si l'utilisateur existe toujours en base (optionnel)
    // const User = require('../models/User');
    // const user = await User.findById(decoded.id).select('_id isActive');
    // if (!user || !user.isActive) {
    //   throw new Error('Utilisateur inactif ou supprimé');
    // }
    
    next();
  } catch (error) {
    mongoLogger.warn('Token invalide', {
      error: error.message,
      path: req.originalUrl
    });
    
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
  // === Fin : Vérification et traitement du token ===
};
// === Fin : Fonction principale de vérification du token ===

// === Début : Exportation du middleware ===
// Explication simple : On rend disponible notre fonction de vérification pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Exposition du middleware via le système de modules CommonJS pour permettre son importation et son utilisation dans les configurations de routes Express.
module.exports = { verifyToken };
// === Fin : Exportation du middleware ===