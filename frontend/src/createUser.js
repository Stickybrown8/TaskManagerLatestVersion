import axios from 'axios';

// URL de votre API backend
const API_URL = 'https://task-manager-api-yx13.onrender.com/api';

// Fonction pour créer un utilisateur
async function createUser()  {
  try {
    // Données de l'utilisateur à créer
    const userData = {
      name: 'Admin',
      email: 'contact@digitalmarketing-beyond.com',
      password: 'Marchas7759',
      role: 'admin'
    };

    // Envoyer la requête d'inscription
    const response = await axios.post(`${API_URL}/users/register`, userData);
    
    console.log('Utilisateur créé avec succès:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error.response?.data || error.message);
    throw error;
  }
}

// Exécuter la fonction
createUser()
  .then(data => console.log('Résultat:', data))
  .catch(err => console.error('Erreur finale:', err));
