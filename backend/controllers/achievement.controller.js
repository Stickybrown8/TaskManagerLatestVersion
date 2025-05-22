/*
 * CONTRÔLEUR DES RÉALISATIONS - backend/controllers/achievement.controller.js
 *
 * Explication simple:
 * Ce fichier gère la récupération des réalisations (achievements) disponibles.
 * C'est comme une vitrine qui montre tous les trophées qu'on peut gagner.
 *
 * Explication technique:
 * Contrôleur MVC qui centralise la logique métier des achievements,
 * extrait de routes/gamification.js pour une meilleure organisation du code.
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé par routes/gamification.js
 * - Utilise le modèle Achievement.js
 * - Utilise mongoLogger.js pour la journalisation
 */

// === IMPORTATIONS ===
const Achievement = require('../models/Achievement');
const mongoLogger = require('../utils/mongoLogger');

// === CONTRÔLEURS D'ACHIEVEMENTS ===

/**
 * RÉCUPÉRER TOUS LES ACHIEVEMENTS DISPONIBLES
 * GET /api/gamification/achievements
 * 
 * Extrait de routes/gamification.js ligne 92-100
 */
const getAllAchievements = async (req, res) => {
  try {
    // Récupérer tous les achievements depuis la base de données
    const achievements = await Achievement.find();

    // Log pour traçabilité
    mongoLogger.info('Achievements récupérés avec succès', {
      count: achievements.length,
      userId: req.userId
    });

    // Réponse au format original
    res.status(200).json(achievements);

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération des succès', {
      error: error.message,
      userId: req.userId
    });

    // Format d'erreur original
    res.status(500).json({ 
      message: 'Erreur lors de la récupération des succès', 
      error: error.message 
    });
  }
};

// === EXPORTATION DES CONTRÔLEURS ===
module.exports = {
  getAllAchievements
};