/*
 * GESTIONNAIRE DE TÂCHES - frontend/src/hooks/useTasks.ts
 *
 * Explication simple:
 * Ce fichier crée un assistant qui s'occupe de toutes les tâches dans l'application.
 * Il permet de récupérer les tâches depuis le serveur, de les afficher, de les filtrer 
 * par client, et de les rafraîchir automatiquement. Si le serveur est temporairement 
 * indisponible, il essaie plusieurs fois de se reconnecter, comme quand tu réessaies 
 * d'appeler quelqu'un qui ne répond pas tout de suite.
 *
 * Explication technique:
 * Hook personnalisé React qui encapsule toute la logique de gestion des tâches dans l'application,
 * incluant la récupération depuis l'API, le stockage dans Redux, la gestion des erreurs avec
 * mécanisme de retry, et le rafraîchissement périodique des données. Il implémente également
 * un filtrage par client.
 *
 * Où ce fichier est utilisé:
 * Importé dans les composants qui affichent ou manipulent des tâches, comme la page de 
 * liste des tâches, le tableau de bord, ou la page de détail d'un client.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les actions et le store du slice '../store/slices/tasksSlice'
 * - Communique avec l'API backend via axios pour récupérer les données des tâches
 * - S'intègre avec les hooks personnalisés useAppDispatch et useAppSelector
 * - Utilisé par différents composants d'interface pour afficher les tâches
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre gestionnaire de tâches, comme quand tu rassembles tes crayons et ton cahier avant de faire tes devoirs.
// Explication technique : Importation des hooks React pour la gestion d'état et du cycle de vie, de la bibliothèque axios pour les requêtes HTTP, et des outils Redux personnalisés pour interagir avec le store global.
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from '../hooks';
import { 
  fetchTasksStart, 
  fetchTasksSuccess, 
  fetchTasksFailure 
} from '../store/slices/tasksSlice';
// === Fin : Importation des dépendances ===

// === Début : Configuration des constantes ===
// Explication simple : On prépare les informations importantes dont on aura besoin, comme l'adresse du serveur et combien de temps attendre avant de rafraîchir les tâches.
// Explication technique : Définition des constantes pour l'URL de l'API avec fallback et l'intervalle de rafraîchissement périodique des données en millisecondes.
// Configuration de l'URL de l'API
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
// === Fin : Configuration des constantes ===

// === Début : Fonction de récupération avec mécanisme de retry ===
// Explication simple : Cette fonction essaie de parler au serveur, et si ça ne marche pas du premier coup, elle réessaye plusieurs fois en attendant un peu plus longtemps entre chaque essai. C'est comme quand tu essaies d'appeler quelqu'un qui ne répond pas, puis tu réessaies un peu plus tard.
// Explication technique : Fonction utilitaire générique qui implémente un mécanisme de retry avec backoff exponentiel et jitter pour les requêtes HTTP, en analysant le type d'erreur pour déterminer si une nouvelle tentative est pertinente.
// Améliorer la fonction fetchWithRetry existante
const fetchWithRetry = async <T>(
  fetcher: () => Promise<T>, 
  retryCount = 0, 
  maxRetries = 3,
  retryDelay = 1000
): Promise<T> => {
  try {
    return await fetcher();
  } catch (error: any) {
    // Déterminer si l'erreur est récupérable
    const isRecoverable = 
      (axios.isAxiosError(error) && 
       error.response?.status !== undefined && 
       error.response.status >= 500) || // Erreurs serveur
      error.message.includes('network') || // Erreurs réseau 
      error.message.includes('timeout') || // Timeouts
      error.message.includes('ECONNREFUSED'); // Refus de connexion

    // Si c'est une erreur non récupérable ou si on a dépassé le nombre max de tentatives
    if (!isRecoverable || retryCount >= maxRetries) {
      throw error;
    }

    // Délai exponentiel avec jitter pour éviter les tempêtes de requêtes
    const delay = retryDelay * Math.pow(2, retryCount) * (0.9 + Math.random() * 0.2);
    console.log(`Tentative ${retryCount + 1}/${maxRetries} dans ${Math.round(delay)}ms...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fetcher, retryCount + 1, maxRetries, retryDelay);
  }
};
// === Fin : Fonction de récupération avec mécanisme de retry ===

// === Début : Définition du hook principal useTasks ===
// Explication simple : C'est notre grand assistant qui va nous aider à gérer toutes les tâches. Tu lui dis quel client t'intéresse, et il s'occupe d'aller chercher toutes les informations et de les garder à jour.
// Explication technique : Hook personnalisé principal qui expose les fonctionnalités de gestion des tâches, avec paramètres optionnels pour le filtrage par client et le forçage du rafraîchissement des données.
/**
 * Hook personnalisé pour gérer les tâches dans l'application
 * @param clientId Optionnel - ID du client pour filtrer les tâches
 * @param forceRefresh Optionnel - Forcer le rechargement des données même si déjà chargées
 */
export const useTasks = (clientId?: string, forceRefresh = false) => {
  // === Début : Initialisation des hooks et états ===
  // Explication simple : On prépare tous les outils dont notre assistant a besoin pour travailler, comme une boîte à outils avec différents compartiments.
  // Explication technique : Configuration du dispatcher Redux pour les actions, récupération de l'état des tâches depuis le store, et initialisation d'un état local pour les tâches filtrées par client.
  // Accéder au dispatch Redux pour déclencher des actions
  const dispatch = useAppDispatch();
  
  // Récupérer l'état des tâches depuis le store Redux
  const { tasks, loading, error, lastFetched } = useAppSelector(state => state.tasks);
  
  // État local pour gérer les tâches filtrées par client si nécessaire
  const [clientTasks, setClientTasks] = useState<any[]>([]);
  // === Fin : Initialisation des hooks et états ===
  
  // === Début : Fonction de chargement de toutes les tâches ===
  // Explication simple : Cette fonction va chercher toutes les tâches sur le serveur, comme quand tu vas chercher tous les livres à la bibliothèque sans filtrer par thème.
  // Explication technique : Fonction mémorisée qui dispatch les actions Redux appropriées, récupère le token d'authentification, effectue l'appel API avec retry et traite la réponse pour mettre à jour le store.
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
  // === Fin : Fonction de chargement de toutes les tâches ===
  
  // === Début : Fonction de chargement des tâches par client ===
  // Explication simple : Cette fonction va chercher seulement les tâches qui appartiennent à un client spécifique, comme quand tu cherches uniquement les livres d'un auteur particulier à la bibliothèque.
  // Explication technique : Fonction mémorisée qui dispatch les actions Redux, effectue un appel API filtré par ID client, vérifie la validité des données reçues et met à jour l'état local des tâches client avec une gestion d'erreurs détaillée.
  /**
   * Fonction pour charger les tâches d'un client spécifique
   */
  const loadClientTasks = useCallback(async (id: string) => {
    try {
      dispatch(fetchTasksStart());
      
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error("Token d'authentification manquant");
        dispatch(fetchTasksFailure(error.message));
        throw error;
      }
      
      const response = await fetchWithRetry(() => axios.get(`${API_URL}/api/tasks/client/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }));
      
      // Vérification des données reçues
      if (!Array.isArray(response.data)) {
        const error = new Error("Format de données invalide reçu du serveur");
        dispatch(fetchTasksFailure(error.message));
        throw error;
      }
      
      setClientTasks(response.data);
      return response.data;
    } catch (error: any) {
      // Gestion d'erreur plus détaillée
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // Erreur serveur avec réponse (4xx, 5xx)
          const errorMessage = error.response.data?.message || `Erreur serveur: ${error.response.status}`;
          console.error(`Erreur lors du chargement des tâches du client ${id}:`, errorMessage);
          dispatch(fetchTasksFailure(errorMessage));
        } else if (error.request) {
          // Pas de réponse reçue
          console.error(`Pas de réponse du serveur pour le client ${id}:`, error.message);
          dispatch(fetchTasksFailure("Le serveur ne répond pas. Vérifiez votre connexion internet."));
        } else {
          // Erreur lors de la configuration de la requête
          console.error(`Erreur de configuration pour le client ${id}:`, error.message);
          dispatch(fetchTasksFailure(error.message));
        }
      } else {
        // Autre type d'erreur
        console.error(`Erreur lors du chargement des tâches du client ${id}:`, error);
        dispatch(fetchTasksFailure(error.message));
      }
      throw error;
    }
  }, [dispatch]);
  // === Fin : Fonction de chargement des tâches par client ===
  
  // === Début : Fonction de rafraîchissement des tâches ===
  // Explication simple : Cette fonction permet de mettre à jour les tâches quand tu le souhaites, comme quand tu appuies sur le bouton "Actualiser" pour voir les nouvelles informations.
  // Explication technique : Fonction publique exposée qui détermine quelle fonction de chargement appeler (globale ou filtrée par client) en fonction des paramètres du hook.
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
  // === Fin : Fonction de rafraîchissement des tâches ===
  
  // === Début : Effet de chargement initial ===
  // Explication simple : Cette partie s'exécute automatiquement au démarrage pour charger les tâches dès que la page s'ouvre, comme quand ton téléphone se connecte automatiquement au Wi-Fi quand tu rentres chez toi.
  // Explication technique : Hook useEffect qui s'exécute au montage du composant et lors des changements des dépendances clés pour déclencher le chargement initial des tâches.
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
  // === Fin : Effet de chargement initial ===

  // === Début : Effet de rafraîchissement périodique ===
  // Explication simple : Cette partie vérifie régulièrement s'il y a de nouvelles tâches, comme une horloge qui sonne toutes les 5 minutes pour te rappeler de regarder les mises à jour.
  // Explication technique : Hook useEffect qui configure un intervalle pour rafraîchir périodiquement les données, avec nettoyage approprié de l'intervalle au démontage du composant.
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
  // === Fin : Effet de rafraîchissement périodique ===
  
  // === Début : Retour des données et fonctions ===
  // Explication simple : À la fin, notre assistant fournit tout ce dont les autres parties de l'application ont besoin : les tâches, l'information si elles sont en train de charger, les erreurs éventuelles, et la possibilité de rafraîchir les données.
  // Explication technique : Objet de retour du hook exposant les données et fonctionnalités aux composants consommateurs, avec sélection intelligente des tâches à retourner selon le contexte (globales ou filtrées par client).
  // Retourner les données et fonctions à utiliser dans vos composants
  return {
    tasks: clientId ? clientTasks : tasks,
    loading,
    error,
    refreshTasks
  };
  // === Fin : Retour des données et fonctions ===
};
// === Fin : Définition du hook principal useTasks ===