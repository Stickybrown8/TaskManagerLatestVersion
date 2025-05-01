import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { motion } from 'framer-motion';
import { addNotification } from '../store/slices/uiSlice';
import { gamificationService } from '../services/api';
import MonthlyProfitabilityWidget from '../components/profitability/MonthlyProfitabilityWidget';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import { profitabilityRewardService } from '../services/profitabilityRewardService';
import { soundService, SoundTypes, SoundType } from '../services/soundService';

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

// Composant pour afficher un tableau de bord ludique
const Dashboard = () => {
  const dispatch = useAppDispatch();
  
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
  
  // Vérifier que badges est un tableau et filtrer les badges valides
  const recentBadges = Array.isArray(badges) 
    ? badges
        .filter(badge => badge && typeof badge === 'object' && '_id' in badge && 'icon' in badge && 'name' in badge)
        .slice(0, 4) 
    : [];
  
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
  
  return (
    <div className="container mx-auto">
      {/* Effet de confettis global */}
      {showGlobalConfetti && (
        <ConfettiEffect 
          show={true}
          duration={5000} 
          particleCount={particleCount}
          onComplete={() => setShowGlobalConfetti(false)}
        />
      )}
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Bienvenue, {memoizedUser?.name || 'Utilisateur'} !</p>
      </div>
      
      {/* Carte de profil */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-center">
              <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold">
                    {(memoizedUser?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-secondary-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {level}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{memoizedUser?.name || 'Utilisateur'}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-3">{memoizedUser?.email || 'utilisateur@exemple.com'}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{actionPoints}</div>
                    <div className="text-xs text-primary-800 dark:text-primary-200">Points</div>
                  </div>
                  <div className="bg-secondary-50 dark:bg-secondary-900/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{Array.isArray(badges) ? badges.length : 0}</div>
                    <div className="text-xs text-secondary-800 dark:text-secondary-200">Badges</div>
                  </div>
                  <div className="bg-success-50 dark:bg-success-900/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-success-600 dark:text-success-400">{currentStreak}</div>
                    <div className="text-xs text-success-800 dark:text-success-200">Jours actifs</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                    <span>Niveau {level}</span>
                    <span>Niveau {level + 1}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                    <div 
                      className="h-full bg-secondary-500 rounded-full" 
                      style={{ width: `${Math.min(100, Math.max(0, Math.floor((experience / 1000) * 100)))}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Défis quotidiens */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
        >
          <div className="p-6" id="challenges-container">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Défis quotidiens</h2>
            
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
                    // Réinitialiser l'erreur et déclencher un nouveau chargement
                    setChallengesError(null);
                    // Cette ligne déclenchera un nouveau chargement via useEffect
                  }}
                  className="mt-3 w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium"
                >
                  Réessayer
                </button>
              </div>
            ) : showChallenges ? (
              <div className="space-y-4">
                {dailyChallenges.length === 0 ? (
                  // Pas de défis disponibles
                  <div className="text-center py-6">
                    <p className="text-gray-600 dark:text-gray-400">Aucun défi disponible pour le moment.</p>
                  </div>
                ) : (
                  // Liste des défis
                  dailyChallenges.map(challenge => (
                    <div key={challenge.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">{challenge.title}</h3>
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">+{challenge.reward}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{challenge.description}</p>
                      
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
                          <span>Progression</span>
                          <span>{challenge.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div 
                            className={`h-full rounded-full ${
                              challenge.completed 
                                ? 'bg-success-500' 
                                : 'bg-primary-500'
                            }`}
                            style={{ width: `${challenge.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleClaimReward(challenge)}
                        disabled={!challenge.completed || claimedRewardIds.includes(challenge.id)}
                        className={`w-full py-2 px-3 rounded-md text-sm font-medium ${
                          claimedRewardIds.includes(challenge.id)
                            ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                            : challenge.completed
                              ? 'bg-success-600 hover:bg-success-700 text-white'
                              : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {claimedRewardIds.includes(challenge.id) 
                          ? 'Récompense réclamée' 
                          : challenge.completed 
                            ? 'Réclamer' 
                            : 'En cours...'}
                      </button>
                    </div>
                  ))
                )}
                
                <button
                  onClick={() => setShowChallenges(false)}
                  className="w-full py-2 px-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
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
                  className="w-full py-2 px-3 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                >
                  Voir les défis
                </button>
              </div>
            )}
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
      
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Clients</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{Array.isArray(clients) ? clients.length : 0}</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 dark:bg-green-900 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tâches terminées</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{completedTasks}</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tâches en cours</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{inProgressTasks}</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 dark:bg-yellow-900 rounded-full p-3 mr-4">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Tâches à faire</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingTasks}</div>
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* Taux de complétion */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Taux de complétion des tâches</h2>
        
        <div className="flex items-center">
          <div className="flex-1 mr-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div 
                className="h-full bg-success-500 rounded-full" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
          </div>
          <div className="text-2xl font-bold text-success-600 dark:text-success-400">{completionRate}%</div>
        </div>
        
        <div className="flex justify-between mt-4">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{totalTasks}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Terminées</div>
            <div className="text-lg font-bold text-success-600 dark:text-success-400">{completedTasks}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">En cours</div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{inProgressTasks}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">À faire</div>
            <div className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{pendingTasks}</div>
          </div>
        </div>
      </motion.div>
      
      {/* Badges récents */}
      {recentBadges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Badges récents</h2>
            <button
              onClick={() => {/* Navigation vers la page de gamification */}}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
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
  );
};

export default Dashboard;