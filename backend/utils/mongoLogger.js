const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');

// Créer les dossiers de logs s'ils n'existent pas
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const mongoLogger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'mongodb' },
  transports: [
    new transports.File({ 
      filename: path.join(logDir, 'mongodb-error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({ 
      filename: path.join(logDir, 'mongodb.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Ajouter la console en développement
if (process.env.NODE_ENV !== 'production') {
  mongoLogger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}

module.exports = mongoLogger;