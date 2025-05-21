import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

console.log("API_URL utilisée :", process.env.REACT_APP_API_URL);

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

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

export default api;
