import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  fetchTasksStart, 
  fetchTasksSuccess, 
  fetchTasksFailure 
} from '../store/slices/tasksSlice';

// Configuration de l'URL de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const fetchWithRetry = async <T>(
  fetcher: () => Promise<T>, 
  retryCount = 0, 
  maxRetries = 3
): Promise<T> => {
  try {
    return await fetcher();
  } catch (error) {
    if (retryCount < maxRetries) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s...
      console.log(`Retry ${retryCount + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fetcher, retryCount + 1, maxRetries);
    }
    throw error;
  }
};

/**
 * Hook personnalisé pour gérer les tâches dans l'application
 * @param clientId Optionnel - ID du client pour filtrer les tâches
 * @param forceRefresh Optionnel - Forcer le rechargement des données même si déjà chargées
 */
export const useTasks = (clientId?: string, forceRefresh = false) => {
  // Accéder au dispatch Redux pour déclencher des actions
  const dispatch = useAppDispatch();
  
  // Récupérer l'état des tâches depuis le store Redux
  const { tasks, loading, error, lastFetched } = useAppSelector(state => state.tasks);
  
  // État local pour gérer les tâches filtrées par client si nécessaire
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  
  /**
   * Fonction pour charger toutes les tâches
   */
  const loadAllTasks = useCallback(async () => {
    try {
      dispatch(fetchTasksStart());
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      const response = await fetchWithRetry(() => axios.get(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }));
      
      dispatch(fetchTasksSuccess(response.data));
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du chargement des tâches:', error);
      dispatch(fetchTasksFailure(error.message));
      throw error;
    }
  }, [dispatch]);
  
  /**
   * Fonction pour charger les tâches d'un client spécifique
   */
  const loadClientTasks = async (id: string) => {
    try {
      dispatch(fetchTasksStart());
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      const response = await fetchWithRetry(() => axios.get(`${API_URL}/api/tasks/client/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }));
      
      setClientTasks(response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Erreur lors du chargement des tâches du client ${id}:`, error);
      throw error;
    }
  };
  
  /**
   * Fonction publique pour rafraîchir les tâches
   * Sera exposée pour permettre aux composants de forcer un rafraîchissement
   */
  const refreshTasks = async () => {
    if (clientId) {
      return loadClientTasks(clientId);
    } else {
      return loadAllTasks();
    }
  };
  
  // Effet qui s'exécute au chargement du composant et quand les dépendances changent
  useEffect(() => {
    // Chargement initial uniquement
    if (clientId) {
      loadClientTasks(clientId);
    } else {
      loadAllTasks();
    }
    // Supprimer la vérification de lastFetched dans cet effet
  }, [clientId, loadAllTasks, loadClientTasks]);

  // Utiliser un effet séparé pour le rafraîchissement périodique
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (clientId) {
        loadClientTasks(clientId);
      } else {
        loadAllTasks();
      }
    }, REFRESH_INTERVAL);
    
    return () => clearInterval(intervalId);
  }, [clientId, loadAllTasks, loadClientTasks]);
  
  // Retourner les données et fonctions à utiliser dans vos composants
  return {
    tasks: clientId ? clientTasks : tasks,
    loading,
    error,
    refreshTasks
  };
};