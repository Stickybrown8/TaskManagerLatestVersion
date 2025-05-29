import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { useTaskCompletion } from '../hooks/useTaskCompletion';
import { addNotification } from '../store/slices/uiSlice';
import { toggleTimerPopup, setSelectedTaskId } from '../store/slices/timerSlice';
import { motion, AnimatePresence } from 'framer-motion';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import { useTasks } from '../hooks/useTasks';
import { tasksService, clientsService, profitabilityService, timerService } from '../services/api';

// Types et Interfaces
interface Client {
  _id: string;
  name: string;
  logo?: string;
  status?: string;
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
  timeSpent?: number;
  estimatedTime?: number;
  isHighImpact?: boolean;
  createdAt?: string;
  completedAt?: string;
  isArchived?: boolean;
}

interface Timer {
  _id: string;
  userId: string;
  clientId: string;
  taskId?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

interface TaskWithMonthlyTime extends Task {
  monthlyTimeMinutes: number;
  totalTimeMinutes: number;
  percentageOfClientTime: number;
  timersThisMonth: Timer[];
}

interface ClientMetrics {
  client: Client;
  tasks: TaskWithMonthlyTime[];
  monthlyMinutes: number;
  monthlyRevenue: number;
  hourlyRate: number;
  currentHourlyRate: number;
  targetHours: number;
  highImpactTasks: number;
  highImpactMinutes: number;
  performanceScore: number;
  budgetConsumed: number;
}

const Tasks: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { tasks, loading, refreshTasks } = useTasks();
  const { handleCompleteTask, showConfetti } = useTaskCompletion();

  // États
  const [clients, setClients] = useState<Client[]>([]);
  const [timers, setTimers] = useState<Timer[]>([]);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [selectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [showArchived, setShowArchived] = useState(false);
  const [clientsProfitability, setClientsProfitability] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Charger toutes les données
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      // Charger clients
      const clientsData = await clientsService.getClients();
    console.log("=== DONNÉES CHARGÉES ===");
    console.log("Clients:", clientsData);
    console.log("Timers:", await timerService.getAllTimers());
    console.log("Tasks via refreshTasks:");

      setClients(clientsData);

      // Charger rentabilité
      const profData = await profitabilityService.getAllProfitability();
      const profMap: Record<string, any> = {};
      profData.forEach((prof: any) => {
        if (prof.clientId?._id) {
          profMap[prof.clientId._id] = prof;
        }
      });
      setClientsProfitability(profMap);
      console.log("Profitability mapping:", Object.keys(profMap), profMap);

      // Charger tous les timers
      const timersData = await timerService.getAllTimers();
      console.log("Premier timer:", timersData[0]);
      setTimers(timersData);

      console.log("Tâches rechargées:", tasks);
      await refreshTasks();
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };

  // Helpers
  const getTaskId = (taskId: string | { _id: string }): string => {
    return typeof taskId === 'object' ? taskId._id : taskId;
  };

  const getClientId = (clientId: string | { _id: string; name: string }): string => {
    if (typeof clientId === 'object' && clientId !== null) {
      return clientId._id;
    }
    return clientId;
  };

  // Calculer les métriques mensuelles par client et par tâche
  const clientMetrics = useMemo(() => {
    const startOfMonth = new Date(selectedMonth + '-01');
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const metricsMap: Record<string, ClientMetrics> = {};

    // Grouper les tâches par client
    const tasksByClient: Record<string, Task[]> = {};
    tasks.forEach(task => {
      const clientId = getClientId(task.clientId);
      if (!tasksByClient[clientId]) {
        tasksByClient[clientId] = [];
      }
      if (!showArchived && task.isArchived) return;
      tasksByClient[clientId].push(task);
    });

    // Pour chaque client
    Object.entries(tasksByClient).forEach(([clientId, clientTasks]) => {
      const client = clients.find(c => c._id === clientId);
      if (!client) return;

      const profitability = clientsProfitability[getClientId(clientId)];
      console.log(`Client ${client.name}: profitability =`, profitability, "hourlyRate:", profitability?.hourlyRate);

      // Enrichir chaque tâche avec son temps mensuel
      const tasksWithMonthlyTime: TaskWithMonthlyTime[] = clientTasks.map(task => {
        const taskId = getTaskId(task._id);

        // Temps des timers pour cette tâche ce mois-ci
        console.log(`Timers pour task ${task._id}:`, timers.filter(t => t.taskId && getTaskId(t.taskId) === taskId).length, "total");
        const taskTimersThisMonth = timers.filter(timer => {
          if (!timer.taskId) return false;
          const taskIdFromTimer = getTaskId(timer.taskId);
          const match = taskIdFromTimer === taskId;
          if (match) console.log(`✅ Timer found for task ${task.title}: timer.taskId=${taskIdFromTimer}, taskId=${taskId}`);
          if (!match) return false;
          const timerDate = new Date(timer.startTime);
          return timerDate >= startOfMonth && timerDate < endOfMonth;
        });

        // Calculer le temps mensuel (minutes de la tâche + secondes des timers)
        let monthlyMinutes = 0;

        // Si la tâche a été complétée ce mois-ci, prendre son timeSpent
        if (task.completedAt) {
          const completedDate = new Date(task.completedAt);
          if (completedDate >= startOfMonth && completedDate < endOfMonth) {
            monthlyMinutes += task.timeSpent || 0;
          }
        }

        // Ajouter le temps des timers
        console.log(`Task ${task.title}: ${taskTimersThisMonth.length} timers ce mois, durées:`, taskTimersThisMonth.map(t => t.duration));
        const timerMinutes = taskTimersThisMonth.reduce((sum, timer) => {
          return sum + ((timer.duration || 0) / 60);
        }, 0);

        monthlyMinutes += timerMinutes;

        return {
          ...task,
          monthlyTimeMinutes: monthlyMinutes,
          totalTimeMinutes: (task.timeSpent || 0) + Math.round(timers.filter(timer => timer.taskId && getTaskId(timer.taskId) === task._id).reduce((sum, timer) => sum + (timer.duration || 0), 0) / 60),
          percentageOfClientTime: 0, // Calculé après
          timersThisMonth: taskTimersThisMonth
        };
      });

      // Calculer les totaux du client
      const totalMonthlyMinutes = tasksWithMonthlyTime.reduce((sum, t) => sum + t.monthlyTimeMinutes, 0);
      const highImpactTasks = tasksWithMonthlyTime.filter(t => t.isHighImpact);
      const highImpactMinutes = highImpactTasks.reduce((sum, t) => sum + t.monthlyTimeMinutes, 0);

      // Calculer le pourcentage de temps par tâche
      tasksWithMonthlyTime.forEach(task => {
        task.percentageOfClientTime = totalMonthlyMinutes > 0
          ? (task.monthlyTimeMinutes / totalMonthlyMinutes) * 100
          : 0;
      });

      // Trier par statut puis par priorité
      const statusOrder = { 'en cours': 0, 'à faire': 1, 'terminée': 2 };
      const priorityOrder = { 'urgente': 0, 'haute': 1, 'moyenne': 2, 'basse': 3 };
      
      tasksWithMonthlyTime.sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        
        if (a.status !== 'terminée') {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        return b.monthlyTimeMinutes - a.monthlyTimeMinutes;
      });

      // Métriques financières
      const hourlyRate = profitability?.revenue && profitability?.spentHours > 0 ? profitability.revenue / profitability.spentHours : (profitability?.hourlyRate || 100);
      const targetHours = profitability?.targetHours || 40;
      const revenue = profitability?.revenue || 0;
      const monthlyHours = totalMonthlyMinutes / 60;
      const currentHourlyRate = monthlyHours > 0 && revenue > 0 ? revenue / monthlyHours : hourlyRate;
      const budgetConsumed = targetHours > 0 ? (monthlyHours / targetHours) * 100 : 0;

      // Score de performance (basé sur le ratio 80/20)
      const highImpactRatio = totalMonthlyMinutes > 0 ? (highImpactMinutes / totalMonthlyMinutes) * 100 : 0;
      const performanceScore = Math.min(100, highImpactRatio * 1.25); // Bonus si > 80% sur high impact

      metricsMap[clientId] = {
        client,
        tasks: tasksWithMonthlyTime,
        monthlyMinutes: totalMonthlyMinutes,
        monthlyRevenue: monthlyHours * currentHourlyRate,
        hourlyRate,
        currentHourlyRate,
        targetHours,
        highImpactTasks: highImpactTasks.length,
        highImpactMinutes,
        performanceScore,
        budgetConsumed
      };
    });

    return metricsMap;
  }, [tasks, clients, timers, selectedMonth, showArchived, clientsProfitability]);

  // Actions
  const handleReactivateTask = async (taskId: string) => {
    try {
      await tasksService.updateTask(taskId, { 
        status: 'à faire',
        isArchived: false 
      });
      
      dispatch(addNotification({
        message: '🔄 Tâche réactivée',
        type: 'success'
      }));
      refreshTasks();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleArchiveTask = async (taskId: string) => {
    try {
      await tasksService.updateTask(taskId, { 
        isArchived: true 
      });
      
      dispatch(addNotification({
        message: '📁 Tâche archivée',
        type: 'success'
      }));
      refreshTasks();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };


  const handleComplete = async (taskId: string) => {
    await handleCompleteTask(taskId);
    await refreshTasks();
  };



  const formatMinutes = (minutes: number): string => {
    if (!minutes || minutes === 0) return '—';
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}min`;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatHours = (hours: number): string => {
    return hours.toFixed(1) + 'h';
  };

  // Fonction pour obtenir la couleur selon la priorité
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'bg-red-100 text-red-700 border-red-300';
      case 'haute': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'moyenne': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'basse': return 'bg-gray-100 text-gray-700 border-gray-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  // Fonction pour obtenir l'emoji du statut
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'terminée': return '✅';
      case 'en cours': return '⚡';
      case 'à faire': return '📋';
      default: return '📋';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header amélioré */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-sm sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-transparent bg-clip-text">
                Tableau de Productivité
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 flex items-center gap-2">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                {new Date(selectedMonth + '-01').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'cards' 
                      ? 'bg-white dark:bg-gray-600 text-[#026aa1] shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Cartes
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white dark:bg-gray-600 text-[#026aa1] shadow-sm' 
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Liste
                </button>
              </div>

              <label className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={(e) => setShowArchived(e.target.checked)}
                  className="rounded text-[#026aa1] focus:ring-[#026aa1]"
                />
                <span>Archives</span>
              </label>

              <button
                onClick={() => navigate('/tasks/new')}
                className="bg-gradient-to-r from-[#026aa1] to-[#0487d9] hover:from-[#0487d9] hover:to-[#026aa1] text-white px-6 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle tâche
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#026aa1] border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement en cours...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(clientMetrics).map(([clientId, metrics]) => {
              const isExpanded = expandedClients.has(clientId);
              const activeTasksCount = metrics.tasks.filter(t => t.status !== 'terminée').length;
              const urgentTasksCount = metrics.tasks.filter(t => t.priority === 'urgente' && t.status !== 'terminée').length;

              return (
                <motion.div
                  key={clientId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
                >
                  {/* Header du client amélioré */}
                  <div
                    className="relative p-6 cursor-pointer group"
                    onClick={() => {
                      const newExpanded = new Set(expandedClients);
                      if (isExpanded) {
                        newExpanded.delete(clientId);
                      } else {
                        newExpanded.add(clientId);
                      }
                      setExpandedClients(newExpanded);
                    }}
                  >
                    {/* Background gradient subtil */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#026aa1]/5 to-[#0487d9]/5 group-hover:from-[#026aa1]/10 group-hover:to-[#0487d9]/10 transition-all duration-300" />
                    
                    <div className="relative flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-20 h-20 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                            {metrics.client.name.substring(0, 2).toUpperCase()}
                          </div>
                          {urgentTasksCount > 0 && (
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
                              {urgentTasksCount}
                            </div>
                          )}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {metrics.client.name}
                            {metrics.performanceScore >= 80 && (
                              <span className="text-2xl">🏆</span>
                            )}
                          </h2>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {activeTasksCount} tâches actives
                            </span>
                            {metrics.tasks.filter(t => t.status === 'terminée').length > 0 && (
                              <span className="text-sm text-green-600 dark:text-green-400">
                                {metrics.tasks.filter(t => t.status === 'terminée').length} terminées
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Métriques visuelles */}
                      <div className="flex items-center gap-8">
                        {/* Temps mensuel avec cercle de progression */}
                        <div className="text-center">
                          <div className="relative w-20 h-20">
                            <svg className="w-20 h-20 transform -rotate-90">
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                className="text-gray-200 dark:text-gray-700"
                              />
                              <circle
                                cx="40"
                                cy="40"
                                r="36"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 36}`}
                                strokeDashoffset={`${2 * Math.PI * 36 * (1 - Math.min(metrics.budgetConsumed, 100) / 100)}`}
                                className={`transition-all duration-1000 ${
                                  metrics.budgetConsumed > 100 ? 'text-red-500' :
                                  metrics.budgetConsumed > 80 ? 'text-orange-500' :
                                  'text-green-500'
                                }`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div>
                                <p className="text-lg font-bold">{formatHours(metrics.monthlyMinutes / 60)}</p>
                                <p className="text-xs text-gray-500">{Math.round(metrics.budgetConsumed)}%</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Temps utilisé</p>
                        </div>

                        {/* Revenue avec indicateur */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-3xl">💰</span>
                            <div>
                              <p className="text-2xl font-bold text-emerald-600">
                                {Math.round(metrics.monthlyRevenue)}€
                              </p>
                              <p className="text-xs text-gray-500">
                                {Math.round(metrics.currentHourlyRate)}€/h
                              </p>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Forfait mensuel</p>
                        </div>

                        {/* Score de performance avec badge */}
                        <div className="text-center">
                          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                            metrics.performanceScore >= 80 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                            metrics.performanceScore >= 60 ? 'bg-gradient-to-br from-amber-400 to-amber-600' :
                            'bg-gradient-to-br from-red-400 to-red-600'
                          } text-white font-bold text-xl shadow-lg`}>
                            {Math.round(metrics.performanceScore)}%
                          </div>
                          <p className="text-xs text-gray-600 mt-1">Performance</p>
                        </div>

                        <motion.svg
                          className="w-6 h-6 text-gray-400"
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </div>
                    </div>
                  </div>

                  {/* Liste des tâches avec sections */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100 dark:border-gray-700"
                      >
                        <div className="p-6">
                          {/* Statistiques rapides */}
                          <div className="grid grid-cols-4 gap-4 mb-6">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-blue-600 dark:text-blue-400">En cours</p>
                                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                                    {metrics.tasks.filter(t => t.status === 'en cours').length}
                                  </p>
                                </div>
                                <span className="text-3xl">⚡</span>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-amber-600 dark:text-amber-400">À faire</p>
                                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                                    {metrics.tasks.filter(t => t.status === 'à faire').length}
                                  </p>
                                </div>
                                <span className="text-3xl">📋</span>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-green-600 dark:text-green-400">Terminées</p>
                                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                                    {metrics.tasks.filter(t => t.status === 'terminée').length}
                                  </p>
                                </div>
                                <span className="text-3xl">✅</span>
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-orange-600 dark:text-orange-400">High Impact</p>
                                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                                    {metrics.highImpactTasks}
                                  </p>
                                </div>
                                <span className="text-3xl">🎯</span>
                              </div>
                            </div>
                          </div>

                          {/* Tâches groupées par statut */}
                          <div className="space-y-6">
                            {['en cours', 'à faire', 'terminée'].map(status => {
                              const statusTasks = metrics.tasks.filter(t => t.status === status);
                              if (statusTasks.length === 0) return null;

                              return (
                                <div key={status} className="space-y-3">
                                  <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <span className="text-lg">{getStatusEmoji(status)}</span>
                                    {status === 'en cours' ? 'En cours' : status === 'à faire' ? 'À faire' : 'Terminées'}
                                    <span className="text-xs bg-gray-200 dark:bg-gray-700 rounded-full px-2 py-1">
                                      {statusTasks.length}
                                    </span>
                                  </h3>

                                  <div className={viewMode === 'cards' ? 'grid grid-cols-2 gap-4' : 'space-y-3'}>
                                    {statusTasks.map((task) => {
                                      const taskId = getTaskId(task._id);
                                      const isCompleted = task.status === 'terminée';
                                      const progress = task.estimatedTime ? (task.totalTimeMinutes / task.estimatedTime) * 100 : 0;

                                      return (
                                        <motion.div
                                          key={taskId}
                                          layout
                                          whileHover={{ scale: viewMode === 'cards' ? 1.02 : 1 }}
                                          className={`
                                            ${viewMode === 'cards' ? 'p-5' : 'p-4'}
                                            ${task.isHighImpact
                                              ? 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800'
                                              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                            }
                                            border rounded-xl hover:shadow-md transition-all duration-200
                                            ${isCompleted ? 'opacity-75' : ''}
                                          `}
                                        >
                                          <div className={viewMode === 'cards' ? 'space-y-3' : 'flex items-start justify-between gap-4'}>
                                            <div className={viewMode === 'cards' ? '' : 'flex-1'}>
                                              {/* En-tête de la tâche */}
                                              <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className={`font-semibold text-gray-900 dark:text-white ${
                                                  isCompleted ? 'line-through opacity-60' : ''
                                                }`}>
                                                  {task.title}
                                                </h4>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                  {task.priority}
                                                </span>
                                              </div>

                                              {task.description && viewMode === 'cards' && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                                                  {task.description}
                                                </p>
                                              )}

                                              {/* Badges et indicateurs */}
                                              <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {task.isHighImpact && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-800/30 dark:to-amber-800/30 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
                                                    <span>🎯</span> High Impact
                                                  </span>
                                                )}
                                                {task.dueDate && (
                                                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {new Date(task.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                  </span>
                                                )}
                                              </div>

                                              {/* Temps et progression */}
                                              <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                  <span className="text-gray-600 dark:text-gray-400">
                                                    Temps: {formatMinutes(task.monthlyTimeMinutes)} ce mois
                                                  </span>
                                                  {task.estimatedTime && (
                                                    <span className={`font-medium ${
                                                      progress > 100 ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'
                                                    }`}>
                                                      {Math.round(progress)}%
                                                    </span>
                                                  )}
                                                </div>
                                                
                                                {task.estimatedTime && (
                                                  <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <motion.div
                                                      initial={{ width: 0 }}
                                                      animate={{ width: `${Math.min(100, progress)}%` }}
                                                      transition={{ duration: 1, ease: "easeOut" }}
                                                      className={`absolute inset-y-0 left-0 ${
                                                        progress > 100 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                        progress > 80 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                        'bg-gradient-to-r from-blue-500 to-blue-600'
                                                      }`}
                                                    />
                                                  </div>
                                                )}
                                              </div>
                                            </div>

                                            {/* Actions */}
                                            <div className={`flex ${viewMode === 'cards' ? 'justify-between' : 'items-start'} gap-2 mt-3`}>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  dispatch(setSelectedTaskId(taskId));
                                                  dispatch(toggleTimerPopup(true));
                                                }}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-[#026aa1] hover:bg-[#0487d9] text-white rounded-lg text-sm font-medium transition-colors"
                                              >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Timer
                                              </button>

                                              {!isCompleted ? (
                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleComplete(taskId);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Terminer
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      navigate(`/tasks/${taskId}`);
                                                    }}
                                                    className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex gap-2">
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleReactivateTask(taskId);
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                    </svg>
                                                    Réactiver
                                                  </button>
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleArchiveTask(taskId);
                                                    }}
                                                    className="p-1.5 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                                                  >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                                    </svg>
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </motion.div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {metrics.tasks.length === 0 && (
                            <div className="text-center py-12">
                              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
                                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                              <p className="text-gray-500 dark:text-gray-400 mb-4">Aucune tâche pour ce client</p>
                              <button
                                onClick={() => navigate('/tasks/new')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-[#026aa1] hover:bg-[#0487d9] text-white rounded-lg font-medium transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Créer une tâche
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {Object.keys(clientMetrics).length === 0 && (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#026aa1]/10 to-[#0487d9]/10 rounded-full mb-6">
                  <svg className="w-12 h-12 text-[#026aa1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Commencez votre journée productive
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Créez votre première tâche pour démarrer
                </p>
                <button
                  onClick={() => navigate('/tasks/new')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] hover:from-[#0487d9] hover:to-[#026aa1] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Créer ma première tâche
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfettiEffect show={showConfetti} />
    </div>
  );
};

export default Tasks;

