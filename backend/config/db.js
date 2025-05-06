// Configuration de MongoDB Atlas
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const mongoLogger = require('../utils/mongoLogger');

// Charger les variables d'environnement
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Options de connexion
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Fonction de connexion avec mécanisme de reconnexion
const connectDB = async (retryCount = 0, maxRetries = 5) => {
  try {
    mongoLogger.info('Tentative de connexion à MongoDB...');
    
    const conn = await mongoose.connect(process.env.MONGO_URI, mongooseOptions);
    
    // Configurer les écouteurs d'événements MongoDB
    mongoose.connection.on('connected', () => {
      mongoLogger.info(`MongoDB connecté: ${conn.connection.host}`);
    });
    
    mongoose.connection.on('error', (err) => {
      mongoLogger.error('Erreur MongoDB:', { error: err.message });
    });
    
    mongoose.connection.on('disconnected', () => {
      mongoLogger.warn('MongoDB déconnecté - attente avant reconnexion...');
      // Tenter de se reconnecter après un délai
      setTimeout(() => {
        mongoLogger.info('Tentative de reconnexion...');
        connectDB();
      }, 5000);
    });
    
    // Instrumentation pour surveillance des performances
    mongoose.set('debug', (collectionName, method, query, doc) => {
      mongoLogger.debug(`MongoDB ${collectionName}.${method}`, {
        query,
        docSize: doc ? JSON.stringify(doc).length : 0
      });
    });
    
    mongoLogger.info(`MongoDB connecté avec succès: ${conn.connection.host}`);
    return true;
  } catch (error) {
    mongoLogger.error('Erreur de connexion MongoDB:', { 
      error: error.message,
      retryCount,
      maxRetries
    });
    
    if (retryCount < maxRetries) {
      mongoLogger.info(`Nouvelle tentative (${retryCount + 1}/${maxRetries}) dans 5 secondes...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retryCount + 1, maxRetries);
    } else {
      mongoLogger.error('Nombre maximum de tentatives atteint, connexion impossible');
      // En production, on ne veut pas arrêter l'application brutalement
      if (process.env.NODE_ENV === 'production') {
        return false;
      } else {
        process.exit(1);
      }
    }
  }
};

module.exports = { connectDB };
