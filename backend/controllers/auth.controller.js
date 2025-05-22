/*
 * CONTRÔLEUR D'AUTHENTIFICATION - backend/controllers/auth.controller.js
 *
 * Explication simple:
 * Ce fichier contient toute la logique pour connecter et inscrire les utilisateurs.
 * C'est comme un employé spécialisé qui s'occupe uniquement des cartes d'identité
 * et des badges d'accès, pendant que d'autres employés s'occupent d'autres tâches.
 *
 * Explication technique:
 * Contrôleur MVC qui centralise la logique métier d'authentification, séparant
 * les responsabilités : les routes gèrent le routage, ce contrôleur gère la
 * logique d'authentification (validation, hachage, JWT, gamification).
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé par routes/auth.js et routes/users.js
 * - Utilise les modèles User.js et Activity.js
 * - Utilise la config auth.config.js pour JWT
 * - Utilise mongoLogger.js pour la journalisation
 */

// === IMPORTATIONS ===
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const authConfig = require('../config/auth.config');
const mongoLogger = require('../utils/mongoLogger');

// === FONCTIONS UTILITAIRES ===

/**
 * Génère un token JWT pour un utilisateur
 * @param {Object} user - Objet utilisateur
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.name
    },
    authConfig.secret,
    { expiresIn: authConfig.jwtExpiration }
  );
};

/**
 * Enregistre une activité d'authentification
 * @param {string} userId - ID de l'utilisateur
 * @param {string} type - Type d'activité ('login' ou 'register')
 * @param {Object} req - Objet request Express
 */
const logAuthActivity = async (userId, type, req) => {
  try {
    await Activity.create({
      userId: userId,
      type: 'auth',
      description: type === 'login' ? 'Connexion utilisateur' : 'Inscription utilisateur',
      metadata: {
        action: type,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      }
    });
  } catch (error) {
    mongoLogger.error('Erreur lors de l\'enregistrement de l\'activité auth', error);
  }
};

// === CONTRÔLEURS D'AUTHENTIFICATION ===

/**
 * INSCRIPTION D'UN NOUVEL UTILISATEUR
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { name, email, password, preferences = {} } = req.body;

    // Validation des données d'entrée
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur, email et mot de passe requis',
        errorCode: 'MISSING_FIELDS'
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide',
        errorCode: 'INVALID_EMAIL'
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères',
        errorCode: 'WEAK_PASSWORD'
      });
    }

    // Vérification de l'unicité de l'email et du nom d'utilisateur
    const existingUser = await User.findOne({
      $or: [{ email }, { name }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'nom d\'utilisateur';
      return res.status(409).json({
        success: false,
        message: `Ce ${field} est déjà utilisé`,
        errorCode: 'USER_EXISTS'
      });
    }

    // Hachage du mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Création de l'utilisateur avec données initiales de gamification
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      preferences: {
        darkMode: false,
        soundEnabled: true,
        notifications: true,
        ...preferences
      },
      gamification: {
        level: 1,
        experience: 0,
        points: 0,
        badges: [],
        achievements: [],
        streak: {
          current: 0,
          longest: 0,
          lastActivity: null
        }
      },
      profile: {
        firstName: '',
        lastName: '',
        avatar: '',
        bio: '',
        joinDate: new Date()
      }
    });

    // Sauvegarde en base
    const savedUser = await newUser.save();

    // Enregistrement de l'activité
    await logAuthActivity(savedUser._id, 'register', req);

    // Génération du token
    const token = generateToken(savedUser);

    mongoLogger.info(`Nouvel utilisateur inscrit: ${name} (${email})`);

    // Réponse succès (sans mot de passe)
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: userResponse,
        token,
        expiresIn: authConfig.jwtExpiration
      }
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de l\'inscription', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      errorCode: 'REGISTRATION_ERROR'
    });
  }
};

/**
 * CONNEXION D'UN UTILISATEUR
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données d'entrée
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis',
        errorCode: 'MISSING_CREDENTIALS'
      });
    }

    // Recherche de l'utilisateur par email ou nom d'utilisateur
    const user = await User.findOne({
      $or: [{ email }, { name: email }]
    }).select('+password'); // Inclure le mot de passe pour la vérification

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Identifiants invalides',
        errorCode: 'INVALID_CREDENTIALS'
      });
    }

    // Mise à jour de la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // ✅ VERSION CORRIGÉE - Compatible avec le modèle actuel
    const today = new Date();

    // Initialiser lastActivity si n'existe pas
    if (!user.gamification.lastActivity) {
      user.gamification.lastActivity = null;
    }

    const lastActivity = user.gamification.lastActivity;

    if (lastActivity) {
      const diffTime = Math.abs(today - lastActivity);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Connexion consécutive - augmenter la streak
        user.gamification.currentStreak += 1;
        user.gamification.longestStreak = Math.max(
          user.gamification.longestStreak,
          user.gamification.currentStreak
        );
        // Bonus points pour la streak
        if (!user.gamification.actionPoints) user.gamification.actionPoints = 0;
        user.gamification.actionPoints += 5;
      } else if (diffDays > 1) {
        // Streak cassée - remettre à zéro
        user.gamification.currentStreak = 1;
      }
    } else {
      // Première connexion
      user.gamification.currentStreak = 1;
    }

    user.gamification.lastActivity = today;
    await user.save();

    // Enregistrement de l'activité
    await logAuthActivity(user._id, 'login', req);

    // Génération du token
    const token = generateToken(user);

    mongoLogger.info(`Connexion utilisateur: ${user.name} (${user.email})`);

    // Réponse succès (sans mot de passe)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userResponse,
        token,
        expiresIn: authConfig.jwtExpiration,
        streak: user.gamification.currentStreak
      }
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de la connexion', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      errorCode: 'LOGIN_ERROR'
    });
  }
};

/**
 * OBTENIR LE PROFIL UTILISATEUR ACTUEL
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    // req.user est défini par le middleware d'authentification
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profil récupéré avec succès',
      data: { user }
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de la récupération du profil', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      errorCode: 'PROFILE_ERROR'
    });
  }
};

/**
 * METTRE À JOUR LE PROFIL UTILISATEUR
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { username, preferences, profile } = req.body;
    const userId = req.user.id;

    // Construction de l'objet de mise à jour
    const updateData = {};

    if (username) {
      // Vérifier l'unicité du nouveau nom d'utilisateur
      const existingUser = await User.findOne({
        username,
        _id: { $ne: userId }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà utilisé',
          errorCode: 'USERNAME_EXISTS'
        });
      }
      updateData.username = username;
    }

    if (preferences) {
      updateData.preferences = preferences;
    }

    if (profile) {
      updateData.profile = profile;
    }

    // Mise à jour de l'utilisateur
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    mongoLogger.info(`Profil mis à jour: ${updatedUser.name}`);

    res.status(200).json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: { user: updatedUser }
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de la mise à jour du profil', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      errorCode: 'UPDATE_PROFILE_ERROR'
    });
  }
};

/**
 * VÉRIFIER LA VALIDITÉ D'UN TOKEN
 * GET /api/auth/verify
 */
const verifyToken = async (req, res) => {
  try {
    // Si on arrive ici, c'est que le middleware d'auth a validé le token
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valide',
      data: {
        user,
        tokenValid: true
      }
    });

  } catch (error) {
    mongoLogger.error('Erreur lors de la vérification du token', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      errorCode: 'TOKEN_VERIFY_ERROR'
    });
  }
};

// === EXPORTATION DES CONTRÔLEURS ===
module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken
};