// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const { connectDB } = require('./config/db');
const mongoLogger = require('./utils/mongoLogger');
const mongoose = require('mongoose');

// Routes
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const authRoutes = require('./routes/auth');
const timerRoutes = require('./routes/timers');

const app = express();
const PORT = process.env.PORT || 5000;

// Sécurité et middleware
app.use(helmet()); // Sécurité des headers HTTP
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize()); // Prévention des injections NoSQL

// Connexion à MongoDB avec gestion améliorée
connectDB().then(connected => {
  if (!connected && process.env.NODE_ENV === 'production') {
    mongoLogger.error('Impossible de se connecter à MongoDB en production');
    process.exit(1);
  }
});

// Routes API
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/timers', timerRoutes);

// Route de vérification d'état MongoDB
app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = {
    0: 'déconnecté',
    1: 'connecté',
    2: 'connexion en cours',
    3: 'déconnexion en cours'
  };
  
  res.json({
    status: 'ok',
    mongodb: {
      state: states[mongoState] || 'inconnu',
      connected: mongoState === 1
    },
    uptime: process.uptime()
  });
});

// Middleware d'erreurs
app.use((err, req, res, next) => {
  mongoLogger.error('Erreur non gérée', { 
    error: err.message,
    stack: err.stack,
    path: req.originalUrl
  });
  
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Middleware pour capturer les erreurs détaillées
app.use((err, req, res, next) => {
  // Journaliser l'erreur
  console.error('Erreur non gérée:', {
    route: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack
  });
  
  // Format de réponse standardisé pour les erreurs
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    errorCode: err.code || 'SERVER_ERROR',
    // Ne pas exposer la stack trace en production
    details: process.env.NODE_ENV === 'production' ? undefined : {
      stack: err.stack,
      ...err
    }
  });
});

// Gestionnaire pour les routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.originalUrl}`,
    errorCode: 'NOT_FOUND'
  });
});

app.listen(PORT, () => {
  mongoLogger.info(`Serveur démarré sur le port ${PORT}`);
});