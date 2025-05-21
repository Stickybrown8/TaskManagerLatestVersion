// === Ce fichier gère toutes les communications avec le serveur backend === /workspaces/TaskManagerLatestVersion/frontend/src/api.js
// Explication simple : Ce fichier est comme un messager qui va chercher et envoyer des informations entre ton application et le serveur qui stocke toutes les données - c'est lui qui s'occupe de connecter les utilisateurs, récupérer les tâches et les clients.
// Explication technique : Module de services API qui encapsule toutes les requêtes HTTP vers le backend via Axios, structuré en objets services distincts par domaine fonctionnel (auth, clients, tasks).
// Utilisé dans : Les actions Redux des slices (authSlice, clientsSlice, tasksSlice), les hooks personnalisés qui récupèrent des données, et potentiellement dans certains composants qui font des appels API directs.
// Connecté à : Backend via Axios, localStorage pour la persistance des tokens, et les reducers Redux qui consomment les données retournées.

import axios from 'axios';

// === Début : Configuration de l'URL de l'API ===
// Explication simple : Ces lignes définissent l'adresse du serveur où l'application va chercher ses informations, comme l'adresse d'un ami à qui tu écris une lettre.
// Explication technique : Déclaration d'une constante qui définit l'URL de base de l'API, utilisant une variable d'environnement avec fallback sur une URL hardcodée, avec logging dans la console pour le débogage.
// URL de base de l'API (votre backend sur Render)
const API_URL = process.env.REACT_APP_API_URL || "https://task-manager-api-yx13.onrender.com";
console.log("API_URL utilisée :", process.env.REACT_APP_API_URL);
// === Fin : Configuration de l'URL de l'API ===

// === Début : Configuration du token d'authentification ===
// Explication simple : Cette fonction est comme un tampon qui met ton nom sur toutes les demandes que tu envoies au serveur, pour qu'il sache que c'est bien toi.
// Explication technique : Fonction utilitaire qui configure les headers d'Axios pour inclure le token d'authentification dans toutes les requêtes futures, ou le supprime en cas de déconnexion.
// Configuration d'axios avec le token d'authentification
const setAuthToken = (token)  => {
  if (token) {
    axios.defaults.headers.common['x-auth-token'] = token;
  } else {
    delete axios.defaults.headers.common['x-auth-token'];
  }
};
// === Fin : Configuration du token d'authentification ===

// === Début : Service d'authentification ===
// Explication simple : Ce bloc contient toutes les fonctions qui permettent de se connecter, de se déconnecter et de vérifier si tu es toujours connecté - comme les clés pour entrer et sortir d'une maison.
// Explication technique : Objet service qui regroupe toutes les fonctions liées à l'authentification, encapsulant les appels API pour la connexion, déconnexion et vérification de l'état d'authentification avec gestion du token JWT.
// Service d'authentification
const authService = {
  // === Début : Fonction de connexion ===
  // Explication simple : Cette fonction envoie ton nom d'utilisateur et ton mot de passe au serveur, et si c'est correct, il te donne un badge spécial pour accéder à l'application.
  // Explication technique : Méthode asynchrone qui envoie les identifiants via une requête POST, gère la réponse en stockant le token JWT dans localStorage, configure Axios et retourne les données utilisateur.
  login: async (email, password) => {
  console.log("Tentative de connexion avec URL:", API_URL);
  console.log("Données envoyées:", { email, password: "***" });
  console.log("URL complète:", `${API_URL}/api/users/login`);
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
  // === Fin : Fonction de connexion ===
  
  // === Début : Fonction de déconnexion ===
  // Explication simple : Cette fonction jette ton badge spécial quand tu veux quitter l'application, comme quand tu ranges ta carte de bibliothèque quand tu as fini d'emprunter des livres.
  // Explication technique : Méthode qui nettoie l'état d'authentification en supprimant le token JWT du localStorage et des headers Axios, effectuant une déconnexion côté client.
  logout: () => {
    // Supprimer le token du localStorage
    localStorage.removeItem('token');
    
    // Supprimer le token des en-têtes axios
    setAuthToken(null);
  },
  // === Fin : Fonction de déconnexion ===
  
  // === Début : Fonction de vérification d'authentification ===
  // Explication simple : Cette fonction vérifie si ton badge spécial est encore valide, comme quand tu vérifies si ta carte de bus fonctionne toujours avant de monter dans le bus.
  // Explication technique : Méthode asynchrone qui vérifie la validité du token stocké dans localStorage en effectuant une requête au serveur, avec gestion automatique de la déconnexion en cas d'échec.
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
      const response = await axios.get(`${API_URL}/api/users/profile`);
      return response.data;
    } catch (error) {
      console.error('Erreur de vérification d\'authentification:', error);
      
      // Si le token est invalide, déconnecter l'utilisateur
      authService.logout();
      return null;
    }
  }
  // === Fin : Fonction de vérification d'authentification ===
};
// === Fin : Service d'authentification ===

// === Début : Service des clients ===
// Explication simple : Ce bloc contient les fonctions qui permettent de récupérer les informations sur les clients, comme si tu avais un carnet d'adresses où tu peux chercher les coordonnées de tes amis.
// Explication technique : Objet service qui encapsule les appels API relatifs à la gestion des clients, incluant les méthodes pour récupérer la liste des clients ou un client spécifique.
// Service des clients
const clientsService = {
  // === Début : Fonction pour récupérer tous les clients ===
  // Explication simple : Cette fonction va chercher la liste de tous les clients, comme quand tu demandes à la maîtresse la liste de tous les élèves de ta classe.
  // Explication technique : Méthode asynchrone qui effectue une requête GET pour récupérer l'ensemble des clients, avec gestion des erreurs et journalisation.
  getClients: async () => {
    try {
      const response = await axios.get(`${API_URL}/clients`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des clients:', error);
      throw error;
    }
  },
  // === Fin : Fonction pour récupérer tous les clients ===
  
  // === Début : Fonction pour récupérer un client spécifique ===
  // Explication simple : Cette fonction va chercher les informations d'un seul client en particulier, comme quand tu cherches la fiche d'un seul copain dans ton carnet d'adresses.
  // Explication technique : Méthode asynchrone qui effectue une requête GET avec un ID spécifique pour récupérer les données d'un client unique, incluant la gestion et propagation des erreurs.
  getClient: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/clients/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération du client ${id}:`, error);
      throw error;
    }
  }
  // === Fin : Fonction pour récupérer un client spécifique ===
};
// === Fin : Service des clients ===

// === Début : Service des tâches ===
// Explication simple : Ce bloc contient les fonctions qui permettent de récupérer toutes les tâches à faire, comme un grand cahier de devoirs où sont notées toutes les choses à faire.
// Explication technique : Objet service qui encapsule les appels API relatifs à la gestion des tâches, avec des méthodes pour récupérer l'ensemble des tâches ou une tâche spécifique.
// Service des tâches
const tasksService = {
  // === Début : Fonction pour récupérer toutes les tâches ===
  // Explication simple : Cette fonction va chercher la liste de toutes les tâches à faire, comme quand tu regardes ton agenda pour voir tous tes devoirs de la semaine.
  // Explication technique : Méthode asynchrone qui effectue une requête GET pour récupérer l'ensemble des tâches, avec gestion des erreurs et journalisation.
  getTasks: async () => {
    try {
      const response = await axios.get(`${API_URL}/tasks`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tâches:', error);
      throw error;
    }
  },
  // === Fin : Fonction pour récupérer toutes les tâches ===
  
  // === Début : Fonction pour récupérer une tâche spécifique ===
  // Explication simple : Cette fonction va chercher les détails d'une seule tâche en particulier, comme quand tu veux savoir les détails d'un devoir précis.
  // Explication technique : Méthode asynchrone qui effectue une requête GET avec un ID spécifique pour récupérer les données d'une tâche unique, incluant la gestion et propagation des erreurs.
  getTask: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la tâche ${id}:`, error);
      throw error;
    }
  }
  // === Fin : Fonction pour récupérer une tâche spécifique ===
};
// === Fin : Service des tâches ===

// === Début : Exportation des services ===
// Explication simple : Cette ligne permet à d'autres parties de l'application d'utiliser les fonctions définies ici, comme quand tu prêtes tes jouets à tes amis.
// Explication technique : Instruction d'exportation ES6 nommée qui rend disponibles les services et l'utilitaire d'authentification pour l'importation dans d'autres modules de l'application.
export { authService, clientsService, tasksService, setAuthToken };
// === Fin : Exportation des services ===
