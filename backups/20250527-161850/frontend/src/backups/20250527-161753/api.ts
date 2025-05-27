// frontend/src/services/api.ts
// Service API avec détection automatique multi-environnements

import axios, { AxiosError } from 'axios';
import { store } from '../store/index';

// === Configuration dynamique de l'API ===
const getApiUrl = (): string => {
  // 1. Détection automatique Codespaces
  if (window.location.hostname.includes('app.github.dev')) {
    // Extraire le nom du codespace de l'URL
    const match = window.location.hostname.match(/^(.*?)-3000\.app\.github\.dev$/);
    if (match && match[1]) {
      const backendUrl = `https://${match[1]}-5000.app.github.dev/api`;
      console.log('🌍 Codespaces détecté - Backend URL:', backendUrl);
      return backendUrl;
    }
  }

  // 2. Production (Netlify ou domaine personnalisé)
  if (window.location.hostname.includes('netlify.app') || 
      window.location.hostname.includes('task-manager-steven.netlify.app') ||
      process.env.NODE_ENV === 'production') {
    console.log('🚀 Environnement Production');
    return 'https://task-manager-api-yx13.onrender.com/api';
  }

  // 3. Variable d'environnement explicite
  if (process.env.REACT_APP_API_URL) {
    const envUrl = process.env.REACT_APP_API_URL;
    console.log('📦 URL depuis variable d\'environnement:', envUrl);
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }

  // 4. Développement local par défaut
  console.log('💻 Environnement Local');
  return 'http://localhost:5000/api';
};

const API_URL = getApiUrl();
console.log('📡 API configurée sur:', API_URL);

// === Instance Axios ===
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// === Intercepteur de requête ===
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token || localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log en développement
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error) => {
    console.error('❌ Erreur requête:', error);
    return Promise.reject(error);
  }
);

// === Intercepteur de réponse ===
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    // Log détaillé en développement
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Erreur API:', {
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    // Gestion du token invalide
    if (error.response?.status === 401) {
      const errorData: any = error.response?.data;
      
      // Token invalide ou expiré
      if (errorData?.error === 'invalid signature' || 
          errorData?.message === 'Token invalide' ||
          errorData?.message === 'Token invalide ou expiré') {
        console.log('🔑 Token invalide détecté, déconnexion automatique');
        
        // Nettoyer le stockage
        localStorage.clear();
        sessionStorage.clear();
        
        // Dispatcher l'action de déconnexion
        store.dispatch({ type: 'auth/logout' });
        
        // Rediriger vers login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

// === Interface Timer ===
interface Timer {
  _id: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  clientId?: string | { _id: string; name: string };
  taskId?: string | { _id: string; title: string };
  description?: string;
  billable?: boolean;
}

// === Service d'authentification ===
export const authService = {
  login: async (email: string, password: string) => {
    try {
      console.log('🔐 Tentative de connexion...');
      const response = await api.post('/users/login', { email, password });
      
      // Stocker le token et l'utilisateur
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      console.log('✅ Connexion réussie');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      throw error;
    }
  },

  register: async (name: string, email: string, password: string) => {
    try {
      console.log('📝 Tentative d\'inscription...');
      const response = await api.post('/users/register', { name, email, password });
      
      // Stocker le token et l'utilisateur
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      console.log('✅ Inscription réussie');
      return response.data;
    } catch (error) {
      console.error('❌ Erreur d\'inscription:', error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },

  verifyToken: async () => {
    try {
      const response = await api.get('/users/verify');
      return response.data;
    } catch (error) {
      return { success: false };
    }
  },

  updateProfile: async (profileData: any) => {
    const response = await api.put('/users/profile', profileData);
    if (response.data.user) {
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.clear();
    sessionStorage.clear();
    store.dispatch({ type: 'auth/logout' });
    window.location.href = '/login';
  }
};

// === Service des tâches ===
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
  completeTask: async (id: string) => {
    const response = await api.put(`/tasks/${id}/complete`);
    return response.data;
  },
};

// === Service des clients ===
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
  updateClientLogo: async (id: string, logoPath: string) => {
    const response = await api.put(`/clients/${id}`, { logo: logoPath });
    return response.data;
  },
  deleteClient: async (id: string) => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  },
};

// === Service de gamification ===
export const gamificationService = {
  getProfile: async () => {
    const response = await api.get('/gamification/profile');
    return response.data;
  },
  getLevels: async () => {
    const response = await api.get('/gamification/levels');
    return response.data;
  },
  getActivities: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/gamification/activities?page=${page}&limit=${limit}`);
    return response.data;
  },
  updateStreak: async () => {
    const response = await api.post('/gamification/streak');
    return response.data;
  },
  addActionPoints: async (points: number, type: string, description: string) => {
    const response = await api.post('/gamification/action-points', { points, type, description });
    return response.data;
  }
};

// === Service des badges ===
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

// === Service de chronométrage ===
export const timerService = {
  startTimer: async (timerData: any) => {
    console.log('⏱️ Démarrage du timer avec:', timerData);
    const response = await api.post('/timers', timerData);
    console.log('⏱️ Timer démarré avec succès:', response.data);
    return response.data;
  },

  stopTimer: async (id: string, duration?: number) => {
    console.log(`⏱️ Arrêt du timer ${id}`);
    const response = await api.put(`/timers/stop/${id}`, { duration });
    console.log('⏱️ Timer arrêté avec succès:', response.data);
    return response.data;
  },

  getRunningTimer: async () => {
    const response = await api.get('/timers');
    const runningTimer = response.data.find((timer: any) => !timer.endTime);
    return runningTimer;
  },

  getTimerHistory: async (taskId: string) => {
    const response = await api.get('/timers');
    return response.data.filter((timer: any) => timer.taskId === taskId);
  },

  getAllTimers: async () => {
    const response = await api.get('/timers');
    return response.data;
  },

  getTimerById: async (id: string) => {
    const response = await api.get(`/timers/${id}`);
    return response.data;
  },

  deleteTimer: async (id: string) => {
    const response = await api.delete(`/timers/${id}`);
    return response.data;
  }
};

// === Service d'impact des tâches ===
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

// === Service de rentabilité ===
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

// === Service des objectifs ===
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

// === Services d'upload ===
export const uploadLogo = async (file: File): Promise<{ path: string, filename: string, success: boolean }> => {
  const formData = new FormData();
  formData.append('logo', file);

  try {
    const response = await api.post('/upload/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Upload réussi:', response.data);
    return {
      path: response.data.path,
      filename: response.data.filename,
      success: response.data.success
    };
  } catch (error: any) {
    console.error('❌ Erreur upload:', error.response?.data || error);
    throw error;
  }
};

export const uploadUserAvatar = async (file: File): Promise<{ path: string, filename: string, success: boolean }> => {
  const formData = new FormData();
  formData.append('logo', file);

  try {
    const response = await api.post('/upload/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('✅ Avatar upload réussi:', response.data);
    return {
      path: response.data.path,
      filename: response.data.filename,
      success: response.data.success
    };
  } catch (error: any) {
    console.error('❌ Erreur upload avatar:', error.response?.data || error);
    throw error;
  }
};

export const updateUserAvatar = async (avatarPath: string) => {
  try {
    const response = await api.put('/users/profile', {
      'profile.avatar': avatarPath
    });
    console.log('✅ Avatar utilisateur mis à jour:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Erreur mise à jour avatar:', error.response?.data || error);
    throw error;
  }
};

// === Fonction de vérification au démarrage ===
export const initializeAuth = async (): Promise<boolean> => {
  const token = localStorage.getItem('token');
  if (!token) {
    return false;
  }

  try {
    const result = await authService.verifyToken();
    if (result.success || result.valid) {
      console.log('✅ Token valide, utilisateur connecté');
      return true;
    } else {
      console.log('❌ Token invalide');
      authService.logout();
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur vérification token:', error);
    return false;
  }
};

// === Fonction utilitaire pour obtenir l'URL complète d'une image ===
export const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return '';
  
  // Si c'est déjà une URL complète, la retourner
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Sinon, construire l'URL complète
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
};

export default api;