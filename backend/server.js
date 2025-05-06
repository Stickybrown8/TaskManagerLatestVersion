// server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
// const chatRoutes = require('./routes/chat');

// Routes imports
const registerRoute = require('./routes/register');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const badgeRoutes = require('./routes/badges');
const gamificationRoutes = require('./routes/gamification');
const imageRoutes = require('./routes/images');
const timerRoutes = require('./routes/timers');

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Connect to database
console.log('Tentative de connexion à MongoDB...');
connectDB().then(() => {
  console.log('MongoDB connecté avec succès');
}).catch(err => {
  console.error('ERREUR de connexion MongoDB:', err);
});

const app = express();

// Middleware
app.use(express.json({ limit: '50mb' })); // Limite augmentée pour l'upload d'images
app.use(cors({ origin: '*' }));
app.use(express.static('public'));

/**
 * Fonction récursive améliorée pour lire la structure des répertoires
 * @param {string} dir - Chemin du répertoire à explorer
 * @param {number} depth - Profondeur maximale de récursion (défaut: 5)
 * @param {number} maxFilesPerDir - Nombre maximum de fichiers par répertoire (défaut: 100)
 * @returns {Object} Structure arborescente du répertoire
 */
function readDirRecursive(dir, depth = 5, maxFilesPerDir = 100) {
  try {
    const name = path.basename(dir);
    
    // Arrêter la récursion si on atteint la profondeur limite
    if (depth < 0) return { name, type: 'dir', children: [] };
    
    // Liste des dossiers à ignorer
    const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.cache'];
    
    // Lire le contenu du répertoire avec gestion d'erreur
    let dirents;
    try {
      dirents = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.warn(`Impossible de lire le répertoire ${dir}: ${err.message}`);
      return { name, type: 'dir', error: err.message, children: [] };
    }
    
    // Filtrage et limitation du nombre de fichiers pour éviter les problèmes de performance
    const filteredDirents = dirents
      .filter(d => !ignoreDirs.includes(d.name))
      .slice(0, maxFilesPerDir);  // Limite le nombre de fichiers par dossier
    
    // Traitement des enfants
    const children = filteredDirents.map(d => {
      const fullPath = path.join(dir, d.name);
      
      if (d.isDirectory()) {
        return { 
          name: d.name, 
          type: 'dir', 
          children: readDirRecursive(fullPath, depth - 1, maxFilesPerDir).children 
        };
      }
      
      return { name: d.name, type: 'file' };
    });
    
    return { name, type: 'dir', children };
  } catch (err) {
    console.error(`Erreur lors de la lecture de l'arborescence ${dir}:`, err);
    return { 
      name: path.basename(dir), 
      type: 'dir', 
      error: 'Erreur lors de la lecture du répertoire', 
      children: [] 
    };
  }
}

// Route pour obtenir l'arborescence des fichiers
app.get('/api/file-tree', (req, res) => {
  try {
    // Paramètres de requête configurables
    const depth = parseInt(req.query.depth) || 5;  // Profondeur par défaut augmentée à 5
    const maxFilesPerDir = parseInt(req.query.maxFiles) || 100;
    
    // Chemin racine du projet
    const rootDir = path.resolve(__dirname, '..');
    
    // Générer l'arborescence avec log de performance
    console.time('file-tree-generation');
    const tree = readDirRecursive(rootDir, depth, maxFilesPerDir);
    console.timeEnd('file-tree-generation');
    
    // Ajouter des informations sur la configuration utilisée
    tree.config = { depth, maxFilesPerDir };
    
    res.json(tree);
  } catch (error) {
    console.error("Erreur lors de la génération de l'arborescence:", error);
    res.status(500).json({
      error: "Erreur lors de la génération de l'arborescence",
      message: error.message
    });
  }
});

// Route pour obtenir le contenu complet d'un fichier
app.get('/api/file', (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).send('Missing path query parameter');
  
  const filePath = path.resolve(__dirname, '..', relPath);
  
  // Vérification de sécurité pour éviter la traversée de répertoire
  if (!filePath.startsWith(path.resolve(__dirname, '..'))) {
    return res.status(400).send('Invalid path');
  }
  
  // Vérifier que le fichier existe et est bien un fichier
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send('File not found');
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    res.type('text/plain').send(content);
  } catch (error) {
    res.status(500).send(`Erreur lors de la lecture du fichier: ${error.message}`);
  }
});

// Debug: liste de toutes les routes enregistrées
app.get('/debug/routes', (req, res) => {
  const routes = app._router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).join(',').toUpperCase()
    }));
  res.json(routes);
});

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ message: 'Route de test fonctionnelle' });
});

// Test de connexion MongoDB
app.get('/api/db-test', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const connectionState = mongoose.connection.readyState;
    const states = {
      0: 'Déconnecté',
      1: 'Connecté',
      2: 'En cours de connexion',
      3: 'En cours de déconnexion'
    };
    res.json({
      status: 'success',
      connection: states[connectionState] || 'Inconnu',
      readyState: connectionState,
      dbName: mongoose.connection.db ? mongoose.connection.db.databaseName : 'Aucun'
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Debug des variables d'environnement
app.get('/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT || 5000
  });
});

// Routes API
app.use('/api/register', registerRoute);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/timers', timerRoutes); // Assurez-vous que cette ligne est présente
app.use('/api/images', imageRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ message: 'API Task Manager fonctionnelle' });
});

// Afficher les routes dans la console
const routes = app._router.stack
  .filter(layer => layer.route)
  .map(layer => `${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`);
routes.forEach(r => console.log('Route:', r));

// Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;