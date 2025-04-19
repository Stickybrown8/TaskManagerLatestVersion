import axios from 'axios';
import { getAuthHeader } from './authHeader';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Service pour les objectifs clients
export const objectivesService = {
  // Récupérer tous les objectifs
  getAll: async () => {
    const response = await axios.get(`${API_URL}/objectives`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer un objectif par son ID
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/objectives/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer les objectifs d'un client spécifique
  getByClient: async (clientId) => {
    const response = await axios.get(`${API_URL}/objectives/client/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer les objectifs à fort impact (80/20)
  getHighImpact: async () => {
    const response = await axios.get(`${API_URL}/objectives/high-impact`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Créer un nouvel objectif
  create: async (objectiveData) => {
    const response = await axios.post(`${API_URL}/objectives`, objectiveData, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Mettre à jour un objectif
  update: async (id, objectiveData) => {
    const response = await axios.put(`${API_URL}/objectives/${id}`, objectiveData, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Mettre à jour la progression d'un objectif
  updateProgress: async (id, currentValue) => {
    const response = await axios.put(`${API_URL}/objectives/${id}/progress`, { currentValue }, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Supprimer un objectif
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/objectives/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Lier une tâche à un objectif
  linkTask: async (objectiveId, taskId) => {
    const response = await axios.post(`${API_URL}/objectives/${objectiveId}/link-task/${taskId}`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Délier une tâche d'un objectif
  unlinkTask: async (objectiveId, taskId) => {
    const response = await axios.delete(`${API_URL}/objectives/${objectiveId}/unlink-task/${taskId}`, { headers: getAuthHeader() });
    return response.data;
  }
};
