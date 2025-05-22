// === Ce fichier est un script autonome qui crée un utilisateur administrateur dans la base de données === /workspaces/TaskManagerLatestVersion/frontend/src/createUser.js
// Explication simple : Ce fichier est comme un petit robot qui s'occupe uniquement de créer un compte spécial d'administrateur dans l'application - il envoie les informations au serveur une seule fois quand on l'exécute.
// Explication technique : Script Node.js autonome qui effectue une seule opération via une requête HTTP POST pour créer un utilisateur avec privilèges d'administrateur sur le backend.
// Utilisé dans : Exécuté directement via Node.js dans un terminal (node createUser.js), généralement lors de la configuration initiale de l'application.
// Connecté à : API backend via Axios, spécifiquement l'endpoint de création d'utilisateur (/api/users/register).

// === Début : Importation et configuration de base ===
// Explication simple : Ces lignes préparent les outils nécessaires pour communiquer avec le serveur et lui indiquer où se trouve l'adresse du serveur.
// Explication technique : Importation du module Axios via require() et configuration de l'URL de base de l'API pour toutes les requêtes HTTP qui suivront.
// Remplacer l'import par require (si vous utilisez Node.js standard)
const axios = require('axios');

// URL de votre API backend
const API_URL = 'https://task-manager-api-yx13.onrender.com/api';
// === Fin : Importation et configuration de base ===

// === Début : Définition de la fonction de création d'utilisateur ===
// Explication simple : Cette fonction est comme un formulaire pré-rempli qui envoie automatiquement les informations du nouvel utilisateur (nom, email, mot de passe) au serveur.
// Explication technique : Fonction asynchrone qui encapsule la logique de création d'un utilisateur via une requête HTTP POST, avec gestion des erreurs et journalisation des étapes.
// Fonction pour créer un utilisateur
async function createUser() {
  try {
    // Données de l'utilisateur à créer
    const userData = {
      username: 'Admin', // Utilisez 'username' si c'est ce que votre backend attend
      name: 'Admin',     // Incluez les deux pour être sûr
      email: 'contact@digitalmarketing-beyond.com',
      password: 'Marchas7759',
      role: 'admin'
    };

    console.log("Tentative de création d'utilisateur...");
    
    // Envoyer la requête d'inscription avec le chemin complet
    const response = await axios.post(`${API_URL}/users/register`, userData);
    
    console.log('Utilisateur créé avec succès:', response.data);
    return response.data;
  // === Fin : Définition de la fonction de création d'utilisateur ===
  
  // === Début : Gestion des erreurs de la requête ===
  // Explication simple : Cette partie s'occupe de dire ce qui ne va pas si le serveur n'arrive pas à créer l'utilisateur - comme quand un jeu te dit pourquoi tu ne peux pas passer au niveau suivant.
  // Explication technique : Bloc catch qui capture et journalise toutes les erreurs potentielles de la requête HTTP, avec extraction et affichage des détails de l'erreur contenus dans la réponse du serveur.
  } catch (error) {
    console.error('Erreur complète:', error);
    console.error('Détails:', error.response ? error.response.data : "Pas de réponse");
    throw error;
  }
}
// === Fin : Gestion des erreurs de la requête ===

// === Début : Exécution du script ===
// Explication simple : Ces lignes lancent le robot qui va créer l'utilisateur et affichent un message pour dire si ça a marché ou pas - comme quand tu appuies sur un bouton et attends de voir si la machine fonctionne.
// Explication technique : Pattern d'auto-exécution de la fonction principale avec chaîne de promesses pour gérer le résultat ou l'erreur, affichant le résultat dans la console, typique des scripts Node.js autonomes.
// Exécuter la fonction
createUser()
  .then(data => console.log('Résultat:', data))
  .catch(err => console.error('Erreur finale:', err));
// === Fin : Exécution du script ===
