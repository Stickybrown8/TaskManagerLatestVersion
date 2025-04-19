import axios from 'axios';
import { getAuthHeader } from './authHeader';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Service pour la gestion de la rentabilité des clients
export const profitabilityService = {
  // Récupérer les données de rentabilité pour tous les clients
  getAllProfitability: async () => {
    const response = await axios.get(`${API_URL}/profitability`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer les données de rentabilité pour un client spécifique
  getClientProfitability: async (clientId) => {
    const response = await axios.get(`${API_URL}/profitability/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Mettre à jour le taux horaire d'un client
  updateHourlyRate: async (clientId, hourlyRate) => {
    const response = await axios.put(
      `${API_URL}/profitability/${clientId}/hourly-rate`, 
      { hourlyRate }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Mettre à jour les heures passées pour un client
  updateSpentHours: async (clientId, spentHours, incrementOnly = false) => {
    const response = await axios.put(
      `${API_URL}/profitability/${clientId}/spent-hours`, 
      { spentHours, incrementOnly }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Mettre à jour les heures cibles pour un client
  updateTargetHours: async (clientId, targetHours) => {
    const response = await axios.put(
      `${API_URL}/profitability/${clientId}/target-hours`, 
      { targetHours }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Créer ou mettre à jour les données de rentabilité complètes pour un client
  createOrUpdateProfitability: async (profitabilityData) => {
    const response = await axios.post(
      `${API_URL}/profitability`, 
      profitabilityData, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Récupérer un résumé global de la rentabilité
  getGlobalSummary: async () => {
    const response = await axios.get(`${API_URL}/profitability/summary/global`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Récupérer les tâches avec le temps passé pour un client
  getClientTasks: async (clientId) => {
    const response = await axios.get(`${API_URL}/profitability/tasks/${clientId}`, { headers: getAuthHeader() });
    return response.data;
  }
};
