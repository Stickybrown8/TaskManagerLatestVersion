import axios from 'axios';

// URL de base de l'API (votre backend sur Render)
const API_URL = process.env.REACT_APP_API_URL || "https://task-manager-api-yx13.onrender.com";

// Configuration d'axios avec le token d'authentification
const setAuthToken = (token)  => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};

// Service d'authentification
const authService = {
  login: async (email, password) => {
  console.log("Tentative de connexion avec URL:", API_URL);
  console.log("Données envoyées:", { email, password: "***" });
  console.log("URL complète:", ${API_URL}/api/users/login);
  try {
    const response = await axios.post(`${API_URL}/api/users/login`, { email, password });
    console.log("Réponse reçue:", response.data);
    const { token, user } = response.data;
    
    // Stocker le token dans le localStorage
    localStorage.setItem('token', token);
    
    // Configurer axios avec le token
    setAuthToken(token);
    
    return user;
  } catch (error) {
    console.error("Erreur de connexion:", error);
    console.error("Détails de l'erreur:", error.response ? error.response.data : "Pas de réponse");
    throw error;
  }
},
  
  logout: () => {
    // Supprimer le token du localStorage
    localStorage.removeItem('token');
    
    // Supprimer le token des en-têtes axios
    setAuthToken(null);
  },
  
  checkAuth: async () => {
    // Vérifier si un token existe dans le localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    try {
      // Configurer axios avec le token
      setAuthToken(token);
      
      // Vérifier si le token est valide
      const response = await axios.get(${API_URL}/api/users/profile);
      return response.data;
    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      
      // Si le token est invalide, déconnecter l'utilisateur
      authService.logout();
      return null;
    }
  }
};

// Service des clients
const clientsService = {
  getClients: async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },
  
  getClient: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  }
};

// Service des tâches
const tasksService = {
  getTasks: async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tâches:', error);
      throw error;
    }
  },
  
  getTask: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la tâche ${id}:`, error);
      throw error;
    }
  }
};

export { authService, clientsService, tasksService, setAuthToken };
