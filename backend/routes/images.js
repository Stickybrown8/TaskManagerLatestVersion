// backend/routes/images.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Image = require('../models/Image');
const mongoose = require('mongoose');
const multer  = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

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

module.exports = router;