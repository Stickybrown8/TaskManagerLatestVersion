/*
 * ROUTES DE GESTION DES CHRONOMÈTRES - backend/routes/timers.js
 *
 * Explication simple:
 * Ce fichier contient tout ce qui permet de gérer les chronomètres dans l'application.
 * Tu peux imaginer ces chronomètres comme ceux qu'on utilise pour mesurer combien 
 * de temps on passe sur une activité. Ici, ils permettent de suivre le temps passé 
 * sur les tâches pour chaque client, de démarrer un chronomètre, de l'arrêter, 
 * et de savoir combien de temps a été facturé.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des timers,
 * avec authentification par JWT et opérations CRUD sur la collection Timer dans MongoDB.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux chronomètres,
 * utilisé par le frontend pour permettre aux utilisateurs de suivre leur temps de travail.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le modèle Timer pour accéder aux données de chronométrage
 * - Utilise le modèle Task pour lier les temps aux tâches
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend de suivi du temps et reporting
 */

// === Début : Importation des dépendances ===
// Explication simple : On prépare tous les outils dont on a besoin pour gérer les chronomètres, comme quand tu sors tes jouets avant de commencer à jouer.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification et des modèles Mongoose nécessaires à la manipulation des données de chronométrage.
const express = require('express');
const router = express.Router();
// Correction ici - changer auth en verifyToken
const { verifyToken } = require('../middleware/auth');
const Timer = require('../models/Timer');
const Task = require('../models/Task');
// === Fin : Importation des dépendances ===

// === Début : Route de test pour vérifier la connexion ===
// Explication simple : Cette fonction vérifie si tout fonctionne bien, comme quand tu demandes "est-ce que tu m'entends?" avant de commencer une conversation importante.
// Explication technique : Endpoint GET de diagnostic qui renvoie une réponse simple confirmant que l'authentification fonctionne et que le service de timer est accessible, utile pour les tests d'intégration.
// Route de test pour la connexion timer
router.get('/test', verifyToken, (req, res) => {
  try {
    res.status(200).json({ 
      message: 'Connexion au service de timer réussie',
      userId: req.userId,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('Erreur route test timer:', err);
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});
// === Fin : Route de test pour vérifier la connexion ===

// === Début : Route pour récupérer tous les chronomètres ===
// Explication simple : Cette fonction te montre tous tes chronomètres, du plus récent au plus ancien, comme quand tu regardes la liste de tous tes scores dans un jeu.
// Explication technique : Endpoint GET qui récupère tous les documents Timer appartenant à l'utilisateur authentifié, triés par ordre chronologique inverse, pour afficher l'historique complet de chronométrage.
// GET /api/timers - Récupérer tous les timers
router.get('/', verifyToken, async (req, res) => {
  try {
    const timers = await Timer.find({ userId: req.userId }).sort({ startTime: -1 });
    res.json(timers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});
// === Fin : Route pour récupérer tous les chronomètres ===

// === Début : Route pour récupérer un chronomètre spécifique ===
// Explication simple : Cette fonction te permet de regarder les détails d'un seul chronomètre particulier, mais seulement si c'est le tien, comme quand tu demandes à voir ton propre carnet de notes à l'école.
// Explication technique : Endpoint GET paramétré qui récupère un document Timer spécifique par son ID, avec une double vérification - existence du timer et propriété par l'utilisateur authentifié - avant de renvoyer les données.
// GET /api/timers/:id - Récupérer un timer spécifique
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const timer = await Timer.findById(req.params.id);
    
    if (!timer) {
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    res.json(timer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});
// === Fin : Route pour récupérer un chronomètre spécifique ===

// === Début : Route pour créer un nouveau chronomètre ===
// Explication simple : Cette fonction démarre un nouveau chronomètre quand tu commences à travailler sur quelque chose. Tu lui dis pour quel client et quelle tâche tu travailles, et elle commence à compter le temps.
// Explication technique : Endpoint POST qui crée un nouveau document Timer avec horodatage de début, associé à un client et optionnellement à une tâche spécifique, avec validation des paramètres et gestion détaillée des erreurs.
// POST /api/timers - Créer un nouveau timer
router.post('/', verifyToken, async (req, res) => {
  try {
    const { description, clientId, taskId, billable } = req.body;
    
    // Log de débogage
    console.log('Création timer - données reçues:', { 
      description, 
      clientId, 
      taskId, 
      billable, 
      userId: req.userId 
    });
    
    // Vérification des paramètres
    if (!clientId) {
      return res.status(400).json({ 
        msg: 'clientId est requis',
        received: req.body
      });
    }
    
    // Vérifier que le clientId est un ObjectId valide
    if (!mongoose.Types.ObjectId.isValid(clientId)) {
      return res.status(400).json({ 
        msg: 'clientId invalide',
        received: clientId
      });
    }
    
    // Création avec valeurs par défaut pour les champs optionnels
    const timer = new Timer({
      userId: req.userId,
      description: description || '',
      clientId,
      taskId: taskId || null,
      billable: billable !== undefined ? billable : true,
      startTime: new Date()
    });
    
    const savedTimer = await timer.save();
    console.log('Timer créé avec succès:', savedTimer._id);
    res.json(savedTimer);
  } catch (err) {
    console.error('Erreur détaillée lors de la création du timer:', err);
    
    // Réponse d'erreur améliorée
    res.status(500).json({ 
      msg: 'Erreur serveur', 
      error: err.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  }
});
// === Fin : Route pour créer un nouveau chronomètre ===

// === Début : Route pour arrêter un chronomètre ===
// Explication simple : Cette fonction arrête le chronomètre quand tu as fini de travailler sur une tâche, et calcule combien de temps tu as passé dessus, comme quand tu appuies sur "stop" après avoir chronométré une course.
// Explication technique : Endpoint PUT paramétré qui met à jour un Timer existant en ajoutant un horodatage de fin et en calculant automatiquement la durée en secondes, avec vérification du propriétaire et option de spécifier manuellement une durée.
// PUT /api/timers/stop/:id - Arrêter un timer
router.put('/stop/:id', verifyToken, async (req, res) => {
  try {
    const timer = await Timer.findById(req.params.id);
    
    if (!timer) {
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    timer.endTime = new Date();
    
    if (req.body.duration) {
      timer.duration = req.body.duration;
    } else {
      // Calculer la durée automatiquement
      const start = new Date(timer.startTime).getTime();
      const end = new Date(timer.endTime).getTime();
      timer.duration = Math.round((end - start) / 1000); // Durée en secondes
    }
    
    await timer.save();
    res.json(timer);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});
// === Fin : Route pour arrêter un chronomètre ===

// === Début : Route pour supprimer un chronomètre ===
// Explication simple : Cette fonction te permet d'effacer complètement un chronomètre si tu as fait une erreur, comme quand tu effaces une ligne dans un cahier.
// Explication technique : Endpoint DELETE paramétré qui supprime un document Timer spécifique après vérification que l'utilisateur est bien le propriétaire du chronomètre, pour éviter la suppression non autorisée de données.
// DELETE /api/timers/:id - Supprimer un timer
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const timer = await Timer.findById(req.params.id);
    
    if (!timer) {
      return res.status(404).json({ msg: 'Timer non trouvé' });
    }
    
    if (timer.userId.toString() !== req.userId.toString()) {
      return res.status(401).json({ msg: 'Non autorisé' });
    }
    
    await Timer.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Timer supprimé' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Erreur serveur');
  }
});
// === Fin : Route pour supprimer un chronomètre ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend notre gestionnaire de chronomètres disponible pour que le reste de l'application puisse l'utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===
