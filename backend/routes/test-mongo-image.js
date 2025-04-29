// test-mongo-image.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Modèle Image simplifié
const ImageSchema = new mongoose.Schema({
  data: String,
  mimeType: String,
  testId: String,
  createdAt: { type: Date, default: Date.now }
});

const Image = mongoose.model('TestImage', ImageSchema);

async function testImageStorage() {
  try {
    // Connexion à MongoDB
    console.log('Tentative de connexion à MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connecté à MongoDB avec succès!');
    
    // Créer une petite image de test en base64
    const smallTestImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QJIiCQAAAABJRU5ErkJggg==';
    
    // Sauvegarder l'image de test
    const testImage = new Image({
      data: smallTestImage,
      mimeType: 'image/png',
      testId: 'test_' + Date.now()
    });
    
    console.log('Tentative de sauvegarde de l\'image test...');
    await testImage.save();
    console.log('Image sauvegardée avec succès!');
    
    // Récupérer l'image
    const retrievedImage = await Image.findById(testImage._id);
    console.log('Image récupérée:', retrievedImage._id);
    
    // Nettoyage
    await Image.deleteOne({ _id: testImage._id });
    console.log('Image supprimée avec succès!');
    
    console.log('Test réussi! La base de données MongoDB peut stocker et récupérer des images.');
    
    // Fermer la connexion
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testImageStorage();