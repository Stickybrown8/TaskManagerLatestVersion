/*
 * UTILITAIRE DE JOURNALISATION MONGODB - backend/utils/mongoLogger.js
 *
 * Explication simple:
 * Ce fichier est comme un carnet de notes automatique qui écrit ce qui se passe quand 
 * l'application parle avec la base de données. Si quelque chose ne fonctionne pas bien,
 * il note le problème en détail pour qu'on puisse comprendre ce qui s'est passé et le réparer.
 * C'est comme une boîte noire d'avion mais pour notre application!
 *
 * Explication technique:
 * Module utilitaire qui configure un logger Winston personnalisé pour les opérations MongoDB,
 * avec rotation de fichiers et différents niveaux de verbosité selon l'environnement.
 *
 * Où ce fichier est utilisé:
 * Importé par tous les fichiers de routes et services qui interagissent avec MongoDB
 * pour journaliser les erreurs et événements importants de la base de données.
 *
 * Connexions avec d'autres fichiers:
 * - Utilisé par les routes API pour enregistrer les erreurs de base de données
 * - Crée des fichiers de logs dans le dossier /logs de l'application
 * - Dépend de la bibliothèque Winston pour la gestion des logs
 * - Utilise les variables d'environnement pour déterminer le niveau de logging
 */

// === Début : Importation des dépendances ===
// Explication simple : On fait venir les outils dont on a besoin pour écrire notre journal automatique.
// Explication technique : Importation de Winston pour la gestion des logs, et du module path pour gérer les chemins de fichiers indépendamment du système d'exploitation.
const winston = require('winston');
const { createLogger, format, transports } = winston;
const path = require('path');
// === Fin : Importation des dépendances ===

// === Début : Création du répertoire de logs ===
// Explication simple : On vérifie si le tiroir pour ranger notre journal existe, et si non, on le crée.
// Explication technique : Utilisation de fs (file system) pour vérifier si le répertoire de logs existe et le créer s'il n'existe pas, garantissant la disponibilité de l'emplacement de stockage avant d'initialiser le logger.
// Créer les dossiers de logs s'ils n'existent pas
const fs = require('fs');
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}
// === Fin : Création du répertoire de logs ===

// === Début : Configuration du logger ===
// Explication simple : On configure notre journal pour qu'il note la date, les détails des problèmes, et stocke tout ça dans des fichiers séparés qui ne deviennent pas trop gros.
// Explication technique : Création et configuration d'une instance Winston logger avec des formats spécifiques, métadonnées par défaut, et plusieurs transports pour diriger les logs vers différents fichiers avec rotation automatique basée sur la taille.
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
// === Fin : Configuration du logger ===

// === Début : Configuration pour l'environnement de développement ===
// Explication simple : Si on travaille en mode développement, on affiche aussi les messages sur l'écran de l'ordinateur, pas seulement dans les fichiers.
// Explication technique : Ajout conditionnel d'un transport Console pour l'environnement de développement, avec formatage colorisé et simplifié pour faciliter le débogage en temps réel.
// Ajouter la console en développement
if (process.env.NODE_ENV !== 'production') {
  mongoLogger.add(new transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple()
    )
  }));
}
// === Fin : Configuration pour l'environnement de développement ===

// === Début : Exportation du logger ===
// Explication simple : On rend notre journal disponible pour que les autres parties de l'application puissent l'utiliser.
// Explication technique : Exportation de l'instance du logger configurée pour être importée par d'autres modules du projet.
module.exports = mongoLogger;
// === Fin : Exportation du logger ===