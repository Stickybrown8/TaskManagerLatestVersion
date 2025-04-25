// backend/models/Image.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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

// Création d'index pour améliorer les performances
ImageSchema.index({ userId: 1, chatId: 1 });
ImageSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Image', ImageSchema);