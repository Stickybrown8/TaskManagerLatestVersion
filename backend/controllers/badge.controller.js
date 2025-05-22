/*
 * CONTRÔLEUR DES BADGES - backend/controllers/badge.controller.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui concerne les badges dans l'application.
 * Les badges sont comme des médailles qu'on gagne en accomplissant certaines actions.
 * Ce contrôleur permet de voir, attribuer, et gérer l'affichage des badges.
 *
 * Explication technique:
 * Contrôleur MVC qui centralise TOUTE la logique métier des badges,
 * extrait de routes/badges.js ET routes/gamification.js pour une organisation
 * parfaite du code selon le pattern MVC.
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé par routes/badges.js et routes/gamification.js
 * - Utilise les modèles Badge.js, User.js et Activity.js
 * - Utilise mongoLogger.js pour la journalisation
 */

// === IMPORTATIONS ===
const Badge = require('../models/Badge');
const User = require('../models/User');
const Activity = require('../models/Activity');
const mongoLogger = require('../utils/mongoLogger');

// === CONTRÔLEURS DE BADGES ===

/**
 * RÉCUPÉRER TOUS LES BADGES DISPONIBLES
 * GET /api/badges/
 * 
 * Extrait de routes/badges.js lignes 38-44
 */
const getAllBadges = async (req, res) => {
  try {
    // Récupérer tous les badges
    const badges = await Badge.find();

    mongoLogger.info('Badges récupérés', {
      count: badges.length,
      userId: req.userId || 'anonymous'
    });

    // Format de réponse original
    res.status(200).json(badges);

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération des badges', {
      error: error.message,
      userId: req.userId || 'anonymous'
    });

    res.status(500).json({ 
      message: 'Erreur lors de la récupération des badges', 
      error: error.message 
    });
  }
};

/**
 * RÉCUPÉRER UN BADGE SPÉCIFIQUE
 * GET /api/badges/:id
 * 
 * Extrait de routes/badges.js lignes 51-63
 */
const getBadgeById = async (req, res) => {
  try {
    const badgeId = req.params.id;
    const badge = await Badge.findById(badgeId);

    if (!badge) {
      return res.status(404).json({ message: 'Badge non trouvé' });
    }

    mongoLogger.info('Badge spécifique récupéré', {
      badgeId,
      badgeName: badge.name,
      userId: req.userId
    });

    res.status(200).json(badge);

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération du badge', {
      error: error.message,
      badgeId: req.params.id,
      userId: req.userId
    });

    res.status(500).json({ 
      message: 'Erreur lors de la récupération du badge', 
      error: error.message 
    });
  }
};

/**
 * RÉCUPÉRER LES BADGES GAGNÉS PAR L'UTILISATEUR
 * GET /api/badges/user/earned
 * 
 * Extrait de routes/badges.js lignes 70-94
 */
const getUserEarnedBadges = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Récupérer les détails complets des badges
    const badgeIds = user.gamification.badges.map(badge => badge.badgeId);
    const badges = await Badge.find({ _id: { $in: badgeIds } });
    
    // Combiner les informations des badges avec les dates d'obtention
    const badgesWithEarnedInfo = badges.map(badge => {
      const userBadge = user.gamification.badges.find(
        ub => ub.badgeId.toString() === badge._id.toString()
      );
      return {
        ...badge.toObject(),
        earnedAt: userBadge.earnedAt,
        displayed: userBadge.displayed
      };
    });

    mongoLogger.info('Badges gagnés récupérés', {
      userId,
      earnedBadgesCount: badgesWithEarnedInfo.length
    });
    
    res.status(200).json(badgesWithEarnedInfo);

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération des badges de l\'utilisateur', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({ 
      message: 'Erreur lors de la récupération des badges de l\'utilisateur', 
      error: error.message 
    });
  }
};

/**
 * ATTRIBUER UN BADGE À UN UTILISATEUR
 * POST /api/badges/award/:id
 * 
 * Extrait de routes/badges.js lignes 105-167
 */
const awardBadge = async (req, res) => {
  try {
    const badgeId = req.params.id;
    const userId = req.userId;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si le badge existe
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: 'Badge non trouvé' });
    }
    
    // Vérifier si l'utilisateur a déjà ce badge
    const hasBadge = user.gamification.badges.some(
      b => b.badgeId.toString() === badgeId
    );
    
    if (hasBadge) {
      return res.status(400).json({ message: 'L\'utilisateur possède déjà ce badge' });
    }
    
    // Ajouter le badge à l'utilisateur
    const badgeData = {
      badgeId,
      earnedAt: Date.now(),
      displayed: true
    };
    
    await User.findByIdAndUpdate(userId, {
      $push: { 'gamification.badges': badgeData },
      $inc: { 
        'gamification.experience': badge.rewards.experience,
        'gamification.actionPoints': badge.rewards.actionPoints
      }
    });
    
    // Enregistrer l'activité
    const activity = new Activity({
      userId,
      type: 'badge_obtenu',
      description: `Badge obtenu: ${badge.name}`,
      details: {
        badgeId,
        experienceEarned: badge.rewards.experience,
        pointsEarned: badge.rewards.actionPoints
      }
    });
    await activity.save();

    mongoLogger.info('Badge attribué avec succès', {
      userId,
      badgeId,
      badgeName: badge.name,
      experienceEarned: badge.rewards.experience,
      pointsEarned: badge.rewards.actionPoints
    });
    
    res.status(200).json({
      message: 'Badge attribué avec succès',
      badge: {
        ...badge.toObject(),
        earnedAt: badgeData.earnedAt,
        displayed: badgeData.displayed
      }
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de l\'attribution du badge', {
      error: error.message,
      userId: req.userId,
      badgeId: req.params.id
    });

    res.status(500).json({ 
      message: 'Erreur lors de l\'attribution du badge', 
      error: error.message 
    });
  }
};

/**
 * MODIFIER LA VISIBILITÉ D'UN BADGE
 * PUT /api/badges/display/:id
 * 
 * Extrait de routes/badges.js lignes 176-207
 */
const updateBadgeDisplay = async (req, res) => {
  try {
    const badgeId = req.params.id;
    const userId = req.userId;
    const { displayed } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier si l'utilisateur a ce badge
    const badgeIndex = user.gamification.badges.findIndex(
      b => b.badgeId.toString() === badgeId
    );
    
    if (badgeIndex === -1) {
      return res.status(404).json({ message: 'Badge non trouvé pour cet utilisateur' });
    }
    
    // Mettre à jour la visibilité du badge
    const updatePath = `gamification.badges.${badgeIndex}.displayed`;
    const updateData = {};
    updateData[updatePath] = displayed;
    
    await User.findByIdAndUpdate(userId, { $set: updateData });

    mongoLogger.info('Visibilité du badge mise à jour', {
      userId,
      badgeId,
      displayed
    });
    
    res.status(200).json({
      message: 'Visibilité du badge mise à jour avec succès',
      displayed
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de la mise à jour de la visibilité du badge', {
      error: error.message,
      userId: req.userId,
      badgeId: req.params.id
    });

    res.status(500).json({ 
      message: 'Erreur lors de la mise à jour de la visibilité du badge', 
      error: error.message 
    });
  }
};

/**
 * RÉCUPÉRER TOUS LES BADGES AVEC STATUT UTILISATEUR (GAMIFICATION)
 * GET /api/gamification/badges
 * 
 * Extrait de routes/gamification.js lignes 71-82
 */
const getAllBadgesWithStatus = async (req, res) => {
  try {
    // Récupérer tous les badges disponibles
    const badges = await Badge.find();
    
    // Récupérer l'utilisateur pour vérifier ses badges
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }
    
    // Enrichir chaque badge avec le statut "earned" (possédé ou non)
    const badgesWithStatus = badges.map(badge => ({
      ...badge.toObject(),
      earned: user.gamification.badges.some(ub => ub.badgeId.toString() === badge._id.toString())
    }));

    mongoLogger.info('Badges avec statut récupérés', {
      userId: req.userId,
      totalBadges: badges.length,
      earnedBadges: badgesWithStatus.filter(b => b.earned).length
    });

    // Format de réponse gamification (simple array)
    res.status(200).json(badgesWithStatus);

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération des badges', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({ 
      message: 'Erreur lors de la récupération des badges', 
      error: error.message 
    });
  }
};

// === EXPORTATION DES CONTRÔLEURS ===
module.exports = {
  getAllBadges,
  getBadgeById,
  getUserEarnedBadges,
  awardBadge,
  updateBadgeDisplay,
  getAllBadgesWithStatus
};