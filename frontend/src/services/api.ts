// === Ce fichier gère toutes les communications entre l'application et le serveur API === /workspaces/TaskManagerLatestVersion/frontend/src/services/api.ts
// Explication simple : C'est comme un messager qui sait comment parler au serveur - il envoie tes demandes et rapporte les réponses, en s'assurant que tu es bien identifié à chaque fois.
// Explication technique : Module de service qui configure Axios pour les requêtes HTTP, implémente l'authentification par token, et organise les appels API en services spécifiques par domaine fonctionnel.
// Utilisé dans : Tous les composants et pages qui ont besoin de communiquer avec le backend, notamment pour charger/manipuler les tâches, clients, utilisateurs, etc.
// Connecté à : Store Redux (pour l'authentification), backend API via Axios, localStorage pour stocker le token, et tous les composants qui font des appels API.

import axios from 'axios';
import { store } from '../store/index';
import { logout } from '../store/slices/authSlice';

// === Début : Configuration de la connexion API ===
// Explication simple : On indique à l'application où se trouve le serveur avec lequel elle doit parler.
// Explication technique : Initialisation de l'URL de base de l'API à partir des variables d'environnement avec journalisation pour faciliter le débogage.
console.log("API_URL utilisée :", process.env.REACT_APP_API_URL);

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});
// === Fin : Configuration de la connexion API ===

// === Début : Intercepteur d'authentification pour les requêtes ===
// Explication simple : C'est comme ajouter automatiquement ton badge d'accès à chaque message que tu envoies au serveur.
// Explication technique : Intercepteur Axios qui capture toutes les requêtes sortantes pour y injecter le token d'authentification JWT stocké dans le store Redux.
// Intercepteur pour ajouter le token d'authentification à chaque requête
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// === Fin : Intercepteur d'authentification pour les requêtes ===

// === Début : Intercepteur de gestion des erreurs pour les réponses ===
// Explication simple : C'est comme un vigile qui vérifie si le serveur ne t'a pas refusé l'entrée, et qui te renvoie à la page de connexion si ton badge n'est plus valide.
// Explication technique : Intercepteur qui traite les réponses d'erreur, particulièrement les erreurs 401 (Unauthorized) pour déconnecter l'utilisateur et rediriger vers la page de connexion.
// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Journalisation détaillée des erreurs
    console.error("Erreur API détaillée:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response && error.response.status === 401) {
      // Gérer la déconnexion
      store.dispatch({ type: 'auth/logout' });
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
// === Fin : Intercepteur de gestion des erreurs pour les réponses ===

// === Début : Définition de l'interface pour les chronométrages ===
// Explication simple : C'est comme un plan qui décrit à quoi ressemble un chronométrage, avec son heure de début, de fin, et à quoi il est lié.
// Explication technique : Interface TypeScript qui définit la structure des objets Timer, spécifiant les types de toutes les propriétés pour assurer la cohérence des données.
// Ajoutez ceci en haut du fichier api.ts
interface Timer {
  _id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  clientId?: string | {_id: string; name: string};
  taskId?: string | {_id: string; title: string};
  description?: string;
  billable?: boolean;
}
// === Fin : Définition de l'interface pour les chronométrages ===

// === Début : Service d'authentification ===
// Explication simple : Ce groupe de fonctions s'occupe de t'aider à te connecter, à créer un compte ou à vérifier qui tu es.
// Explication technique : Objet qui encapsule les fonctions liées à l'authentification utilisateur, incluant login, register et récupération du profil utilisateur courant.
// Services pour les différentes entités
export const authService = {
  login: async (email: string, password: string) => {
    try {
      console.log("Tentative de connexion avec:", { email, password: '***' });
      const response = await api.post('/api/users/login', { email, password });
      console.log("Réponse de connexion:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      throw error;
    }
  },
  register: async (name: string, email: string, password: string) => {
    try {
      console.log("Tentative d'inscription avec:", { name, email, password: '***' });
      const response = await api.post('/api/users/register', { name, email, password });
      console.log("Réponse d'inscription:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      throw error;
    }
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/users/profile');
    return response.data;
  },
};
// === Fin : Service d'authentification ===

// === Début : Service de gestion des tâches ===
// Explication simple : Ce groupe de fonctions te permet de voir toutes tes tâches, d'en créer de nouvelles, de les modifier ou de les supprimer.
// Explication technique : Service qui fournit les opérations CRUD (Create, Read, Update, Delete) pour l'entité Task, avec des méthodes encapsulant les appels API correspondants.
export const tasksService = {
  getTasks: async () => {
    const response = await api.get('/api/tasks');
    return response.data;
  },
  getTaskById: async (id: string) => {
    const response = await api.get(`/api/tasks/${id}`);
    return response.data;
  },
  createTask: async (taskData: any) => {
    const response = await api.post('/api/tasks', taskData);
    return response.data;
  },
  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/api/tasks/${id}`, taskData);
    return response.data;
  },
  deleteTask: async (id: string) => {
    const response = await api.delete(`/api/tasks/${id}`);
    return response.data;
  },
};
// === Fin : Service de gestion des tâches ===

// === Début : Service de gestion des clients ===
// Explication simple : Ces fonctions te permettent de gérer la liste des clients pour qui tu travailles - les voir, en ajouter, modifier leurs infos ou les supprimer.
// Explication technique : Service qui encapsule les opérations CRUD pour l'entité Client, structuré de manière similaire au service des tâches pour une cohérence d'architecture.
export const clientsService = {
  getClients: async () => {
    const response = await api.get('/api/clients');
    return response.data;
  },
  getClientById: async (id: string) => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },
  createClient: async (clientData: any) => {
    const response = await api.post('/api/clients', clientData);
    return response.data;
  },
  updateClient: async (id: string, clientData: any) => {
    const response = await api.put(`/api/clients/${id}`, clientData);
    return response.data;
  },
  deleteClient: async (id: string) => {
    const response = await api.delete(`/api/clients/${id}`);
    return response.data;
  },
};
// === Fin : Service de gestion des clients ===

// === Début : Service de gamification ===
// Explication simple : Ces fonctions gèrent ton profil de joueur, tes points, niveaux et récompenses quand tu accomplis des choses dans l'application.
// Explication technique : Service qui encapsule les fonctionnalités liées à la gamification, incluant la récupération de profil, la gestion des niveaux et des streaks d'activité.
// Ajout des services manquants
export const gamificationService = {
  getProfile: async () => {
    const response = await api.get('/api/gamification/profile');
    return response.data;
  },
  getLevels: async () => {
    const response = await api.get('/api/gamification/levels');
    return response.data;
  },
  getActivities: async (page: number, limit: number) => {
    const response = await api.get(`/api/gamification/activities?page=${page}&limit=${limit}`);
    return response.data;
  },
  updateStreak: async () => {
    const response = await api.post('/api/gamification/streak');
    return response.data;
  },
  addActionPoints: async (points: number, type: string, description: string) => {
    const response = await api.post('/api/gamification/action-points', { points, type, description });
    return response.data;
  }
};
// === Fin : Service de gamification ===

// === Début : Service de gestion des badges ===
// Explication simple : Ces fonctions s'occupent de vérifier quels badges tu as déjà gagnés et lesquels tu peux encore obtenir.
// Explication technique : Service qui gère la récupération des badges utilisateur et tous les badges disponibles dans le système de gamification.
export const badgesService = {
  getUserBadges: async () => {
    const response = await api.get('/api/badges/user');
    return response.data;
  },
  getAllBadges: async () => {
    const response = await api.get('/api/badges');
    return response.data;
  },
};
// === Fin : Service de gestion des badges ===

// === Début : Service de chronométrage du temps ===
// Explication simple : Ces fonctions permettent de démarrer un chronomètre quand tu commences à travailler sur une tâche et de l'arrêter quand tu as fini.
// Explication technique : Service qui encapsule la logique de gestion des timers (démarrage, arrêt, récupération), avec une gestion particulière pour s'assurer de l'authentification.
export const timerService = {
  startTimer: async (timerData: any) => {
    console.log("⏱️ Démarrage du timer avec:", timerData);
    try {
      // Obtenir le token d'authentification depuis localStorage directement
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Faire la requête avec le token explicite
      const response = await axios({
        method: 'post',
        url: `${process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com'}/api/timers`,
        data: timerData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("⏱️ Timer démarré avec succès:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("⏱️ Erreur complète lors du démarrage du timer:", error);
      throw error;
    }
  },
  
  stopTimer: async (id: string, duration?: number) => {
    console.log(`⏱️ Arrêt du timer ${id} avec duration:`, duration);
    try {
      // Utiliser la route correcte définie dans le backend
      const response = await api.put(`/api/timers/stop/${id}`, { duration });
      console.log("⏱️ Timer arrêté avec succès:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("⏱️ Erreur lors de l'arrêt:", error.response?.data || error);
      throw error;
    }
  },
  
  getRunningTimer: async () => {
    try {
      console.log("⏱️ Recherche du timer en cours");
      const response = await api.get('/api/timers');
      const runningTimer = response.data.find((timer: any) => !timer.endTime);
      console.log("⏱️ Timer en cours trouvé:", runningTimer || "Aucun");
      return runningTimer;
    } catch (error: any) {
      console.error("⏱️ Erreur lors de la recherche:", error.response?.data || error);
      throw error;
    }
  },
  
  getTimerHistory: async (taskId: string) => {
    try {
      console.log("⏱️ Récupération de l'historique pour la tâche:", taskId);
      const response = await api.get('/api/timers');
      const timers = response.data.filter((timer: any) => timer.taskId === taskId);
      console.log(`⏱️ ${timers.length} timers trouvés pour cette tâche`);
      return timers;
    } catch (error: any) {
      console.error("⏱️ Erreur lors de la récupération:", error.response?.data || error);
      throw error;
    }
  },
  getAllTimers: async () => {
    try {
      console.log("⏱️ Récupération de tous les timers");
      const response = await api.get('/api/timers'); // Corriger pour utiliser le pluriel
      console.log(`⏱️ ${response.data.length} timers récupérés`);
      return response.data;
    } catch (error: any) {
      console.error("⏱️ Erreur lors de la récupération:", error.response?.data || error);
      throw error;
    }
  },
  getTimerById: async (id: string) => {
    const response = await api.get(`/api/timers/${id}`);
    return response.data;
  },
  deleteTimer: async (id: string) => {
    const response = await api.delete(`/api/timers/${id}`);
    return response.data;
  }
};
// === Fin : Service de chronométrage du temps ===

// === Début : Service d'analyse d'impact des tâches ===
// Explication simple : Ces fonctions t'aident à identifier les tâches les plus importantes qui vont apporter les meilleurs résultats.
// Explication technique : Service qui gère les fonctionnalités liées à l'analyse d'impact des tâches, basé sur le principe de Pareto/80-20, permettant d'identifier et de prioriser les tâches à fort impact.
export const taskImpactService = {
  getHighImpactTasks: async () => {
    const response = await api.get('/api/taskImpact/highImpact');
    return response.data;
  },
  updateTaskImpact: async (taskId: string, isHighImpact: boolean, impactScore: number) => {
    const response = await api.put(`/api/taskImpact/${taskId}`, { isHighImpact, impactScore });
    return response.data;
  },
  analyzeTasksImpact: async () => {
    const response = await api.post('/api/taskImpact/analyze');
    return response.data;
  },
  applyImpactAnalysis: async (updatedTasks: any[]) => {
    const response = await api.post('/api/taskImpact/apply', { tasks: updatedTasks });
    return response.data;
  },
};
// === Fin : Service d'analyse d'impact des tâches ===

// === Début : Service de rentabilité ===
// Explication simple : Ces fonctions t'aident à savoir si tu gagnes de l'argent avec tes clients, en suivant ton temps et tes tarifs.
// Explication technique : Service qui encapsule la logique de calcul et de suivi de la rentabilité par client, incluant les tarifs horaires, les heures passées et les métriques de performance.
export const profitabilityService = {
  getAllProfitability: async () => {
    const response = await api.get('/api/profitability/all');
    return response.data;
  },
  getClientProfitability: async (clientId: string) => {
    const response = await api.get(`/api/profitability/client/${clientId}`);
    return response.data;
  },
  updateHourlyRate: async (clientId: string, hourlyRate: number) => {
    const response = await api.put(`/api/profitability/hourlyRate/${clientId}`, { hourlyRate });
    return response.data;
  },
  updateSpentHours: async (clientId: string, spentHours: number, incrementOnly?: boolean) => {
    const response = await api.put(`/api/profitability/spentHours/${clientId}`, { spentHours, incrementOnly });
    return response.data;
  },
  updateTargetHours: async (clientId: string, targetHours: number) => {
    const response = await api.put(`/api/profitability/targetHours/${clientId}`, { targetHours });
    return response.data;
  },
  getGlobalProfitabilitySummary: async () => {
    const response = await api.get('/api/profitability/summary');
    return response.data;
  },
  getClientTasks: async (clientId: string) => {
    const response = await api.get(`/api/profitability/tasks/${clientId}`);
    return response.data;
  },
};
// === Fin : Service de rentabilité ===

// === Début : Service d'objectifs ===
// Explication simple : Ces fonctions te permettent de créer et suivre des objectifs pour tes clients, comme "augmenter les ventes de 10%" ou "réduire les coûts de 5%".
// Explication technique : Service qui gère le cycle de vie complet des objectifs clients, incluant la création, le suivi de progression, et les associations avec les tâches correspondantes.
export const objectivesService = {
  getAll: async () => {
    const response = await api.get('/api/objectives');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/api/objectives/${id}`);
    return response.data;
  },
  getByClient: async (clientId: string) => {
    const response = await api.get(`/api/objectives/client/${clientId}`);
    return response.data;
  },
  getHighImpact: async () => {
    const response = await api.get('/api/objectives/highImpact');
    return response.data;
  },
  create: async (objectiveData: any) => {
    const response = await api.post('/api/objectives', objectiveData);
    return response.data;
  },
  update: async (id: string, objectiveData: any) => {
    const response = await api.put(`/api/objectives/${id}`, objectiveData);
    return response.data;
  },
  updateProgress: async (id: string, currentValue: number) => {
    const response = await api.put(`/api/objectives/${id}/progress`, { currentValue });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/api/objectives/${id}`);
    return response.data;
  },
  linkTask: async (objectiveId: string, taskId: string) => {
    const response = await api.post(`/api/objectives/${objectiveId}/tasks/${taskId}`);
    return response.data;
  },
  unlinkTask: async (objectiveId: string, taskId: string) => {
    const response = await api.delete(`/api/objectives/${objectiveId}/tasks/${taskId}`);
    return response.data;
  },
};
// === Fin : Service d'objectifs ===

// === Début : Exportation de l'instance API ===
// Explication simple : C'est comme dire "voici l'adresse complète du messager" pour que d'autres parties de l'application puissent aussi lui parler directement.
// Explication technique : Exportation par défaut de l'instance Axios configurée, permettant son utilisation directe dans d'autres modules si nécessaire, en complément des services spécifiques.
export default api;
// === Fin : Exportation de l'instance API ===
