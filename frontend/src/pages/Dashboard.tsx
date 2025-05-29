/*
 * COMPOSANT TABLEAU DE BORD GAMIFIÉ - src/pages/Dashboard.tsx
 * 
 * Explication simple:
 * Ce fichier crée un tableau de bord ludique qui montre les statistiques de l'utilisateur,
 * ses défis quotidiens, ses badges et l'état de ses tâches, avec des animations et récompenses
 * pour encourager l'utilisateur à être plus productif.
 * 
 * Explication technique:
 * Composant React fonctionnel qui implémente une interface gamifiée intégrant des mécanismes
 * de récompense, avec gestion d'état via Redux, animations via Framer Motion, et optimisations
 * de performance (useMemo, useCallback, etc.). Inclut la gestion des erreurs, des états de
 * chargement et des notifications.
 * 
 * Où ce fichier est utilisé:
 * Dans le routeur principal de l'application, probablement affiché comme page principale après
 * connexion de l'utilisateur.
 * 
 * Connexions avec d'autres fichiers:
 * - Utilise le store Redux via hooks (useAppDispatch, useAppSelector)
 * - Importe des composants UI comme MonthlyProfitabilityWidget et ConfettiEffect
 * - Appelle des services API comme gamificationService, profitabilityRewardService, soundService
 * - Interagit avec les slices Redux pour la gestion des notifications (uiSlice)
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { motion } from 'framer-motion';
import { addNotification } from '../store/slices/uiSlice';
import { gamificationService, timerService, profitabilityService } from '../services/api';
import MonthlyProfitabilityWidget from '../components/profitability/MonthlyProfitabilityWidget';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import { profitabilityRewardService } from '../services/profitabilityRewardService';
import { soundService, SoundTypes, SoundType } from '../services/soundService';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

// Enregistrement des composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// === Début : Interfaces et Types ===
// Explication simple : Ces blocs définissent la forme des données que le composant va utiliser, comme un plan pour construire une maison.
// Explication technique : Déclarations d'interfaces TypeScript pour assurer la cohérence des types de données utilisés dans le composant, notamment pour les challenges et les notifications.
// Définition de l'interface Challenge pour résoudre l'erreur TypeScript
interface Challenge {
  id: number;
  title: string;
  description: string;
  progress: number;
  reward: number;
  completed: boolean;
}

// Interface pour les notifications
interface Notification {
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}
// === Fin : Interfaces et Types ===

interface ClientMetrics {
  id: string;
  name: string;
  logo?: string;
  monthlyRevenue: number;
  hoursThisMonth: number;
  profitabilityScore: number;
}

// === Début : Composant principal Dashboard ===
// Explication simple : Cette fonction crée toute la page du tableau de bord avec toutes ses parties (statistiques, défis, etc.).
// Explication technique : Composant fonctionnel React qui orchestre l'affichage des différents widgets et la logique d'interaction utilisateur. Point d'entrée principal pour la page dashboard.
const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // === Début : Initialisation des références et états ===
  // Explication simple : On crée des "boîtes" pour stocker différentes informations qui peuvent changer avec le temps.
  // Explication technique : Déclaration des hooks useState pour gérer l'état local du composant et useRef pour conserver des références entre les rendus.
  
  // Référence pour stocker les timers
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  
  // Utilisation de valeurs par défaut pour tous les états
  const auth = useAppSelector(state => state.auth) || {};
  const { user = { name: 'Utilisateur', email: 'utilisateur@exemple.com' } } = auth;
  
  // Mémoiser l'utilisateur pour éviter des re-renders inutiles
  const memoizedUser = useMemo(() => user, [user]);
  
  const gamification = useAppSelector(state => state.gamification) || {};
  const { 
    level = 1, 
    experience = 0, 
    actionPoints = 0, 
    badges = [], 
    currentStreak = 0
  } = gamification;
  
  const tasksState = useAppSelector(state => state.tasks) || {};
  const { tasks = [] } = tasksState;
  
  const clientsState = useAppSelector(state => state.clients) || {};
  const { clients = [] } = clientsState;
  
  const [showChallenges, setShowChallenges] = useState(false);
  const [showGlobalConfetti, setShowGlobalConfetti] = useState(false);
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [notificationQueue, setNotificationQueue] = useState<Notification[]>([]);
  
  // Nouveaux états pour les métriques
  const [todayStats, setTodayStats] = useState({ hours: 0, revenue: 0, tasksCompleted: 0 });
  const [weekStats, setWeekStats] = useState({ hours: 0, revenue: 0, growth: 0 });
  const [topClients, setTopClients] = useState<ClientMetrics[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any>({ labels: [], datasets: [] });
  const [taskDistributionData, setTaskDistributionData] = useState<any>({ labels: [], datasets: [] });
  const [activeTimers, setActiveTimers] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  // === Fin : Initialisation des références et états ===
  
  // === Début : Traitement des tâches et calcul des statistiques ===
  // Explication simple : On organise et compte les tâches selon leur statut (terminées, en cours, à faire).
  // Explication technique : Filtrage et agrégation des tâches pour calculer les métriques d'avancement utilisées dans l'interface.
  // S'assurer que tasks est un tableau et que chaque tâche a un statut valide
  const isValidTask = (task: any): boolean => 
    task && typeof task === 'object' && 'status' in task && 
    ['terminée', 'à faire', 'en cours'].includes(task.status);
    
  const validTasks = Array.isArray(tasks) ? tasks.filter(isValidTask) : [];
  const completedTasks = validTasks.filter(task => task.status === 'terminée').length;
  const pendingTasks = validTasks.filter(task => task.status === 'à faire').length;
  const inProgressTasks = validTasks.filter(task => task.status === 'en cours').length;
  const totalTasks = validTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Utiliser currentStreak dans l'UI
  useEffect(() => {
    if (currentStreak > 0) {
      console.log(`Série actuelle: ${currentStreak} jours`);
    }
  }, [currentStreak]);

  // Utiliser completionRate dans l'UI  
  useEffect(() => {
    if (completionRate > 80) {
      console.log(`Excellent taux de complétion: ${completionRate}%`);
    }
  }, [completionRate]);

  // === Fin : Traitement des tâches et calcul des statistiques ===
  
  // === Début : Traitement des badges ===
  // Explication simple : On s'assure que les badges sont valides et on prend seulement les 4 premiers pour les afficher.
  // Explication technique : Validation et filtrage des données de badges pour assurer l'intégrité de l'UI et limiter le nombre d'éléments affichés.
  // Vérifier que badges est un tableau et filtrer les badges valides
  const recentBadges = Array.isArray(badges) 
    ? badges
        .filter(badge => badge && typeof badge === 'object' && '_id' in badge && 'icon' in badge && 'name' in badge)
        .slice(0, 4) 
    : [];
  // === Fin : Traitement des badges ===
  
  // === Début : Gestion responsive des confettis ===
  // Explication simple : On ajuste le nombre de confettis selon la taille de l'écran pour éviter de ralentir les petits appareils.
  // Explication technique : Adaptation responsive du nombre de particules de confettis selon la largeur de l'écran, avec un gestionnaire d'événement de redimensionnement.
  // Nombre de particules adaptatif selon la taille de l'écran
  const [particleCount, setParticleCount] = useState(200);
  
  // Effet pour définir le nombre de particules en fonction de la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setParticleCount(window.innerWidth > 768 ? 200 : 100);
    };
    
    // Initialisation
    handleResize();
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', handleResize);
    
    // Nettoyage
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  // === Fin : Gestion responsive des confettis ===
  
  // === Début : Fonction de déclenchement des confettis ===
  // Explication simple : Cette fonction lance l'effet de confettis avec un son optionnel et les fait disparaître après 5 secondes.
  // Explication technique : Fonction mémoïsée qui gère l'animation de confettis et la lecture des effets sonores, avec vérification de validité du type de son.
  // Fonction centralisée pour déclencher les confettis
  const triggerConfetti = useCallback((soundEffect?: string) => {
    if (!showGlobalConfetti) {
      setShowGlobalConfetti(true);
      if (soundEffect && Object.values(SoundTypes).includes(soundEffect as SoundType)) {
        soundService.play(soundEffect as SoundType);
      } else if (soundEffect) {
        console.warn(`Invalid sound effect: ${soundEffect}`);
      }
      setTimeout(() => setShowGlobalConfetti(false), 5000);
    }
  }, [showGlobalConfetti]);
  // === Fin : Fonction de déclenchement des confettis ===
  
  // === Début : Gestion des notifications ===
  // Explication simple : Cette fonction permet d'ajouter des messages en file d'attente pour les afficher un par un, en priorisant les messages importants.
  // Explication technique : Système de gestion de file d'attente pour les notifications avec priorisation des types error/warning, et limitation du nombre maximum d'éléments.
  // Fonction centralisée pour gérer les notifications avec priorisation
  const addNotificationToQueue = useCallback((notification: Notification) => {
    setNotificationQueue(prevQueue => {
      // Prioriser les notifications d'erreur et d'avertissement
      const isPriority = notification.type === 'error' || notification.type === 'warning';
      
      // Si c'est une notification prioritaire et que la file est pleine, on retire la notification la moins prioritaire
      if (isPriority && prevQueue.length >= 3) {
        // Trouver l'index de la première notification non prioritaire ('success' ou 'info')
        const indexToRemove = prevQueue.findIndex(n => n.type === 'success' || n.type === 'info');
        
        if (indexToRemove !== -1) {
          // Créer une nouvelle file d'attente en retirant la notification non prioritaire
          const newQueue = [...prevQueue];
          newQueue.splice(indexToRemove, 1);
          return [...newQueue, notification];
        }
      }
      
      // Comportement standard: limiter le nombre de notifications à 3 maximum
      const newQueue = [...prevQueue, notification].slice(-3);
      return newQueue;
    });
  }, []);
  
  // Effet pour traiter la file d'attente des notifications
  useEffect(() => {
    if (notificationQueue.length > 0) {
      const notification = notificationQueue[0];
      dispatch(addNotification(notification));
      
      // Retirer la notification de la file d'attente
      setTimeout(() => {
        setNotificationQueue(prevQueue => prevQueue.slice(1));
      }, 500); // Délai court pour éviter les notifications simultanées
    }
  }, [notificationQueue, dispatch]); // dispatch inclus comme dépendance
  // === Fin : Gestion des notifications ===
  
  // === Fonctions utilitaires ===
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };
  
  const getMotivationalQuote = () => {
    const quotes = [
      "Chaque minute compte, faites-en bon usage ! 💪",
      "La productivité d'aujourd'hui est le succès de demain 🚀",
      "Transformez vos objectifs en réalisations ✨",
      "Excellente journée pour atteindre vos buts ! 🎯",
      "Votre détermination forge votre réussite 💎"
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  };
  
  // === Chargement des données du dashboard ===
  const loadDashboardData = useCallback(async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Charger les timers et calculer les statistiques
      const [timersData, profitabilityData] = await Promise.all([
        timerService.getAllTimers(),
        profitabilityService.getAllProfitability()
      ]);
      
      // Calculer les stats du jour
      const today = new Date().toISOString().split('T')[0];
      const todayTimers = timersData.filter((t: any) => t.startTime?.startsWith(today));
      const todayHours = todayTimers.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) / 3600;
      
      // Créer un map de profitabilité
      const profitMap = new Map();
      profitabilityData.forEach((p: any) => {
        if (p.clientId?._id) {
          profitMap.set(p.clientId._id, p);
        }
      });
      
      // Calculer les revenus du jour
      let todayRevenue = 0;
      todayTimers.forEach((timer: any) => {
        if (timer.billable && timer.clientId) {
          const prof = profitMap.get(timer.clientId);
          if (prof) {
            todayRevenue += (timer.duration / 3600) * (prof.hourlyRate || 100);
          }
        }
      });
      
      // Stats de la semaine
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekTimers = timersData.filter((t: any) => 
        new Date(t.startTime) >= weekAgo
      );
      const weekHours = weekTimers.reduce((sum: number, t: any) => sum + (t.duration || 0), 0) / 3600;
      
      // Calculer le top 3 des clients
      const clientStats = new Map();
      timersData.forEach((timer: any) => {
        if (timer.clientId && timer.billable) {
          const client = clients.find((c: any) => c._id === timer.clientId);
          if (client) {
            const current = clientStats.get(client._id) || { 
              id: client._id,
              name: client.name,
              logo: client.logo,
              hours: 0,
              revenue: 0
            };
            const prof = profitMap.get(client._id);
            const hours = timer.duration / 3600;
            current.hours += hours;
            current.revenue += hours * (prof?.hourlyRate || 100);
            clientStats.set(client._id, current);
          }
        }
      });
      
      const topClientsArray = Array.from(clientStats.values())
        .map(c => ({
          ...c,
          monthlyRevenue: Math.round(c.revenue),
          hoursThisMonth: Math.round(c.hours * 10) / 10,
          profitabilityScore: c.hours > 0 ? Math.round((c.revenue / c.hours) / 100 * 100) : 0
        }))
        .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
        .slice(0, 3);
      
      // Préparer les données du graphique de revenus (7 derniers jours)
      const revenueByDay = new Map();
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        revenueByDay.set(date.toISOString().split('T')[0], 0);
      }
      
      timersData.forEach((timer: any) => {
        const date = timer.startTime?.split('T')[0];
        if (date && revenueByDay.has(date) && timer.billable) {
          const prof = profitMap.get(timer.clientId);
          if (prof) {
            const revenue = (timer.duration / 3600) * (prof.hourlyRate || 100);
            revenueByDay.set(date, revenueByDay.get(date) + revenue);
          }
        }
      });
      
      const chartLabels = Array.from(revenueByDay.keys()).map(date => {
        const d = new Date(date);
        return d.toLocaleDateString('fr-FR', { weekday: 'short' });
      });
      
      setRevenueChartData({
        labels: chartLabels,
        datasets: [{
          label: 'Revenus',
          data: Array.from(revenueByDay.values()),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      });
      
      // Distribution des tâches
      const validTasks = Array.isArray(tasks) ? tasks : [];
      const taskCounts = {
        completed: validTasks.filter(t => t.status === 'terminée').length,
        inProgress: validTasks.filter(t => t.status === 'en cours').length,
        todo: validTasks.filter(t => t.status === 'à faire').length
      };
      
      setTaskDistributionData({
        labels: ['Terminées', 'En cours', 'À faire'],
        datasets: [{
          data: [taskCounts.completed, taskCounts.inProgress, taskCounts.todo],
          backgroundColor: [
            'rgba(16, 185, 129, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(251, 146, 60, 0.8)'
          ],
          borderWidth: 0
        }]
      });
      
      // Timers actifs
      const activeTimersData = timersData
        .filter((t: any) => t.isActive)
        .map((t: any) => ({
          taskTitle: t.taskId?.title || 'Tâche sans titre',
          clientName: clients.find((c: any) => c._id === t.clientId)?.name || 'Sans client',
          startTime: t.startTime,
          duration: t.duration || 0
        }));
      
      setActiveTimers(activeTimersData);
      
      // Calculer les tâches complétées aujourd'hui en se basant sur les timers
      // au lieu d'utiliser updatedAt qui n'existe pas
      const tasksWithTimersToday = new Set();
      todayTimers.forEach((timer: any) => {
        if (timer.taskId) {
          tasksWithTimersToday.add(timer.taskId);
        }
      });
      
      const tasksCompletedToday = validTasks.filter(task => 
        task.status === 'terminée' && 
        Array.from(tasksWithTimersToday).includes(task._id)
      ).length;
      
      // Mettre à jour les états
      setTodayStats({
        hours: Math.round(todayHours * 10) / 10,
        revenue: Math.round(todayRevenue),
        tasksCompleted: tasksCompletedToday
      });
      
      setWeekStats({
        hours: Math.round(weekHours * 10) / 10,
        revenue: Math.round(weekTimers.reduce((sum: number, t: any) => {
          if (t.billable && t.clientId) {
            const prof = profitMap.get(t.clientId);
            return sum + (t.duration / 3600) * (prof?.hourlyRate || 100);
          }
          return sum;
        }, 0)),
        growth: 12 // À calculer avec les données historiques
      });
      
      setTopClients(topClientsArray);
      setLoadingStats(false);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoadingStats(false);
    }
  }, [clients, tasks]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);
  
  // === Début : Chargement des défis quotidiens ===
  // Explication simple : On charge les défis du jour avec plusieurs tentatives en cas d'échec, et on affiche un état de chargement.
  // Explication technique : Fonction de chargement des défis avec mécanisme de retry basé sur l'exponentiel backoff, validation des données reçues, et gestion complète des états (loading, error).
  // État pour suivre le chargement des défis
  const [isChallengesLoading, setIsChallengesLoading] = useState(false);
  const [challengesError, setChallengesError] = useState<string | null>(null);
  
  // Chargement des défis quotidiens avec gestion complète des erreurs
  useEffect(() => {
    // Fonction pour récupérer les défis avec rétentatives
    const fetchChallengesWithRetry = async (retryCount = 0, maxRetries = 3) => {
      setIsChallengesLoading(true);
      setChallengesError(null);
      
      try {
        // Simulation d'une pause pour représenter le temps réseau
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Dans une app réelle, appel API avec timeout:
        // const controller = new AbortController();
        // const timeoutId = setTimeout(() => controller.abort(), 5000);
        // try {
        //   const challenges = await gamificationService.getDailyChallenges({ signal: controller.signal });
        //   clearTimeout(timeoutId);
        //   // Traitement normal...
        // } catch (err) {
        //   if (err.name === 'AbortError') {
        //     throw new Error('La requête a expiré, vérifiez votre connexion.');
        //   }
        //   throw err;
        // }
        
        // Défis simulés pour le moment
        const simulatedChallenges = [
          {
            id: 1,
            title: 'Complétez 3 tâches aujourd\'hui',
            description: "Terminez 3 tâches pour gagner 15 points d'action supplémentaires",
            progress: completedTasks >= 3 ? 100 : Math.round((completedTasks / 3) * 100),
            reward: 15,
            completed: completedTasks >= 3
          },
          {
            id: 2,
            title: 'Mettez à jour le statut de 5 tâches',
            description: "Changez le statut de 5 tâches pour gagner 10 points d'action",
            progress: 60, // Simulé
            reward: 10,
            completed: false
          },
          {
            id: 3,
            title: 'Ajoutez un nouveau client',
            description: "Créez un nouveau profil client pour gagner 20 points d'action",
            progress: 0,
            reward: 20,
            completed: false
          }
        ];
        
        // Validation des données reçues
        const validChallenges = simulatedChallenges.filter(challenge => 
          challenge && 
          typeof challenge === 'object' &&
          'id' in challenge &&
          'title' in challenge &&
          'description' in challenge &&
          'progress' in challenge &&
          'reward' in challenge &&
          'completed' in challenge
        );
        
        if (validChallenges.length === 0) {
          throw new Error('Format des défis invalide');
        }
        
        setDailyChallenges(validChallenges);
        setIsChallengesLoading(false);
      } catch (error) {
        console.error(`Erreur lors de la récupération des défis quotidiens (tentative ${retryCount + 1}/${maxRetries}):`, error);
        
        // Si moins de maxRetries tentatives, on réessaie avec backoff exponentiel
        if (retryCount < maxRetries - 1) {
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
          const timerId = setTimeout(() => {
            fetchChallengesWithRetry(retryCount + 1, maxRetries);
          }, backoffTime);
          
          // Stocker le timer dans la ref pour nettoyage
          timersRef.current[`challenge-retry-${retryCount}`] = timerId;
        } else {
          // Après maxRetries tentatives échouées
          setIsChallengesLoading(false);
          setChallengesError(error instanceof Error ? error.message : 'Erreur inconnue');
          
          addNotificationToQueue({
            message: `Impossible de charger les défis quotidiens: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
            type: 'error'
          });
        }
      }
    };
    
    fetchChallengesWithRetry();
    
    // Nettoyage en cas de démontage du composant
    return () => {
      // Nettoyer tous les timers stockés pour les retentatives
      Object.keys(timersRef.current).forEach(key => {
        if (key.startsWith('challenge-retry-')) {
          clearTimeout(timersRef.current[key]);
          delete timersRef.current[key];
        }
      });
    };
  }, [completedTasks, addNotificationToQueue]); // completedTasks pour la progression + addNotificationToQueue comme dépendance
  // === Fin : Chargement des défis quotidiens ===
  
  // === Début : Vérification des événements spéciaux ===
  // Explication simple : On vérifie s'il y a des événements spéciaux comme un anniversaire ou le premier jour du mois pour afficher des surprises.
  // Explication technique : Système de détection d'événements spéciaux (anniversaire, premier jour du mois) avec gestion de timeouts pour les requêtes API et validation des données.
  // Référence pour vérifier si les événements spéciaux ont déjà été vérifiés
  const alreadyChecked = useRef(false);

  // Vérification des événements spéciaux (anniversaire, premier jour du mois, etc.)
  useEffect(() => {
    const checkSpecialEvents = async () => {
      if (alreadyChecked.current) return;
      alreadyChecked.current = true;
      
      try {
        // Vérifier s'il y a des événements spéciaux aujourd'hui
        const today = new Date();
        const dayOfMonth = today.getDate();
        const month = today.getMonth() + 1;
        
        // Exemple: Anniversaire de l'utilisateur - avec validation de la date
        if (memoizedUser && 
            typeof memoizedUser === 'object' && 
            'birthDate' in memoizedUser && 
            memoizedUser.birthDate) {
          try {
            const birthDate = new Date(memoizedUser.birthDate);
            
            // Vérifier que la date est valide et correspond à aujourd'hui
            if (!isNaN(birthDate.getTime()) && 
                birthDate.getDate() === dayOfMonth && 
                birthDate.getMonth() + 1 === month) {
              triggerConfetti('celebration');
              addNotificationToQueue({
                message: 'Joyeux anniversaire ! 🎉',
                type: 'success'
              });
            }
          } catch (dateError) {
            console.error('Erreur lors du traitement de la date d\'anniversaire:', dateError);
          }
        }
        
        // Exemple: Premier jour du mois - vérification de la rentabilité
        if (dayOfMonth === 1) {
          try {
            // Ajouter un timeout pour éviter les blocages
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('La requête a expiré')), 10000)
            );
            
            // Course entre la requête et le timeout
            const profitabilityResult = await Promise.race([
              profitabilityRewardService.checkMonthlyProfitabilityTargets(),
              timeoutPromise
            ]);
            
            if (profitabilityResult && 
                typeof profitabilityResult === 'object' &&
                'targetsReached' in profitabilityResult && 
                'totalPointsEarned' in profitabilityResult &&
                (profitabilityResult as { targetsReached: number; totalPointsEarned: number }).targetsReached > 0) {
              
              addNotificationToQueue({
                message: `Félicitations ! ${profitabilityResult.targetsReached} clients ont atteint leurs objectifs de rentabilité. Vous avez gagné ${profitabilityResult.totalPointsEarned} points !`,
                type: 'success'
              });
              
              // Déclencher les confettis si l'objectif est atteint
              triggerConfetti('monthly_reward');
            }
          } catch (profitError) {
            console.error('Erreur lors de la vérification de la rentabilité:', profitError);
            
            // Notification uniquement si c'est une erreur de timeout (pas pour les erreurs silencieuses)
            if (profitError instanceof Error && profitError.message === 'La requête a expiré') {
              addNotificationToQueue({
                message: 'Impossible de vérifier les objectifs de rentabilité. Veuillez réessayer plus tard.',
                type: 'error'
              });
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des événements spéciaux:', error);
      }
    };
    
    checkSpecialEvents();
    
    // Réinitialiser la vérification si memoizedUser change de manière significative
    return () => {
      alreadyChecked.current = false;
    };
  }, [dispatch, memoizedUser, triggerConfetti, addNotificationToQueue]); // Toutes les dépendances explicitées
  // === Fin : Vérification des événements spéciaux ===
  
  // === Début : Gestion des récompenses de défis ===
  // Explication simple : Cette partie permet de réclamer des récompenses quand un défi est terminé, avec des confettis et des points.
  // Explication technique : Système de réclamation des récompenses avec validation d'état, gestion optimiste de l'UI, et appel API pour enregistrer les points gagnés.
  // État pour traquer les récompenses réclamées
  const [claimedRewardIds, setClaimedRewardIds] = useState<number[]>([]);
  
  // Réclamer la récompense d'un défi avec meilleure synchronisation des états
  const handleClaimReward = async (challenge: Challenge) => {
    // Vérifier si déjà réclamé ou non complété
    if (claimedRewardIds.includes(challenge.id)) {
      addNotificationToQueue({
        message: 'Vous avez déjà réclamé cette récompense !',
        type: 'info'
      });
      return;
    }
    
    if (!challenge.completed) {
      addNotificationToQueue({
        message: 'Vous devez d\'abord compléter ce défi !',
        type: 'warning'
      });
      return;
    }
    
    try {
      // Marquer comme réclamé immédiatement pour éviter les doubles clics
      setClaimedRewardIds(prev => [...prev, challenge.id]);
      
      // Ajouter les points d'action à l'utilisateur
      const pointsResponse = await gamificationService.addActionPoints(
        challenge.reward,
        'challenge_completion',
        `Défi complété: ${challenge.title}`
      );
      
      // Utiliser la réponse pour vérifier le succès
      if (pointsResponse && pointsResponse.success) {
        console.log('Points ajoutés avec succès:', pointsResponse);
      }
      
      addNotificationToQueue({
        message: `Félicitations ! Vous avez gagné ${challenge.reward} points d'action.`,
        type: 'success'
      });
      
      // Déclencher les confettis
      triggerConfetti('challenge_complete');
      
      // Mettre à jour les défis (simulation)
      setDailyChallenges(prevChallenges =>
        prevChallenges.map(c => 
          c.id === challenge.id 
            ? { ...c, completed: true, progress: 100 } 
            : c
        )
      );
      
      // Utiliser un timer pour fermer les défis
      const hideTimerId = setTimeout(() => {
        // Vérifier si l'utilisateur est toujours sur cette page
        if (document.body.contains(document.getElementById('challenges-container'))) {
          setShowChallenges(false);
        }
      }, 3000);
      
      // Stocker le timer dans la ref pour le nettoyer si nécessaire
      timersRef.current[`hide-challenges-${challenge.id}`] = hideTimerId;
    } catch (error) {
      // Permettre à l'utilisateur de réessayer en cas d'erreur
      setClaimedRewardIds(prev => prev.filter(id => id !== challenge.id));
      
      console.error('Erreur lors de la réclamation de la récompense:', error);
      addNotificationToQueue({
        message: 'Erreur lors de la réclamation de la récompense',
        type: 'error'
      });
    }
  };
  // === Fin : Gestion des récompenses de défis ===
  
  // === Début : Nettoyage des timers ===
  // Explication simple : On s'assure que toutes les minuteries sont arrêtées quand on quitte la page pour éviter les fuites de mémoire.
  // Explication technique : Hook de nettoyage pour éviter les memory leaks en supprimant tous les timers enregistrés lors du démontage du composant.
  // Effet pour nettoyer tous les timers au démontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer tous les timers stockés dans timersRef
      Object.values(timersRef.current).forEach(timer => {
        clearTimeout(timer);
      });
      timersRef.current = {};
    };
  }, []);
  // === Fin : Nettoyage des timers ===
  
  // === Début : Vérification des données requises ===
  // Explication simple : On vérifie que toutes les données nécessaires sont bien disponibles avant d'afficher la page complète.
  // Explication technique : Validation des données critiques avec mémorisation pour optimiser les performances et gestion d'un état de chargement conditionnel.
  // Vérifier que nous avons les données nécessaires avant de rendre le composant
  // et identifier les problèmes spécifiques
  const dataStatus = useMemo(() => {
    const issues: string[] = [];
    
    if (!memoizedUser) issues.push('Données utilisateur manquantes');
    if (typeof level !== 'number') issues.push('Niveau utilisateur non défini');
    if (!Array.isArray(tasks)) issues.push('Liste des tâches non disponible');
    if (!Array.isArray(clients)) issues.push('Liste des clients non disponible');
    
    return {
      isReady: issues.length === 0,
      issues
    };
  }, [memoizedUser, level, tasks, clients]);
  
  const hasRequiredData = dataStatus.isReady;
  
  if (!hasRequiredData) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chargement du tableau de bord</h1>
          {dataStatus.issues.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Certaines données ne sont pas disponibles :
              </h2>
              <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300">
                {dataStatus.issues.map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
              <p className="mt-2 text-yellow-600 dark:text-yellow-400 text-sm">
                Les données manquantes seront chargées dès qu'elles seront disponibles.
              </p>
            </div>
          )}
        </div>
        
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  // === Fin : Vérification des données requises ===
  
  // === Début : Rendu du tableau de bord ===
  // Explication simple : C'est la partie qui dessine tous les éléments de la page avec leurs styles et animations.
  // Explication technique : Rendu JSX principal du tableau de bord avec animations via Framer Motion, gestion d'états conditionnels et structure responsive.
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Effet de confettis global */}
      {showGlobalConfetti && (
        <ConfettiEffect 
          show={true}
          duration={5000} 
          particleCount={particleCount}
          onComplete={() => setShowGlobalConfetti(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec salutation personnalisée */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {getGreeting()}, {memoizedUser?.name?.split(' ')[0] || 'Champion'} ! 👋
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {getMotivationalQuote()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </motion.div>
        
        {/* Métriques principales du jour */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">💰</span>
              </div>
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                Aujourd'hui
              </span>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              Revenus du jour
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loadingStats ? '...' : `${todayStats.revenue.toLocaleString()}€`}
            </p>
            <div className="mt-3 flex items-center text-sm">
              <span className={`font-medium ${weekStats.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {weekStats.growth > 0 ? '+' : ''}{weekStats.growth}%
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-1">vs hier</span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">⏱️</span>
              </div>
              {activeTimers.length > 0 && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              Heures aujourd'hui
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loadingStats ? '...' : `${todayStats.hours}h`}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                <span>Objectif: 8h</span>
                <span>{Math.round((todayStats.hours / 8) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (todayStats.hours / 8) * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">
              Tâches complétées
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loadingStats ? '...' : todayStats.tasksCompleted}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                <span className="font-medium text-blue-600">{inProgressTasks}</span> en cours
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                <span className="font-medium text-orange-600">{pendingTasks}</span> à faire
              </span>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-2xl shadow-xl p-6 text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <span className="text-2xl">🏆</span>
              </div>
              <span className="text-2xl font-bold">Nv.{level}</span>
            </div>
            <h3 className="text-white/80 text-sm font-medium mb-1">
              Points d'action
            </h3>
            <p className="text-3xl font-bold">
              {actionPoints}
            </p>
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/60 mb-1">
                <span>Prochain niveau</span>
                <span>{Math.round((experience / 1000) * 100)}%</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (experience / 1000) * 100)}%` }}
                />
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Widget de rentabilité mensuelle */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-8"
        >
          <MonthlyProfitabilityWidget displayMode="full" />
        </motion.div>
        
        {/* Graphiques et métriques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Graphique des revenus */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Évolution des revenus
              </h3>
              <button
                onClick={() => navigate('/client-statistics')}
                className="text-sm text-[#026aa1] hover:text-[#0487d9] font-medium flex items-center gap-1"
              >
                Voir plus
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
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
                height={250}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            )}
          </motion.div>
          
          {/* Distribution des tâches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              État des tâches
            </h3>
            {taskDistributionData.labels.length > 0 ? (
              <Doughnut
                data={taskDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: { size: 12 }
                      }
                    }
                  }
                }}
                height={250}
              />
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-gray-500">Aucune tâche</p>
              </div>
            )}
          </motion.div>
        </div>
        
        {/* Top clients et défis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 3 clients */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Top clients du mois
              </h3>
              <button
                onClick={() => navigate('/clients')}
                className="text-sm text-[#026aa1] hover:text-[#0487d9] font-medium"
              >
                Tous les clients →
              </button>
            </div>
            
            <div className="space-y-4">
              {topClients.length > 0 ? (
                topClients.map((client, index) => (
                  <div key={client.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="relative">
                      {client.logo ? (
                        <img src={client.logo} alt={client.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white font-bold">
                          {client.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{client.name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {client.hoursThisMonth}h • {client.monthlyRevenue.toLocaleString()}€
                      </p>
                    </div>
                    <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                      client.profitabilityScore >= 90 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                        : client.profitabilityScore >= 70 
                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {client.profitabilityScore}%
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Aucun client actif ce mois</p>
                  <button
                    onClick={() => navigate('/clients/new')}
                    className="mt-4 px-4 py-2 bg-[#026aa1] text-white rounded-lg hover:bg-[#0487d9] transition-colors"
                  >
                    Ajouter un client
                  </button>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Défis quotidiens */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6" id="challenges-container">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Défis du jour
                </h3>
                <button
                  onClick={() => navigate('/gamification')}
                  className="text-sm text-[#026aa1] hover:text-[#0487d9] font-medium"
                >
                  Gamification →
                </button>
              </div>
              
              {isChallengesLoading ? (
                // État de chargement des défis
                <div className="animate-pulse space-y-4">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              ) : challengesError ? (
                // Affichage des erreurs de chargement
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300">{challengesError}</p>
                  <button
                    onClick={() => {
                      setChallengesError(null);
                    }}
                    className="mt-3 w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                  >
                    Réessayer
                  </button>
                </div>
              ) : showChallenges ? (
                <div className="space-y-4">
                  {dailyChallenges.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-gray-600 dark:text-gray-400">Aucun défi disponible pour le moment.</p>
                    </div>
                  ) : (
                    dailyChallenges.map(challenge => (
                      <div key={challenge.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">{challenge.title}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{challenge.description}</p>
                          </div>
                          <span className="text-lg font-bold text-[#026aa1]">+{challenge.reward}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>Progression</span>
                            <span>{challenge.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                challenge.completed 
                                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                                  : 'bg-gradient-to-r from-[#026aa1] to-[#0487d9]'
                              }`}
                              style={{ width: `${challenge.progress}%` }}
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleClaimReward(challenge)}
                          disabled={!challenge.completed || claimedRewardIds.includes(challenge.id)}
                          className={`mt-3 w-full py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                            claimedRewardIds.includes(challenge.id)
                              ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                              : challenge.completed
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
                                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          {claimedRewardIds.includes(challenge.id) 
                            ? 'Récompense réclamée' 
                            : challenge.completed 
                              ? 'Réclamer la récompense' 
                              : 'En cours...'}
                        </button>
                      </div>
                    ))
                  )}
                  
                  <button
                    onClick={() => setShowChallenges(false)}
                    className="w-full py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Masquer les défis
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Complétez des défis quotidiens pour gagner des points d'action supplémentaires !
                  </p>
                  <button
                    onClick={() => setShowChallenges(true)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-lg rounded-lg text-sm font-medium hover:from-[#0487d9] hover:to-[#026aa1] transition-all"
                  >
                    Voir les défis
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Timers actifs */}
        {activeTimers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800"
          >
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
              Timers actifs
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeTimers.map((timer, index) => (
                <div key={index} className="bg-white/50 dark:bg-gray-800/50 backdrop-blur rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white">{timer.taskTitle}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{timer.clientName}</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-2">
                    {Math.floor(timer.duration / 3600)}h {Math.floor((timer.duration % 3600) / 60)}m
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Badges récents */}
        {recentBadges.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Badges récents</h2>
              <button
                onClick={() => navigate('/gamification')}
                className="text-sm text-[#026aa1] hover:text-[#0487d9] font-medium"
              >
                Voir tous les badges
              </button>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {recentBadges.map((badge) => (
                <div key={badge._id} className="flex-shrink-0 w-24 text-center">
                  <img 
                    src={badge.icon} 
                    alt={badge.name} 
                    className="w-16 h-16 mx-auto mb-2 object-contain"
                  />
                  <h4 className="text-xs font-medium text-gray-900 dark:text-white truncate">{badge.name}</h4>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
// === Fin : Composant principal Dashboard ===

export default Dashboard;