const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const Activity = require('../models/Activity');

// Obtenir le profil de gamification de l'utilisateur
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Calculer le prochain niveau
    const nextLevelExp = user.level * 100;
    const progress = (user.experience / nextLevelExp) * 100;
    
    res.status(200).json({
      level: user.level,
      experience: user.experience,
      nextLevelExp,
      progress,
      points: user.points,
      badges: user.badges,
      streak: user.streak
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil de gamification', error: error.message });
  }
});

// Obtenir tous les badges
router.get('/badges', verifyToken, async (req, res) => {
  try {
    const badges = await Badge.find();
    const user = await User.findById(req.userId);
    
    const badgesWithStatus = badges.map(badge => ({
      ...badge.toObject(),
      earned: user.badges.includes(badge._id)
    }));
    
    res.status(200).json(badgesWithStatus);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des badges', error: error.message });
  }
});

// Obtenir tous les succès
router.get('/achievements', verifyToken, async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.status(200).json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des succès', error: error.message });
  }
});

// Obtenir l'historique d'activité
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId }).sort({ timestamp: -1 }).limit(20);
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique d\'activité', error: error.message });
  }
});

// Ajouter une activité
router.post('/activity', verifyToken, async (req, res) => {
  try {
    const { type, description, points, experience } = req.body;
    
    const newActivity = new Activity({
      userId: req.userId,
      type,
      description,
      points: points || 0,
      experience: experience || 0,
      timestamp: Date.now()
    });
    
    await newActivity.save();
    
    // Mettre à jour les points et l'expérience de l'utilisateur
    if (points || experience) {
      const user = await User.findById(req.userId);
      if (points) user.points += points;
      if (experience) user.experience += experience;
      
      // Vérifier si l'utilisateur monte de niveau
      const nextLevelExp = user.level * 100;
      if (user.experience >= nextLevelExp) {
        user.level += 1;
      }
      
      await user.save();
    }
    
    res.status(201).json({ message: 'Activité enregistrée avec succès', activity: newActivity });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'enregistrement de l\'activité', error: error.message });
  }
});

module.exports = router;
