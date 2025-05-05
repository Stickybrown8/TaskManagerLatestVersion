import React, { useState, useEffect, useRef } from 'react';
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
import { addNotification } from '../../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';
import { store } from '../../store';
import { addTask } from '../../store/slices/tasksSlice';
import ClientLogo from '../Clients/ClientLogo';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { updateTaskImpact } from '../../store/slices/taskImpactSlice';
import { useGamification } from '../../hooks/useGamification';
import { useTasks } from '../../hooks/useTasks';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

const TimerPopupFix: React.FC = () => {
  const dispatch = useAppDispatch();

  // Accéder directement à chaque propriété pour une meilleure réactivité
  const showTimerPopup = useAppSelector(state => {
    return state.timer?.showTimerPopup || false;
  });
  const timerPopupSize = useAppSelector(state => state.timer?.timerPopupSize || 'medium');
  const timerPopupPosition = useAppSelector(state => state.timer?.timerPopupPosition || 'bottom-right');
  const runningTimer = useAppSelector(state => state.timer?.runningTimer || null);

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
  const [billable, setBillable] = useState<boolean>(true);

  // États pour le drag-and-drop
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // États pour la rentabilité en temps réel
  const [currentHourlyRate, setCurrentHourlyRate] = useState<number>(0);
  const [isOverBudget, setIsOverBudget] = useState<boolean>(false);
  const [hoursRemaining, setHoursRemaining] = useState<number>(0);
  const [percentageUsed, setPercentageUsed] = useState<number>(0);

  // États pour la création de nouvelle tâche
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    clientId: '',
    priority: 'normale',
    dueDate: '',
    isHighImpact: false,
    impactScore: 50
  });

  // États pour la minimisation
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [previousSize, setPreviousSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Ajouter ces états
  const [dragBounds, setDragBounds] = useState({ left: 0, top: 0, right: 0, bottom: 0 });
  const dragConstraintsRef = useRef(null);

  const [showImpactIndicator, setShowImpactIndicator] = useState(true);
  const { highImpactTasks } = useSelector((state: RootState) => state.taskImpact);

  const { addExperience, checkAchievement, showReward } = useGamification();
  const { refreshTasks } = useTasks();

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
        try {
          const response = await axios.get(`${API_URL}/api/timers/running`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.data && response.data._id) {
            setTimerId(response.data._id);
            setIsRunning(response.data.isRunning || false);
            setTimerDuration(response.data.duration || 0);
            setBillable(response.data.billable !== false);

            if (response.data.clientId) {
              fetchClientDetails(response.data.clientId);
            }

            if (response.data.taskId) {
              setSelectedTaskId(response.data.taskId);
              fetchTaskDetails(response.data.taskId);
            }

            setDescription(response.data.description || '');
          }
        } catch (err) {
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

  // Charger la position sauvegardée du timer
  useEffect(() => {
    const savedPosition = localStorage.getItem('timerPosition');
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        setPosition(parsedPosition);
      } catch (e) {
        console.error('Erreur lors du chargement de la position du timer:', e);
      }
    }
  }, []);

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

        const profitData = profitabilityResponse.data;
        setProfitability(profitData);
        setCurrentHourlyRate(profitData.hourlyRate || 0);

        // Calculer les heures restantes et le pourcentage utilisé
        if (profitData.targetHours && profitData.spentHours) {
          const remaining = profitData.targetHours - profitData.spentHours;
          setHoursRemaining(remaining);
          setPercentageUsed((profitData.spentHours / profitData.targetHours) * 100);
          setIsOverBudget(remaining < 0);
        }
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
        setTimerDuration(prev => {
          const newDuration = prev + 1;

          // Mettre à jour la rentabilité en temps réel
          if (profitability && profitability.targetHours) {
            // Calculer les heures passées, y compris le timer actuel
            const currentHoursSpent = profitability.spentHours + (newDuration / 3600);
            const remaining = profitability.targetHours - currentHoursSpent;
            const percentUsed = (currentHoursSpent / profitability.targetHours) * 100;

            setHoursRemaining(remaining);
            setPercentageUsed(percentUsed);
            setIsOverBudget(remaining < 0);

            // Calculer le taux horaire actuel
            if (profitability.monthlyBudget && currentHoursSpent > 0) {
              const rate = profitability.monthlyBudget / currentHoursSpent;
              setCurrentHourlyRate(rate);
            }

            // Alerte si on approche ou dépasse la limite
            if (remaining <= 0 && !isOverBudget) {
              dispatch(addNotification({
                message: `Attention: Budget horaire dépassé pour ${selectedClient?.name}`,
                type: 'warning'
              }));
            } else if (remaining <= 1 && remaining > 0) {
              dispatch(addNotification({
                message: `Attention: Il reste moins d'une heure de budget pour ${selectedClient?.name}`,
                type: 'info'
              }));
            }
          }

          return newDuration;
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [isRunning, profitability, selectedClient, dispatch, isOverBudget]);

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

      // Préparer les données du timer avec validation
      const timerData = {
        clientId: selectedClientId || (selectedTask?.clientId?._id || selectedTask?.clientId),
        taskId: selectedTaskId,
        description: description || (selectedTask?.title ? `Travail sur: ${selectedTask.title}` : ''),
        billable: billable
      };

      // Créer le timer avec retry si nécessaire
      let retries = 0;
      let response;

      while (retries < 3) {
        try {
          console.log("Tentative de connexion à:", `${API_URL}/api/timers/start`);

          response = await axios({
            method: 'post',
            url: `${API_URL}/api/timers/start`,
            data: timerData,
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // Timeout de 10 secondes
          });

          break; // Sortir de la boucle si succès
        } catch (err) {
          retries++;
          if (retries >= 3) throw err;
          await new Promise(r => setTimeout(r, 1000)); // Attendre 1 sec avant de réessayer
        }
      }

      // Mettre à jour l'état local
      const createdTimer = response?.data?.timer || response?.data;
      if (createdTimer?._id) {
        setTimerId(createdTimer._id);
        setIsRunning(true);
        setTimerDuration(0);

        // Mettre à jour le state Redux
        dispatch(startTimer(createdTimer._id, selectedClientId ? 'client' : 'task'));

        dispatch(addNotification({
          message: 'Chronomètre démarré',
          type: 'success'
        }));
      } else {
        throw new Error("ID du timer manquant dans la réponse");
      }
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

        } catch (error) {
          console.error("Erreur lors de la mise à jour des données de rentabilité:", error);
        }
      }

      // Système de gamification: récompenser l'utilisateur en fonction de l'impact
      if (timerDuration > 600) { // Plus de 10 minutes de travail
        let points = Math.floor(timerDuration / 60); // 1 point par minute
        const isHighImpact = selectedTask && selectedTask.isHighImpact;
        const impactMultiplier = isHighImpact ? 2 : 1;
        const totalPoints = points * impactMultiplier;
        const reason = isHighImpact
          ? `Timer sur tâche à fort impact (${formatDuration(timerDuration)})`
          : `Timer: ${formatDuration(timerDuration)} sur ${selectedTask?.title || selectedClient?.name || 'une tâche'}`;
        await addExperience(totalPoints, reason);
        if (isHighImpact) {
          const achievements = await checkAchievement('high_impact_tasks');
          if (achievements.length > 0) {
            showReward(achievements[0]);
          }
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

  // Fonction pour marquer une tâche comme terminée ou en cours
  const handleTaskCompletion = async (isComplete: boolean) => {
    if (!selectedTaskId) {
      dispatch(addNotification({
        message: 'Aucune tâche sélectionnée',
        type: 'warning'
      }));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      // Mettre à jour le statut de la tâche
      await axios.put(
        `${API_URL}/api/tasks/${selectedTaskId}`,
        { status: isComplete ? 'terminée' : 'en cours' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Arrêter le timer si la tâche est terminée
      if (isComplete && timerId) {
        await handleStopTimer();
      }

      dispatch(addNotification({
        message: isComplete ? 'Tâche marquée comme terminée' : 'Tâche marquée comme en cours',
        type: 'success'
      }));

      // Recharger la tâche pour mettre à jour l'UI
      if (selectedTaskId) {
        fetchTaskDetails(selectedTaskId);
      }

    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut de la tâche:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la mise à jour du statut',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour créer une nouvelle tâche
  const handleCreateNewTask = async () => {
    try {
      if (!newTaskData.title || !newTaskData.clientId) {
        dispatch(addNotification({
          message: 'Veuillez remplir au moins le titre et sélectionner un client',
          type: 'warning'
        }));
        return;
      }

      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error("Token d'authentification manquant");
      }

      // Enrichir les données de la tâche
      const enrichedTaskData = {
        ...newTaskData,
        status: 'en cours',
        createdAt: new Date().toISOString()
      };

      const response = await axios.post(
        `${API_URL}/api/tasks`,
        enrichedTaskData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Mettre à jour Redux avec la nouvelle tâche (assurez-vous d'avoir importé l'action)
      // Cette partie fonctionne bien
      dispatch(addTask(response.data)); // Ajouter la tâche au store Redux

      dispatch(addNotification({
        message: 'Nouvelle tâche créée et ajoutée à votre liste',
        type: 'success'
      }));

      // Mettre à jour la liste des tâches localement
      const tasksResponse = await axios.get(`${API_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setTasks(tasksResponse.data);

      // Sélectionner automatiquement la tâche créée
      setSelectedTaskId(response.data._id);
      fetchTaskDetails(response.data._id);

      // Réinitialiser le formulaire mais garder le client
      setNewTaskData({
        title: '',
        description: '',
        clientId: newTaskData.clientId,
        priority: 'normale',
        dueDate: '',
        isHighImpact: false,
        impactScore: 30
      });

      setShowNewTaskForm(false);

      // Après la création réussie de la tâche
      dispatch(addTask(response.data)); // Redux
      refreshTasks(); // Rafraîchir partout

    } catch (error: any) {
      console.error('Erreur lors de la création de la tâche:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la création de la tâche',
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

  // Améliorer la fonction handleTaskChange

  const handleTaskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const taskId = e.target.value;

    // Stocker dans le localStorage pour persistance
    if (taskId) {
      localStorage.setItem('selectedTaskId', taskId);
    }

    setSelectedTaskId(taskId);

    if (taskId) {
      fetchTaskDetails(taskId);
    } else {
      setSelectedTask(null);
    }
  };

  // Ajouter dans votre useEffect initial
  useEffect(() => {
    // Restaurer la sélection précédente au chargement
    const savedTaskId = localStorage.getItem('selectedTaskId');
    if (savedTaskId) {
      setSelectedTaskId(savedTaskId);
      fetchTaskDetails(savedTaskId);
    }
  }, []);

  // Fonctions pour le drag-and-drop
  const onDragStart = () => {
    setIsDragging(true);
  };

  const onDragEnd = () => {
    setIsDragging(false);
  };

  // Ajoutez ce style dans le <head> du document HTML
  useEffect(() => {
    if (showTimerPopup) {
      // Ajouter un style global pour garantir que le timer reste au-dessus de tout
      const style = document.createElement('style');
      style.innerHTML = `
        .timer-popup-container {
          z-index: 2147483647 !important; /* Valeur maximale de z-index */
          position: fixed !important;
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);

      // Modifier la classe du conteneur de timer
      if (popupRef.current) {
        popupRef.current.classList.add('timer-popup-container');
      }

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [showTimerPopup]);

  // Ajouter cet useEffect pour calculer les limites de déplacement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDragBounds({
        top: 0,
        left: 0,
        right: window.innerWidth - 320, // Adapter en fonction de la taille
        bottom: window.innerHeight - 200 // Adapter en fonction de la taille
      });

      const handleResize = () => {
        setDragBounds({
          top: 0,
          left: 0,
          right: window.innerWidth - 320,
          bottom: window.innerHeight - 200
        });
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [timerPopupSize]);

  useEffect(() => {
    function updateBounds() {
      setDragBounds({
        left: 0,
        top: 0,
        right: window.innerWidth - 320,
        bottom: window.innerHeight - 200,
      });
    }
    updateBounds();
    window.addEventListener('resize', updateBounds);
    return () => window.removeEventListener('resize', updateBounds);
  }, []);

  // Ajouter ces fonctions après les autres fonctions utilitaires
  const getRateColor = () => {
    if (!profitability?.hourlyRate) return '';
    const ratio = currentHourlyRate / profitability.hourlyRate;
    if (ratio < 0.8) return 'text-red-600 dark:text-red-400';
    if (ratio < 1) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getRentabilityStatusColor = () => {
    if (isOverBudget) return 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30';
    if (percentageUsed > 80) return 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30';
    return 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30';
  };

  const getTaskImpactInfo = () => {
    if (!selectedTaskId || !highImpactTasks) return null;

    const isHighImpact = highImpactTasks.some(task => task._id === selectedTaskId);
    return isHighImpact;
  };

  // Remplacer la section return avec un design plus élégant
  return (
    <>
      {!showTimerPopup ? (
        <button
          onClick={() => dispatch(toggleTimerPopup(true))}
          className="fixed bottom-4 right-4 bg-primary-600 text-white p-3 rounded-full shadow-xl hover:bg-primary-700 transition-all hover:scale-110 z-[9999]"
          title="Ouvrir le chronomètre"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      ) : (
        <motion.div
          ref={popupRef}
          drag
          dragConstraints={dragBounds}
          dragElastic={0.2}
          dragMomentum={false}
          dragTransition={{ bounceStiffness: 600, bounceDamping: 20 }}
          className="fixed shadow-2xl rounded-2xl bg-white dark:bg-gray-900 p-4 z-[9999] border border-gray-200 dark:border-gray-700"
          style={{
            width: '95vw',
            maxWidth: 400,
            minWidth: 260,
            maxHeight: '90vh',
            overflowY: 'auto',
            resize: 'both', // <-- Ajoute cette ligne
          }}
        >
          <div className="cursor-default">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center truncate max-w-[180px]">
                {selectedClient && (
                  <div className="mr-2 flex-shrink-0">
                    <ClientLogo client={selectedClient} size="small" />
                  </div>
                )}
                <span className="truncate">
                  {selectedClient ? selectedClient.name : (selectedTask ? selectedTask.title : 'Chronomètre')}
                </span>
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
                  onClick={() => {
                    setIsMinimized(!isMinimized);
                    // Sauvegarder l'état précédent si on maximise
                    if (isMinimized) {
                      dispatch(setTimerPopupSize(previousSize || 'medium'));
                    } else {
                      setPreviousSize(timerPopupSize);
                      dispatch(setTimerPopupSize('small'));
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title={isMinimized ? "Maximiser" : "Minimiser"}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    {isMinimized ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    )}
                  </svg>
                </button>
                <button
                  onClick={() => dispatch(hideTimerPopup())}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  title="Fermer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 011.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Afficher les infos de rentabilité si disponibles */}
            {selectedClient && profitability && (
              <div className={`mb-4 p-4 rounded-lg shadow-inner bg-gradient-to-r 
                from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 
                border-l-4 transition-all duration-300
                ${isOverBudget ? 'border-red-500' : percentageUsed > 80 ? 'border-yellow-500' : 'border-green-500'}`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-semibold">Rentabilité actuelle :</span>
                  <div className={`text-xl font-bold ${isOverBudget ? 'text-red-600' : percentageUsed > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {Math.round(currentHourlyRate)}€/h
                  </div>
                </div>
                <div className="text-sm">
                  {isOverBudget
                    ? "⚠️ Budget dépassé !"
                    : percentageUsed > 80
                      ? "Attention : Vous approchez de la limite de budget"
                      : "Budget sous contrôle"}
                </div>
                <div className="mt-2 text-xs">
                  Il vous reste <span className="font-bold">{hoursRemaining > 0 ? `+${hoursRemaining.toFixed(1)}h` : `${hoursRemaining.toFixed(1)}h`}</span> pour rester rentable.
                </div>
              </div>
            )}

            {selectedTask && showImpactIndicator && (
              <div className={`mb-4 p-3 rounded-lg ${getTaskImpactInfo() ? 'bg-green-50 border-l-4 border-green-500' : 'bg-gray-50 border-l-4 border-gray-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Impact de la tâche:</span>
                  {getTaskImpactInfo() ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-bold">
                      Fort impact (80/20)
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                      Impact normal
                    </span>
                  )}
                </div>
                {getTaskImpactInfo() && (
                  <p className="text-xs text-green-700 mt-1">
                    Cette tâche fait partie des 20% qui génèrent 80% des résultats. Priorité maximale!
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-center mb-6">
              <div className="text-5xl font-extrabold mb-4 text-gray-900 dark:text-white py-6 px-10 rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 shadow-inner border border-gray-100 dark:border-gray-700 tracking-widest">
                {formatDuration(timerDuration)}
              </div>
            </div>
            <div className="flex space-x-3 mt-2">
              {isRunning ? (
                <button
                  onClick={handlePauseTimer}
                  disabled={loading}
                  className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:outline-none 
                  focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50 
                  transition-all duration-200 ease-in-out shadow-md hover:shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Pause
                    </div>
                  ) : (
                    <span className="flex items-center">
                      <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      Pause
                    </span>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStartTimer}
                  disabled={loading || (!selectedClientId && !selectedTaskId)}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-bold text-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  Démarrer
                </button>
              )}
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>{client.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="task" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tâche
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowNewTaskForm(!showNewTaskForm)}
                      className="text-primary-600 hover:text-primary-700 text-xs"
                    >
                      {showNewTaskForm ? 'Annuler' : '+ Nouvelle tâche'}
                    </button>
                  </div>

                  <select
                    id="task"
                    value={selectedTaskId}
                    onChange={handleTaskChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    disabled={loading}
                  >
                    <option value="">Sélectionner une tâche</option>
                    {tasks
                      .filter(task => {
                        const taskClientId = typeof task.clientId === 'object' ? task.clientId._id : task.clientId;
                        return (!selectedClientId || taskClientId === selectedClientId) && task.status !== 'terminée';
                      })
                      .map(task => (
                        <option key={task._id} value={task._id}>{task.title}</option>
                      ))
                    }
                  </select>

                  {showNewTaskForm && (
                    <div className="mt-3 bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Titre de la tâche
                        </label>
                        <input
                          type="text"
                          value={newTaskData.title}
                          onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                          placeholder="Titre de la nouvelle tâche"
                        />
                      </div>

                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Client
                        </label>
                        <select
                          value={newTaskData.clientId}
                          onChange={(e) => setNewTaskData({ ...newTaskData, clientId: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                        >
                          <option value="">Sélectionner un client</option>
                          {clients.map(client => (
                            <option key={client._id} value={client._id}>{client.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description (optionnelle)
                        </label>
                        <textarea
                          value={newTaskData.description}
                          onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md"
                          rows={2}
                        ></textarea>
                      </div>

                      <label className="flex items-center space-x-2 mt-2">
                        <input
                          type="checkbox"
                          checked={newTaskData.isHighImpact}
                          onChange={(e) => setNewTaskData({
                            ...newTaskData,
                            isHighImpact: e.target.checked,
                            impactScore: e.target.checked ? 80 : 30
                          })}
                          className="form-checkbox h-4 w-4 text-primary-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Tâche à fort impact (principe 80/20)
                        </span>
                      </label>

                      <button
                        onClick={handleCreateNewTask}
                        disabled={loading}
                        className="w-full mt-2 px-3 py-1 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700"
                      >
                        {loading ? 'Création...' : 'Créer la tâche'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Que faites-vous ?"
                    disabled={loading}
                  />
                </div>

                <label className="flex items-center space-x-2 mt-2">
                  <input
                    type="checkbox"
                    checked={billable}
                    onChange={() => setBillable(!billable)}
                    className="form-checkbox h-5 w-5 text-green-500"
                  />
                  <span className="text-lg font-semibold flex items-center">
                    {billable ? "💸 Facturable" : "⏳ Non facturable"}
                  </span>
                </label>
              </div>
            )}

            {selectedTaskId && (
              <div className="flex mt-2 space-x-2">
                <button
                  onClick={() => handleTaskCompletion(true)}
                  disabled={loading}
                  className="px-3 py-1 bg-success-500 text-white rounded-md hover:bg-success-600 focus:outline-none focus:ring-2 focus:ring-success-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    Tâche terminée
                  </span>
                </button>
                <button
                  onClick={() => handleTaskCompletion(false)}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    En cours
                  </span>
                </button>
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
          </div>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="absolute top-2 right-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            title={isMinimized ? "Agrandir" : "Réduire"}
          >
            {isMinimized ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            )}
          </button>
        </motion.div>
      )}
    </>
  );
};

export default TimerPopupFix;
