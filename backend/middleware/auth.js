const jwt = require('jsonwebtoken');
const config = require('../config/auth.config');

const verifyToken = (req, res, next) => {
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
};

module.exports = {
  verifyToken
};
