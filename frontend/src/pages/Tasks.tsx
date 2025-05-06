import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setTaskFilters } from '../store/slices/tasksSlice';
import { addNotification } from '../store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { tasksService } from '../services/api';
import ClientLogo from '../components/Clients/ClientLogo';
import { format, isBefore, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';

// Interfaces pour typer les données
interface Client {
  _id: string;
  name: string;
  logo?: string;
}

interface Task {
  _id: string | { _id: string };
  title: string;
  description: string;
  clientId: string | { _id: string; name: string; logo?: string };
  status: string;
  priority: string;
  dueDate: string;
  category: string;
  actionPoints: number;
}

const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tasks, loading, error, refreshTasks } = useTasks();
  const { clients } = useAppSelector(state => state.clients) as { clients: Client[] };
  const [searchTerm, setSearchTerm] = useState('');
  const tasksState = useAppSelector(state => state.tasks || {});
  const { filteredTasks = [] as Task[], filters = {} } = tasksState;
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Fonction pour après la création d'une tâche
  const handleTaskCreated = () => {
    refreshTasks();
  };

  // Appliquer les filtres
  const handleFilterChange = (filterName: string, value: string) => {
    dispatch(setTaskFilters({
      ...filters,
      [filterName]: value === 'tous' ? undefined : value
    }));
  };

  // Filtrer les tâches en fonction de la recherche
  const displayedTasks: Task[] = searchTerm
    ? filteredTasks.filter((task: Task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    : filteredTasks.filter((task: Task) => {
      if (filters.clientId) {
        const taskClientId = typeof task.clientId === 'object' ? task.clientId._id : task.clientId;
        if (taskClientId !== filters.clientId) return false;
      }
      return true;
    });

  // Naviguer vers la page de détail de la tâche
  const handleTaskClick = (taskId: string | any) => {
    const id = typeof taskId === 'object' ? taskId._id : taskId;
    navigate(`/tasks/${id}`);
  };

  // Naviguer vers la page de création de tâche
  const handleCreateTask = () => {
    navigate('/tasks/new');
  };

  // Obtenir le client à partir de son ID
  const getClient = (clientId: string | { _id: string; name: string; logo?: string }): Client => {
    if (typeof clientId === 'object' && clientId !== null) 
      return { _id: clientId._id, name: clientId.name, logo: clientId.logo };
    
    const client = clients.find(c => c._id === clientId);
    return client || { _id: '', name: 'Client inconnu' };
  };

  // Formater la date d'échéance et obtenir son statut
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    let status: 'overdue' | 'today' | 'tomorrow' | 'upcoming' = 'upcoming';
    
    // Vérifier le statut de la date
    if (isBefore(date, today) && !isToday(date)) {
      status = 'overdue';
    } else if (isToday(date)) {
      status = 'today';
    } else if (isTomorrow(date)) {
      status = 'tomorrow';
    }

    // Formater la date
    const formattedDate = format(date, 'dd MMM', { locale: fr });

    return {
      text: status === 'today' ? 'Aujourd\'hui' : 
            status === 'tomorrow' ? 'Demain' : 
            formattedDate,
      status
    };
  };

  // Style des éléments pour un affichage cohérent
  const styles = {
    priority: {
      'urgente': {
        bg: 'bg-gradient-to-r from-red-500 to-red-600',
        text: 'text-white',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        )
      },
      'haute': {
        bg: 'bg-gradient-to-r from-orange-400 to-orange-500',
        text: 'text-white',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        )
      },
      'moyenne': {
        bg: 'bg-gradient-to-r from-yellow-400 to-yellow-500',
        text: 'text-gray-800',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      },
      'basse': {
        bg: 'bg-gradient-to-r from-green-400 to-green-500',
        text: 'text-white',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      }
    },
    status: {
      'à faire': {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-200',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      },
      'en cours': {
        bg: 'bg-gradient-to-r from-blue-400 to-blue-500',
        text: 'text-white',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )
      },
      'terminée': {
        bg: 'bg-gradient-to-r from-green-400 to-green-500',
        text: 'text-white',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        )
      }
    },
    dueDate: {
      'overdue': {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      },
      'today': {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-800 dark:text-amber-200',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        )
      },
      'tomorrow': {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-800 dark:text-blue-200',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )
      },
      'upcoming': {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-800 dark:text-gray-200',
        icon: (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        )
      }
    },
    category: {
      'campagne': {
        icon: (
          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        )
      },
      'landing': {
        icon: (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        )
      },
      'rapport': {
        icon: (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      },
      'email': {
        icon: (
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      },
      'reunion': {
        icon: (
          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      },
      'tracking': {
        icon: (
          <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        )
      },
      'cro': {
        icon: (
          <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        )
      },
      'default': {
        icon: (
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
      }
    }
  };

  // Rendu d'une carte de tâche
  const renderTaskCard = (task: Task) => {
    const taskId = typeof task._id === 'object' ? task._id._id : task._id;
    const client = getClient(task.clientId);
    const { text: dueDateText, status: dueDateStatus } = formatDueDate(task.dueDate);
    const priorityStyle = styles.priority[task.priority as keyof typeof styles.priority] || styles.priority.basse;
    const statusStyle = styles.status[task.status as keyof typeof styles.status] || styles.status['à faire'];
    const dueDateStyle = styles.dueDate[dueDateStatus as keyof typeof styles.dueDate];
    const categoryStyle = styles.category[task.category as keyof typeof styles.category] || styles.category.default;

    return (
      <motion.div
        key={taskId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer transition-all duration-200 ${viewMode === 'grid' ? 'h-full' : ''}`}
        onClick={() => handleTaskClick(task._id)}
      >
        {viewMode === 'list' ? (
          <div className="flex flex-col md:flex-row">
            {/* Section gauche: Client + Catégorie */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900/30 p-4 flex items-center">
              <div className="flex-shrink-0">
                <ClientLogo client={client} size="medium" shape="rounded" className="mr-3" />
              </div>
              <div className="ml-3">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-1">{client.name}</h3>
                <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                  {categoryStyle.icon}
                  <span className="ml-1">{task.category.charAt(0).toUpperCase() + task.category.slice(1)}</span>
                </div>
              </div>
            </div>
            
            {/* Section principale: Titre, Description, Metadata */}
            <div className="flex-1 p-4">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{task.title}</h2>
                <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{task.description}</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {/* Badges de statut, priorité, etc. */}
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
                  {priorityStyle.icon}
                  <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
                </div>
                
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                  {statusStyle.icon}
                  <span>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
                </div>
                
                <div className={`inline-flex items-center px-2.5 py-1 rounded-full ${dueDateStyle.bg} ${dueDateStyle.text}`}>
                  {dueDateStyle.icon}
                  <span>{dueDateText}</span>
                </div>
                
                {task.actionPoints > 0 && (
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span>{task.actionPoints} pts</span>
                  </div>
                )}
                
                {/* Boutons d'action */}
                {task.status !== 'terminée' && (
                  <div className="ml-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        tasksService.updateTask(
                          typeof task._id === 'object' ? (task._id as any)._id : task._id,
                          { status: 'terminée' }
                        ).then(() => {
                          dispatch(addNotification({ message: 'Tâche marquée comme terminée', type: 'success' }));
                          refreshTasks();
                        }).catch(() => {
                          dispatch(addNotification({ message: "Erreur lors de la mise à jour", type: "error" }));
                        });
                      }}
                      className="inline-flex items-center px-2.5 py-1 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Terminer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Mode grille
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center mb-3">
              <ClientLogo client={client} size="small" shape="rounded" className="mr-2" />
              <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{client.name}</span>
            </div>
            
            <div className="mb-3 flex-1">
              <div className="flex items-center mb-2">
                {categoryStyle.icon}
                <h2 className="text-base font-semibold text-gray-900 dark:text-white ml-2 line-clamp-1">{task.title}</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">{task.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-2">
              <div className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${priorityStyle.bg} ${priorityStyle.text}`}>
                {priorityStyle.icon}
                <span>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</span>
              </div>
              
              <div className={`inline-flex items-center px-2 py-0.5 text-xs rounded-full ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.icon}
                <span>{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-auto">
              <div className={`inline-flex items-center ${dueDateStyle.text}`}>
                {dueDateStyle.icon}
                <span>{dueDateText}</span>
              </div>
              
              {task.actionPoints > 0 && (
                <span className="inline-flex items-center text-indigo-600 dark:text-indigo-400">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {task.actionPoints} pts
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="container mx-auto px-4">
      {/* En-tête avec titre et bouton d'action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 mt-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tâches</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Gérez vos tâches pour chaque client</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-1">
            <div className="flex">
              <button
                className={`px-3 py-1 rounded-md ${viewMode === 'list' ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('list')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                className={`px-3 py-1 rounded-md ${viewMode === 'grid' ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                onClick={() => setViewMode('grid')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center shadow-sm"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
                placeholder="Rechercher une tâche..."
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Statut
            </label>
            <select
              id="status"
              value={filters.status || 'tous'}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="tous">Tous</option>
              <option value="à faire">À faire</option>
              <option value="en cours">En cours</option>
              <option value="terminée">Terminée</option>
            </select>
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priorité
            </label>
            <select
              id="priority"
              value={filters.priority || 'tous'}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="tous">Toutes</option>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
          <div>
            <label htmlFor="client" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client
            </label>
            <select
              id="client"
              value={filters.clientId || 'tous'}
              onChange={(e) => handleFilterChange('clientId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="tous">Tous</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des tâches...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 p-4 rounded-xl shadow-sm mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      ) : displayedTasks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center"
        >
          <div className="bg-gray-50 dark:bg-gray-900/30 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Aucune tâche trouvée</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
            {searchTerm || Object.values(filters).some(v => v !== undefined)
              ? "Aucune tâche ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore ajouté de tâches."}
          </p>
          <button
            onClick={handleCreateTask}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors inline-flex items-center shadow-md"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Créer votre première tâche
          </button>
        </motion.div>
      ) : (
        <AnimatePresence>
          {viewMode === 'list' ? (
            <div className="space-y-4">
              {displayedTasks.map((task) => renderTaskCard(task))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedTasks.map((task) => renderTaskCard(task))}
            </div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default Tasks;
