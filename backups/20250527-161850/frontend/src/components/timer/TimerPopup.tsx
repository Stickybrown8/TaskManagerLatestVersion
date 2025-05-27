import { formatDurationHuman } from '../../utils/dateUtils';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  toggleTimerPopup,
  hideTimerPopup,
  setRunningTimer,
  startTimer,
  pauseTimer,
  stopTimer
} from '../../store/slices/timerSlice';
import { addNotification } from '../../store/slices/uiSlice';
import { addTask } from '../../store/slices/tasksSlice';
import ClientLogo from '../Clients/ClientLogo';
import { timerService } from '../../services/api';
import { useGamification } from '../../hooks/useGamification';
import { useTasks } from '../../hooks/useTasks';

// Détection automatique de l'URL pour GitHub Codespaces
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  if (window.location.hostname.includes('github.dev')) {
    return window.location.origin.replace('-3000.', '-5000.');
  }
  return process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
};

const API_URL = getApiUrl();

interface TimerPopupProps { }

const TimerPopup: React.FC<TimerPopupProps> = () => {
  const dispatch = useAppDispatch();
  const { showTimerPopup } = useAppSelector(state => state.timer);
  const { addExperience, checkAchievement, showReward } = useGamification();
  const { refreshTasks } = useTasks();
  const dragControls = useDragControls();

  // États principaux
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerId, setTimerId] = useState<string | null>(null);
  const [description, setDescription] = useState<string>('');
  const [billable, setBillable] = useState<boolean>(true);

  // États pour les données
  const [clients, setClients] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [profitability, setProfitability] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // États pour la rentabilité
  const [currentHourlyRate, setCurrentHourlyRate] = useState<number>(0);
  const [targetHourlyRate, setTargetHourlyRate] = useState<number>(0);

  // États UI
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('large');
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [showNewTaskForm, setShowNewTaskForm] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => { });
  const [confirmMessage, setConfirmMessage] = useState<string>('');
  const popupRef = useRef<HTMLDivElement>(null);

  // Formulaire nouvelle tâche
  const [newTaskData, setNewTaskData] = useState({
    title: '',
    description: '',
    priority: 'moyenne',
    dueDate: '',
    isHighImpact: false
  });

  // Styles pour les tailles
  const sizeStyles = {
    small: 'w-96 md:w-[420px]',
    medium: 'w-full md:w-[480px]',
    large: 'w-full md:w-[550px]'
  };

  // Fonction pour formater les heures en heures et minutes - PLUS PRÉCISE
  const formatHoursToHM = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    
    if (h === 0 && m === 0) return '0min';
    if (h === 0) return `${m}min`;
    if (m === 0) return `${h}h`;
    
    // Format avec padding pour les minutes
    return `${h}h${m.toString().padStart(2, '0')}min`;
  };

  // Charger les données initiales
  useEffect(() => {
    if (showTimerPopup) {
      fetchClientsAndTasks();
      checkRunningTimer();
    }
  }, [showTimerPopup]);

  // Timer interval avec mise à jour du taux horaire
  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setTimerDuration(prev => {
          const newDuration = prev + 1;

          // Mise à jour du taux horaire en temps réel - CALCUL RÉEL
          if (profitability && profitability.revenue) {
            const hoursWorked = (profitability.spentHours || 0) + (newDuration / 3600);

            if (hoursWorked > 0) {
              // Taux horaire réel = Forfait mensuel / Heures travaillées
              const realRate = profitability.revenue / hoursWorked;
              setCurrentHourlyRate(Math.floor(realRate)); // Changé de Math.round à Math.floor
            }
          }

          return newDuration;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning, profitability]);

  const fetchClientsAndTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [clientsRes, tasksRes] = await Promise.all([
        fetch(`${API_URL}/api/clients`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json()),
        fetch(`${API_URL}/api/tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => res.json())
      ]);

      setClients(clientsRes);
      setTasks(tasksRes);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    }
  };

  const checkRunningTimer = async () => {
    try {
      const timers = await timerService.getAllTimers();
      const activeTimer = timers.find((t: any) => !t.endTime);

      if (activeTimer) {
        console.log("Timer actif trouvé:", activeTimer);
        setTimerId(activeTimer._id);
        setTimerDuration(activeTimer.duration || 0);
        setIsRunning(true);
        if (activeTimer.clientId) {
          setSelectedClientId(activeTimer.clientId._id || activeTimer.clientId);
          fetchClientDetails(activeTimer.clientId._id || activeTimer.clientId);
        }
        if (activeTimer.taskId) {
          setSelectedTaskId(activeTimer.taskId._id || activeTimer.taskId);
          fetchTaskDetails(activeTimer.taskId._id || activeTimer.taskId);
        }
      }
    } catch (error) {
      console.error('Erreur timer actif:', error);
    }
  };

  const fetchClientDetails = async (clientId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !clientId) return;

      // Récupérer le client
      const clientRes = await fetch(`${API_URL}/api/clients/${clientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const clientData = await clientRes.json();
      setSelectedClient(clientData);

      // Récupérer la rentabilité SPÉCIFIQUE au client
      try {
        const profitRes = await fetch(`${API_URL}/api/profitability/client/${clientId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (profitRes.ok) {
          const profitData = await profitRes.json();
          setProfitability(profitData);
          // Utilise le taux horaire OBJECTIF défini pour CE client
          setTargetHourlyRate(profitData.hourlyRate || 100);

          const hoursWorked = profitData.spentHours || 0;
          if (profitData.revenue && hoursWorked > 0) {
            // Calcul du taux réel basé sur le forfait mensuel DE CE CLIENT
            const realRate = profitData.revenue / hoursWorked;
            setCurrentHourlyRate(Math.round(realRate));
          } else {
            setCurrentHourlyRate(0);
          }
        }
      } catch (profitError) {
        console.error("Erreur rentabilité:", profitError);
      }
    } catch (error) {
      console.error("Erreur fetchClientDetails:", error);
    }
  };

  const fetchTaskDetails = async (taskId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !taskId) return;

      const response = await fetch(`${API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const taskData = await response.json();

      setSelectedTask(taskData);
      if (taskData.clientId && !selectedClientId) {
        const clientId = taskData.clientId._id || taskData.clientId;
        setSelectedClientId(clientId);
        fetchClientDetails(clientId);
      }
    } catch (error) {
      console.error('Erreur détails tâche:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = async () => {
    if (!selectedClientId || !selectedTaskId) {
      dispatch(addNotification({
        message: '⚠️ Veuillez sélectionner un client ET une tâche',
        type: 'error'
      }));
      return;
    }

    try {
      setLoading(true);
      const timerData = {
        clientId: selectedClientId,
        taskId: selectedTaskId,
        description: description || `Travail sur: ${selectedTask?.title}`,
        billable
      };

      const response = await timerService.startTimer(timerData);
      const newTimer = response.timer || response;

      setTimerId(newTimer._id);
      setIsRunning(true);
      setTimerDuration(0);

      dispatch(setRunningTimer({
        _id: newTimer._id,
        isRunning: true,
        startTime: new Date().toISOString(),
        duration: 0,
        clientId: selectedClientId,
        taskId: selectedTaskId
      } as any));

      dispatch(addNotification({
        message: '▶️ Timer démarré!',
        type: 'success'
      }));
    } catch (error) {
      console.error('Erreur démarrage:', error);
      dispatch(addNotification({
        message: 'Erreur lors du démarrage',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTask = async () => {
    if (!selectedTaskId) return;

    showConfirm(
      "Terminer la tâche et arrêter le timer ?",
      async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');

          if (isRunning && timerId) {
            await timerService.stopTimer(timerId);

            if (timerDuration > 0) {
              const taskRes = await fetch(`${API_URL}/api/tasks/${selectedTaskId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const currentTask = await taskRes.json();

              const newTotalTime = (currentTask.timeSpent || 0) + Math.round(timerDuration / 60);

              await fetch(`${API_URL}/api/tasks/${selectedTaskId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ timeSpent: newTotalTime })
              });
            }

            if (selectedClientId) {
              await fetch(`${API_URL}/api/profitability/update-hours/${selectedClientId}`, {
                method: 'PUT',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
              });
            }
          }

          const response = await fetch(
            `${API_URL}/api/tasks/${selectedTaskId}/complete`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                actualTime: Math.round(timerDuration / 60)
              })
            }
          );

          if (response.ok) {
            const data = await response.json();

            if (timerDuration > 180) {
              const points = Math.floor(timerDuration / 60);
              const multiplier = selectedTask?.isHighImpact ? 2 : 1;
              await addExperience(points * multiplier, `Timer: ${formatDuration(timerDuration)}`);
            }

            if (data.rewards) {
              dispatch(addNotification({
                message: `🎉 Tâche terminée! +${data.rewards.points} points, +${data.rewards.experience} XP`,
                type: 'success'
              }));
            } else {
              dispatch(addNotification({
                message: '🎉 Tâche terminée!',
                type: 'success'
              }));
            }

            setIsRunning(false);
            setSelectedTaskId('');
            setSelectedTask(null);
            setTimerDuration(0);
            setTimerId(null);
            dispatch(setRunningTimer(null));

            refreshTasks();
            fetchClientsAndTasks();
          }
        } catch (error) {
          console.error('Erreur fin tâche:', error);
          dispatch(addNotification({
            message: 'Erreur lors de la fin de la tâche',
            type: 'error'
          }));
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleStopTimer = async () => {
    if (!timerId) return;

    showConfirm('Mettre en pause le timer ?', async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        // Arrêter le timer avec la durée actuelle
        await timerService.stopTimer(timerId, timerDuration);

        if (selectedTaskId && timerDuration > 0) {
          const taskRes = await fetch(`${API_URL}/api/tasks/${selectedTaskId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const currentTask = await taskRes.json();

          const newTotalTime = (currentTask.timeSpent || 0) + Math.round(timerDuration / 60);

          await fetch(`${API_URL}/api/tasks/${selectedTaskId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ timeSpent: newTotalTime })
          });

          refreshTasks();
        }

        if (selectedClientId) {
          await fetch(`${API_URL}/api/profitability/update-hours/${selectedClientId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
          });

          await fetchClientDetails(selectedClientId);
        }

        if (timerDuration > 180) {
          const points = Math.floor(timerDuration / 60);
          await addExperience(points, `Timer: ${formatDuration(timerDuration)}`);
        }

        // IMPORTANT : Réinitialiser tous les états du timer
        setIsRunning(false);
        setTimerId(null);
        setTimerDuration(0); // Remettre le timer à 00:00:00

        dispatch(setRunningTimer(null));

        dispatch(addNotification({
          message: '⏸️ Timer mis en pause et réinitialisé',
          type: 'success'
        }));
      } catch (error) {
        console.error('Erreur arrêt timer:', error);
        dispatch(addNotification({
          message: 'Erreur lors de l\'arrêt',
          type: 'error'
        }));
      } finally {
        setLoading(false);
      }
    });
  };

  const handleCreateTask = async () => {
    if (!newTaskData.title || !selectedClientId) {
      dispatch(addNotification({
        message: 'Titre et client requis',
        type: 'warning'
      }));
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newTaskData,
          clientId: selectedClientId,
          status: 'à faire',
          timeSpent: 0,
          estimatedTime: 60
        })
      });

      if (!response.ok) {
        throw new Error('Erreur création tâche');
      }

      const responseData = await response.json();

      await fetchClientsAndTasks();

      setSelectedTaskId(responseData._id);
      setSelectedTask(responseData);

      setNewTaskData({
        title: '',
        description: '',
        priority: 'moyenne',
        dueDate: '',
        isHighImpact: false
      });
      setShowNewTaskForm(false);

      dispatch(addNotification({
        message: '✅ Tâche créée et sélectionnée!',
        type: 'success'
      }));
    } catch (error) {
      console.error('Erreur création tâche:', error);
    } finally {
      setLoading(false);
    }
  };

  const showConfirm = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const getRentabilityColor = () => {
    if (!profitability || !targetHourlyRate) return 'text-gray-400';
    if (selectedTask?.isHighImpact) return 'text-amber-600'; // Couleur spéciale pour 80/20
    const ratio = currentHourlyRate / targetHourlyRate;
    if (ratio >= 1.5) return 'text-emerald-600';
    if (ratio >= 1) return 'text-emerald-500';
    if (ratio >= 0.8) return 'text-amber-500';
    return 'text-rose-500';
  };

  const getProgressPercentage = () => {
    if (!profitability || !targetHourlyRate || targetHourlyRate === 0) return 0;
    const hoursNeeded = profitability.revenue / targetHourlyRate;
    const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
    return Math.min((hoursWorked / hoursNeeded) * 100, 100);
  };

  // Bouton flottant si fermé
  if (!showTimerPopup) {
    return (
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => dispatch(toggleTimerPopup(true))}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-[#026aa1] to-[#0487d9] text-white rounded-full shadow-2xl flex items-center justify-center z-50 hover:from-[#024d7a] hover:to-[#026aa1] transition-all duration-300"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </motion.button>
    );
  }

  return (
    <>
      <motion.div
        ref={popupRef}
        drag
        dragControls={dragControls}
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={{
          left: -window.innerWidth + 200,
          right: window.innerWidth - 200,
          top: -window.innerHeight + 200,
          bottom: window.innerHeight - 200
        }}
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className={`fixed z-50 ${sizeStyles[size]} ${isMinimized ? 'h-16' : 'h-auto max-h-[90vh]'} mx-4 md:mx-0`}
        style={{
          bottom: 20,
          right: 20,
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.5)'
        }}
      >
        {/* Header avec drag - MODIFIÉ pour inclure forfait mensuel */}
        <div
          onPointerDown={(e) => dragControls.start(e)}
          className={`p-4 text-white rounded-t-2xl cursor-move transition-all duration-300 ${
            selectedTask?.isHighImpact && isRunning
              ? 'bg-gradient-to-r from-amber-500 to-orange-600'
              : 'bg-gradient-to-r from-[#026aa1] to-[#0487d9]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {selectedClient && (
                <div className="relative flex-shrink-0">
                  <ClientLogo client={selectedClient} size="large" />
                  {isRunning && (
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-lg truncate">
                  {selectedClient?.name || 'Timer'}
                </h3>
                {selectedTask && !isMinimized && (
                  <p className="text-sm opacity-90 truncate">{selectedTask.title}</p>
                )}
              </div>

              {/* Forfait mensuel dans le header */}
              {selectedClient && profitability && !isMinimized && (
                <div className="text-right ml-4">
                  <p className="text-xs uppercase tracking-wider opacity-80">Forfait mensuel</p>
                  <p className="text-xl font-bold">{profitability.revenue || 0}€</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0 ml-3">
              {/* Boutons de taille */}
              {!isMinimized && (
                <div className="hidden md:flex items-center space-x-1 bg-white/20 rounded-lg p-1">
                  <button
                    onClick={() => setSize('small')}
                    className={`p-1 rounded ${size === 'small' ? 'bg-white/30' : 'hover:bg-white/10'}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="8" y="8" width="8" height="8" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSize('medium')}
                    className={`p-1 rounded ${size === 'medium' ? 'bg-white/30' : 'hover:bg-white/10'}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSize('large')}
                    className={`p-1 rounded ${size === 'large' ? 'bg-white/30' : 'hover:bg-white/10'}`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" />
                    </svg>
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>
              <button
                onClick={() => dispatch(hideTimerPopup())}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Contenu - RÉORGANISÉ */}
        {!isMinimized && (
          <div className="p-4 md:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
            {/* Temps investi ce mois - AU DESSUS DU CHRONOMÈTRE */}
            {selectedClient && profitability && (
              <div className="text-center mb-3">
                <p className="text-sm text-gray-600 font-medium">Temps investi ce mois</p>
                <p className="text-2xl font-bold text-gray-800">
                  {formatHoursToHM((profitability.spentHours || 0) + (timerDuration / 3600))}
                </p>
              </div>
            )}

            {/* Timer Display - AMÉLIORÉ AVEC FOND GRIS */}
            <div className="bg-gray-100 rounded-2xl p-6 mb-4 shadow-inner">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-mono font-bold text-gray-800 mb-2 tracking-wider">
                  {formatDuration(timerDuration)}
                </div>
                {isRunning && (
                  <div className="flex justify-center items-center space-x-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm text-emerald-600 font-medium">En cours</span>
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-75" />
                  </div>
                )}
              </div>
            </div>

            {/* Boutons de contrôle - DÉPLACÉS ICI AVANT LES SÉLECTEURS */}
            <div className="flex gap-3 mb-4">
              {!isRunning ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleStartTimer}
                  disabled={loading || !selectedClientId || !selectedTaskId}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Démarrer
                </motion.button>
              ) : (
                <div className="flex gap-3 w-full">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleStopTimer}
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pause
                  </motion.button>

                  {selectedTaskId && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleFinishTask}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-[#026aa1] to-[#0487d9] hover:from-[#024d7a] hover:to-[#026aa1] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Terminer
                    </motion.button>
                  )}
                </div>
              )}
            </div>

            {/* Taux horaire effectif - UTILISE LES DONNÉES SPÉCIFIQUES DU CLIENT */}
            {selectedClient && profitability && (
              <div className={`rounded-xl p-4 text-white mb-4 shadow-lg ${
                selectedTask?.isHighImpact 
                  ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white/90 flex items-center gap-2">
                      {(() => {
                        const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                        return hoursWorked < 1 ? 'Taux horaire' : 'Taux horaire réel';
                      })()}
                      {selectedTask?.isHighImpact && (
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                          80/20 🚀
                        </span>
                      )}
                    </p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold">
                        {(() => {
                          const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                          
                          // Pendant la première heure, afficher le forfait mensuel comme taux horaire
                          if (hoursWorked === 0) {
                            return '—';
                          } else if (hoursWorked < 1) {
                            // Première heure = forfait mensuel complet
                            return profitability.revenue;
                          } else {
                            // Après 1h, afficher le taux horaire réel avec calcul précis
                            const realRate = profitability.revenue / hoursWorked;
                            
                            // Utiliser toFixed pour plus de précision avant l'arrondi
                            if (realRate >= 1000) {
                              return `${(realRate / 1000).toFixed(1)}k`;
                            } else {
                              // Arrondir correctement sans perdre de précision
                              return Math.floor(realRate);
                            }
                          }
                        })()}€
                      </span>
                      <span className="text-sm text-white/80">/h</span>
                    </div>
                    
                    {/* Message adapté selon le temps travaillé */}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-white/70">
                        {(() => {
                          const revenue = profitability.revenue;
                          const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                          
                          if (hoursWorked === 0) {
                            return `Première heure = ${revenue}€ (forfait complet) | 2h = ${Math.round(revenue/2)}€/h | 5h = ${Math.round(revenue/5)}€/h`;
                          } else if (hoursWorked < 1) {
                            const minutesWorked = Math.round(hoursWorked * 60);
                            return `1ère heure en cours (${minutesWorked}min) : Vous gagnez ${revenue}€ pour cette première heure`;
                          } else if (hoursWorked <= 2) {
                            // Afficher le calcul précis pour transparence
                            const hoursDisplay = hoursWorked.toFixed(4);
                            const currentRate = Math.floor(revenue / hoursWorked);
                            return `${revenue}€ ÷ ${hoursDisplay}h = ${currentRate}€/h (était ${revenue}€ la 1ère heure)`;
                          } else {
                            const currentRate = Math.floor(revenue / hoursWorked);
                            const nextHour = Math.ceil(hoursWorked) + 1;
                            const nextRate = Math.floor(revenue / nextHour);
                            return `Actuellement: ${currentRate}€/h → À ${nextHour}h: ${nextRate}€/h`;
                          }
                        })()}
                      </p>
                      
                      {/* Objectif de rentabilité */}
                      {targetHourlyRate > 0 && (
                        <p className="text-xs text-white/60">
                          Objectif: {targetHourlyRate}€/h
                          {(() => {
                            const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                            
                            if (hoursWorked === 0) {
                              const maxHours = profitability.revenue / targetHourlyRate;
                              return ` → Maximum ${Math.round(maxHours)}h/mois pour maintenir cet objectif`;
                            } else if (hoursWorked < 1) {
                              // Pendant la première heure, on dépasse forcément l'objectif
                              return ` ✓ Largement dépassé (${profitability.revenue}€/h) !`;
                            } else {
                              const currentRate = profitability.revenue / hoursWorked;
                              if (currentRate >= targetHourlyRate) {
                                const remainingHours = (profitability.revenue / targetHourlyRate) - hoursWorked;
                                return ` ✓ Atteint ! Encore ${Math.round(Math.max(0, remainingHours))}h possibles`;
                              } else {
                                return ' ⚠️ En dessous de l\'objectif';
                              }
                            }
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Emoji adapté */}
                  <div className="text-center ml-4">
                    <div className="text-4xl">
                      {(() => {
                        const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                        const currentRate = hoursWorked > 0 ? profitability.revenue / hoursWorked : 0;
                        
                        if (selectedTask?.isHighImpact) return '🚀';
                        if (hoursWorked === 0) return '⏳';
                        if (hoursWorked < 1) return '💎'; // Première heure = diamant
                        if (hoursWorked === 1) return '🔥'; // Juste 1h = feu
                        
                        if (currentRate >= targetHourlyRate * 2) return '⭐';
                        if (currentRate >= targetHourlyRate * 1.5) return '✨';
                        if (currentRate >= targetHourlyRate) return '✅';
                        if (currentRate >= targetHourlyRate * 0.8) return '👍';
                        return '⚠️';
                      })()}
                    </div>
                    <p className="text-xs text-white/80 mt-1 font-medium">
                      {(() => {
                        const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                        if (hoursWorked === 0) return 'Prêt';
                        if (hoursWorked < 1) return '1ère heure';
                        if (hoursWorked <= 2) return `${hoursWorked.toFixed(1)}h`;
                        if (hoursWorked <= 5) return `${Math.floor(hoursWorked)}h`;
                        return `${Math.floor(hoursWorked)}h ⚠️`;
                      })()}
                    </p>
                  </div>
                </div>

                {/* SUPPRESSION DU GRAPHIQUE INUTILE */}
              </div>
            )}

            {/* Sélecteurs */}
            <div className="space-y-3 mb-4">
              {/* Client */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Client *</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    if (e.target.value) fetchClientDetails(e.target.value);
                    setSelectedTaskId('');
                    setSelectedTask(null);
                  }}
                  disabled={isRunning}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent disabled:bg-gray-100 transition-all"
                >
                  <option value="">Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>{client.name}</option>
                  ))}
                </select>
              </div>

              {/* Tâche */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-sm font-medium text-gray-700">Tâche *</label>
                  <button
                    onClick={() => setShowNewTaskForm(true)}
                    className="text-xs text-[#026aa1] hover:text-indigo-700 font-medium"
                    disabled={!selectedClientId}
                  >
                    + Nouvelle tâche
                  </button>
                </div>
                <select
                  value={selectedTaskId}
                  onChange={(e) => {
                    setSelectedTaskId(e.target.value);
                    if (e.target.value) fetchTaskDetails(e.target.value);
                  }}
                  disabled={isRunning || !selectedClientId}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent disabled:bg-gray-100 transition-all"
                >
                  <option value="">Sélectionner une tâche</option>
                  {tasks
                    .filter(task => {
                      const taskClientId = task.clientId?._id || task.clientId;
                      return taskClientId === selectedClientId && task.status !== 'terminée';
                    })
                    .map(task => (
                      <option key={task._id} value={task._id}>
                        {task.isHighImpact ? '🚀 ' : ''}{task.title}
                        {task.isHighImpact && ' (80/20)'}
                      </option>
                    ))}
                </select>
              </div>

              {/* Impact de la tâche */}
              {selectedTask && selectedTask.isHighImpact && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-orange-300 rounded-xl relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-400/10 to-orange-400/10 animate-pulse" />
                  <div className="relative flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-orange-800 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Tâche 80/20 - Fort impact
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5">
                        Maximum de valeur, minimum d'effort • Bonus XP x2
                      </p>
                    </div>
                    <span className="text-3xl animate-bounce">🚀</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Message de statut - EN BAS */}
            {selectedClient && profitability && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl p-3 ${
                  selectedTask?.isHighImpact 
                    ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200'
                    : currentHourlyRate >= targetHourlyRate * 1.5 
                      ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-200' 
                      : currentHourlyRate >= targetHourlyRate 
                        ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200' 
                        : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`mt-0.5 ${
                    selectedTask?.isHighImpact ? 'text-amber-600' :
                    currentHourlyRate >= targetHourlyRate ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {selectedTask?.isHighImpact ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    ) : currentHourlyRate >= targetHourlyRate ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${
                      selectedTask?.isHighImpact ? 'text-amber-700' :
                      currentHourlyRate >= targetHourlyRate ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {selectedTask?.isHighImpact ?
                        'Tâche 80/20 - Impact maximal !' :
                        !isRunning && ((profitability.spentHours || 0) + (timerDuration / 3600)) === 0 ?
                          'Prêt à optimiser votre temps' :
                          currentHourlyRate >= targetHourlyRate ?
                            'Objectif de rentabilité atteint' :
                            'Optimisez votre temps'
                      }
                    </p>
                    <p className={`text-xs mt-0.5 ${
                      selectedTask?.isHighImpact ? 'text-amber-600' :
                      currentHourlyRate >= targetHourlyRate ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {(() => {
                        const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                        const hoursForTarget = profitability.revenue / targetHourlyRate;
                        
                        if (selectedTask?.isHighImpact) {
                          const efficiency = currentHourlyRate > 0 ? Math.round((currentHourlyRate / targetHourlyRate) * 100) : 0;
                          if (efficiency >= 200) {
                            return `Performance exceptionnelle sur cette tâche 80/20 ! Vous générez ${(currentHourlyRate / 1000).toFixed(1)}k€/h en vous concentrant sur l'essentiel.`;
                          }
                          return `Cette tâche apporte le maximum de valeur avec le minimum d'effort. Continuez à prioriser les actions à fort impact !`;
                        } else if (hoursWorked === 0) {
                          return `Votre objectif : maintenir un taux supérieur à ${targetHourlyRate}€/h. Maximum ${Math.round(hoursForTarget)}h pour rester rentable.`;
                        } else if (currentHourlyRate >= targetHourlyRate) {
                          const remainingHours = Math.max(0, hoursForTarget - hoursWorked);
                          if (currentHourlyRate >= 1000) {
                            return `Performance exceptionnelle ! Taux actuel : ${(currentHourlyRate / 1000).toFixed(1)}k€/h. Plus vous travaillez efficacement, plus votre valeur horaire reste élevée.`;
                          } else {
                            return `Excellent ! Vous pouvez encore travailler ${Math.round(remainingHours)}h en restant au-dessus de ${targetHourlyRate}€/h`;
                          }
                        } else {
                          return `Pour maintenir ${targetHourlyRate}€/h, limitez-vous à ${Math.round(hoursForTarget)}h ce mois (${Math.round(hoursForTarget - hoursWorked)}h restantes)`;
                        }
                      })()}
                    </p>
                  </div>
                </div>

                {/* Barre de progression simplifiée */}
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(() => {
                          const hoursWorked = (profitability.spentHours || 0) + (timerDuration / 3600);
                          if (hoursWorked === 0) return 0;
                          
                          // Progression basée sur l'efficacité (moins d'heures = mieux)
                          const optimalHours = profitability.revenue / targetHourlyRate;
                          const efficiency = Math.min((optimalHours / hoursWorked) * 100, 100);
                          return efficiency;
                        })()}%`
                      }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-full ${
                        currentHourlyRate >= targetHourlyRate 
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500' 
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-600">
                    <span>Efficacité max</span>
                    <span>Plus d'heures = moins rentable</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>

      {/* Modal de création de tâche */}
      <AnimatePresence>
        {showNewTaskForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewTaskForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-4">Nouvelle tâche</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Titre *</label>
                  <input
                    type="text"
                    value={newTaskData.title}
                    onChange={(e) => setNewTaskData({ ...newTaskData, title: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#026aa1]"
                    placeholder="Nom de la tâche..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#026aa1]"
                    rows={3}
                    placeholder="Détails de la tâche..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Priorité</label>
                  <select
                    value={newTaskData.priority}
                    onChange={(e) => setNewTaskData({ ...newTaskData, priority: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#026aa1]"
                  >
                    <option value="basse">Basse</option>
                    <option value="moyenne">Moyenne</option>
                    <option value="haute">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date d'échéance</label>
                  <input
                    type="date"
                    value={newTaskData.dueDate}
                    onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                    className="mt-1 w-full p-2 border rounded-lg focus:ring-2 focus:ring-[#026aa1]"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTaskData.isHighImpact}
                      onChange={(e) => setNewTaskData({ ...newTaskData, isHighImpact: e.target.checked })}
                      className="w-4 h-4 text-[#026aa1] focus:ring-[#026aa1] border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Tâche 80/20 (fort impact)</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={loading || !newTaskData.title}
                  className="flex-1 px-4 py-2 bg-[#026aa1] text-white rounded-lg hover:bg-[#024d7a] disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
                >
                  Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmation */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-bold mb-2">Confirmation</h3>
              <p className="text-gray-600 mb-6">{confirmMessage}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    confirmAction();
                    setShowConfirmModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-[#026aa1] text-white rounded-lg hover:bg-[#024d7a] transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TimerPopup;