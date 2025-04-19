const express = require('express');
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
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://task-manager-client.vercel.app'] 
    : 'http://localhost:3000'
}));

// Routes
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
