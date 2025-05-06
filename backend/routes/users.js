const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Activity = require('../models/Activity');
const config = require('../config/auth.config');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');
const Activity = require('../models/Activity');

// Route d'inscription - Ajouter la transaction
router.post('/register', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, password } = req.body;
    
    // 1. Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // 2. Créer un nouvel utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      level: 1,
      experience: 0,
      points: 0,
      badges: [],
      streak: 0,
      lastActive: Date.now()
    });
    
    await newUser.save({ session });
    
    // 3. Créer l'activité d'inscription
    const newActivity = new Activity({
      userId: newUser._id,
      type: 'account_creation',
      description: 'Inscription au système',
      points: 10,
      createdAt: Date.now()
    });
    
    await newActivity.save({ session });
    
    // 4. Valider la transaction
    await session.commitTransaction();
    session.endSession();
    
    // Générer un token JWT
    const token = jwt.sign({ id: newUser._id }, config.secret, {
      expiresIn: config.jwtExpiration
    });
    
    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        level: newUser.level,
        experience: newUser.experience,
        points: newUser.points
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    mongoLogger.error('Erreur création utilisateur', {
      error: error.message,
      email: req.body.email
    });
    
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
        name: user.name,
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
        name: user.name,
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
