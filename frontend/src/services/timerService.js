import axios from 'axios';
import { getAuthHeader } from './authHeader';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Service pour la gestion des chronomètres
export const timerService = {
  // Récupérer tous les chronomètres
  getAllTimers: async () => {
    const response = await axios.get(`${API_URL}/timers`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer le chronomètre en cours d'exécution
  getRunningTimer: async () => {
    const response = await axios.get(`${API_URL}/timers/running`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer un chronomètre par son ID
  getTimerById: async (id) => {
    const response = await axios.get(`${API_URL}/timers/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Démarrer un nouveau chronomètre
  startTimer: async (timerData) => {
    const response = await axios.post(`${API_URL}/timers`, timerData, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Mettre en pause un chronomètre
  pauseTimer: async (id) => {
    const response = await axios.put(`${API_URL}/timers/${id}/pause`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Reprendre un chronomètre en pause
  resumeTimer: async (id) => {
    const response = await axios.put(`${API_URL}/timers/${id}/resume`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Arrêter un chronomètre
  stopTimer: async (id) => {
    const response = await axios.put(`${API_URL}/timers/${id}/stop`, {}, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Supprimer un chronomètre
  deleteTimer: async (id) => {
    const response = await axios.delete(`${API_URL}/timers/${id}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer les chronomètres d'un client spécifique
  getClientTimers: async (clientId) => {
    const response = await axios.get(`${API_URL}/timers/client/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer les chronomètres d'une tâche spécifique
  getTaskTimers: async (taskId) => {
    const response = await axios.get(`${API_URL}/timers/task/${taskId}`, { headers: getAuthHeader() });
    return response.data;
  }
};
