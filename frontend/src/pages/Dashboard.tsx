import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { motion } from 'framer-motion';
import { addNotification } from '../store/slices/uiSlice';
import { gamificationService } from '../services/api';
import MonthlyProfitabilityWidget from '../components/profitability/MonthlyProfitabilityWidget';
import ConfettiEffect from '../components/gamification/ConfettiEffect';
import { profitabilityRewardService } from '../services/profitabilityRewardService';
import { soundService } from '../services/soundService';

// Définition de l'interface Challenge pour résoudre l'erreur TypeScript
interface Challenge {
  id: number;
  title: string;
  description: string;
  progress: number;
  reward: number;
  completed: boolean;
}

// Composant pour afficher un tableau de bord ludique
const Dashboard = () => {
  const dispatch = useAppDispatch();
  
  // Utilisation de valeurs par défaut pour tous les états
  const auth = useAppSelector(state => state.auth) || {};
  const { user = { name: 'Utilisateur', email: 'utilisateur@exemple.com' } } = auth;
  
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
  
  // Calculer les statistiques
  const completedTasks = tasks.filter(task => task.status === 'terminée').length || 0;
  const pendingTasks = tasks.filter(task => task.status === 'à faire').length || 0;
  const inProgressTasks = tasks.filter(task => task.status === 'en cours').length || 0;
  const totalTasks = tasks.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  // Défis quotidiens (simulés)
  const dailyChallenges = [
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
  
  // Vérification des événements spéciaux (anniversaire, premier jour du mois, etc.)
  useEffect(() => {
    const checkSpecialEvents = async () => {
      try {
        // Vérifier s'il y a des événements spéciaux aujourd'hui
        const today = new Date();
        const dayOfMonth = today.getDate();
        const month = today.getMonth() + 1;
        
        // Exemple: Anniversaire de l'utilisateur
        if (user && user.birthDate) {
          const birthDate = new Date(user.birthDate);
          if (birthDate.getDate() === dayOfMonth && birthDate.getMonth() + 1 === month) {
            setShowGlobalConfetti(true);
            soundService.play('celebration');
            dispatch(addNotification({
              message: 'Joyeux anniversaire ! 🎉',
              type: 'success'
            }));
          }
        }
        
        // Exemple: Premier jour du mois - vérification de la rentabilité
        if (dayOfMonth === 1) {
          const profitabilityResult = await profitabilityRewardService.checkMonthlyProfitabilityTargets();
          if (profitabilityResult && profitabilityResult.targetsReached > 0) {
            dispatch(addNotification({
              message: `Félicitations ! ${profitabilityResult.targetsReached} clients ont atteint leurs objectifs de rentabilité. Vous avez gagné ${profitabilityResult.totalPointsEarned} points !`,
              type: 'success'
            }));
            
            // Déclencher les confettis si l'objectif est atteint
            setShowGlobalConfetti(true);
            soundService.play('monthly_reward');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des événements spéciaux:', error);
      }
    };
    
    checkSpecialEvents();
  }, [dispatch, user]);
  
  // Réclamer la récompense d'un défi
  const handleClaimReward = async (challenge: Challenge) => {
    if (!challenge.completed) {
      dispatch(addNotification({
        message: 'Vous devez d\'abord compléter ce défi !',
        type: 'warning'
      }));
      return;
    }
    
    try {
      // Ajouter les points d'action à l'utilisateur
      const pointsResponse = await gamificationService.addActionPoints(
        challenge.reward,
        'challenge_completion',
        `Défi complété: ${challenge.title}`
      );
      
      dispatch(addNotification({
        message: `Félicitations ! Vous avez gagné ${challenge.reward} points d'action.`,
        type: 'success'
      }));
      
      // Déclencher les confettis
      setShowGlobalConfetti(true);
      soundService.play('challenge_complete');
      
      // Mettre à jour l'interface (dans une application réelle, cela serait géré par Redux)
      setTimeout(() => {
        setShowChallenges(false);
        setShowGlobalConfetti(false);
      }, 3000);
    } catch (error) {
      dispatch(addNotification({
        message: 'Erreur lors de la réclamation de la récompense',
        type: 'error'
      }));
    }
  };
  
  return (
    <div className="container mx-auto">
      {/* Effet de confettis global */}
      <ConfettiEffect 
        show={showGlobalConfetti} 
        duration={5000} 
        particleCount={200} 
        onComplete={() => setShowGlobalConfetti(false)}
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tableau de bord</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Bienvenue, {user?.name || 'Utilisateur'} !</p>
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
                    {(user?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-secondary-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {level}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{user?.name || 'Utilisateur'}</h2>
                <p className="text-gray-600 dark:text-gray-300 mb-3">{user?.email || 'utilisateur@exemple.com'}</p>
                
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{actionPoints}</div>
                    <div className="text-xs text-primary-800 dark:text-primary-200">Points</div>
                  </div>
                  <div className="bg-secondary-50 dark:bg-secondary-900/30 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{badges?.length || 0}</div>
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
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Défis quotidiens</h2>
            
            {showChallenges ? (
              <div className="space-y-4">
                {dailyChallenges.map(challenge => (
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
                      disabled={!challenge.completed}
                      className={`w-full py-2 px-3 rounded-md text-sm font-medium ${
                        challenge.completed
                          ? 'bg-success-600 hover:bg-success-700 text-white'
                          : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {challenge.completed ? 'Réclamer' : 'En cours...'}
                    </button>
                  </div>
                ))}
                
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
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{clients.length}</div>
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
      {badges.length > 0 && (
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
            {badges.slice(0, 4).map((badge) => (
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
