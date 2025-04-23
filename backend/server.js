const express = require('express');
const registerRoute = require('./routes/register');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const taskRoutes = require('./routes/tasks');
const badgeRoutes = require('./routes/badges');
const gamificationRoutes = require('./routes/gamification');

// Charger les variables d'environnement
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Connexion à la base de données
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: '*' }));

// Route de débogage pour voir toutes les routes enregistrées
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach(middleware => {
    if(middleware.route) { // routes registered directly on the app
      routes.push(middleware.route.path);
    } else if(middleware.name === 'router') { // router middleware 
      middleware.handle.stack.forEach(handler => {
        const route = handler.route;
        if(route) {
          routes.push(route.path);
        }
      });
    }
  });
  res.json(routes);
});

// Route de test simple
app.get('/api/test', (req, res) => {
  res.json({ message: 'Route de test fonctionnelle' });
});

// Route pour vérifier les variables d'environnement (sécurisées)
app.get('/debug/env', (req, res) => {
  res.json({ 
    nodeEnv: process.env.NODE_ENV,
    hasMongoUri: !!process.env.MONGO_URI,
    hasJwtSecret: !!process.env.JWT_SECRET,
    port: process.env.PORT || 5000
  });
});

// Routes
app.use('/api/register', registerRoute);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/badges', badgeRoutes);
app.use('/api/gamification', gamificationRoutes);

// Route de base pour vérifier que l'API fonctionne
app.get('/', (req, res) => {
  res.json({ message: 'API Task Manager fonctionnelle' });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

module.exports = app;
