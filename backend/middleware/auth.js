// backend/middleware/auth.js
// Middleware d'authentification avec support multi-environnements

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const mongoLogger = require('../utils/mongoLogger');

// === Configuration JWT ===
const JWT_SECRET = process.env.JWT_SECRET || 'e34aaef4c604376cab0329dfa150e060a2e67601835e118ae6518a5754923e7d';
const JWT_EXPIRES_IN = '7d'; // Token valide 7 jours
const AUTH_REQUIRED = process.env.AUTH_REQUIRED !== 'false';

// === Middleware principal de vérification du token ===
const verifyToken = async (req, res, next) => {
  try {
    // Log de la requête en développement
    if (process.env.NODE_ENV === 'development') {
      mongoLogger.debug('🔐 Vérification auth', {
        method: req.method,
        path: req.originalUrl,
        hasAuthHeader: !!req.headers.authorization
      });
    }
    
    // Mode sans authentification (dev uniquement)
    if (!AUTH_REQUIRED && process.env.NODE_ENV !== 'production') {
      mongoLogger.warn('⚠️  Mode sans auth activé (DEV)', {
        path: req.originalUrl
      });
      
      // Essayer d'extraire l'ID du token même sans vérification
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (token) {
        try {
          const decoded = jwt.decode(token);
          req.userId = decoded?.id || "507f1f77bcf86cd799439011";
          req.user = { 
            id: decoded?.id || "507f1f77bcf86cd799439011",
            email: decoded?.email,
            username: decoded?.username || decoded?.name
          };
        } catch {
          req.userId = "507f1f77bcf86cd799439011";
          req.user = { id: "507f1f77bcf86cd799439011" };
        }
      } else {
        req.userId = "507f1f77bcf86cd799439011";
        req.user = { id: "507f1f77bcf86cd799439011" };
      }
      return next();
    }
    
    // Extraction du token
    let token = req.headers['x-access-token'] || req.headers['authorization'];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Aucun token fourni'
      });
    }
    
    // Retirer le préfixe "Bearer "
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }
    
    // Vérification du token
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        // Log de l'erreur
        mongoLogger.warn('❌ Token invalide', {
          error: err.message,
          path: req.originalUrl,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'Aucun'
        });
        
        // Gestion spécifique des erreurs
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Token expiré',
            expired: true
          });
        }
        
        if (err.name === 'JsonWebTokenError') {
          return res.status(401).json({
            success: false,
            message: 'Token invalide',
            error: err.message
          });
        }
        
        // Erreur générique
        return res.status(401).json({
          success: false,
          message: 'Erreur d\'authentification'
        });
      }
      
      // Token valide - enrichir la requête
      req.userId = decoded.id;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username || decoded.name
      };
      
      // Log de succès en développement
      if (process.env.NODE_ENV === 'development') {
        mongoLogger.debug('✅ Auth réussie', {
          userId: req.user.id,
          username: req.user.username
        });
      }
      
      next();
    });
  } catch (error) {
    mongoLogger.error('❌ Erreur middleware auth', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'authentification'
    });
  }
};

// === Fonction pour générer un token ===
const generateToken = (user) => {
  const payload = {
    id: user._id || user.id,
    email: user.email,
    username: user.name || user.username
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  if (process.env.NODE_ENV === 'development') {
    mongoLogger.info('🎫 Token généré', {
      userId: payload.id,
      username: payload.username,
      expiresIn: JWT_EXPIRES_IN
    });
  }

  return token;
};

// === Middleware optionnel (ne bloque pas si pas de token) ===
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = null;
    } else {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        username: decoded.username || decoded.name
      };
    }
    next();
  });
};

// === Fonction de vérification de token (pour les routes de vérification) ===
const verifyTokenOnly = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

module.exports = { 
  verifyToken, 
  generateToken, 
  optionalAuth,
  verifyTokenOnly,
  JWT_SECRET,
  JWT_EXPIRES_IN
};