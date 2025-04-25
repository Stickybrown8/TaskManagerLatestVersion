// backend/routes/images.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Image = require('../models/Image');

// Télécharger une nouvelle image
router.post('/upload', verifyToken, async (req, res) => {
  try {
    const { imageData, chatId, mimeType } = req.body;
    
    // Vérifier que les données de l'image sont présentes
    if (!imageData || !chatId || !mimeType) {
      return res.status(400).json({ message: 'Données d\'image manquantes' });
    }
    
    // Créer une nouvelle entrée image
    const newImage = new Image({
      userId: req.userId,
      chatId,
      data: imageData,
      mimeType,
      createdAt: Date.now()
    });
    
    await newImage.save();
    
    res.status(201).json({ 
      message: 'Image téléchargée avec succès',
      imageId: newImage._id
    });
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    res.status(500).json({ message: 'Erreur lors du téléchargement de l\'image', error: error.message });
  }
});

// Récupérer toutes les images d'un chat
router.get('/chat/:chatId', verifyToken, async (req, res) => {
  try {
    const images = await Image.find({ 
      userId: req.userId,
      chatId: req.params.chatId
    }).sort({ createdAt: 1 });
    
    res.status(200).json(images);
  } catch (error) {
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
      return res.status(404).json({ message: 'Image non trouvée' });
    }
    
    res.status(200).json(image);
  } catch (error) {
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
    
    res.status(200).json({ message: 'Image supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la suppression de l\'image', error: error.message });
  }
});

module.exports = router;