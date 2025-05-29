// === Ce fichier affiche des statistiques détaillées pour les clients avec des graphiques === /workspaces/TaskManagerLatestVersion/frontend/src/pages/ClientStatistics.tsx
// Explication simple : C'est comme un tableau de bord qui montre combien de temps on a passé à travailler pour chaque client, combien d'argent on a gagné, et si c'était rentable ou pas. Il y a des graphiques pour voir tout ça facilement.
// Explication technique : Composant React fonctionnel qui affiche des métriques et visualisations de données pour analyser la performance des clients en termes de temps passé, rentabilité et revenus générés via Chart.js.
// Utilisé dans : Probablement dans un Router principal comme page accessible depuis la navigation
// Connecté à : uiSlice.ts (notifications), API backend pour les clients et les timers, Chart.js pour les visualisations, ClientLogo pour l'affichage visuel

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../hooks';
import { addNotification } from '../store/slices/uiSlice';
import axios from 'axios';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { motion } from 'framer-motion';

// Configuration de l'API et Chart.js
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, 
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ClientMetrics {
  id: string;
  name: string;
  logo?: string;
  totalHours: number;
  billableHours: number;
  revenue: number;
  effectiveRate: number;
  targetRate: number;
  profitabilityScore: number;
  monthlyBudget: number;
}

interface TaskMetrics {
  id: string;
  title: string;
  clientName: string;
  totalHours: number;
  percentage: number;
}

const ClientStatistics: React.FC = () => {
  const dispatch = useAppDispatch();
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'clients' | 'tasks'>('overview');
  
  // États pour les données
  const [globalMetrics, setGlobalMetrics] = useState({
    totalRevenue: 0,
    totalHours: 0,
    billableHours: 0,
    averageHourlyRate: 0,
    clientCount: 0,
    taskCount: 0,
    billablePercentage: 0,
    monthlyGrowth: 0
  });
  
  const [clientsMetrics, setClientsMetrics] = useState<ClientMetrics[]>([]);
  const [tasksMetrics, setTasksMetrics] = useState<TaskMetrics[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any>({ labels: [], datasets: [] });
  const [clientDistributionData, setClientDistributionData] = useState<any>({ labels: [], datasets: [] });
  const [timeDistributionData, setTimeDistributionData] = useState<any>({ labels: [], datasets: [] });

  // Fonction pour charger toutes les données
  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error("Token d'authentification manquant");
      
      // Charger les clients, timers et tâches en parallèle
      const [clientsRes, timersRes, tasksRes, profitabilityRes] = await Promise.all([
        axios.get(`${API_URL}/api/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/timers`, {
          params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/tasks`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/profitability`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      processData(clientsRes.data, timersRes.data, tasksRes.data, profitabilityRes.data);
      
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      dispatch(addNotification({
        message: 'Erreur lors du chargement des statistiques',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  }, [dateRange, dispatch]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Traitement des données
  const processData = (clients: any[], timers: any[], tasks: any[], profitability: any[]) => {
    // Calcul des métriques globales
    let totalRevenue = 0;
    let totalSeconds = 0;
    let billableSeconds = 0;
    const activeClients = new Set();
    
    // Créer un map de profitabilité par client
    const profitabilityMap = new Map();
    profitability.forEach(p => {
      if (p.clientId) {
        profitabilityMap.set(p.clientId._id || p.clientId, p);
      }
    });
    
    // Analyser les timers
    const clientHoursMap = new Map();
    const taskHoursMap = new Map();
    
    timers.forEach(timer => {
      const seconds = timer.duration || 0;
      totalSeconds += seconds;
      
      if (timer.billable) {
        billableSeconds += seconds;
      }
      
      // Accumulation par client
      if (timer.clientId) {
        activeClients.add(timer.clientId);
        const current = clientHoursMap.get(timer.clientId) || { total: 0, billable: 0 };
        current.total += seconds;
        if (timer.billable) current.billable += seconds;
        clientHoursMap.set(timer.clientId, current);
      }
      
      // Accumulation par tâche
      if (timer.taskId) {
        const current = taskHoursMap.get(timer.taskId) || 0;
        taskHoursMap.set(timer.taskId, current + seconds);
      }
    });
    
    // Calcul des métriques par client
    const clientsMetricsData: ClientMetrics[] = [];
    
    clients.forEach(client => {
      const hours = clientHoursMap.get(client._id) || { total: 0, billable: 0 };
      const clientProf = profitabilityMap.get(client._id) || client.profitability || {};
      const hourlyRate = clientProf.hourlyRate || 100;
      const targetHours = clientProf.targetHours || 40;
      const monthlyBudget = clientProf.monthlyBudget || 0;
      
      const revenue = (hours.billable / 3600) * hourlyRate;
      totalRevenue += revenue;
      
      const effectiveRate = hours.total > 0 ? revenue / (hours.total / 3600) : 0;
      const profitabilityScore = hours.total > 0 ? (effectiveRate / hourlyRate) * 100 : 0;
      
      clientsMetricsData.push({
        id: client._id,
        name: client.name,
        logo: client.logo,
        totalHours: hours.total / 3600,
        billableHours: hours.billable / 3600,
        revenue,
        effectiveRate,
        targetRate: hourlyRate,
        profitabilityScore,
        monthlyBudget
      });
    });
    
    // Trier les clients par revenue
    clientsMetricsData.sort((a, b) => b.revenue - a.revenue);
    
    // Calcul des métriques par tâche
    const tasksMetricsData: TaskMetrics[] = [];
    const taskClientMap = new Map();
    
    tasks.forEach(task => {
      if (task.client) {
        taskClientMap.set(task._id, task.client.name || 'Sans client');
      }
    });
    
    Array.from(taskHoursMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([taskId, seconds]) => {
        const task = tasks.find(t => t._id === taskId);
        if (task) {
          tasksMetricsData.push({
            id: taskId,
            title: task.title,
            clientName: taskClientMap.get(taskId) || 'Sans client',
            totalHours: seconds / 3600,
            percentage: (seconds / totalSeconds) * 100
          });
        }
      });
    
    // Mise à jour des états
    setGlobalMetrics({
      totalRevenue,
      totalHours: totalSeconds / 3600,
      billableHours: billableSeconds / 3600,
      averageHourlyRate: totalSeconds > 0 ? totalRevenue / (totalSeconds / 3600) : 0,
      clientCount: activeClients.size,
      taskCount: taskHoursMap.size,
      billablePercentage: totalSeconds > 0 ? (billableSeconds / totalSeconds) * 100 : 0,
      monthlyGrowth: 15 // À calculer avec les données historiques
    });
    
    setClientsMetrics(clientsMetricsData);
    setTasksMetrics(tasksMetricsData);
    
    // Préparer les données des graphiques
    prepareChartData(clientsMetricsData, timers);
  };

  // Préparation des données pour les graphiques
  const prepareChartData = (clientsData: ClientMetrics[], timers: any[]) => {
    // Graphique de revenue par client (top 5)
    const topClients = clientsData.slice(0, 5);
    setClientDistributionData({
      labels: topClients.map(c => c.name),
      datasets: [{
        data: topClients.map(c => c.revenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(147, 51, 234, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderWidth: 0
      }]
    });
    
    // Graphique de distribution du temps
    const billableHours = clientsData.reduce((sum, c) => sum + c.billableHours, 0);
    const nonBillableHours = clientsData.reduce((sum, c) => sum + (c.totalHours - c.billableHours), 0);
    
    setTimeDistributionData({
      labels: ['Temps facturable', 'Temps non-facturable'],
      datasets: [{
        data: [billableHours, nonBillableHours],
        backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)'],
        borderWidth: 0
      }]
    });
    
    // Graphique d'évolution des revenus
    const revenueByDate = new Map();
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    // Initialiser toutes les dates
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      revenueByDate.set(d.toISOString().split('T')[0], 0);
    }
    
    // Calculer les revenus par jour
    timers.forEach(timer => {
      if (timer.billable && timer.startTime) {
        const date = timer.startTime.split('T')[0];
        const client = clientsData.find(c => c.id === timer.clientId);
        if (client) {
          const dayRevenue = (timer.duration / 3600) * client.targetRate;
          revenueByDate.set(date, (revenueByDate.get(date) || 0) + dayRevenue);
        }
      }
    });
    
    const sortedDates = Array.from(revenueByDate.keys()).sort();
    setRevenueChartData({
      labels: sortedDates.map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      }),
      datasets: [{
        label: 'Revenus journaliers',
        data: sortedDates.map(date => revenueByDate.get(date)),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      }]
    });
  };

  // Gestion du changement de période
  const handlePeriodChange = (newPeriod: typeof period) => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'custom') return;
    
    const today = new Date();
    let startDate = new Date();
    
    switch (newPeriod) {
      case 'week':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'quarter':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'year':
        startDate.setDate(today.getDate() - 365);
        break;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec titre et sélecteur de période */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-transparent bg-clip-text mb-2">
                Tableau de Bord
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Analysez votre activité et la rentabilité de vos clients
              </p>
            </div>
            
            {/* Sélecteur de période */}
            <div className="flex gap-2">
              {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePeriodChange(p)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    period === p
                      ? 'bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:shadow-md'
                  }`}
                >
                  {p === 'week' ? 'Semaine' : p === 'month' ? 'Mois' : p === 'quarter' ? 'Trimestre' : 'Année'}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#026aa1] border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Métriques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    globalMetrics.monthlyGrowth > 0 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {globalMetrics.monthlyGrowth > 0 ? '+' : ''}{globalMetrics.monthlyGrowth}%
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Revenus totaux
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {globalMetrics.totalRevenue.toLocaleString()}€
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Taux horaire moyen: {Math.round(globalMetrics.averageHourlyRate)}€/h
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                    {Math.round(globalMetrics.billablePercentage)}% facturable
                  </span>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Heures travaillées
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(globalMetrics.totalHours)}h
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Dont {Math.round(globalMetrics.billableHours)}h facturables
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Clients actifs
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {globalMetrics.clientCount}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {globalMetrics.taskCount} tâches travaillées
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
                  Productivité
                </h3>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(globalMetrics.totalHours / 30 * 10) / 10}h/jour
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  En moyenne sur la période
                </p>
              </motion.div>
            </div>

            {/* Tabs pour naviguer entre les vues */}
            <div className="flex gap-4 mb-6">
              {(['overview', 'clients', 'tasks'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    activeTab === tab
                      ? 'bg-white dark:bg-gray-800 text-[#026aa1] shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab === 'overview' ? '📊 Vue d\'ensemble' : 
                   tab === 'clients' ? '👥 Analyse clients' : 
                   '📋 Analyse tâches'}
                </button>
              ))}
            </div>

            {/* Contenu selon l'onglet actif */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique d'évolution des revenus */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Évolution des revenus
                  </h3>
                  {revenueChartData.labels.length > 0 ? (
                    <Line
                      data={revenueChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                              label: (context) => `${context.parsed.y.toLocaleString()}€`
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => `${value}€`
                            }
                          }
                        }
                      }}
                      height={300}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-gray-500">Aucune donnée disponible</p>
                    </div>
                  )}
                </motion.div>

                {/* Répartition des revenus par client */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Top 5 clients par revenus
                  </h3>
                  {clientDistributionData.labels.length > 0 ? (
                    <Doughnut
                      data={clientDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                              font: { size: 12 }
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                              label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value.toLocaleString()}€ (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                      height={300}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-gray-500">Aucune donnée disponible</p>
                    </div>
                  )}
                </motion.div>

                {/* Répartition du temps */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Répartition du temps
                  </h3>
                  {timeDistributionData.labels.length > 0 ? (
                    <Doughnut
                      data={timeDistributionData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                              font: { size: 14 }
                            }
                          },
                          tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                              label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${Math.round(value)}h`;
                              }
                            }
                          }
                        }
                      }}
                      height={300}
                    />
                  ) : (
                    <div className="h-[300px] flex items-center justify-center">
                      <p className="text-gray-500">Aucune donnée disponible</p>
                    </div>
                  )}
                </motion.div>

                {/* Insights et recommandations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
                >
                  <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💡</span>
                    Insights & Recommandations
                  </h3>
                  <div className="space-y-3">
                    {globalMetrics.billablePercentage < 70 && (
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-500 text-xl">⚠️</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Temps facturable faible ({Math.round(globalMetrics.billablePercentage)}%)
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Essayez de réduire le temps non-facturable ou de le facturer davantage.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {globalMetrics.averageHourlyRate < 80 && (
                      <div className="flex items-start gap-3">
                        <span className="text-red-500 text-xl">📉</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Taux horaire moyen bas ({Math.round(globalMetrics.averageHourlyRate)}€/h)
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Considérez d'augmenter vos tarifs ou de vous concentrer sur des clients plus rentables.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {globalMetrics.averageHourlyRate >= 100 && (
                      <div className="flex items-start gap-3">
                        <span className="text-green-500 text-xl">🎯</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            Excellente rentabilité !
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Votre taux horaire moyen de {Math.round(globalMetrics.averageHourlyRate)}€/h est très bon.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div className="space-y-6">
                {/* Liste des clients avec métriques */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      Analyse de rentabilité par client
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Heures
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Revenus
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Taux effectif
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Score rentabilité
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Statut
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {clientsMetrics.map((client, index) => (
                          <motion.tr
                            key={client.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {client.logo ? (
                                  <img src={client.logo} alt={client.name} className="w-10 h-10 rounded-lg mr-3" />
                                ) : (
                                  <div className="w-10 h-10 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white font-bold mr-3">
                                    {client.name.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {client.name}
                                  </div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400">
                                    Budget: {client.monthlyBudget.toLocaleString()}€/mois
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 dark:text-white">
                                {Math.round(client.totalHours)}h
                              </div>
                              <div className="text-xs text-gray-500">
                                {Math.round(client.billableHours)}h facturables
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {client.revenue.toLocaleString()}€
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                client.effectiveRate >= client.targetRate 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {Math.round(client.effectiveRate)}€/h
                              </div>
                              <div className="text-xs text-gray-500">
                                Cible: {client.targetRate}€/h
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      client.profitabilityScore >= 90 
                                        ? 'bg-green-500' 
                                        : client.profitabilityScore >= 70 
                                        ? 'bg-yellow-500' 
                                        : 'bg-red-500'
                                    }`}
                                    style={{ width: `${Math.min(100, client.profitabilityScore)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {Math.round(client.profitabilityScore)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                client.profitabilityScore >= 90 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                                  : client.profitabilityScore >= 70 
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              }`}>
                                {client.profitabilityScore >= 90 ? '🚀 Excellent' : 
                                 client.profitabilityScore >= 70 ? '👍 Bon' : 
                                 '⚠️ À améliorer'}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="space-y-6">
                {/* Top 10 des tâches chronophages */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
                >
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Top 10 des tâches les plus chronophages
                  </h3>
                  <div className="space-y-4">
                    {tasksMetrics.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {task.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {task.clientName}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 dark:text-white">
                                {Math.round(task.totalHours)}h
                              </p>
                              <p className="text-xs text-gray-500">
                                {task.percentage.toFixed(1)}% du temps total
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${task.percentage}%` }}
                              transition={{ duration: 1, delay: index * 0.05 }}
                              className="h-2 rounded-full bg-gradient-to-r from-[#026aa1] to-[#0487d9]"
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientStatistics;