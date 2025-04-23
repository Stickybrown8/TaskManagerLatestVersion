const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');
const mongoose = require('mongoose');

const verifyToken = (req, res, next) => {
  // DÉSACTIVATION TEMPORAIRE DE L'AUTHENTIFICATION
  // ⚠️ À NE PAS UTILISER EN PRODUCTION ⚠️
  console.log("Authentification désactivée temporairement");
  
  // On simule un utilisateur connecté avec un ID factice
 req.userId = mongoose.Types.ObjectId("507f1f77bcf86cd799439011"); // Utilisez un ID hexadécimal valide
  
  // On passe à la route suivante sans vérifier le token
  next();
  
  // L'ancien code est commenté ci-dessous pour pouvoir le restaurer facilement
  /*
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    return res.status(403).send({ message: 'Aucun token fourni!' });
  }

  // Supprimer "Bearer " si présent
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Non autorisé!' });
    }
    req.userId = decoded.id;
    next();
  });
  */
};

module.exports = {
  verifyToken
};
