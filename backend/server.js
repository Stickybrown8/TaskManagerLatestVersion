// backend/server.js
// Serveur principal avec configuration multi-environnements et CORS universel

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const { connectDB } = require('./config/db');
const mongoLogger = require('./utils/mongoLogger');
const mongoose = require('mongoose');

// === Import des routes ===
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const authRoutes = require('./routes/auth');
const timerRoutes = require('./routes/timers');
const uploadRoutes = require('./routes/upload');
const profitabilityRoutes = require('./routes/profitability');
const objectiveRoutes = require('./routes/objectives');
const gamificationRoutes = require('./routes/gamification');
const badgeRoutes = require('./routes/badges');
const taskImpactRoutes = require('./routes/taskImpact');

// === Initialisation Express ===
const app = express();
const PORT = process.env.PORT || 5000;

// === Détection de l'environnement ===
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const isCodespaces = process.env.CODESPACES === 'true';

console.log('╔════════════════════════════════════════╗');
console.log('║     🚀 DÉMARRAGE DU SERVEUR API        ║');
console.log('╠════════════════════════════════════════╣');
console.log(`║ 📍 Environnement: ${(process.env.NODE_ENV || 'development').padEnd(20)}║`);
console.log(`║ 🌍 Codespaces: ${isCodespaces ? 'Oui'.padEnd(23) : 'Non'.padEnd(23)}║`);
console.log(`║ 🔧 Port: ${PORT.toString().padEnd(29)}║`);
console.log('╚════════════════════════════════════════╝');

// === Configuration CORS Universelle ===
const corsOptions = {
  origin: function (origin, callback) {
    // Autoriser les requêtes sans origine (Postman, serveur, etc.)
    if (!origin) {
      console.log('✅ CORS: Requête sans origine autorisée');
      return callback(null, true);
    }
    
    // Log de l'origine
    console.log(`🔍 CORS: Vérification de l'origine: ${origin}`);
    
    // Liste des origines toujours autorisées
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];
    
    // Ajouter l'URL frontend depuis les variables d'environnement
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
    }
    
    // === RÈGLES D'AUTORISATION ===
    
    // 1. GitHub Codespaces - TOUJOURS autoriser
    if (origin.includes('.app.github.dev')) {
      console.log(`✅ CORS: Codespaces autorisé - ${origin}`);
      return callback(null, true);
    }
    
    // 2. Netlify - TOUJOURS autoriser
    if (origin.includes('.netlify.app')) {
      console.log(`✅ CORS: Netlify autorisé - ${origin}`);
      return callback(null, true);
    }
    
    // 3. Render - TOUJOURS autoriser
    if (origin.includes('.onrender.com')) {
      console.log(`✅ CORS: Render autorisé - ${origin}`);
      return callback(null, true);
    }
    
    // 4. Vercel - TOUJOURS autoriser
    if (origin.includes('.vercel.app')) {
      console.log(`✅ CORS: Vercel autorisé - ${origin}`);
      return callback(null, true);
    }
    
    // 5. Origines explicitement autorisées
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS: Origine autorisée - ${origin}`);
      return callback(null, true);
    }
    
    // 6. En développement - autoriser tout
    if (isDevelopment) {
      console.log(`⚠️  CORS: Origine autorisée (mode dev) - ${origin}`);
      return callback(null, true);
    }
    
    // 7. En production - rejeter les origines non autorisées
    console.error(`❌ CORS: Origine refusée - ${origin}`);
    callback(new Error('Non autorisé par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Auth-Token', 'X-Total-Count'],
  maxAge: 86400, // 24 heures
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// === Application des middlewares ===
app.use(cors(corsOptions));

// Helmet avec configuration adaptée
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Désactiver CSP pour éviter les problèmes
}));

// Parsers avec limites augmentées
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(mongoSanitize());

// === Servir les fichiers statiques (uploads) ===
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Access-Control-Allow-Origin', '*');
  }
}));

// Alternative pour les logos (si frontend/public/logos existe)
const logosPath = path.join(__dirname, '../frontend/public/logos');
const fs = require('fs');
if (fs.existsSync(logosPath)) {
  app.use('/logos', express.static(logosPath, {
    setHeaders: (res, filePath) => {
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Access-Control-Allow-Origin', '*');
    }
  }));
}

// === Middleware de logging des requêtes ===
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log de la requête entrante
  console.log(`📥 ${req.method} ${req.url}`, {
    ip: req.ip,
    origin: req.get('Origin') || 'Aucune',
    auth: req.get('Authorization') ? 'Présent' : 'Absent'
  });
  
  // Log de la réponse
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    originalSend.call(this, data);
  };
  
  next();
});

// === Connexion MongoDB ===
connectDB().then(connected => {
  if (connected) {
    console.log('✅ MongoDB connecté avec succès');
  } else if (process.env.NODE_ENV === 'production') {
    console.error('❌ Impossible de se connecter à MongoDB en production');
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Erreur connexion MongoDB:', err);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// === Routes de santé ===
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Task Manager API v1.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    codespaces: isCodespaces
  });
});

app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'API Task Manager',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tasks: '/api/tasks',
      clients: '/api/clients',
      timers: '/api/timers',
      objectives: '/api/objectives',
      profitability: '/api/profitability',
      gamification: '/api/gamification'
    }
  });
});

app.get('/api/health', (req, res) => {
  const mongoState = mongoose.connection.readyState;
  const states = {
    0: 'déconnecté',
    1: 'connecté',
    2: 'connexion en cours',
    3: 'déconnexion en cours'
  };

  res.json({
    success: true,
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    mongodb: {
      state: states[mongoState] || 'inconnu',
      connected: mongoState === 1
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    codespaces: isCodespaces
  });
});

// === Routes API ===
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/timers', timerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/profitability', profitabilityRoutes);
app.use('/api/objectives', objectiveRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/taskImpact', taskImpactRoutes);

// === Gestion des routes non trouvées ===
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method
  });
});

// Route catch-all pour les autres requêtes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint non trouvé',
    path: req.originalUrl
  });
});

// === Middleware de gestion d'erreurs global ===
app.use((err, req, res, next) => {
  // Log de l'erreur
  mongoLogger.error('Erreur serveur:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  // Erreur CORS
  if (err.message === 'Non autorisé par CORS') {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé par CORS',
      origin: req.get('Origin')
    });
  }
  
  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors
    });
  }
  
  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} déjà utilisé`
    });
  }
  
  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token invalide'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expiré'
    });
  }
  
  // Erreur par défaut
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Erreur serveur' : err.message,
    ...(isDevelopment && { 
      stack: err.stack,
      details: err 
    })
  });
});

// === Démarrage du serveur ===
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║      ✅ SERVEUR API DÉMARRÉ           ║');
  console.log('╠════════════════════════════════════════╣');
  console.log(`║ 🌐 URL locale: http://localhost:${PORT}${' '.repeat(23 - PORT.toString().length)}║`);
  
  if (isCodespaces) {
    const codespaceName = process.env.CODESPACE_NAME || 'unknown';
    console.log(`║ 🚀 URL Codespaces:${' '.repeat(20)}║`);
    console.log(`║ https://${codespaceName}-${PORT}.app.github.dev${' '.repeat(40 - codespaceName.length - PORT.toString().length)}║`);
  }
  
  console.log('╚════════════════════════════════════════╝\n');
});

// === Gestion de l'arrêt gracieux ===
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM reçu, arrêt du serveur...');
  server.close(() => {
    console.log('🛑 Serveur arrêté');
    mongoose.connection.close(false, () => {
      console.log('🔌 Connexion MongoDB fermée');
      process.exit(0);
    });
  });
});

// === Gestion des erreurs non capturées ===
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  if (isProduction) {
    // En production, logger et continuer
    mongoLogger.error('Unhandled Rejection', { reason });
  }
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  mongoLogger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  if (isProduction) {
    // En production, arrêter proprement
    process.exit(1);
  }
});