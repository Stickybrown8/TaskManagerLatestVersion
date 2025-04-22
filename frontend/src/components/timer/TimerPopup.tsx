import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  toggleTimerPopup,
  hideTimerPopup,
  setTimerPopupSize,
  setTimerPopupPosition,
  updateRunningTimerDuration,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer
} from '../../store/slices/timerSlice';
// Correction des imports qui font référence à des chemins inexistants
// Changement de './pages/TaskForm' à '../../pages/TaskForm'
import TaskForm from '../../pages/TaskForm';
import ClientDashboard from '../../pages/ClientDashboard';
import { addNotification } from '../../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

const TimerPopup: React.FC = () => {
  const dispatch = useAppDispatch();
  
  // Accès sécurisé à l'état Redux avec des valeurs par défaut
  const timerState = useAppSelector(state => state.timer || {});
  const {
    runningTimer = null,
    showTimerPopup = false,
    timerPopupSize = 'medium',
    timerPopupPosition = 'bottom-right'
  } = timerState;
  
  // États locaux
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [description, setDescription] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [profitability, setProfitability] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Charger les clients et les tâches
  useEffect(() => {
    const fetchClientsAndTasks = async () => {
      try {
        // Récupérer le token d'authentification
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error("Token d'authentification manquant");
          return;
        }
        
        setLoading(true);
        
        // Charger les clients
        const clientsResponse = await axios.get(`${API_URL}/api/clients`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setClients(clientsResponse.data);
        
        // Charger les tâches
        const tasksResponse = await axios.get(`${API_URL}/api/tasks`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setTasks(tasksResponse.data);
        
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        dispatch(addNotification({
          message: 'Erreur lors du chargement des données du timer',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    };
    
    if (showTimerPopup) {
      fetchClientsAndTasks();
    }
  }, [dispatch, showTimerPopup]);

  // Charger le timer en cours s'il existe
  useEffect(() => {
    const fetchRunningTimer = async () => {
      try {
        // Récupérer le token d'authentification
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error("Token d'authentification manquant");
          return;
        }
        
        setLoading(true);
        
        // Vérifier s'il y a un timer en cours
        const response = await axios.get(`${API_URL}/api/timers/running`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data && response.data._id) {
          setTimerId(response.data._id);
          setIsRunning(response.data.isRunning || false);
          setTimerDuration(response.data.duration || 0);
          
          if (response.data.clientId) {
            setSelectedClientId(response.data.clientId);
            fetchClientDetails(response.data.clientId);
          }
          
          if (response.data.taskId) {
            setSelectedTaskId(response.data.taskId);
            fetchTaskDetails(response.data.taskId);
          }
          
          setDescription(response.data.description || '');
        }
        
      } catch (error) {
        console.error('Erreur lors de la récupération du timer en cours:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (showTimerPopup) {
      fetchRunningTimer();
    }
  }, [showTimerPopup]);

  // Récupérer les détails d'un client
  const fetchClientDetails = async (clientId: string) => {
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token || !clientId) return;
      
      // Charger les détails du client
      const response = await axios.get(`${API_URL}/api/clients/${clientId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSelectedClient(response.data);
      
      // Charger les données de rentabilité
      try {
        const profitabilityResponse = await axios.get(`${API_URL}/api/profitability/client/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setProfitability(profitabilityResponse.data);
      } catch (err) {
        console.log('Pas de données de rentabilité pour ce client');
        setProfitability(null);
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du client:', error);
      setSelectedClient(null);
    }
  };

  // Récupérer les détails d'une tâche
  const fetchTaskDetails = async (taskId: string) => {
    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token || !taskId) return;
      
      // Charger les détails de la tâche
      const response = await axios.get(`${API_URL}/api/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSelectedTask(response.data);
      
      // Si la tâche a un client, charger les détails du client
      if (response.data.clientId) {
        fetchClientDetails(response.data.clientId);
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des détails de la tâche:', error);
      setSelectedTask(null);
    }
  };

  // Formater la durée en HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Mettre à jour la durée du timer toutes les secondes si en cours d'exécution
  useEffect(() => {
    if (isRunning) {
      const intervalId = setInterval(() => {
        setTimerDuration(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [isRunning]);

  // Fonction pour démarrer un timer
  const handleStartTimer = async () => {
    try {
      // Vérifier si un client ou une tâche est sélectionné
      if (!selectedClientId && !selectedTaskId) {
        dispatch(addNotification({
          message: 'Veuillez sélectionner un client ou une tâche',
          type: 'warning'
        }));
        return;
      }
      
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Préparer les données du timer
      const timerData = {
        clientId: selectedClientId || (selectedTask?.clientId || ''),
        taskId: selectedTaskId || '',
        description: description,
        billable: true
      };
      
      // Créer le timer
      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/timers/start`,
        data: timerData,
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log("Timer créé:", response.data);
      
      // Mettre à jour l'état local
      setTimerId(response.data._id || response.data.timer._id);
      setIsRunning(true);
      setTimerDuration(0);
      
      // Mettre à jour le state Redux
      dispatch(startTimer(response.data._id || response.data.timer._id, selectedClientId ? 'client' : 'task'));
      
      dispatch(addNotification({
        message: 'Chronomètre démarré',
        type: 'success'
      }));
      
    } catch (error: any) {
      console.error('Erreur lors du démarrage du timer:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors du démarrage du chronomètre',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre en pause le timer
  const handlePauseTimer = async () => {
    if (!timerId) return;
    
    try {
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Mettre en pause le timer
      await axios.put(`${API_URL}/api/timers/${timerId}/pause`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mettre à jour l'état local
      setIsRunning(false);
      
      // Mettre à jour le state Redux
      dispatch(pauseTimer(timerId, selectedClientId ? 'client' : 'task'));
      
      dispatch(addNotification({
        message: 'Chronomètre mis en pause',
        type: 'info'
      }));
      
    } catch (error: any) {
      console.error('Erreur lors de la mise en pause du timer:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la mise en pause du chronomètre',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour reprendre le timer
  const handleResumeTimer = async () => {
    if (!timerId) return;
    
    try {
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Reprendre le timer
      await axios.put(`${API_URL}/api/timers/${timerId}/resume`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mettre à jour l'état local
      setIsRunning(true);
      
      // Mettre à jour le state Redux
      dispatch(resumeTimer(timerId, selectedClientId ? 'client' : 'task'));
      
      dispatch(addNotification({
        message: 'Chronomètre repris',
        type: 'success'
      }));
      
    } catch (error: any) {
      console.error('Erreur lors de la reprise du timer:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la reprise du chronomètre',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour arrêter le timer
  const handleStopTimer = async () => {
    if (!timerId) return;
    
    try {
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Arrêter le timer
      await axios.put(`${API_URL}/api/timers/${timerId}/stop`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mettre à jour l'état local
      setIsRunning(false);
      setTimerDuration(0);
      setTimerId(null);
      
      // Mettre à jour le state Redux
      dispatch(stopTimer(timerId, selectedClientId ? 'client' : 'task'));
      
      dispatch(addNotification({
        message: 'Chronomètre arrêté',
        type: 'success'
      }));
      
      // Si le client a des données de rentabilité, les mettre à jour
      if (selectedClientId && profitability) {
        try {
          // Convertir la durée en heures (secondes / 3600)
          const hoursSpent = timerDuration / 3600;
          
          await axios.put(`${API_URL}/api/profitability/client/${selectedClientId}/spent-hours`, {
            spentHours: hoursSpent,
            incrementOnly: true
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log("Données de rentabilité mises à jour");
        } catch (error) {
          console.error("Erreur lors de la mise à jour des données de rentabilité:", error);
        }
      }
      
    } catch (error: any) {
      console.error('Erreur lors de l\'arrêt du timer:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de l\'arrêt du chronomètre',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Gérer le changement de client
  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClientId(clientId);
    setSelectedTaskId('');
    
    if (clientId) {
      fetchClientDetails(clientId);
    } else {
      setSelectedClient(null);
      setProfitability(null);
    }
  };

  // Gérer le changement de tâche
  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;
    setSelectedTaskId(taskId);
    
    if (taskId) {
      fetchTaskDetails(taskId);
    } else {
      setSelectedTask(null);
    }
  };

  // Afficher uniquement le bouton flottant si la popup n'est pas visible
  if (!showTimerPopup) {
    return (
      <button
        onClick={() => dispatch(toggleTimerPopup(true))}
        className="fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-50"
        title="Ouvrir le chronomètre"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    );
  }

  // Déterminer les classes CSS en fonction de la taille et de la position
  const sizeClasses = {
    small: 'w-64 h-auto',
    medium: 'w-80 h-auto',
    large: 'w-96 h-auto'
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`fixed ${positionClasses[timerPopupPosition as keyof typeof positionClasses]} ${
        sizeClasses[timerPopupSize as keyof typeof sizeClasses]
      } bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 z-50 border border-gray-200 dark:border-gray-700`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
          {selectedClient && selectedClient.logo && (
            <div className="w-6 h-6 mr-2 rounded-sm overflow-hidden">
              <img 
                src={selectedClient.logo} 
                alt={`Logo de ${selectedClient.name}`} 
                className="w-full h-full object-contain"
              />
            </div>
          )}
          {selectedClient ? selectedClient.name : (selectedTask ? selectedTask.title : 'Chronomètre')}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch(setTimerPopupSize('small'))}
            className={`w-4 h-4 rounded-full ${timerPopupSize === 'small' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Petit"
          />
          <button
            onClick={() => dispatch(setTimerPopupSize('medium'))}
            className={`w-4 h-4 rounded-full ${timerPopupSize === 'medium' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Moyen"
          />
          <button
            onClick={() => dispatch(setTimerPopupSize('large'))}
            className={`w-4 h-4 rounded-full ${timerPopupSize === 'large' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Grand"
          />
          <button
            onClick={() => dispatch(hideTimerPopup())}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Afficher les infos de rentabilité si disponibles */}
      {selectedClient && profitability && (
        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 p-2 rounded-md text-xs">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 dark:text-blue-300">Taux horaire:</span>
            <span className="font-medium">{profitability.hourlyRate}€/h</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-blue-700 dark:text-blue-300">Rentabilité:</span>
            <span className={`font-medium ${profitability.profitabilityPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profitability.profitabilityPercentage >= 0 ? '+' : ''}{profitability.profitabilityPercentage.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formatDuration(timerDuration)}
        </div>
        <div className="flex space-x-2">
          {isRunning ? (
            <button
              onClick={handlePauseTimer}
              disabled={loading}
              className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Pause
                </div>
              ) : 'Pause'}
            </button>
          ) : timerId ? (
            <button
              onClick={handleResumeTimer}
              disabled={loading}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reprendre
                </div>
              ) : 'Reprendre'}
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              disabled={(!selectedClientId && !selectedTaskId) || loading}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Démarrer
                </div>
              ) : 'Démarrer'}
            </button>
          )}
          {(isRunning || timerId) && (
            <button
              onClick={handleStopTimer}
              disabled={loading}
              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Arrêter
                </div>
              ) : 'Arrêter'}
            </button>
          )}
        </div>
      </div>

      {!isRunning && !timerId && (
        <div className="mt-4">
          <div className="mb-3">
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client
            </label>
            <select
              id="client"
              value={selectedClientId}
              onChange={handleClientChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="task" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tâche
            </label>
            <select
              id="task"
              value={selectedTaskId}
              onChange={handleTaskChange}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            >
              <option value="">Sélectionner une tâche</option>
              {tasks.map(task => (
                <option key={task._id} value={task._id}>{task.title}</option>
              ))}
            </select>
          </div>

          <div className="mb-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Que faites-vous ?"
              disabled={loading}
            />
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2">
        <div className="flex space-x-1">
          <button
            onClick={() => dispatch(setTimerPopupPosition('top-right'))}
            className={`w-4 h-4 rounded-sm ${timerPopupPosition === 'top-right' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="En haut à droite"
          />
          <button
            onClick={() => dispatch(setTimerPopupPosition('bottom-right'))}
            className={`w-4 h-4 rounded-sm ${timerPopupPosition === 'bottom-right' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="En bas à droite"
          />
          <button
            onClick={() => dispatch(setTimerPopupPosition('center'))}
            className={`w-4 h-4 rounded-sm ${timerPopupPosition === 'center' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Au centre"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default TimerPopup;
