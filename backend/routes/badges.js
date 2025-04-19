const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { verifyToken, checkUserExists } = require('../middleware/auth');

// Récupérer tous les badges disponibles
router.get('/', verifyToken, async (req, res) => {
  try {
    const badges = await Badge.find();
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des badges', error: error.message });
  }
});

// Récupérer un badge spécifique
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const badgeId = req.params.id;
    const badge = await Badge.findById(badgeId);
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge non trouvé' });
    }
    
    res.status(200).json(badge);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du badge', error: error.message });
  }
});

// Récupérer les badges de l'utilisateur
router.get('/user/earned', verifyToken, async (req, res) => {
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
    
    res.status(200).json(badgesWithEarnedInfo);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des badges de l\'utilisateur', error: error.message });
  }
});

// Attribuer un badge à l'utilisateur (pour les tests ou l'administration)
router.post('/award/:id', verifyToken, async (req, res) => {
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
    
    res.status(200).json({
      message: 'Badge attribué avec succès',
      badge: {
        ...badge.toObject(),
        earnedAt: badgeData.earnedAt,
        displayed: badgeData.displayed
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'attribution du badge', error: error.message });
  }
});

// Modifier la visibilité d'un badge
router.put('/display/:id', verifyToken, async (req, res) => {
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
    
    res.status(200).json({
      message: 'Visibilité du badge mise à jour avec succès',
      displayed
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la visibilité du badge', error: error.message });
  }
});

module.exports = router;
