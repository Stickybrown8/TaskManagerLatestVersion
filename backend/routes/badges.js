/*
 * ROUTES DES BADGES - /workspaces/TaskManagerLatestVersion/backend/routes/badges.js
 *
 * Explication simple:
 * Ce fichier gère toutes les opérations concernant les badges dans l'application.
 * Il permet de voir tous les badges disponibles, récupérer les badges d'un utilisateur,
 * attribuer de nouveaux badges et choisir quels badges afficher sur son profil.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des badges,
 * avec authentification par JWT et opérations CRUD sur les collections badges et users.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux badges,
 * utilisé par le frontend pour afficher et manipuler les badges des utilisateurs.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les modèles Badge, User et Activity pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend qui gèrent les badges (pages de profil, tableaux de bord)
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils nécessaires pour créer nos routes de badges.
// Explication technique : Importation des modules Express pour le routage, des modèles Mongoose nécessaires et des middlewares d'authentification.
const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { verifyToken, checkUserExists } = require('../middleware/auth');
// === Fin : Importation des dépendances ===

// === Début : Route pour récupérer tous les badges disponibles ===
// Explication simple : Cette route permet de voir la liste complète de tous les badges qui existent dans le jeu.
// Explication technique : Endpoint GET qui récupère tous les documents de la collection Badge sans filtrage, après vérification du token d'authentification.
router.get('/', verifyToken, async (req, res) => {
  try {
    const badges = await Badge.find();
    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la récupération des badges', error: error.message });
  }
});
// === Fin : Route pour récupérer tous les badges disponibles ===

// === Début : Route pour récupérer un badge spécifique ===
// Explication simple : Cette route permet de voir les détails d'un seul badge en particulier, quand on connaît son identifiant.
// Explication technique : Endpoint GET paramétré qui récupère un document Badge spécifique par son ID, avec gestion des erreurs 404 si le badge n'existe pas.
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
// === Fin : Route pour récupérer un badge spécifique ===

// === Début : Route pour récupérer les badges gagnés par l'utilisateur ===
// Explication simple : Cette route permet à un utilisateur de voir tous les badges qu'il a déjà gagnés, avec la date à laquelle il les a obtenus.
// Explication technique : Endpoint GET qui extrait les badges de l'utilisateur authentifié, effectue une jointure sur la collection Badge pour récupérer les détails complets et enrichit les résultats avec les métadonnées d'obtention.
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
// === Fin : Route pour récupérer les badges gagnés par l'utilisateur ===

// === Début : Route pour attribuer un badge à un utilisateur ===
// Explication simple : Cette route permet de donner un nouveau badge à un utilisateur, en lui accordant aussi des points et de l'expérience en récompense.
// Explication technique : Endpoint POST paramétré qui vérifie l'existence du badge et de l'utilisateur, puis met à jour le document User avec le nouveau badge et les récompenses associées, tout en enregistrant l'activité de gamification.
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
// === Fin : Route pour attribuer un badge à un utilisateur ===

// === Début : Route pour modifier la visibilité d'un badge ===
// Explication simple : Cette route permet à un utilisateur de choisir s'il veut montrer ou cacher un badge sur son profil.
// Explication technique : Endpoint PUT paramétré qui met à jour l'attribut "displayed" d'un badge spécifique dans le sous-document badges de l'utilisateur, avec validation de l'existence préalable du badge dans sa collection.
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
// === Fin : Route pour modifier la visibilité d'un badge ===

// === Début : Exportation du routeur ===
// Explication simple : On rend toutes nos routes de badges disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de modules CommonJS.
module.exports = router;
// === Fin : Exportation du routeur ===
