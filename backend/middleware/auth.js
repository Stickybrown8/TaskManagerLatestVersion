const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');

// Configuration et variables d'environnement
const JWT_SECRET = process.env.JWT_SECRET || 'e34aaef4c604376cab0329dfa150e060a2e67601835e118ae6518a5754923e7d';
const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false'; // Activer par défaut

const verifyToken = async (req, res, next) => {
  // Journaliser chaque requête (sans les données sensibles)
  mongoLogger.debug('Requête API reçue', {
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // Mode de transition: vérifier si l'authentification est requise
  if (!AUTH_REQUIRED) {
    mongoLogger.warn('Mode sans authentification activé (NE PAS UTILISER EN PRODUCTION)', {
      path: req.originalUrl
    });
    req.userId = new mongoose.Types.ObjectId("507f1f77bcf86cd799439011");
    return next();
  }
  
  // Extraire le token
  let token = req.headers['x-access-token'] || req.headers['authorization'];
  
  if (!token) {
    mongoLogger.warn('Accès sans token refusé', { path: req.originalUrl });
    return res.status(403).json({ 
      success: false,
      message: 'Aucun token fourni'
    });
  }
  
  // Nettoyer le préfixe Bearer si présent
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  
  try {
    // Vérifier le token
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    
    // Vérifier si l'utilisateur existe toujours en base (optionnel)
    // const User = require('../models/User');
    // const user = await User.findById(decoded.id).select('_id isActive');
    // if (!user || !user.isActive) {
    //   throw new Error('Utilisateur inactif ou supprimé');
    // }
    
    next();
  } catch (error) {
    mongoLogger.warn('Token invalide', {
      error: error.message,
      path: req.originalUrl
    });
    
    return res.status(401).json({
      success: false,
      message: 'Token invalide ou expiré',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

module.exports = { verifyToken };