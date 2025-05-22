/*
 * SCRIPT DE TEST DE STOCKAGE D'IMAGES - backend/routes/test-mongo-image.js
 *
 * Explication simple:
 * Ce fichier est un petit programme de test qui vérifie si notre base de données MongoDB
 * peut bien stocker et récupérer des images. C'est comme si on vérifiait qu'un album photo
 * fonctionne correctement avant de l'utiliser vraiment, en y mettant une petite photo test,
 * en vérifiant qu'on peut la voir, puis en la supprimant.
 *
 * Explication technique:
 * Script utilitaire Node.js autonome qui teste les opérations CRUD sur la collection TestImage
 * dans MongoDB, en validant la capacité à stocker et récupérer des images au format base64.
 *
 * Où ce fichier est utilisé:
 * Exécuté manuellement par les développeurs pour vérifier la configuration de MongoDB
 * avant de déployer la fonctionnalité de stockage d'images dans l'application.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les variables d'environnement définies dans .env (MONGO_URI)
 * - Sert de test préliminaire pour le modèle Image.js utilisé dans les routes images.js
 * - N'est pas connecté directement à l'application principale, c'est un script autonome
 */

// === Début : Configuration et importation des dépendances ===
// Explication simple : On prépare tous les outils dont on a besoin pour notre test, comme quand on sort tous les ingrédients avant de cuisiner.
// Explication technique : Importation des modules nécessaires - dotenv pour les variables d'environnement, mongoose pour la connexion MongoDB, et fs/path pour la manipulation de fichiers si nécessaire.
// test-mongo-image.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
// === Fin : Configuration et importation des dépendances ===

// === Début : Définition du modèle de données TestImage ===
// Explication simple : On crée un "moule" pour nos images de test, qui définit quelles informations on va stocker pour chaque image.
// Explication technique : Définition d'un schéma Mongoose simplifié pour la collection TestImage, avec des champs pour les données binaires, le type MIME, un identifiant de test et un horodatage.
// Modèle Image simplifié
const ImageSchema = new mongoose.Schema({
  data: String,
  mimeType: String,
  testId: String,
  createdAt: { type: Date, default: Date.now }
});

const Image = mongoose.model('TestImage', ImageSchema);
// === Fin : Définition du modèle de données TestImage ===

// === Début : Fonction principale de test du stockage d'images ===
// Explication simple : Cette fonction est le coeur de notre test. Elle se connecte à la base de données, y enregistre une toute petite image, vérifie qu'on peut la retrouver, puis la supprime pour faire le ménage.
// Explication technique : Fonction asynchrone qui exécute un cycle complet d'opérations CRUD sur la collection TestImage - connexion à MongoDB, création et sauvegarde d'une image base64 minimale, récupération par ID, suppression et fermeture de la connexion, avec gestion des erreurs.
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
// === Fin : Fonction principale de test du stockage d'images ===

// === Début : Exécution du test ===
// Explication simple : Ici, on demande à l'ordinateur de lancer le test que nous avons préparé, comme quand on appuie sur le bouton "démarrer" d'une machine.
// Explication technique : Invocation immédiate de la fonction asynchrone de test sans attente du résultat au niveau du module principal.
testImageStorage();
// === Fin : Exécution du test ===