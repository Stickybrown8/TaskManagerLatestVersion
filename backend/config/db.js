// Configuration de MongoDB Atlas
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Charger les variables d'environnement
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env' });

// Fonction de connexion à MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB connecté: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`Erreur de connexion à MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
