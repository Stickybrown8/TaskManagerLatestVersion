/*
 * CONTRÔLEUR DES ACTIVITÉS - backend/controllers/activity.controller.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui concerne l'historique des activités des utilisateurs.
 * C'est comme un journal personnel qui note tout ce que fait un utilisateur
 * et lui donne des récompenses pour ses actions.
 *
 * Explication technique:
 * Contrôleur MVC qui centralise la logique métier des activités utilisateur,
 * extrait de routes/gamification.js pour une meilleure organisation du code.
 * Gère l'historique des activités et l'attribution de récompenses.
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé par routes/gamification.js
 * - Utilise les modèles Activity.js et User.js
 * - Utilise mongoLogger.js pour la journalisation
 */

// === IMPORTATIONS ===
const Activity = require('../models/Activity');
const User = require('../models/User');
const mongoLogger = require('../utils/mongoLogger');

// === CONTRÔLEURS D'ACTIVITÉS ===

/**
 * RÉCUPÉRER L'HISTORIQUE D'ACTIVITÉ DE L'UTILISATEUR
 * GET /api/gamification/activity
 * 
 * Extrait de routes/gamification.js lignes 106-112
 */
const getActivityHistory = async (req, res) => {
  try {
    // Récupérer les 20 dernières activités de l'utilisateur
    const activities = await Activity.find({ userId: req.userId })
      .sort({ timestamp: -1 })
      .limit(20);

    // Log pour traçabilité
    mongoLogger.info('Historique d\'activité récupéré', {
      userId: req.userId,
      activitiesCount: activities.length
    });

    // Réponse au format original
    res.status(200).json(activities);

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération de l\'historique d\'activité', {
      error: error.message,
      userId: req.userId
    });

    // Format d'erreur original
    res.status(500).json({ 
      message: 'Erreur lors de la récupération de l\'historique d\'activité', 
      error: error.message 
    });
  }
};

/**
 * ENREGISTRER UNE NOUVELLE ACTIVITÉ ET ATTRIBUER DES RÉCOMPENSES
 * POST /api/gamification/activity
 * 
 * Extrait de routes/gamification.js lignes 120-150
 */
const createActivity = async (req, res) => {
  try {
    const { type, description, points, experience } = req.body;
    
    // Créer la nouvelle activité
    const newActivity = new Activity({
      userId: req.userId,
      type,
      description,
      points: points || 0,
      experience: experience || 0,
      timestamp: Date.now()
    });
    
    await newActivity.save();

    // Log de création d'activité
    mongoLogger.info('Nouvelle activité créée', {
      userId: req.userId,
      activityType: type,
      points: points || 0,
      experience: experience || 0
    });
    
    // Mettre à jour les points et l'expérience de l'utilisateur
    if (points || experience) {
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ 
          message: 'Utilisateur non trouvé' 
        });
      }

      // Mise à jour des points et expérience
      if (points) user.points += points;
      if (experience) user.experience += experience;
      
      // Vérifier si l'utilisateur monte de niveau
      const nextLevelExp = user.level * 100;
      let leveledUp = false;
      
      if (user.experience >= nextLevelExp) {
        user.level += 1;
        leveledUp = true;
        
        mongoLogger.info('Utilisateur monté de niveau', {
          userId: req.userId,
          newLevel: user.level,
          totalExperience: user.experience
        });
      }
      
      await user.save();

      // Log de mise à jour des récompenses
      mongoLogger.info('Récompenses attribuées', {
        userId: req.userId,
        pointsAdded: points || 0,
        experienceAdded: experience || 0,
        newTotalPoints: user.points,
        newTotalExperience: user.experience,
        currentLevel: user.level,
        leveledUp
      });
    }
    
    // Réponse au format original
    res.status(201).json({ 
      message: 'Activité enregistrée avec succès', 
      activity: newActivity 
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de l\'enregistrement de l\'activité', {
      error: error.message,
      userId: req.userId,
      requestBody: req.body
    });

    // Format d'erreur original
    res.status(500).json({ 
      message: 'Erreur lors de l\'enregistrement de l\'activité', 
      error: error.message 
    });
  }
};

// === EXPORTATION DES CONTRÔLEURS ===
module.exports = {
  getActivityHistory,
  createActivity
};