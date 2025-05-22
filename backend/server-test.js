/*
 * FICHIER TEMPORAIRE DE TEST - server-test.js
 * 
 * ⚠️  ATTENTION: Ce fichier est une copie modifiée de server.js
 * ⚠️  Il désactive MongoDB pour permettre les tests
 * ⚠️  NE PAS utiliser en production !
 * 
 * L'ORIGINAL server.js reste INTACT !
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
// const { connectDB } = require('./config/db'); // ← DÉSACTIVÉ POUR TEST
const mongoLogger = require('./utils/mongoLogger');
// const mongoose = require('mongoose'); // ← DÉSACTIVÉ POUR TEST

// Routes
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const authRoutes = require('./routes/auth');
const timerRoutes = require('./routes/timers');

const app = express();
const PORT = process.env.PORT || 5000;

// Sécurité et middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// ========================================
// MONGODB DÉSACTIVÉ POUR TEST
// ========================================
console.log('🧪 MODE TEST: MongoDB désactivé');
console.log('📁 Fichier original server.js non modifié');

// Routes API
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/timers', timerRoutes);

// Route de vérification d'état (VERSION TEST)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'TEST - MongoDB désactivé',
    mongodb: {
      state: 'désactivé pour tests',
      connected: false
    },
    uptime: process.uptime(),
    warning: 'Version de test - server.js original intact'
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
  console.error('Erreur non gérée:', {
    route: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack
  });
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    errorCode: err.code || 'SERVER_ERROR',
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

// Démarrage du serveur
app.listen(PORT, () => {
  console.log(`🚀 SERVEUR TEST démarré sur le port ${PORT}`);
  console.log(`🧪 Mode: TEST (MongoDB désactivé)`);
  console.log(`📁 Original: server.js (INTACT)`);
  console.log(`🔧 Test: server-test.js (modifié)`);
  mongoLogger.info(`Serveur TEST démarré sur le port ${PORT}`);
});