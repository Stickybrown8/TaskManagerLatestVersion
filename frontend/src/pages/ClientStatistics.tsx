// === Ce fichier affiche des statistiques détaillées pour les clients avec des graphiques === /workspaces/TaskManagerLatestVersion/frontend/src/pages/ClientStatistics.tsx
// Explication simple : C'est comme un tableau de bord qui montre combien de temps on a passé à travailler pour chaque client, combien d'argent on a gagné, et si c'était rentable ou pas. Il y a des graphiques pour voir tout ça facilement.
// Explication technique : Composant React fonctionnel qui affiche des métriques et visualisations de données pour analyser la performance des clients en termes de temps passé, rentabilité et revenus générés via Chart.js.
// Utilisé dans : Probablement dans un Router principal comme page accessible depuis la navigation
// Connecté à : uiSlice.ts (notifications), API backend pour les clients et les timers, Chart.js pour les visualisations, ClientLogo pour l'affichage visuel

import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch } from '../hooks';
import { addNotification } from '../store/slices/uiSlice';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement
} from 'chart.js';
import ClientLogo from '../components/Clients/ClientLogo';

// === Début : Configuration de l'API et Chart.js ===
// Explication simple : On prépare les outils dont on a besoin pour faire des beaux graphiques et parler avec le serveur.
// Explication technique : Configuration de l'URL de l'API et enregistrement des composants nécessaires pour Chart.js qui permettront de créer différents types de visualisations.
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

// Enregistrement des composants Chart.js (après tous les imports)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement, 
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
// === Fin : Configuration de l'API et Chart.js ===

// === Début : Interface pour la plage de dates ===
// Explication simple : C'est comme un petit formulaire qui dit "je veux voir les données de cette date à cette date".
// Explication technique : Interface TypeScript définissant la structure pour stocker la plage de dates utilisée pour filtrer les données statistiques.
interface DateRange {
  startDate: string;
  endDate: string;
}
// === Fin : Interface pour la plage de dates ===

// === Début : Composant principal des statistiques client ===
// Explication simple : C'est toute la page qui montre les statistiques des clients avec des graphiques et des nombres.
// Explication technique : Composant React fonctionnel principal qui gère l'affichage et la logique des statistiques clients avec visualisation de données.
const ClientStatistics: React.FC = () => {
  // === Début : États et variables du composant ===
  // Explication simple : On prépare toutes les petites boîtes où on va ranger les informations dont on a besoin.
  // Explication technique : Initialisation des hooks d'état React pour stocker les données clients, les plages de dates, les statistiques et contrôler l'état de chargement.
  const dispatch = useAppDispatch();
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [timers, setTimers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [profitability, setProfitability] = useState<any>(null);
  const [timeData, setTimeData] = useState<any>({ labels: [], datasets: [] });
  const [profitabilityData, setProfitabilityData] = useState<any>({ labels: [], datasets: [] });
  const [selectedClient, setSelectedClient] = useState<any>(null);
  // === Fin : États et variables du composant ===

  // === Début : Chargement initial des clients ===
  // Explication simple : Quand la page s'ouvre, on va chercher la liste de tous les clients pour pouvoir choisir celui qu'on veut voir.
  // Explication technique : Hook useEffect qui s'exécute au montage du composant pour récupérer la liste des clients depuis l'API, en utilisant le token d'authentification stocké.
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(`${API_URL}/api/clients`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setClients(response.data);
      } catch (error) {
        console.error("Erreur lors du chargement des clients:", error);
      }
    };
    
    fetchClients();
  }, []);
  // === Fin : Chargement initial des clients ===

  // === Début : Fonction de récupération des données du client sélectionné ===
  // Explication simple : Cette fonction va chercher toutes les informations importantes sur le client que tu as choisi : combien de temps on a travaillé pour lui, combien il paie, etc.
  // Explication technique : Fonction callback qui effectue plusieurs requêtes API asynchrones pour récupérer les détails du client, ses données de temps (timers) et sa rentabilité, puis met à jour les états correspondants.
  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Récupérer les infos du client
      const clientResponse = await axios.get(`${API_URL}/api/clients/${selectedClientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setSelectedClient(clientResponse.data);
      
      // Récupérer les timers pour le client dans la plage de dates
      const timersResponse = await axios.get(`${API_URL}/api/timers`, {
        params: {
          clientId: selectedClientId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setTimers(timersResponse.data);
      
      // Récupérer les données de rentabilité
      const profitabilityResponse = await axios.get(`${API_URL}/api/profitability/client/${selectedClientId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setProfitability(profitabilityResponse.data);
      
      // Préparer les données pour les graphiques
      prepareChartData(timersResponse.data);
      
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setError(error.response?.data?.message || error.message || "Erreur lors du chargement des données");
      
      dispatch(addNotification({
        message: 'Erreur lors du chargement des statistiques client',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  }, [selectedClientId, dateRange, dispatch]);
  // === Fin : Fonction de récupération des données du client sélectionné ===

  // === Début : Déclenchement de la récupération des données au changement de client ou de dates ===
  // Explication simple : Dès que tu choisis un client différent ou des dates différentes, on met à jour toutes les informations pour montrer les bonnes statistiques.
  // Explication technique : Hook useEffect qui surveille les changements de client sélectionné ou de plage de dates pour déclencher une nouvelle récupération des données.
  useEffect(() => {
    if (selectedClientId) {
      fetchClientData();
    }
  }, [selectedClientId, dateRange, fetchClientData]);
  // === Fin : Déclenchement de la récupération des données au changement de client ou de dates ===

  // === Début : Préparation des données pour les graphiques ===
  // Explication simple : Cette fonction transforme les informations brutes en un format que les graphiques peuvent comprendre et afficher.
  // Explication technique : Fonction qui traite les données des timers pour créer les structures de données nécessaires aux visualisations Chart.js, avec regroupement par date et séparation du temps facturable et non facturable.
  const prepareChartData = (timersData: any[]) => {
    if (!timersData.length) {
      setTimeData({ labels: [], datasets: [] });
      setProfitabilityData({ labels: [], datasets: [] });
      return;
    }
    
    // Regrouper les timers par jour
    const entriesByDate: { [date: string]: { total: number, billable: number, nonBillable: number } } = {};
    
    // Initialiser toutes les dates dans la plage
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      entriesByDate[dateString] = { total: 0, billable: 0, nonBillable: 0 };
    }
    
    // Remplir avec les données réelles
    timersData.forEach(timer => {
      const date = new Date(timer.startTime).toISOString().split('T')[0];
      if (!entriesByDate[date]) {
        entriesByDate[date] = { total: 0, billable: 0, nonBillable: 0 };
      }
      
      // Convertir la durée en secondes si elle est en heures
      const durationInSeconds = timer.duration * (timer.duration < 100 ? 3600 : 1);
      
      // Ajouter au total
      entriesByDate[date].total += durationInSeconds;
      
      // Ajouter au facturable ou non facturable
      if (timer.billable) {
        entriesByDate[date].billable += durationInSeconds;
      } else {
        entriesByDate[date].nonBillable += durationInSeconds;
      }
    });
    
    // Préparer les données pour le graphique de temps
    const labels = Object.keys(entriesByDate).sort();
    
    const timeChartData = {
      labels,
      datasets: [
        {
          label: 'Temps facturable (heures)',
          data: labels.map(date => entriesByDate[date].billable / 3600),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
          label: 'Temps non facturable (heures)',
          data: labels.map(date => entriesByDate[date].nonBillable / 3600),
          borderColor: 'rgb(234, 179, 8)',
          backgroundColor: 'rgba(234, 179, 8, 0.5)',
        }
      ]
    };
    
    setTimeData(timeChartData);
    
    // Préparer les données pour le graphique de rentabilité
    if (profitability && profitability.hourlyRate) {
      const hourlyRate = profitability.hourlyRate;
      
      const profitabilityChartData = {
        labels,
        datasets: [
          {
            label: 'Revenus (€)',
            data: labels.map(date => (entriesByDate[date].billable / 3600) * hourlyRate),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            yAxisID: 'y',
          },
          {
            label: 'Taux horaire (€/h)',
            data: labels.map(date => {
              const hours = entriesByDate[date].total / 3600;
              if (hours === 0) return hourlyRate;
              const revenue = (entriesByDate[date].billable / 3600) * hourlyRate;
              return Math.round(revenue / hours);
            }),
            borderColor: 'rgb(249, 115, 22)',
            backgroundColor: 'rgba(249, 115, 22, 0.5)',
            type: 'line',
            yAxisID: 'y1',
          }
        ]
      };
      
      setProfitabilityData(profitabilityChartData);
    }
  };
  // === Fin : Préparation des données pour les graphiques ===

  // === Début : Gestion du changement de période ===
  // Explication simple : Cette fonction permet de choisir facilement si on veut voir les données pour aujourd'hui, la semaine, le mois ou l'année.
  // Explication technique : Fonction qui met à jour la plage de dates en fonction de la période sélectionnée (jour, semaine, mois, année ou personnalisée), en calculant les dates de début et de fin appropriées.
  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'year' | 'custom') => {
    setPeriod(newPeriod);
    
    if (newPeriod === 'custom') return;
    
    const today = new Date();
    let startDate = new Date();
    
    switch (newPeriod) {
      case 'day':
        startDate = new Date(today);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        break;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };
  // === Fin : Gestion du changement de période ===

  // === Début : Formatage de la durée ===
  // Explication simple : Cette fonction transforme des secondes en un format plus facile à lire comme "2h 30min".
  // Explication technique : Fonction utilitaire qui convertit une durée en secondes en format horaire lisible (heures et minutes) pour l'affichage dans l'interface.
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes}min`;
    }
    
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };
  // === Fin : Formatage de la durée ===

  // === Début : Calculs des statistiques totales ===
  // Explication simple : On calcule tous les totaux importants : combien de temps total, combien d'argent gagné, etc.
  // Explication technique : Calcul des métriques agrégées à partir des données des timers pour afficher les totaux de temps facturable, non facturable, pourcentage facturable, revenus et taux horaire effectif.
  const totalBillableSeconds = timers.reduce((total, timer) => {
    // Convertir la durée en secondes si elle est en heures
    const durationInSeconds = timer.billable ? (timer.duration * (timer.duration < 100 ? 3600 : 1)) : 0;
    return total + durationInSeconds;
  }, 0);

  const totalNonBillableSeconds = timers.reduce((total, timer) => {
    // Convertir la durée en secondes si elle est en heures
    const durationInSeconds = !timer.billable ? (timer.duration * (timer.duration < 100 ? 3600 : 1)) : 0;
    return total + durationInSeconds;
  }, 0);

  const totalSeconds = totalBillableSeconds + totalNonBillableSeconds;
  const billablePercentage = totalSeconds > 0 ? Math.round((totalBillableSeconds / totalSeconds) * 100) : 0;
  const revenue = profitability && profitability.hourlyRate ? (totalBillableSeconds / 3600) * profitability.hourlyRate : 0;
  const effectiveHourlyRate = totalSeconds > 0 ? revenue / (totalSeconds / 3600) : 0;
  // === Fin : Calculs des statistiques totales ===

  // === Début : Rendu de l'interface ===
  // Explication simple : C'est tout ce qu'on va voir à l'écran : les filtres, les graphiques et les chiffres.
  // Explication technique : Fonction de rendu JSX qui affiche l'interface utilisateur avec les filtres de sélection, les statistiques agrégées et les visualisations de données, avec gestion conditionnelle des états de chargement et d'erreur.
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <span className="mr-2">Statistiques clients</span>
        {selectedClient && <ClientLogo client={selectedClient} size="small" />}
      </h1>
      
      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Sélectionner un client</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Période
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handlePeriodChange('day')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'day'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => handlePeriodChange('week')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                7 derniers jours
              </button>
              <button
                onClick={() => handlePeriodChange('month')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                30 derniers jours
              </button>
              <button
                onClick={() => handlePeriodChange('year')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'year'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                365 derniers jours
              </button>
              <button
                onClick={() => handlePeriodChange('custom')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'custom'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Personnalisé
              </button>
            </div>
          </div>
        </div>
        
        {period === 'custom' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
          {error}
        </div>
      ) : selectedClientId ? (
        <>
          {/* Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Temps total</h2>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {formatDuration(totalSeconds)}
              </div>
              <div className="mt-1 flex items-center">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-blue-600 dark:text-blue-400">{formatDuration(totalBillableSeconds)}</span> facturable
                </div>
                <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">{formatDuration(totalNonBillableSeconds)}</span> non-facturable
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Taux horaire</h2>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {profitability?.hourlyRate || 0}€/h
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Objectif mensuel: <span className="font-medium">{profitability?.targetHours || 0}h</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Revenus générés</h2>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.round(revenue)}€
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Basé sur le temps facturable
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Taux effectif</h2>
              <div className={`text-3xl font-bold ${
                effectiveHourlyRate >= (profitability?.hourlyRate || 0)
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {Math.round(effectiveHourlyRate)}€/h
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {Math.round(billablePercentage)}% du temps facturable
              </div>
            </div>
          </div>
          
          {/* Graphiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Temps passé par jour</h2>
              {timeData.labels.length > 0 ? (
                <Bar
                  data={timeData}
                  options={{
                    responsive: true,
                    scales: {
                      x: {
                        stacked: true,
                      },
                      y: {
                        stacked: true,
                        title: {
                          display: true,
                          text: 'Heures'
                        }
                      }
                    }
                  }}
                />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400">Aucune donnée pour la période sélectionnée</p>
                </div>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition du temps</h2>
              {totalSeconds > 0 ? (
                <Doughnut
                  data={{
                    labels: ['Facturable', 'Non facturable'],
                    datasets: [
                      {
                        data: [totalBillableSeconds, totalNonBillableSeconds],
                        backgroundColor: [
                          'rgba(59, 130, 246, 0.7)',
                          'rgba(234, 179, 8, 0.7)'
                        ],
                        borderColor: [
                          'rgba(59, 130, 246, 1)',
                          'rgba(234, 179, 8, 1)'
                        ],
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400">Aucune donnée pour la période sélectionnée</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Graphique de rentabilité */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Rentabilité et revenus</h2>
            {profitabilityData.labels.length > 0 ? (
              <Bar
                data={profitabilityData}
                options={{
                  responsive: true,
                  scales: {
                    y: {
                      position: 'left',
                      title: {
                        display: true,
                        text: 'Revenus (€)'
                      }
                    },
                    y1: {
                      position: 'right',
                      grid: {
                        drawOnChartArea: false,
                      },
                      title: {
                        display: true,
                        text: 'Taux horaire (€/h)'
                      }
                    },
                  }
                }}
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                <p className="text-gray-600 dark:text-gray-400">Aucune donnée pour la période sélectionnée</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg text-center">
          <p className="text-blue-800 dark:text-blue-200">Veuillez sélectionner un client pour voir ses statistiques</p>
        </div>
      )}
    </div>
  );
  // === Fin : Rendu de l'interface ===
};
// === Fin : Composant principal des statistiques client ===

export default ClientStatistics;