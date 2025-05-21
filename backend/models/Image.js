/*
 * MODÈLE D'IMAGE - backend/models/Image.js
 *
 * Explication simple:
 * Ce fichier définit comment sont stockées les images dans l'application.
 * Il permet de sauvegarder des images envoyées par les utilisateurs dans les discussions,
 * avec des informations sur qui les a envoyées et quand.
 *
 * Explication technique:
 * Modèle de données Mongoose pour la collection "images" dans MongoDB,
 * définissant la structure pour stocker les données d'images encodées avec leurs métadonnées.
 *
 * Où ce fichier est utilisé:
 * Dans les contrôleurs qui gèrent l'envoi, le stockage et la récupération
 * des images dans les fonctionnalités de chat de l'application.
 *
 * Connexions avec d'autres fichiers:
 * - Référencé au modèle User (pour associer des images à leur propriétaire)
 * - Probablement utilisé par les contrôleurs de chat ou de message
 * - Peut être lié aux services de stockage de fichiers ou d'optimisation d'images
 * - Interagit avec les composants frontend qui affichent les images dans les discussions
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour créer notre modèle d'images.
// Explication technique : Importation du module mongoose et extraction de l'objet Schema pour définir la structure du document MongoDB.
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// === Fin : Importation des dépendances ===

// === Début : Définition du schéma de données pour les images ===
// Explication simple : On crée un plan qui décrit toutes les informations qu'une image doit contenir, comme qui l'a envoyée, dans quelle discussion, et le contenu de l'image elle-même.
// Explication technique : Déclaration d'un schéma Mongoose avec les champs nécessaires, les types de données, et les contraintes pour la collection d'images stockées.
// Schéma pour les images
const ImageSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  data: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
// === Fin : Définition du schéma de données pour les images ===

// === Début : Optimisation des performances avec des index ===
// Explication simple : On crée des raccourcis pour que l'ordinateur trouve plus vite les images quand on cherche celles d'un utilisateur ou d'une discussion.
// Explication technique : Création d'index MongoDB via Mongoose pour optimiser les requêtes fréquentes sur les champs userId/chatId et createdAt, améliorant ainsi les performances des opérations de recherche.
// Création d'index pour améliorer les performances
ImageSchema.index({ userId: 1, chatId: 1 });
ImageSchema.index({ createdAt: 1 });
// === Fin : Optimisation des performances avec des index ===

// === Début : Exportation du modèle ===
// Explication simple : On donne un nom à notre plan et on le rend disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Création et exportation du modèle Mongoose "Image" basé sur le schéma défini, ce qui permet d'interagir avec la collection "images" dans MongoDB.
module.exports = mongoose.model('Image', ImageSchema);
// === Fin : Exportation du modèle ===