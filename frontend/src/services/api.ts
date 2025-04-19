import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

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

export const timerService = {
  startTimer: async (timerData: any) => {
    const response = await api.post('/api/timer/start', timerData);
    return response.data;
  },
  stopTimer: async (id: string, duration?: number) => {
    const response = await api.post(`/api/timer/stop/${id}`, { duration });
    return response.data;
  },
  getTimerHistory: async (taskId: string) => {
    const response = await api.get(`/api/timer/history/${taskId}`);
    return response.data;
  },
  getAllTimers: async () => {
    const response = await api.get('/api/timer/all');
    return response.data;
  },
  getRunningTimer: async () => {
    const response = await api.get('/api/timer/running');
    return response.data;
  },
  getTimerById: async (id: string) => {
    const response = await api.get(`/api/timer/${id}`);
    return response.data;
  },
  pauseTimer: async (id: string) => {
    const response = await api.post(`/api/timer/pause/${id}`);
    return response.data;
  },
  resumeTimer: async (id: string) => {
    const response = await api.post(`/api/timer/resume/${id}`);
    return response.data;
  },
  deleteTimer: async (id: string) => {
    const response = await api.delete(`/api/timer/${id}`);
    return response.data;
  },
};

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

export default api;
