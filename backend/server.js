// server.js - Ajout des routes pour les images
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');
const chatRoutes = require('./routes/chat');

// Routes imports
const registerRoute = require('./routes/register');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const badgeRoutes = require('./routes/badges');
const gamificationRoutes = require('./routes/gamification');
const imageRoutes = require('./routes/images'); // Nouvelle importation

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' })); // Augmenter la limite pour permettre l'upload d'images
app.use(cors({ origin: '*' }));
app.use(express.static('public'));

// Recursive function to read directory structure
function readDirRecursive(dir, depth = 3) {
  const name = path.basename(dir);
  if (depth < 0) return { name, type: 'dir', children: [] };
  const children = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => !['node_modules', '.git'].includes(d.name))
    .map(d => {
      const fullPath = path.join(dir, d.name);
      if (d.isDirectory()) {
        return { name: d.name, type: 'dir', children: readDirRecursive(fullPath, depth - 1).children };
      }
      return { name: d.name, type: 'file' };
    });
  return { name, type: 'dir', children };
}

// Route to get project file tree
app.get('/api/file-tree', (req, res) => {
  const rootDir = path.resolve(__dirname, '..');
  const tree = readDirRecursive(rootDir, 3);
  res.json(tree);
});

// Route to get full file content
app.get('/api/file', (req, res) => {
  const relPath = req.query.path;
  if (!relPath) return res.status(400).send('Missing path query parameter');
  const filePath = path.resolve(__dirname, '..', relPath);
  if (!filePath.startsWith(path.resolve(__dirname, '..'))) {
    return res.status(400).send('Invalid path');
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send('File not found');
  }
  const content = fs.readFileSync(filePath, 'utf8');
  res.type('text/plain').send(content);
});

// Simple debug: list all registered routes
app.get('/debug/routes', (req, res) => {
  const routes = app._router.stack
    .filter(layer => layer.route)
    .map(layer => ({
      path: layer.route.path,
      methods: Object.keys(layer.route.methods).join(',').toUpperCase()
    }));
  res.json(routes);
});

// Simple test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Route de test fonctionnelle' });
});

// Environment debug
app.get('/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT || 5000
  });
});

// API routes
app.use('/api/register', registerRoute);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/images', imageRoutes); // Nouvelle route pour les images

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'API Task Manager fonctionnelle' });
});

// Print routes to console
const routes = app._router.stack
  .filter(layer => layer.route)
  .map(layer => `${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`);
routes.forEach(r => console.log('Route:', r));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;