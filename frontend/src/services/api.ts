import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Créer une instance axios avec la configuration de base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
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
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const tasksService = {
  getTasks: async () => {
    const response = await api.get('/tasks');
    return response.data;
  },
  getTaskById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },
  createTask: async (taskData: any) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },
  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

export const clientsService = {
  getClients: async () => {
    const response = await api.get('/clients');
    return response.data;
  },
  getClientById: async (id: string) => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },
  createClient: async (clientData: any) => {
    const response = await api.post('/clients', clientData);
    return response.data;
  },
  updateClient: async (id: string, clientData: any) => {
    const response = await api.put(`/clients/${id}`, clientData);
    return response.data;
  },
  deleteClient: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};

export const gamificationService = {
  getProfile: async () => {
    const response = await api.get('/gamification/profile');
    return response.data;
  },
  getLevels: async () => {
    const response = await api.get('/gamification/levels');
    return response.data;
  },
  getActivities: async (page: number, limit: number) => {
    const response = await api.get(`/gamification/activities?page=${page}&limit=${limit}`);
    return response.data;
  },
  updateStreak: async () => {
    const response = await api.post('/gamification/streak');
    return response.data;
  },
  // Ajout de méthodes manquantes
  addActionPoints: async (points: number, type: string, description: string) => {
    const response = await api.post('/gamification/action-points', { points, type, description });
    return response.data;
  }
};

export const badgesService = {
  getUserBadges: async () => {
    const response = await api.get('/badges/user');
    return response.data;
  },
  getAllBadges: async () => {
    const response = await api.get('/badges');
    return response.data;
  },
};

// Service Timer complet avec toutes les méthodes nécessaires
export const timerService = {
  startTimer: async (timerData: any) => {
    const response = await api.post('/timer/start', timerData);
    return response.data;
  },
  stopTimer: async (id: string, duration?: number) => {
    const response = await api.post(`/timer/stop/${id}`, { duration });
    return response.data;
  },
  getTimerHistory: async (taskId: string) => {
    const response = await api.get(`/timer/history/${taskId}`);
    return response.data;
  },
  // Méthodes manquantes
  getAllTimers: async () => {
    const response = await api.get('/timer/all');
    return response.data;
  },
  getRunningTimer: async () => {
    const response = await api.get('/timer/running');
    return response.data;
  },
  getTimerById: async (id: string) => {
    const response = await api.get(`/timer/${id}`);
    return response.data;
  },
  pauseTimer: async (id: string) => {
    const response = await api.post(`/timer/pause/${id}`);
    return response.data;
  },
  resumeTimer: async (id: string) => {
    const response = await api.post(`/timer/resume/${id}`);
    return response.data;
  },
  deleteTimer: async (id: string) => {
    const response = await api.delete(`/timer/${id}`);
    return response.data;
  },
  getClientTimers: async (clientId: string) => {
    const response = await api.get(`/timer/client/${clientId}`);
    return response.data;
  },
  getTaskTimers: async (taskId: string) => {
    const response = await api.get(`/timer/task/${taskId}`);
    return response.data;
  }
};

// Ajout des services manquants
export const taskImpactService = {
  getHighImpactTasks: async () => {
    const response = await api.get('/taskImpact/highImpact');
    return response.data;
  },
  updateTaskImpact: async (taskId: string, isHighImpact: boolean, impactScore: number) => {
    const response = await api.put(`/taskImpact/${taskId}`, { isHighImpact, impactScore });
    return response.data;
  },
  analyzeTasksImpact: async () => {
    const response = await api.post('/taskImpact/analyze');
    return response.data;
  },
  applyImpactAnalysis: async (updatedTasks: any[]) => {
    const response = await api.post('/taskImpact/apply', { tasks: updatedTasks });
    return response.data;
  },
};

export const profitabilityService = {
  getAllProfitability: async () => {
    const response = await api.get('/profitability/all');
    return response.data;
  },
  getClientProfitability: async (clientId: string) => {
    const response = await api.get(`/profitability/client/${clientId}`);
    return response.data;
  },
  updateHourlyRate: async (clientId: string, hourlyRate: number) => {
    const response = await api.put(`/profitability/hourlyRate/${clientId}`, { hourlyRate });
    return response.data;
  },
  updateSpentHours: async (clientId: string, spentHours: number, incrementOnly?: boolean) => {
    const response = await api.put(`/profitability/spentHours/${clientId}`, { spentHours, incrementOnly });
    return response.data;
  },
  updateTargetHours: async (clientId: string, targetHours: number) => {
    const response = await api.put(`/profitability/targetHours/${clientId}`, { targetHours });
    return response.data;
  },
  getGlobalProfitabilitySummary: async () => {
    const response = await api.get('/profitability/summary');
    return response.data;
  },
  getClientTasks: async (clientId: string) => {
    const response = await api.get(`/profitability/tasks/${clientId}`);
    return response.data;
  },
};

export const objectivesService = {
  getAll: async () => {
    const response = await api.get('/objectives');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/objectives/${id}`);
    return response.data;
  },
  getByClient: async (clientId: string) => {
    const response = await api.get(`/objectives/client/${clientId}`);
    return response.data;
  },
  getHighImpact: async () => {
    const response = await api.get('/objectives/highImpact');
    return response.data;
  },
  create: async (objectiveData: any) => {
    const response = await api.post('/objectives', objectiveData);
    return response.data;
  },
  update: async (id: string, objectiveData: any) => {
    const response = await api.put(`/objectives/${id}`, objectiveData);
    return response.data;
  },
  updateProgress: async (id: string, currentValue: number) => {
    const response = await api.put(`/objectives/${id}/progress`, { currentValue });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/objectives/${id}`);
    return response.data;
  },
  linkTask: async (objectiveId: string, taskId: string) => {
    const response = await api.post(`/objectives/${objectiveId}/tasks/${taskId}`);
    return response.data;
  },
  unlinkTask: async (objectiveId: string, taskId: string) => {
    const response = await api.delete(`/objectives/${objectiveId}/tasks/${taskId}`);
    return response.data;
  },
};

export default api;
