import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  fetchRunningTimer,
  startTimer,
  pauseTimer,
  resumeTimer,
  stopTimer,
  hideTimerPopup,
  setTimerPopupSize,
  setTimerPopupPosition,
  updateRunningTimerDuration,
  toggleTimerPopup
} from '../../store/slices/timerSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

const TimerPopup: React.FC = () => {
  const dispatch = useDispatch();

  // Récupération sécurisée des états avec des valeurs par défaut
  const timerState = useSelector((state: RootState) => state.timer || {});
  const {
    runningTimer = null,
    showTimerPopup: timerPopupVisible = false,
    timerPopupSize = 'medium',
    timerPopupPosition = 'bottom-right'
  } = timerState;

  // Récupération des clients et tâches (avec valeurs par défaut)
  const clientsState = useSelector((state: RootState) => state.clients || {});
  const { clients = [] } = clientsState;
  
  const tasksState = useSelector((state: RootState) => state.tasks || {});
  const { tasks = [] } = tasksState;

  // États locaux
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [timerDuration, setTimerDuration] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Données de démonstration pour le développement
  const dummyClients = [
    { _id: 'client1', name: 'Client A' },
    { _id: 'client2', name: 'Client B' },
    { _id: 'client3', name: 'Client C' },
  ];
  
  const dummyTasks = [
    { _id: 'task1', title: 'Campagne Google Ads' },
    { _id: 'task2', title: 'Rapport mensuel' },
    { _id: 'task3', title: 'Optimisation landing page' },
  ];

  // Formater la durée en HH:MM:SS
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Charger le timer en cours au chargement du composant
  useEffect(() => {
    dispatch(fetchRunningTimer());

    // Mettre à jour la durée du timer toutes les secondes
    const intervalId = setInterval(() => {
      if (isRunning) {
        dispatch(updateRunningTimerDuration());
        if (runningTimer) {
          setTimerDuration(runningTimer.duration || 0);
        }
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [dispatch, isRunning, runningTimer]);

  // Mettre à jour l'état local lorsque runningTimer change
  useEffect(() => {
    if (runningTimer) {
      setIsRunning(runningTimer.isRunning || false);
      setTimerDuration(runningTimer.duration || 0);

      if (runningTimer.clientId) {
        setSelectedClientId(runningTimer.clientId);
        setSelectedTaskId('');
      } else if (runningTimer.taskId) {
        setSelectedTaskId(runningTimer.taskId);
        setSelectedClientId('');
      }
    } else {
      setIsRunning(false);
      setTimerDuration(0);
    }
  }, [runningTimer]);

  // Démarrer un timer pour un client
  const handleStartClientTimer = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedTaskId('');
    setIsRunning(true);
    dispatch(startTimer(clientId, 'client'));
  };

  // Démarrer un timer pour une tâche
  const handleStartTaskTimer = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSelectedClientId('');
    setIsRunning(true);
    dispatch(startTimer(taskId, 'task'));
  };

  // Mettre en pause le timer en cours
  const handlePauseTimer = () => {
    setIsRunning(false);
    if (selectedClientId) {
      dispatch(pauseTimer(selectedClientId, 'client'));
    } else if (selectedTaskId) {
      dispatch(pauseTimer(selectedTaskId, 'task'));
    }
  };

  // Reprendre le timer en pause
  const handleResumeTimer = () => {
    setIsRunning(true);
    if (selectedClientId) {
      dispatch(resumeTimer(selectedClientId, 'client'));
    } else if (selectedTaskId) {
      dispatch(resumeTimer(selectedTaskId, 'task'));
    }
  };

  // Arrêter le timer en cours
  const handleStopTimer = () => {
    setIsRunning(false);
    setTimerDuration(0);
    if (selectedClientId) {
      dispatch(stopTimer(selectedClientId, 'client'));
    } else if (selectedTaskId) {
      dispatch(stopTimer(selectedTaskId, 'task'));
    }
    setSelectedClientId('');
    setSelectedTaskId('');
  };

  // Afficher le timer
  const handleShowTimer = () => {
    dispatch(toggleTimerPopup(true));
  };

  // Fermer la popup
  const handleClosePopup = () => {
    dispatch(hideTimerPopup());
  };

  // Changer la taille de la popup
  const handleChangeSize = (size: 'small' | 'medium' | 'large') => {
    dispatch(setTimerPopupSize(size));
  };

  // Changer la position de la popup
  const handleChangePosition = (position: 'top-right' | 'bottom-right' | 'center') => {
    dispatch(setTimerPopupPosition(position));
  };

  // Si la popup n'est pas visible, afficher uniquement un bouton flottant
  if (!timerPopupVisible) {
    return (
      <button
        onClick={handleShowTimer}
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
    small: 'w-64 h-48',
    medium: 'w-80 h-64',
    large: 'w-96 h-80'
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
  };

  // Fonction pour obtenir le nom du client
  const getClientName = (id: string): string => {
    // Utiliser les vraies données si disponibles, sinon les données de démo
    if (clients && clients.length > 0) {
      const client = clients.find((c: any) => c._id === id);
      return client ? client.name : 'Client inconnu';
    } else {
      const dummyClient = dummyClients.find(c => c._id === id);
      return dummyClient ? dummyClient.name : 'Client inconnu';
    }
  };

  // Fonction pour obtenir le titre de la tâche
  const getTaskTitle = (id: string): string => {
    // Utiliser les vraies données si disponibles, sinon les données de démo
    if (tasks && tasks.length > 0) {
      const task = tasks.find((t: any) => t._id === id);
      return task ? task.title : 'Tâche inconnue';
    } else {
      const dummyTask = dummyTasks.find(t => t._id === id);
      return dummyTask ? dummyTask.title : 'Tâche inconnue';
    }
  };

  // Déterminer quels clients/tâches afficher
  const clientsToShow = clients && clients.length > 0 ? clients : dummyClients;
  const tasksToShow = tasks && tasks.length > 0 ? tasks : dummyTasks;

  return (
    <div className={`fixed ${positionClasses[timerPopupPosition]} ${sizeClasses[timerPopupSize]} bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 z-50 border border-gray-200 dark:border-gray-700`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedClientId ? getClientName(selectedClientId) : ''}
          {selectedTaskId ? getTaskTitle(selectedTaskId) : ''}
          {!selectedClientId && !selectedTaskId ? 'Chronomètre' : ''}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => handleChangeSize('small')}
            className={`w-4 h-4 rounded-full ${timerPopupSize === 'small' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Petit"
          />
          <button
            onClick={() => handleChangeSize('medium')}
            className={`w-4 h-4 rounded-full ${timerPopupSize === 'medium' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Moyen"
          />
          <button
            onClick={() => handleChangeSize('large')}
            className={`w-4 h-4 rounded-full ${timerPopupSize === 'large' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Grand"
          />
          <button
            onClick={handleClosePopup}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center mb-4">
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {formatDuration(timerDuration)}
        </div>
        <div className="flex space-x-2">
          {isRunning ? (
            <button
              onClick={handlePauseTimer}
              className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={handleResumeTimer}
              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              disabled={!selectedClientId && !selectedTaskId}
            >
              {timerDuration > 0 ? 'Reprendre' : 'Démarrer'}
            </button>
          )}
          <button
            onClick={handleStopTimer}
            className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
            disabled={!selectedClientId && !selectedTaskId}
          >
            Arrêter
          </button>
        </div>
      </div>

      {!selectedClientId && !selectedTaskId && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Clients</h4>
          <div className="max-h-24 overflow-y-auto">
            {clientsToShow.map((client: any) => (
              <button
                key={client._id}
                onClick={() => handleStartClientTimer(client._id)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md mb-1"
              >
                {client.name}
              </button>
            ))}
          </div>

          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-3 mb-2">Tâches</h4>
          <div className="max-h-24 overflow-y-auto">
            {tasksToShow.map((task: any) => (
              <button
                key={task._id}
                onClick={() => handleStartTaskTimer(task._id)}
                className="w-full text-left px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md mb-1"
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-2 right-2">
        <div className="flex space-x-1">
          <button
            onClick={() => handleChangePosition('top-right')}
            className={`w-4 h-4 rounded-sm ${timerPopupPosition === 'top-right' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="En haut à droite"
          />
          <button
            onClick={() => handleChangePosition('bottom-right')}
            className={`w-4 h-4 rounded-sm ${timerPopupPosition === 'bottom-right' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="En bas à droite"
          />
          <button
            onClick={() => handleChangePosition('center')}
            className={`w-4 h-4 rounded-sm ${timerPopupPosition === 'center' ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'}`}
            title="Au centre"
          />
        </div>
      </div>
    </div>
  );
};

export default TimerPopup;
