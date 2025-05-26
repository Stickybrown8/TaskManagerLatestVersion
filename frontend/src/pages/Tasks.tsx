import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { setTaskFilters } from '../store/slices/tasksSlice';
import { addNotification } from '../store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { useTasks } from '../hooks/useTasks';
import { tasksService } from '../services/api';

// Interfaces
interface Client {
  _id: string;
  name: string;
  logo?: string;
  status?: string;
  description?: string;
}

interface Task {
  _id: string | { _id: string };
  title: string;
  description: string;
  clientId: string | { _id: string; name: string };
  status: 'à faire' | 'en cours' | 'terminée';
  priority: 'basse' | 'moyenne' | 'haute' | 'urgente';
  dueDate: string;
  category: string;
  actionPoints?: number;
  timeSpent?: number; // Changé de actualTime
  estimatedTime?: number;
  isHighImpact?: boolean;
  createdAt?: string;
  completedAt?: string;
}

interface ClientProfitability {
  clientId: string;
  spentHours: number;
  revenue: number;
  hourlyRate: number;
  targetHours: number;
}

const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tasks, loading, error, refreshTasks } = useTasks();
  const { clients } = useAppSelector(state => state.clients) as { clients: Client[] };
  const [localClients, setLocalClients] = useState<Client[]>([]);
  const [clientsProfitability, setClientsProfitability] = useState<Record<string, ClientProfitability>>({});
  
  // États
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  
  // État pour la création de tâche
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    clientId: '',
    priority: 'moyenne' as const,
    dueDate: '',
    estimatedTime: 60,
    isHighImpact: false,
    category: 'autre'
  });

  // Charger les clients et la rentabilité au montage
  useEffect(() => {
    fetchClients();
    fetchAllClientsProfitability();
  }, []);

  const fetchClients = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLocalClients(data);
      }
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  // NOUVEAU : Récupérer la rentabilité de tous les clients
  const fetchAllClientsProfitability = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/profitability`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const profitabilityMap: Record<string, ClientProfitability> = {};
        data.forEach((prof: any) => {
          profitabilityMap[prof.clientId._id || prof.clientId] = prof;
        });
        setClientsProfitability(profitabilityMap);
      }
    } catch (error) {
      console.error('Erreur chargement rentabilité:', error);
    }
  };

  // Utiliser localClients si clients du store est vide
  const allClients = clients.length > 0 ? clients : localClients;
  const getTaskId = (taskId: string | { _id: string }): string => {
    return typeof taskId === 'object' ? taskId._id : taskId;
  };

  const getClientId = (clientId: string | { _id: string; name: string }): string => {
    if (typeof clientId === 'object' && clientId !== null) {
      return clientId._id;
    }
    return clientId;
  };

  const getClientName = (clientId: string | { _id: string; name: string }) => {
    if (typeof clientId === 'object' && clientId !== null) return clientId.name;
    const client = allClients.find(c => c._id === clientId);
    return client ? client.name : 'Client inconnu';
  };

  // Filtrage des tâches
  const filteredTasks = tasks.filter((task: Task) => {
    const matchSearch = searchTerm === '' || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const taskClientId = getClientId(task.clientId);
    const matchClient = selectedClient === 'all' || taskClientId === selectedClient;
    const matchStatus = selectedStatus === 'all' || task.status === selectedStatus;
    
    return matchSearch && matchClient && matchStatus;
  });

  // Grouper les tâches par client
  const tasksByClient = filteredTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    const clientId = getClientId(task.clientId);
    if (!acc[clientId]) {
      acc[clientId] = [];
    }
    acc[clientId].push(task);
    return acc;
  }, {});

  // AMÉLIORÉ : Calcul des statistiques par client avec rentabilité
  const getClientStats = (clientTasks: Task[], clientId: string) => {
    const completed = clientTasks.filter(t => t.status === 'terminée');
    const inProgress = clientTasks.filter(t => t.status === 'en cours');
    const todo = clientTasks.filter(t => t.status === 'à faire');
    
    // Calculer le temps total du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const monthlyTasks = completed.filter(t => {
      if (!t.completedAt) return false;
      return new Date(t.completedAt) >= startOfMonth;
    });
    
    const monthlyMinutes = monthlyTasks.reduce((sum, t) => sum + (t.timeSpent || 0), 0);
    const monthlyHours = monthlyMinutes / 60;
    
    // Récupérer les infos de rentabilité
    const profitability = clientsProfitability[clientId];
    const budget = profitability?.revenue || 0;
    const targetHours = profitability?.targetHours || 40;
    const hourlyRate = profitability?.hourlyRate || 100;
    
    // Calculer le taux horaire actuel
    let currentHourlyRate = 0;
    if (monthlyHours > 0 && budget > 0) {
      currentHourlyRate = budget / monthlyHours;
    } else if (budget > 0) {
      // Taux théorique si pas encore d'heures
      currentHourlyRate = budget / 160; // Base 160h/mois
    }
    
    // Calcul du pourcentage de progression et budget
    const progress = clientTasks.length > 0 ? (completed.length / clientTasks.length) * 100 : 0;
    const budgetConsumed = monthlyHours > 0 ? (monthlyHours / targetHours) * 100 : 0;
    
    return {
      total: clientTasks.length,
      completed: completed.length,
      inProgress: inProgress.length,
      todo: todo.length,
      monthlyMinutes,
      monthlyHours,
      budget,
      targetHours,
      hourlyRate,
      currentHourlyRate,
      progress,
      budgetConsumed
    };
  };

  // Toggle expansion client
  const toggleClientExpansion = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  // Création de tâche
  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.clientId) {
      dispatch(addNotification({
        message: '⚠️ Veuillez remplir tous les champs obligatoires',
        type: 'warning'
      }));
      return;
    }

    try {
      const taskData = {
        ...newTask,
        status: 'à faire' as const,
        timeSpent: 0, // Changé de actualTime
        actionPoints: newTask.isHighImpact ? 10 : 5
      };

      await tasksService.createTask(taskData);
      
      dispatch(addNotification({
        message: '✅ Tâche créée avec succès!',
        type: 'success'
      }));
      
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        clientId: '',
        priority: 'moyenne',
        dueDate: '',
        estimatedTime: 60,
        isHighImpact: false,
        category: 'autre'
      });
      
      refreshTasks();
    } catch (error) {
      console.error('Erreur création:', error);
      dispatch(addNotification({
        message: '❌ Erreur lors de la création de la tâche',
        type: 'error'
      }));
    }
  };

  // Mise à jour du statut
  const handleStatusUpdate = async (taskId: string, newStatus: string) => {
    try {
      if (newStatus === 'terminée') {
        // Utiliser la route /complete pour bénéficier de la gamification
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/tasks/${taskId}/complete`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.rewards) {
            dispatch(addNotification({
              message: `🎉 Tâche terminée! +${data.rewards.points} points, +${data.rewards.experience} XP`,
              type: 'success'
            }));
          }
        }
      } else {
        await tasksService.updateTask(taskId, { status: newStatus });
      }
      
      refreshTasks();
      fetchAllClientsProfitability(); // Rafraîchir la rentabilité
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      dispatch(addNotification({
        message: '❌ Erreur lors de la mise à jour',
        type: 'error'
      }));
    }
  };

  // Suppression de tâche
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) return;
    
    try {
      await tasksService.deleteTask(taskId);
      dispatch(addNotification({
        message: '🗑️ Tâche supprimée',
        type: 'success'
      }));
      refreshTasks();
    } catch (error) {
      console.error('Erreur suppression:', error);
      dispatch(addNotification({
        message: '❌ Erreur lors de la suppression',
        type: 'error'
      }));
    }
  };

  // Formatage
  const formatTime = (minutes?: number) => {
    if (!minutes) return '0h';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1) + 'h';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'border-l-4 border-red-500';
      case 'haute': return 'border-l-4 border-orange-500';
      case 'moyenne': return 'border-l-4 border-yellow-500';
      case 'basse': return 'border-l-4 border-green-500';
      default: return 'border-l-4 border-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgente': return '🔴';
      case 'haute': return '🟠';
      case 'moyenne': return '🟡';
      case 'basse': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'terminée': return '✅';
      case 'en cours': return '🏃';
      case 'à faire': return '📋';
      default: return '📋';
    }
  };

  // Couleur du taux horaire
  const getHourlyRateColor = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return 'text-emerald-600';
    if (ratio >= 0.8) return 'text-amber-600';
    return 'text-red-600';
  };

  // Composant Logo Client
  const ClientLogo = ({ client }: { client: Client }) => {
    if (client.logo) {
      return (
        <img 
          src={client.logo} 
          alt={client.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
      );
    }
    
    return (
      <div className="w-12 h-12 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white font-bold text-lg">
        {client.name.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header moderne */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mes Tâches</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {tasks.length} tâches • {tasksByClient && Object.keys(tasksByClient).length} clients actifs • Mois en cours
              </p>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#026aa1] hover:bg-[#0487d9] text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle tâche
            </button>
          </div>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-2">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tous les statuts</option>
                <option value="à faire">📋 À faire</option>
                <option value="en cours">🏃 En cours</option>
                <option value="terminée">✅ Terminées</option>
              </select>

              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white"
              >
                <option value="all">Tous les clients</option>
                {allClients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#026aa1]"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-6 rounded-2xl">
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : Object.keys(tasksByClient).length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune tâche trouvée</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Commencez par créer votre première tâche
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 text-[#026aa1] hover:text-[#0487d9] font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Créer une tâche
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {Object.entries(tasksByClient).map(([clientId, clientTasks]) => {
              const client = allClients.find(c => c._id === clientId);
              const stats = getClientStats(clientTasks as Task[], clientId);
              const isExpanded = expandedClients.has(clientId);
              
              return (
                <motion.div
                  key={clientId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden"
                >
                  {/* En-tête du client AMÉLIORÉ */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => toggleClientExpansion(clientId)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {client && <ClientLogo client={client} />}
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {client?.name || 'Sans client'}
                          </h2>
                          <div className="flex items-center gap-6 mt-2 text-sm text-gray-600 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="font-medium text-gray-900 dark:text-white">{stats.total}</span> tâches
                            </span>
                            <span className="flex items-center gap-1">
                              {getStatusIcon('terminée')} <span className="font-medium text-green-600">{stats.completed}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              {getStatusIcon('en cours')} <span className="font-medium text-blue-600">{stats.inProgress}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              {getStatusIcon('à faire')} <span className="font-medium text-gray-600">{stats.todo}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        {/* NOUVEAU : Informations de rentabilité */}
                        <div className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <span className="text-sm text-gray-600">Ce mois:</span>
                            <span className="font-bold text-lg text-gray-900 dark:text-white">
                              {formatHours(stats.monthlyHours)}
                            </span>
                          </div>
                          {stats.budget > 0 && (
                            <>
                              <div className="flex items-center gap-2 justify-end mt-1">
                                <span className="text-xs text-gray-500">Taux:</span>
                                <span className={`font-medium ${getHourlyRateColor(stats.currentHourlyRate, stats.hourlyRate)}`}>
                                  {Math.round(stats.currentHourlyRate)}€/h
                                </span>
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-gray-500">Budget:</span>
                                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div 
                                      className={`h-1.5 rounded-full transition-all duration-500 ${
                                        stats.budgetConsumed > 100 ? 'bg-red-500' :
                                        stats.budgetConsumed > 80 ? 'bg-amber-500' :
                                        'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(stats.budgetConsumed, 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-medium">
                                    {Math.round(stats.budgetConsumed)}%
                                  </span>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        
                        {/* Barre de progression des tâches */}
                        <div className="hidden sm:block">
                          <div className="flex items-center gap-3">
                            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-[#026aa1] to-[#0487d9] h-2 rounded-full transition-all duration-500"
                                style={{ width: `${stats.progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {Math.round(stats.progress)}%
                            </span>
                          </div>
                        </div>
                        
                        {/* Chevron */}
                        <svg 
                          className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Liste des tâches */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                          {(clientTasks as Task[]).map((task) => {
                            const taskId = getTaskId(task._id);
                            
                            return (
                              <div
                                key={taskId}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${getPriorityColor(task.priority)}`}
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-start gap-3">
                                      <div className="mt-1">
                                        <span className="text-lg">{getStatusIcon(task.status)}</span>
                                      </div>
                                      <div className="flex-1">
                                        <h3 className={`font-medium text-gray-900 dark:text-white ${task.status === 'terminée' ? 'line-through opacity-60' : ''}`}>
                                          {task.title}
                                        </h3>
                                        {task.description && (
                                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                            {task.description}
                                          </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            {formatDate(task.dueDate)}
                                          </span>
                                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatTime(task.timeSpent)} / {formatTime(task.estimatedTime)}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            {getPriorityBadge(task.priority)} {task.priority}
                                          </span>
                                          {task.isHighImpact && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 rounded-full font-medium">
                                              🚀 80/20
                                            </span>
                                          )}
                                          {task.actionPoints && (
                                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-medium">
                                              🏆 {task.actionPoints} pts
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Actions */}
                                  <div className="flex items-center gap-2">
                                    {task.status !== 'terminée' && (
                                      <select
                                        value={task.status}
                                        onChange={(e) => handleStatusUpdate(taskId, e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white"
                                      >
                                        <option value="à faire">À faire</option>
                                        <option value="en cours">En cours</option>
                                        <option value="terminée">Terminée</option>
                                      </select>
                                    )}
                                    
                                    <button
                                      onClick={() => navigate(`/tasks/${taskId}`)}
                                      className="p-2 text-[#026aa1] hover:bg-[#026aa1]/10 rounded-lg transition-colors"
                                      title="Voir les détails"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                      </svg>
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteTask(taskId)}
                                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                      title="Supprimer"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de création (inchangé) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-[#026aa1] p-6 text-white">
                <h2 className="text-2xl font-bold">Nouvelle tâche</h2>
              </div>
              
              {/* Contenu */}
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Ex: Créer la landing page"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Client *
                  </label>
                  <select
                    value={newTask.clientId}
                    onChange={(e) => setNewTask({...newTask, clientId: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    <option value="">Sélectionner un client</option>
                    {allClients.map(client => (
                      <option key={client._id} value={client._id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Détails de la tâche..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priorité
                    </label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="basse">🟢 Basse</option>
                      <option value="moyenne">🟡 Moyenne</option>
                      <option value="haute">🟠 Haute</option>
                      <option value="urgente">🔴 Urgente</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date d'échéance
                    </label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temps estimé (minutes)
                  </label>
                  <input
                    type="number"
                    value={newTask.estimatedTime}
                    onChange={(e) => setNewTask({...newTask, estimatedTime: parseInt(e.target.value) || 0})}
                    min="0"
                    step="15"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTask.isHighImpact}
                      onChange={(e) => setNewTask({...newTask, isHighImpact: e.target.checked})}
                      className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">🚀 Tâche à fort impact (80/20)</span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                        Cette tâche fait partie des 20% qui apportent 80% des résultats
                      </p>
                    </div>
                  </label>
                </div>
                
                {newTask.isHighImpact && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl"
                  >
                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                      ✨ Cette tâche bénéficiera d'un bonus XP x2 !
                    </p>
                  </motion.div>
                )}
              </div>
              
              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900 flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTask.title || !newTask.clientId}
                  className="px-6 py-2.5 bg-[#026aa1] hover:bg-[#0487d9] text-white rounded-xl font-medium transition-all disabled:bg-gray-300"
                >
                  Créer la tâche
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Tasks;