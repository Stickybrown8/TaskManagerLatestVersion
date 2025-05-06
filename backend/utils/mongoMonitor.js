const mongoose = require('mongoose');
const mongoLogger = require('./mongoLogger');

// Liste pour stocker les requêtes lentes
const slowQueries = [];

// Configurer le monitoring MongoDB
const setupMongoMonitoring = () => {
  // Activer le debug mode en développement uniquement
  if (process.env.NODE_ENV !== 'production') {
    mongoose.set('debug', (collectionName, method, query, doc) => {
      mongoLogger.debug(`MongoDB ${collectionName}.${method}`, {
        query: JSON.stringify(query),
        doc: doc ? '✅' : '❌'
      });
    });
  }

  // Monitorer les requêtes lentes
  mongoose.connection.on('query', (query) => {
    const start = Date.now();
    
    query.once('end', () => {
      const duration = Date.now() - start;
      
      // Enregistrer les requêtes qui prennent plus de 100ms
      if (duration > 100) {
        const slowQuery = {
          collection: query.model.collection.name,
          operation: query.op,
          query: JSON.stringify(query.conditions),
          duration: duration
        };
        
        slowQueries.push(slowQuery);
        
        // Limiter la taille de la liste
        if (slowQueries.length > 100) {
          slowQueries.shift();
        }
        
        mongoLogger.warn(`Requête MongoDB lente (${duration}ms)`, slowQuery);
      }
    });
  });

  return {
    getSlowQueries: () => [...slowQueries],
    clearSlowQueries: () => {
      slowQueries.length = 0;
    }
  };
};

module.exports = setupMongoMonitoring;