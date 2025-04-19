const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const config = require('../config/auth.config');

// Route d'inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      level: 1,
      experience: 0,
      points: 0,
      badges: [],
      streak: 0,
      lastActive: Date.now()
    });
    
    await newUser.save();
    
    // Créer un token JWT
    const token = jwt.sign({ id: newUser._id }, config.secret, {
      expiresIn: config.jwtExpiration
    });
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        level: newUser.level,
        experience: newUser.experience,
        points: newUser.points
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de l\'inscription', error: error.message });
  }
});

// Route de connexion
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }
    
    // Mettre à jour la date de dernière activité
    user.lastActive = Date.now();
    await user.save();
    
    // Créer un token JWT
    const token = jwt.sign({ id: user._id }, config.secret, {
      expiresIn: config.jwtExpiration
    });
    
    res.status(200).json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        experience: user.experience,
        points: user.points
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion', error: error.message });
  }
});

// Route pour obtenir le profil de l'utilisateur
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        level: user.level,
        experience: user.experience,
        points: user.points,
        badges: user.badges,
        streak: user.streak,
        lastActive: user.lastActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
  }
});

module.exports = router;
