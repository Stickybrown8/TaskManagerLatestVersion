/*
 * ROUTES DE GESTION DES IMAGES - backend/routes/images.js
 *
 * Explication simple:
 * Ce fichier gère tout ce qui concerne les images dans l'application.
 * Il permet d'envoyer, récupérer et supprimer des images pour les conversations entre utilisateurs.
 * C'est comme un album photo numérique qui organise les images par conversation.
 *
 * Explication technique:
 * Module Express.js contenant les routes API RESTful pour la gestion des images,
 * avec authentification par JWT et opérations CRUD sur la collection images dans MongoDB.
 * Intègre Multer pour le traitement des fichiers multipart/form-data.
 *
 * Où ce fichier est utilisé:
 * Appelé par le serveur backend lors des requêtes API relatives aux images,
 * utilisé par le frontend pour afficher et manipuler les images dans les conversations.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise le modèle Image pour accéder aux données
 * - Importe le middleware auth.js pour la vérification des tokens
 * - Utilise multer pour le traitement des fichiers d'image
 * - Ses routes sont montées dans le fichier principal du serveur (server.js/app.js)
 * - Appelé par les composants frontend de chat/messagerie qui affichent ou envoient des images
 */

// === Début : Importation des dépendances ===
// Explication simple : On rassemble tous les outils dont on a besoin pour gérer les photos dans notre application.
// Explication technique : Importation des modules Express pour le routage, du middleware d'authentification, du modèle Mongoose Image, et de multer pour la gestion des fichiers uploadés.
// backend/routes/images.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Image = require('../models/Image');
const mongoose = require('mongoose');
const multer  = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
// === Fin : Importation des dépendances ===

// === Début : Route de test de la connexion MongoDB ===
// Explication simple : Cette fonction vérifie si notre boîte de stockage des images fonctionne bien, comme quand on teste une lampe pour voir si elle s'allume.
// Explication technique : Endpoint GET qui vérifie l'état de la connexion MongoDB, tente de sauvegarder une petite image test et renvoie des informations de diagnostic sur la base de données.
// Test de la connexion MongoDB
router.get('/test', async (req, res) => {
  try {
    console.log('Test de connexion MongoDB...');
    
    // Vérifier l'état de la connexion
    const state = mongoose.connection.readyState;
    const states = {
      0: 'Déconnecté',
      1: 'Connecté',
      2: 'En connexion',
      3: 'En déconnexion'
    };
    
    // Tester l'enregistrement d'une petite image
    const testImage = new Image({
      userId: new mongoose.Types.ObjectId("507f1f77bcf86cd799439011"),
      chatId: 'test_chat_' + Date.now(),
      data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QJIiCQAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      createdAt: Date.now()
    });
    
    console.log('Sauvegarde de l\'image test...');
    await testImage.save();
    console.log('Image test sauvegardée avec succès, ID:', testImage._id);
    
    res.json({
      connection: states[state] || 'État inconnu',
      readyState: state,
      testImageId: testImage._id,
      success: true,
      dbName: mongoose.connection.db.databaseName
    });
  } catch (error) {
    console.error('ERREUR TEST MONGODB:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});
// === Fin : Route de test de la connexion MongoDB ===

// === Début : Route pour télécharger une image ===
// Explication simple : Cette fonction permet d'envoyer une photo dans une conversation, comme quand tu partages une image avec tes amis sur WhatsApp.
// Explication technique : Endpoint POST avec middleware multer qui intercepte le fichier image, le convertit en format data URL (base64) et l'enregistre dans MongoDB avec des métadonnées associées.
// ← NOUVELLE ROUTE POST /api/images/upload
router.post(
  '/upload',
  verifyToken,
  upload.single('image'),   // ← multer intercepte le champ "image"
  async (req, res) => {
    try {
      if (!req.file || !req.body.chatId) {
        return res.status(400).json({ message: 'Image ou chatId manquant' });
      }
      // On reconstruit la data-URL comme avant
      const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
      const newImage = new Image({
        userId:   req.userId,
        chatId:   req.body.chatId,
        data:     dataUrl,
        mimeType: req.file.mimetype,
        createdAt: Date.now()
      });
      await newImage.save();
      res.status(201).json({ imageId: newImage._id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Erreur sauvegarde image', error: err.message });
    }
  }
);
// === Fin : Route pour télécharger une image ===

// === Début : Route pour récupérer toutes les images d'une conversation ===
// Explication simple : Cette fonction montre toutes les photos qui ont été partagées dans une conversation, comme un album photos spécifique à cette discussion.
// Explication technique : Endpoint GET paramétré qui interroge la collection d'images filtrées par identifiant d'utilisateur et identifiant de chat, triées chronologiquement.
// Récupérer toutes les images d'un chat
router.get('/chat/:chatId', verifyToken, async (req, res) => {
  try {
    console.log(`Récupération des images pour chatId: ${req.params.chatId}`);
    const images = await Image.find({ 
      userId: req.userId,
      chatId: req.params.chatId
    }).sort({ createdAt: 1 });
    
    console.log(`${images.length} images trouvées`);
    res.status(200).json(images);
  } catch (error) {
    console.error('Erreur lors de la récupération des images:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des images', error: error.message });
  }
});
// === Fin : Route pour récupérer toutes les images d'une conversation ===

// === Début : Route pour récupérer une image spécifique ===
// Explication simple : Cette fonction permet de voir une photo particulière quand on connaît son numéro d'identification, comme quand on cherche une page précise dans un livre.
// Explication technique : Endpoint GET paramétré qui récupère un document Image spécifique par son ID, avec vérification que l'utilisateur est bien le propriétaire de l'image.
// Récupérer une image par son ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const image = await Image.findOne({ 
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!image) {
      console.log(`Image non trouvée: ${req.params.id}`);
      return res.status(404).json({ message: 'Image non trouvée' });
    }
    
    console.log(`Image récupérée: ${req.params.id}`);
    res.status(200).json(image);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'image:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'image', error: error.message });
  }
});
// === Fin : Route pour récupérer une image spécifique ===

// === Début : Route pour supprimer une image ===
// Explication simple : Cette fonction permet d'effacer une photo qu'on ne veut plus garder, comme quand tu déchires une photo dans un album physique.
// Explication technique : Endpoint DELETE paramétré qui supprime un document Image spécifique par son ID, avec vérification préalable des droits d'accès de l'utilisateur.
// Supprimer une image
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deletedImage = await Image.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!deletedImage) {
      return res.status(404).json({ message: 'Image non trouvée' });
    }
    
    console.log(`Image supprimée: ${req.params.id}`);
    res.status(200).json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'image:', error);
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'image', error: error.message });
  }
});
// === Fin : Route pour supprimer une image ===

// === Début : Exportation du routeur ===
// Explication simple : Cette ligne rend toutes nos fonctions d'images disponibles pour que l'application puisse les utiliser.
// Explication technique : Exportation du routeur Express configuré pour être intégré dans l'application principale via le système de middleware Express.
module.exports = router;
// === Fin : Exportation du routeur ===