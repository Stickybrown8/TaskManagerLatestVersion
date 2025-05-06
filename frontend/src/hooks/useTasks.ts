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

/**
 * Hook personnalisé pour gérer les tâches dans l'application
 * @param clientId Optionnel - ID du client pour filtrer les tâches
 * @param forceRefresh Optionnel - Forcer le rechargement des données même si déjà chargées
 */
export const useTasks = (clientId?: string, forceRefresh = false) => {
  // Accéder au dispatch Redux pour déclencher des actions
  const dispatch = useAppDispatch();
  
  // Récupérer l'état des tâches depuis le store Redux
  const { tasks, loading, lastFetched } = useAppSelector(state => state.tasks);
  const reduxError = useAppSelector(state => state.tasks.error);
  
  // État local pour gérer les tâches filtrées par client si nécessaire
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  
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

      console.log("Tentative de connexion à:", API_URL);
      
      const response = await axios.get(`${API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      dispatch(fetchTasksSuccess(response.data));
      return response.data;
    } catch (error: any) {
      console.error('Erreur lors du chargement des tâches:', error);
      
      // Amélioration du logging d'erreurs
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'état
        console.error("Réponse du serveur:", error.response.data);
        console.error("Status:", error.response.status);
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        console.error("Aucune réponse reçue:", error.request);
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        console.error("Erreur de configuration:", error.message);
      }
      
      const errorMessage = error.response?.data?.message || error.message || "Erreur de connexion au serveur";
      dispatch(fetchTasksFailure(errorMessage));
      setLocalError(errorMessage);
      throw error;
    }
  }, [dispatch]);
  
  /**
   * Fonction pour charger les tâches d'un client spécifique
   */
  const loadClientTasks = useCallback(async (id: string) => {
    try {
      dispatch(fetchTasksStart());
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      const response = await axios.get(`${API_URL}/api/tasks/client/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setClientTasks(response.data);
      return response.data;
    } catch (error: any) {
      console.error(`Erreur lors du chargement des tâches du client ${id}:`, error);
      
      // Amélioration du logging d'erreurs
      if (error.response) {
        console.error("Réponse du serveur:", error.response.data);
        console.error("Status:", error.response.status);
      } else if (error.request) {
        console.error("Aucune réponse reçue:", error.request);
      } else {
        console.error("Erreur de configuration:", error.message);
      }
      
      const errorMessage = error.response?.data?.message || error.message || "Erreur de connexion au serveur";
      setLocalError(errorMessage);
      throw error;
    }
  }, [dispatch]);
  
  /**
   * Fonction publique pour rafraîchir les tâches
   * Sera exposée pour permettre aux composants de forcer un rafraîchissement
   */
  const refreshTasks = useCallback(async () => {
    try {
      if (clientId) {
        return await loadClientTasks(clientId);
      } else {
        return await loadAllTasks();
      }
    } catch (error: any) {
      console.error("Erreur lors du rafraîchissement des tâches:", error);
      const errorMessage = error.response?.data?.message || error.message || "Erreur de connexion au serveur";
      setLocalError(errorMessage);
      return null;
    }
  }, [clientId, loadAllTasks, loadClientTasks]);
  
  // Effet qui s'exécute au chargement du composant et quand les dépendances changent
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (clientId) {
          await loadClientTasks(clientId);
        } else {
          await loadAllTasks();
        }
      } catch (error) {
        console.error("Erreur dans useEffect:", error);
      }
    };
    
    // Charger les données immédiatement si forceRefresh ou si les données n'ont jamais été chargées
    if (forceRefresh || !lastFetched) {
      fetchData();
      return;
    }
    
    // Rafraîchissement périodique si nécessaire
    const now = Date.now();
    if (lastFetched && now - lastFetched > REFRESH_INTERVAL) {
      fetchData();
    }
  }, [clientId, forceRefresh, lastFetched, loadAllTasks, loadClientTasks]);
  
  // Retourner les données et fonctions à utiliser dans vos composants
  return {
    tasks: clientId ? clientTasks : tasks,
    loading,
    error: localError || reduxError,
    refreshTasks
  };
};