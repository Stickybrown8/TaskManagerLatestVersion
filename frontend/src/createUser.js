// Remplacer l'import par require (si vous utilisez Node.js standard)
const axios = require('axios');

// URL de votre API backend
const API_URL = 'https://task-manager-api-yx13.onrender.com/api';

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
  } catch (error) {
    console.error('Erreur complète:', error);
    console.error('Détails:', error.response ? error.response.data : "Pas de réponse");
    throw error;
  }
}

// Exécuter la fonction
createUser()
  .then(data => console.log('Résultat:', data))
  .catch(err => console.error('Erreur finale:', err));
