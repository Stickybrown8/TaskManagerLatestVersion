// backend/routes/users.js
// Routes pour la gestion des utilisateurs avec authentification

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const authController = require('../controllers/auth.controller');
const mongoLogger = require('../utils/mongoLogger');

// === Routes publiques (sans authentification) ===

// Inscription
router.post('/register', (req, res, next) => {
  mongoLogger.info('📝 Route register appelée', { email: req.body.email });
  next();
}, authController.register);

// Connexion
router.post('/login', (req, res, next) => {
  mongoLogger.info('🔐 Route login appelée', { email: req.body.email });
  next();
}, authController.login);

// === Routes protégées (nécessitent authentification) ===

// Vérification du token
router.get('/verify', verifyToken, async (req, res) => {
  try {
    // Si on arrive ici, le token est valide (vérifié par le middleware)
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        gamification: user.gamification
      }
    });
  } catch (error) {
    mongoLogger.error('❌ Erreur vérification token', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    });
  }
});

// Récupération du profil
router.get('/profile', verifyToken, authController.getProfile);

// Mise à jour du profil
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const User = require('../models/User');
    const userId = req.user.id;
    const updates = req.body;
    
    mongoLogger.info('📝 Mise à jour profil', {
      userId,
      fields: Object.keys(updates)
    });
    
    // Empêcher la modification de certains champs
    delete updates._id;
    delete updates.password;
    delete updates.email; // Email ne peut pas être changé directement
    
    // Gérer la mise à jour de l'avatar dans le profil
    if (updates['profile.avatar']) {
      updates.profile = updates.profile || {};
      updates.profile.avatar = updates['profile.avatar'];
      delete updates['profile.avatar'];
    }
    
    // Mettre à jour l'utilisateur
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: updates,
        $currentDate: { updatedAt: true }
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    mongoLogger.info('✅ Profil mis à jour', {
      userId: user._id,
      name: user.name
    });
    
    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        gamification: user.gamification,
        preferences: user.preferences
      }
    });
    
  } catch (error) {
    mongoLogger.error('❌ Erreur mise à jour profil', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Changement de mot de passe
router.put('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const bcrypt = require('bcrypt');
    const User = require('../models/User');
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau requis'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      });
    }
    
    // Hasher et sauvegarder le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    await user.save();
    
    mongoLogger.info('✅ Mot de passe changé', { userId });
    
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
    
  } catch (error) {
    mongoLogger.error('❌ Erreur changement mot de passe', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    });
  }
});

// Route de déconnexion (optionnelle, côté client suffit généralement)
router.post('/logout', verifyToken, (req, res) => {
  // Ici on pourrait invalider le token côté serveur si on avait une blacklist
  // Pour l'instant, la déconnexion est gérée côté client
  mongoLogger.info('👋 Déconnexion utilisateur', { userId: req.user.id });
  
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Export
module.exports = router;