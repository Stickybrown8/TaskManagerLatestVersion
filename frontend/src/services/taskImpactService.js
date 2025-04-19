import axios from 'axios';
import { getAuthHeader } from './authHeader';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Service pour la gestion des tâches à fort impact (principe 80/20)
export const taskImpactService = {
  // Récupérer toutes les tâches à fort impact
  getHighImpactTasks: async () => {
    const response = await axios.get(`${API_URL}/tasks/high-impact`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Mettre à jour le statut d'impact d'une tâche
  updateTaskImpact: async (taskId, isHighImpact, impactScore) => {
    const response = await axios.put(
      `${API_URL}/tasks/${taskId}/impact`, 
      { isHighImpact, impactScore }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  },
  
  // Analyser les tâches pour identifier celles à fort impact
  analyzeTasksImpact: async () => {
    const response = await axios.get(`${API_URL}/tasks/impact-analysis`, { headers: getAuthHeader() });
    return response.data;
  },
  
  // Appliquer les recommandations d'analyse d'impact
  applyImpactAnalysis: async (taskUpdates) => {
    const response = await axios.post(
      `${API_URL}/tasks/apply-impact-analysis`, 
      { taskUpdates }, 
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};
