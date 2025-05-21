/*
 * CONFIGURATION D'AUTHENTIFICATION - backend/config/auth.config.js
 * 
 * Explication simple:
 * Ce fichier contient les paramètres secrets pour sécuriser la connexion des utilisateurs.
 * Il définit une clé secrète et la durée pendant laquelle un utilisateur reste connecté.
 * 
 * Explication technique:
 * Module de configuration Node.js qui définit les paramètres pour l'authentification JWT (JSON Web Token),
 * notamment la clé secrète et la durée d'expiration des tokens.
 * 
 * Où ce fichier est utilisé:
 * Dans les middlewares d'authentification et les services qui gèrent la connexion et la vérification des tokens.
 * 
 * Connexions avec d'autres fichiers:
 * - Utilisé par les contrôleurs d'authentification (auth.controller.js)
 * - Intégré au middleware de vérification des tokens (authJwt.js)
 * - Exploité lors de la création et validation des sessions utilisateur
 */

// === Début : Configuration des paramètres d'authentification ===
// Explication simple : Ce bloc définit une clé secrète pour chiffrer les informations de connexion et fixe la durée de validité d'une session.
// Explication technique : Objet de configuration exporté contenant la clé secrète pour signer/vérifier les JWT et la durée d'expiration du token en secondes.
module.exports = {
  secret: "task-manager-secret-key-for-jwt-authentication",
  // Durée de validité du token: 24 heures
  jwtExpiration: 86400
};
// === Fin : Configuration des paramètres d'authentification ===
