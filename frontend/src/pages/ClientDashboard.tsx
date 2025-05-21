/*
 * TABLEAU DE BORD DU TEMPS PAR CLIENT - frontend/src/pages/ClientDashboard.tsx
 *
 * Explication simple:
 * Ce fichier crée une page qui te montre combien de temps tu as passé à travailler pour 
 * chaque client. C'est comme un journal du temps que tu peux filtrer par jour, semaine 
 * ou mois. Tu peux voir quels clients ont pris le plus de ton temps, sur quelles tâches 
 * tu as travaillé, et un graphique qui montre comment ton temps de travail a changé jour 
 * après jour.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente un tableau de bord analytique pour visualiser
 * les données de suivi du temps par client et par tâche. Il gère la récupération des données
 * temporelles depuis l'API, le filtrage par plage de dates, et la présentation des métriques
 * sous forme de statistiques et de visualisations.
 *
 * Où ce fichier est utilisé:
 * Affiché comme page principale dans l'application, accessible via le menu de navigation latéral,
 * généralement sous une route comme '/client-statistics' ou '/time-dashboard'.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés useAppDispatch et useAppSelector depuis '../hooks'
 * - Importe et dispatch l'action addNotification depuis '../store/slices/uiSlice'
 * - Communique avec l'API backend via axios pour récupérer les données de suivi du temps
 * - Utilise la bibliothèque framer-motion pour les animations d'interface
 */

// === Début : Importation des dépendances et configuration ===
// Explication simple : On prend tous les outils dont on a besoin pour créer notre tableau de bord, comme quand tu rassembles tes crayons, règles et papiers avant de dessiner.
// Explication technique : Importation des hooks React nécessaires pour la gestion d'état et du cycle de vie, des hooks Redux personnalisés pour accéder au store, de l'action de notification, de la bibliothèque d'animation et d'axios pour les requêtes HTTP.
import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Importation des dépendances et configuration ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur à quoi ressemblent nos données, comme quand tu décris les règles d'un jeu avant de commencer à jouer.
// Explication technique : Déclaration des interfaces TypeScript qui définissent la structure des objets de données utilisés dans le composant, avec typage strict pour assurer l'intégrité des données manipulées.
// Types
interface TimeEntry {
  _id: string;
  clientId: string;
  clientName: string;
  clientLogo?: string;
  taskId?: string;
  taskTitle?: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration: number; // en secondes
  date: string;
}

interface ClientSummary {
  clientId: string;
  clientName: string;
  clientLogo?: string;
  totalDuration: number; // en secondes
  tasks: {
    taskId: string;
    taskTitle: string;
    duration: number; // en secondes
  }[];
}
// === Fin : Définition des interfaces TypeScript ===

// === Début : Composant principal ClientDashboard ===
// Explication simple : C'est le grand tableau de bord qui va afficher toutes les informations sur ton temps de travail, comme un tableau d'affichage à l'école qui montre tous les résultats.
// Explication technique : Définition du composant fonctionnel React avec typage explicite, qui encapsule toute la logique et l'interface utilisateur du tableau de bord d'analyse temporelle.
const ClientDashboard: React.FC = () => {
// === Fin : Composant principal ClientDashboard ===

  // === Début : Initialisation des hooks Redux ===
  // Explication simple : On prépare notre messager qui va pouvoir envoyer des messages au "cerveau" de l'application.
  // Explication technique : Configuration du dispatcher Redux pour émettre des actions et interagir avec le store global de l'application.
  const dispatch = useAppDispatch();
  // === Fin : Initialisation des hooks Redux ===
  
  // === Début : Configuration des états locaux ===
  // Explication simple : On crée des boîtes pour ranger toutes nos informations et pouvoir les changer facilement, comme des tiroirs dans une commode.
  // Explication technique : Initialisation des états locaux via useState pour gérer les données des entrées temporelles, les résumés par client, l'état de chargement et les filtres de date.
  // États locaux
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [clientSummaries, setClientSummaries] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dateRange, setDateRange] = useState<{
    startDate: string;
    endDate: string;
  }>({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // 30 jours en arrière
    endDate: new Date().toISOString().split('T')[0] // Aujourd'hui
  });
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('month');
  // === Fin : Configuration des états locaux ===
  
  // === Début : Fonction de récupération des données temporelles ===
  // Explication simple : Cette fonction va chercher toutes les informations sur ton temps de travail sur le serveur, comme quand tu demandes à la bibliothèque de te donner tous les livres sur un sujet.
  // Explication technique : Fonction mémorisée avec useCallback qui effectue une requête HTTP pour récupérer les données de suivi du temps, puis les traite pour construire les structures de données nécessaires à l'affichage.
  const fetchTimeData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Récupérer les timers dans la plage de dates
      const response = await axios.get(`${API_URL}/api/timers`, {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Traiter les données
      const entries: TimeEntry[] = response.data.map((timer: any) => ({
        _id: timer._id,
        clientId: timer.clientId?._id || timer.clientId,
        clientName: timer.clientId?.name || 'Client inconnu',
        clientLogo: timer.clientId?.logo,
        taskId: timer.taskId?._id || timer.taskId,
        taskTitle: timer.taskId?.title || 'Tâche sans titre',
        description: timer.description || '',
        startTime: timer.startTime,
        endTime: timer.endTime,
        duration: timer.duration,
        date: new Date(timer.startTime).toISOString().split('T')[0]
      }));
      
      setTimeEntries(entries);
      
      // Créer les résumés par client
      const summaries: ClientSummary[] = [];
      const clientMap: {[key: string]: ClientSummary} = {};
      
      entries.forEach(entry => {
        if (!clientMap[entry.clientId]) {
          clientMap[entry.clientId] = {
            clientId: entry.clientId,
            clientName: entry.clientName,
            clientLogo: entry.clientLogo,
            totalDuration: 0,
            tasks: []
          };
          summaries.push(clientMap[entry.clientId]);
        }
        
        // Ajouter la durée au total du client
        clientMap[entry.clientId].totalDuration += entry.duration;
        
        // Ajouter la tâche si elle existe
        if (entry.taskId) {
          // Vérifier si la tâche existe déjà dans le résumé
          const taskIndex = clientMap[entry.clientId].tasks.findIndex(t => t.taskId === entry.taskId);
          
          if (taskIndex === -1) {
            // Ajouter une nouvelle tâche
            clientMap[entry.clientId].tasks.push({
              taskId: entry.taskId,
              taskTitle: entry.taskTitle || 'Tâche sans titre',
              duration: entry.duration
            });
          } else {
            // Mettre à jour la durée de la tâche existante
            clientMap[entry.clientId].tasks[taskIndex].duration += entry.duration;
          }
        }
      });
      
      // Trier les clients par durée totale (décroissant)
      summaries.sort((a, b) => b.totalDuration - a.totalDuration);
      
      // Trier les tâches de chaque client par durée (décroissant)
      summaries.forEach(summary => {
        summary.tasks.sort((a, b) => b.duration - a.duration);
      });
      
      setClientSummaries(summaries);
      
    } catch (error: any) {
      console.error('Erreur lors de la récupération des données de temps:', error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la récupération des données',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  }, [dateRange, dispatch]);
  // === Fin : Fonction de récupération des données temporelles ===
  
  // === Début : Effet de chargement initial des données ===
  // Explication simple : Cette partie s'assure que les données sont chargées automatiquement quand tu ouvres la page, comme quand la lumière s'allume automatiquement quand tu entres dans une pièce.
  // Explication technique : Hook useEffect qui déclenche le chargement des données au montage du composant et lorsque la fonction de récupération change (notamment suite à un changement de plage de dates).
  // Charger les données
  useEffect(() => {
    fetchTimeData();
  }, [fetchTimeData]);
  // === Fin : Effet de chargement initial des données ===
  
  // === Début : Fonction de formatage de la durée ===
  // Explication simple : Cette fonction transforme des secondes en un format plus facile à lire avec des heures et des minutes, comme quand tu convertis des centimètres en mètres pour mieux comprendre la taille.
  // Explication technique : Fonction utilitaire qui convertit une durée en secondes en une chaîne de caractères formatée en heures et minutes, avec gestion conditionnelle de l'affichage selon la valeur.
  // Formater la durée en heures et minutes
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    }
    
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };
  // === Fin : Fonction de formatage de la durée ===
  
  // === Début : Fonction de changement de période ===
  // Explication simple : Cette fonction permet de changer rapidement la période que tu veux voir (aujourd'hui, la semaine, le mois...), comme quand tu zoomes ou dézoomes sur une carte pour voir différentes échelles.
  // Explication technique : Gestionnaire d'événement qui met à jour l'état de la période sélectionnée et calcule dynamiquement la plage de dates correspondante pour filtrer les données affichées.
  // Fonction pour définir la plage de dates en fonction de la période
  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'year' | 'custom') => {
    setPeriod(newPeriod);
    
    const today = new Date();
    let startDate = new Date();
    
    switch (newPeriod) {
      case 'day':
        // Aujourd'hui
        startDate = new Date(today);
        break;
      case 'week':
        // 7 derniers jours
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        // 30 derniers jours
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'year':
        // 365 derniers jours
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 365);
        break;
      case 'custom':
        // Ne rien faire, garder les dates actuelles
        return;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };
  // === Fin : Fonction de changement de période ===
  
  // === Début : Calcul des statistiques globales ===
  // Explication simple : On additionne tous les temps pour avoir une vue d'ensemble, comme quand tu comptes tous tes bonbons pour savoir combien tu en as au total.
  // Explication technique : Calcul des métriques agrégées à partir des données client pour afficher les statistiques globales et les pourcentages relatifs.
  // Calculer les totaux
  const totalDuration = clientSummaries.reduce((sum, client) => sum + client.totalDuration, 0);
  const totalHours = Math.floor(totalDuration / 3600);
  const totalMinutes = Math.floor((totalDuration % 3600) / 60);
  
  // Calculer le pourcentage de chaque client
  const getClientPercentage = (clientDuration: number): number => {
    if (totalDuration === 0) return 0;
    return (clientDuration / totalDuration) * 100;
  };
  // === Fin : Calcul des statistiques globales ===
  
  // === Début : Rendu du composant ===
  // Explication simple : C'est là qu'on dessine tout notre tableau de bord avec toutes ses parties, comme quand tu assembles un puzzle pour voir l'image complète.
  // Explication technique : Retour du JSX qui structure l'interface utilisateur complète du tableau de bord, organisé en sections distinctes avec animations via Framer Motion.
  return (
    <div className="container mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Tableau de bord du temps</h1>
        
        {/* === Début : Section des filtres de date === */}
        {/* Explication simple : Cette partie te permet de choisir quelle période de temps tu veux voir, comme quand tu choisis si tu veux regarder les photos d'aujourd'hui ou de toute la semaine. */}
        {/* Explication technique : Panneau de filtrage temporel qui permet à l'utilisateur de sélectionner une période prédéfinie ou personnalisée, avec des contrôles adaptatifs selon le choix de période. */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2 md:mr-6">
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
                Année
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
            
            {period === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Période: <span className="font-medium text-gray-800 dark:text-gray-200">{dateRange.startDate} - {dateRange.endDate}</span>
            </div>
            
            <button
              onClick={fetchTimeData}
              disabled={loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Chargement...
                </div>
              ) : 'Actualiser'}
            </button>
          </div>
        </div>
        {/* === Fin : Section des filtres de date === */}
        
        {/* === Début : Section de résumé global === */}
        {/* Explication simple : Cette partie montre les grands chiffres importants : combien de temps total tu as travaillé, pour combien de clients, et combien de temps en moyenne par jour. */}
        {/* Explication technique : Affichage des métriques agrégées clés sous forme de cartes, présentant le temps total, le nombre de clients et la moyenne quotidienne, avec conversion automatique des unités. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Temps total</h2>
            <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {totalHours}h {totalMinutes}min
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Période: {dateRange.startDate} - {dateRange.endDate}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Nombre de clients</h2>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {clientSummaries.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Clients ayant du temps enregistré sur la période
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Moyenne quotidienne</h2>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              {(() => {
                const days = Math.max(1, Math.round((new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                const avgSeconds = totalDuration / days;
                const avgHours = Math.floor(avgSeconds / 3600);
                const avgMinutes = Math.floor((avgSeconds % 3600) / 60);
                return `${avgHours}h ${avgMinutes}min`;
              })()}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Temps moyen par jour sur la période
            </p>
          </div>
        </div>
        {/* === Fin : Section de résumé global === */}
        
        {/* === Début : Section de répartition par client === */}
        {/* Explication simple : Cette partie montre en détail pour chaque client combien de temps tu as travaillé et sur quelles tâches, comme quand tu fais l'inventaire de tes jouets en les regroupant par type. */}
        {/* Explication technique : Visualisation détaillée des données par client, avec barres de progression pour les pourcentages de temps, logos conditionnels, et liste hiérarchique des tâches par durée. */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition par client</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : clientSummaries.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">Aucune donnée disponible pour cette période</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clientSummaries.map((client) => (
                <div key={client.clientId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      {client.clientLogo ? (
                        <div className="w-8 h-8 mr-3 rounded overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img 
                            src={client.clientLogo} 
                            alt={`Logo de ${client.clientName}`} 
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 mr-3 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                          <span className="text-gray-600 dark:text-gray-400 text-sm font-bold">
                            {client.clientName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <h3 className="font-semibold text-gray-900 dark:text-white">{client.clientName}</h3>
                    </div>
                    <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {formatDuration(client.totalDuration)}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary-600 dark:bg-primary-500 rounded-full" 
                        style={{ width: `${getClientPercentage(client.totalDuration)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-right text-xs text-gray-600 dark:text-gray-400">
                      {getClientPercentage(client.totalDuration).toFixed(1)}% du temps total
                    </div>
                  </div>
                  
                  {client.tasks.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Répartition par tâche</h4>
                      <div className="space-y-2 pl-4">
                        {client.tasks.slice(0, 3).map((task) => (
                          <div key={task.taskId} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400 truncate max-w-xs">{task.taskTitle}</span>
                            <span className="text-gray-900 dark:text-gray-100 font-medium">{formatDuration(task.duration)}</span>
                          </div>
                        ))}
                        {client.tasks.length > 3 && (
                          <div className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                            + {client.tasks.length - 3} autres tâches
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* === Fin : Section de répartition par client === */}
        
        {/* === Début : Section de graphique d'évolution === */}
        {/* Explication simple : Cette partie montre un graphique qui te permet de voir comment ton temps de travail a changé jour après jour, comme quand tu dessines une ligne qui monte et qui descend pour montrer tes progrès. */}
        {/* Explication technique : Visualisation graphique de l'évolution temporelle, implémentée sous forme de graphique à barres avec tooltips interactifs, construit manuellement à partir des données d'entrées temporelles regroupées par date. */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Évolution du temps par jour</h2>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
            </div>
          ) : timeEntries.length === 0 ? (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-gray-600 dark:text-gray-400">Aucune donnée disponible pour cette période</p>
            </div>
          ) : (
            <div>
              {/* Graphique simplifié */}
              <div className="h-64 relative mt-4">
                {(() => {
                  // Regrouper les entrées par date
                  const entriesByDate: {[date: string]: {total: number, byClient: {[clientId: string]: number}}} = {};
                  
                  // Initialiser toutes les dates dans la plage
                  const startDate = new Date(dateRange.startDate);
                  const endDate = new Date(dateRange.endDate);
                  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dateString = d.toISOString().split('T')[0];
                    entriesByDate[dateString] = { total: 0, byClient: {} };
                  }
                  
                  // Remplir avec les données réelles
                  timeEntries.forEach(entry => {
                    const date = new Date(entry.startTime).toISOString().split('T')[0];
                    if (!entriesByDate[date]) {
                      entriesByDate[date] = { total: 0, byClient: {} };
                    }
                    
                    // Ajouter au total de la date
                    entriesByDate[date].total += entry.duration;
                    
                    // Ajouter au client spécifique
                    if (!entriesByDate[date].byClient[entry.clientId]) {
                      entriesByDate[date].byClient[entry.clientId] = 0;
                    }
                    entriesByDate[date].byClient[entry.clientId] += entry.duration;
                  });
                  
                  // Convertir en tableau pour faciliter le rendu
                  const dateEntries = Object.entries(entriesByDate).sort(([a], [b]) => a.localeCompare(b));
                  
                  // Trouver la valeur maximale pour l'échelle
                  const maxDuration = Math.max(...dateEntries.map(([_, data]) => data.total));
                  
                  // Rendu du graphique simplifié
                  return (
                    <>
                      {/* Axe des dates (X) */}
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                        {dateEntries.length > 10 ? (
                          // Si trop de dates, n'afficher que quelques-unes
                          dateEntries.filter((_, i) => i % Math.ceil(dateEntries.length / 10) === 0).map(([date]) => (
                            <div key={date} className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                            </div>
                          ))
                        ) : (
                          // Sinon, afficher toutes les dates
                          dateEntries.map(([date]) => (
                            <div key={date} className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'})}
                            </div>
                          ))
                        )}
                      </div>
                      
                      {/* Barres du graphique */}
                      <div className="absolute top-0 bottom-8 left-0 right-0 flex justify-between items-end px-4">
                        {dateEntries.map(([date, data]) => {
                          const height = maxDuration > 0 ? (data.total / maxDuration) * 100 : 0;
                          return (
                            <div key={date} className="flex-1 mx-px relative group">
                              <div
                                className="bg-primary-500 dark:bg-primary-600 rounded-t hover:bg-primary-400 dark:hover:bg-primary-500 transition-colors"
                                style={{ height: `${height}%` }}
                              ></div>
                              
                              {/* Info-bulle au survol */}
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                                <div className="font-medium">{new Date(date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'long'})}</div>
                                <div>{formatDuration(data.total)}</div>
                                {Object.entries(data.byClient).slice(0, 3).map(([clientId, duration]) => {
                                  const client = clientSummaries.find(c => c.clientId === clientId);
                                  return (
                                    <div key={clientId} className="text-gray-300 text-xxs">
                                      {client?.clientName || 'Client'}: {formatDuration(duration)}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Axe des durées (Y) */}
                      <div className="absolute top-0 bottom-8 left-0 flex flex-col justify-between items-end pr-2">
                        {[0, 25, 50, 75, 100].map(percent => (
                          <div key={percent} className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDuration((maxDuration * percent) / 100)}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
        {/* === Fin : Section de graphique d'évolution === */}
      </motion.div>
    </div>
  );
  // === Fin : Rendu du composant ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre tableau de bord disponible pour que d'autres parties de l'application puissent l'afficher, comme quand tu partages ton dessin pour que tout le monde puisse le voir.
// Explication technique : Export par défaut du composant pour permettre son importation dans le système de routage de l'application.
export default ClientDashboard;
// === Fin : Export du composant ===
