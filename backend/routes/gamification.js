/*
 * ROUTES DE GAMIFICATION - /workspaces/TaskManagerLatestVersion/backend/routes/gamification.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui est lié au système de jeu dans l'application.
 * Il permet de voir ton niveau, tes points, tes badges, et d'enregistrer
 * quand tu accomplis quelque chose pour te récompenser avec des points et de l'expérience.
 * C'est comme un jeu vidéo où tu gagnes des médailles et montes de niveau!
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion du système de gamification,
 * incluant la progression, les badges, les succès et l'historique d'activité des utilisateurs.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives à la gamification,
 * utilisé par le frontend pour afficher les éléments de progression et de récompense utilisateur.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les modèles User, Badge, Achievement et Activity pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend de profil utilisateur, tableau de bord et notifications
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils dont on a besoin pour gérer le système de jeu.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification et des modèles Mongoose nécessaires au système de gamification.
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const User = require('../models/User');
const Badge = require('../models/Badge');
const Achievement = require('../models/Achievement');
const Activity = require('../models/Activity');
// === Fin : Importation des dépendances ===

// === Début : Route pour récupérer le profil de gamification de l'utilisateur ===
// Explication simple : Cette fonction te montre tout ce que tu as gagné dans le jeu: ton niveau, ton expérience, tes badges, comme quand tu regardes ta fiche de personnage dans un jeu vidéo.
// Explication technique : Endpoint GET qui récupère et calcule les métriques de progression de l'utilisateur authentifié, incluant son niveau actuel, son expérience, le pourcentage de progression vers le niveau suivant et ses récompenses.
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
// === Fin : Route pour récupérer le profil de gamification de l'utilisateur ===

// === Début : Route pour récupérer tous les badges disponibles ===
// Explication simple : Cette fonction te montre tous les badges que tu peux gagner et ceux que tu as déjà obtenus, comme une collection d'autocollants où on voit ceux qu'on a et ceux qu'il nous manque.
// Explication technique : Endpoint GET qui récupère tous les badges du système et enrichit les résultats avec un indicateur booléen indiquant si l'utilisateur actuel a déjà obtenu chaque badge.
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
// === Fin : Route pour récupérer tous les badges disponibles ===

// === Début : Route pour récupérer tous les succès disponibles ===
// Explication simple : Cette fonction te montre tous les défis spéciaux que tu peux accomplir dans l'application, comme la liste des quêtes à faire dans un jeu d'aventure.
// Explication technique : Endpoint GET qui récupère tous les documents de la collection Achievement sans filtrage, permettant au frontend d'afficher les objectifs de réalisation disponibles.
// Obtenir tous les succès
router.get('/achievements', verifyToken, async (req, res) => {
  try {
    const achievements = await Achievement.find();
    res.status(200).json(achievements);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des succès', error: error.message });
  }
});
// === Fin : Route pour récupérer tous les succès disponibles ===

// === Début : Route pour récupérer l'historique d'activité ===
// Explication simple : Cette fonction te montre tout ce que tu as fait récemment dans l'application, comme un journal de bord de tes aventures.
// Explication technique : Endpoint GET qui récupère les 20 dernières activités de l'utilisateur connecté, triées par date décroissante, pour afficher un flux d'activités récentes.
// Obtenir l'historique d'activité
router.get('/activity', verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.userId }).sort({ timestamp: -1 }).limit(20);
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'historique d\'activité', error: error.message });
  }
});
// === Fin : Route pour récupérer l'historique d'activité ===

// === Début : Route pour enregistrer une nouvelle activité et attribuer des récompenses ===
// Explication simple : Cette fonction enregistre quand tu fais quelque chose d'important et te donne des points et de l'expérience en récompense. Si tu gagnes assez d'expérience, tu montes même de niveau!
// Explication technique : Endpoint POST qui crée un nouveau document Activity et met à jour simultanément les métriques de l'utilisateur (points, expérience), avec une vérification conditionnelle pour la montée de niveau.
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
// === Fin : Route pour enregistrer une nouvelle activité et attribuer des récompenses ===

// === Début : Exportation du routeur ===
// Explication simple : On rend toutes nos fonctions de jeu disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
