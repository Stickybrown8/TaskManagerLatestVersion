/*
 * ROUTES DE GESTION DES UTILISATEURS - backend/routes/users.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui concerne les comptes utilisateurs dans l'application.
 * Il permet aux nouveaux utilisateurs de s'inscrire, aux utilisateurs existants de se connecter,
 * et aux utilisateurs connectés de voir leurs informations personnelles. C'est comme
 * le portier qui vérifie qui peut entrer dans l'application et qui garde les informations
 * sur chaque personne.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour l'authentification et la gestion des utilisateurs,
 * avec hachage sécurisé des mots de passe via bcrypt, génération de JWT pour maintenir les sessions,
 * et transactions MongoDB pour garantir l'intégrité des données lors de l'inscription.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux utilisateurs,
 * utilisé par le frontend pour l'inscription, la connexion et l'affichage des profils.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le modèle User pour accéder aux données des utilisateurs
 * - Utilise le modèle Activity pour enregistrer les activités des utilisateurs
 * - Importe la configuration d'authentification depuis auth.config.js
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Utilise mongoLogger pour journaliser les erreurs
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils dont on a besoin pour gérer les utilisateurs, comme quand tu prépares tout ton matériel avant de commencer un bricolage.
// Explication technique : Importation des modules Express pour le routage, bcrypt pour le hachage des mots de passe, JWT pour la gestion des tokens d'authentification, et des modèles Mongoose pour interagir avec la base de données.
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Activity = require('../models/Activity');
const config = require('../config/auth.config');
const mongoLogger = require('../utils/mongoLogger');
// === Fin : Importation des dépendances ===

// === Début : Route d'inscription des utilisateurs ===
// Explication simple : Cette fonction permet à une nouvelle personne de créer un compte dans l'application, en vérifiant d'abord si son email n'est pas déjà utilisé, puis en protégeant son mot de passe et en lui donnant un badge de nouveau joueur.
// Explication technique : Endpoint POST avec transaction MongoDB qui vérifie l'unicité de l'email, hache le mot de passe avec bcrypt, crée un document User avec les métriques de gamification initiales, enregistre une activité associée et génère un JWT pour l'authentification immédiate.
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
// === Fin : Route d'inscription des utilisateurs ===

// === Début : Route de connexion des utilisateurs ===
// Explication simple : Cette fonction vérifie si la personne qui veut entrer dans l'application est bien qui elle prétend être, en contrôlant son email et son mot de passe, comme un gardien qui vérifie ton identité avant de te laisser passer.
// Explication technique : Endpoint POST d'authentification qui vérifie les identifiants utilisateur, compare le mot de passe fourni avec sa version hachée stockée en base de données, met à jour l'horodatage de dernière activité et génère un nouveau JWT en cas de succès.
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
// === Fin : Route de connexion des utilisateurs ===

// === Début : Route pour récupérer le profil utilisateur ===
// Explication simple : Cette fonction permet à un utilisateur connecté de voir toutes ses informations personnelles, comme quand tu ouvres ton propre carnet de notes pour voir tes résultats et tes progrès.
// Explication technique : Endpoint GET protégé qui utilise le middleware d'authentification pour vérifier le JWT, récupère les données de l'utilisateur depuis la base de données et renvoie un objet utilisateur filtré avec les informations pertinentes.
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
// === Fin : Route pour récupérer le profil utilisateur ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend toutes nos fonctions de gestion des utilisateurs disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
