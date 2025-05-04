import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchTasksStart, fetchTasksSuccess, fetchTasksFailure, setTaskFilters } from '../store/slices/tasksSlice';
import { fetchClientsStart, fetchClientsSuccess, fetchClientsFailure } from '../store/slices/clientsSlice';
import { tasksService, clientsService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';

// Interfaces pour typer les données
interface Client {
  _id: string;
  name: string;
}

interface Task {
  _id: string | { _id: string };
  title: string;
  description: string;
  clientId: string | { _id: string; name: string };
  status: string;
  priority: string;
  dueDate: string;
  category: string;
  actionPoints: number;
}

const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const tasksState = useAppSelector(state => state.tasks || {});
  const { tasks = [], filteredTasks = [] as Task[], filters = {}, loading = false, error = null } = tasksState;
  const { clients } = useAppSelector(state => state.clients) as { clients: Client[] };
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les tâches et les clients au chargement de la page
  useEffect(() => {
    console.log("Chargement des tâches...");
    const loadData = async () => {
      try {
        // Charger les tâches
        dispatch(fetchTasksStart());
        const tasksData = await tasksService.getTasks();
        dispatch(fetchTasksSuccess(tasksData));

        // Charger les clients si ce n'est pas déjà fait
        if (clients.length === 0) {
          dispatch(fetchClientsStart());
          const clientsData = await clientsService.getClients();
          dispatch(fetchClientsSuccess(clientsData));
        }
      } catch (error: any) {
        dispatch(fetchTasksFailure(error.message));
        dispatch(addNotification({
          message: 'Erreur lors du chargement des tâches',
          type: 'error'
        }));
      }
    };

    loadData();
  }, [dispatch, clients.length]);

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

  // Obtenir le nom du client à partir de son ID
  const getClientName = (clientId: string | { _id: string; name: string }) => {
    if (typeof clientId === 'object' && clientId !== null) return clientId.name;
    const client = clients.find(c => c._id === clientId);
    return client ? client.name : 'Client inconnu';
  };

  // Formater la date d'échéance
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Vérifier si la date est aujourd'hui, demain ou plus tard
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Obtenir la couleur en fonction de la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'haute':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'moyenne':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'basse':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Obtenir la couleur en fonction du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'à faire':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'en cours':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'terminée':
        return 'bg-green-100 text-green-800 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Obtenir l'icône en fonction de la catégorie
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'campagne':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        );
      case 'landing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        );
      case 'rapport':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'email':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'reunion':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'tracking':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'cro':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tâches</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Gérez vos tâches pour chaque client</p>
        </div>
        <button
          onClick={handleCreateTask}
          className="mt-4 md:mt-0 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvelle tâche
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Rechercher
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="tous">Tous</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
          {error}
        </div>
      ) : displayedTasks.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune tâche trouvée</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {searchTerm || Object.values(filters).some(v => v !== undefined)
              ? "Aucune tâche ne correspond à vos critères de recherche."
              : "Vous n'avez pas encore ajouté de tâches."}
          </p>
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Ajouter une tâche
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedTasks.map((task) => (
            <motion.div
              key={typeof task._id === 'object' ? task._id._id : task._id}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleTaskClick(task._id)}
            >
              <div className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div className="mr-2 text-gray-600 dark:text-gray-300">
                        {getCategoryIcon(task.category)}
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h2>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{task.description}</p>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Client: <span>{getClientName(task.clientId)}</span>
                      </span>
                      <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Échéance: <span className="font-medium">{formatDueDate(task.dueDate)}</span>
                      </span>
                      <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Points: <span className="font-medium">{task.actionPoints}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center mt-3 md:mt-0 space-x-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    <span className={`px-3 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                    {task.status !== 'terminée' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // Appel API pour marquer comme terminée
                            await tasksService.updateTask(task._id, { status: 'terminée' });
                            dispatch(addNotification({ message: 'Tâche marquée comme terminée', type: 'success' }));
                            // Recharge la liste
                            dispatch(fetchTasksStart());
                            const tasksData = await tasksService.getTasks();
                            dispatch(fetchTasksSuccess(tasksData));
                          } catch (error) {
                            dispatch(addNotification({ message: "Erreur lors de la complétion", type: "error" }));
                          }
                        }}
                        className="ml-2 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                      >
                        Terminer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;
