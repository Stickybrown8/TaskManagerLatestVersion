const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes imports
const registerRoute = require('./routes/register');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const badgeRoutes = require('./routes/badges');
const gamificationRoutes = require('./routes/gamification');

// Chargement des variables d'environnement
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Connexion à la base de données
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Route de debug qui affiche toutes les routes montées, préfixes inclus (API-friendly)
app.get('/debug/routes', (req, res) => {
  const getRoutes = (stack, parent = '') => {
    let routes = [];
    stack.forEach((middleware) => {
      if (middleware.route) {
        routes.push(parent + middleware.route.path);
      } else if (middleware.name === 'router' && middleware.handle.stack) {
        // Extraction du préfixe du router
        const prefix = middleware.regexp && middleware.regexp.source
          ? middleware.regexp.source
              .replace(/^\\^\\/, '/')
              .replace(/\\\/\?\(\?=\\\/\|\$\)/, '')
              .replace(/\\\//g, '/')
          : '';
        routes = routes.concat(getRoutes(middleware.handle.stack, parent + prefix));
      }
    });
    return routes;
  };
  res.json(getRoutes(app._router.stack));
});

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ message: 'Route de test fonctionnelle' });
});

// Route pour vérifier les variables d’environnement
app.get('/debug/env', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT || 5000
  });
});

// ROUTES API
app.use('/api/register', registerRoute);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/gamification', gamificationRoutes);

// Route de base pour vérifier que l’API fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'API Task Manager fonctionnelle' });
});

// --- Affichage en console des routes exposées (pour Render logs/debug) ---
function printRoutes(stack, parent = '') {
  stack.forEach(middleware => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods);
      console.log(`Route: ${parent}${middleware.route.path} [${methods.join(', ')}]`);
    } else if (middleware.name === 'router' && middleware.handle.stack) {
      const prefix = middleware.regexp && middleware.regexp.source
        ? middleware.regexp.source
            .replace(/^\\^\\/, '/')
            .replace(/\\\/\?\(\?=\\\/\|\$\)/, '')
            .replace(/\\\//g, '/')
        : '';
      printRoutes(middleware.handle.stack, parent + prefix);
    }
  });
}

printRoutes(app._router.stack);

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
