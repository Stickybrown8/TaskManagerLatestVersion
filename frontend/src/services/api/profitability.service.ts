import axios from 'axios';

const getApiUrl = () => {
  if (window.location.hostname === 'localhost') return 'http://localhost:5000';
  if (window.location.hostname.includes('github.dev')) {
    return window.location.origin.replace('-3000.', '-5000.');
  }
  return process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
};

const API_URL = getApiUrl();

// Créer une instance axios configurée
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const profitabilityService = {
  async getClientProfitability(clientId: string): Promise<any> {
    try {
      const response = await api.get(`/profitability/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching client profitability:', error);
      throw error;
    }
  },

  async updateClientProfitability(clientId: string, data: any): Promise<any> {
    try {
      const response = await api.put(`/profitability/client/${clientId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating client profitability:', error);
      throw error;
    }
  }
};