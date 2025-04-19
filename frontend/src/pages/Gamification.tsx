import React, { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import {
  fetchGamificationProfileStart,
  fetchGamificationProfileSuccess,
  fetchGamificationProfileFailure,
  fetchBadgesStart,
  fetchBadgesSuccess,
  fetchActivitiesStart,
  fetchActivitiesSuccess,
  fetchActivitiesFailure,
  fetchLevelsStart,
  fetchLevelsSuccess,
} from '../store/slices/gamificationSlice';
import { gamificationService, badgesService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';

const Gamification: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    level,
    experience,
    actionPoints,
    totalPointsEarned,
    currentStreak,
    longestStreak,
    badges,
    activities,
    levels,
    loading,
    error
  } = useAppSelector(state => state.gamification);

  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fonction utilitaire pour gérer les dates potentiellement undefined
  const safeDate = (dateStr: any): Date => {
    if (!dateStr) return new Date();
    try {
      return new Date(dateStr);
    } catch (error) {
      return new Date();
    }
  };

  // Définir loadActivities avec useCallback avant de l'utiliser dans useEffect
  const loadActivities = useCallback(async (page: number) => {
    try {
      dispatch(fetchActivitiesStart());
      const activitiesData = await gamificationService.getActivities(page, 10);
      dispatch(fetchActivitiesSuccess(activitiesData.activities));
      setTotalPages(activitiesData.pagination.pages);
    } catch (error: any) {
      dispatch(fetchActivitiesFailure(error.message));
      dispatch(addNotification({
        message: 'Erreur lors du chargement des activités',
        type: 'error'
      }));
    }
  }, [dispatch]);

  // Charger les données de gamification au chargement de la page
  useEffect(() => {
    const loadGamificationData = async () => {
      try {
        // Charger le profil de gamification
        dispatch(fetchGamificationProfileStart());
        const profileData = await gamificationService.getProfile();
        dispatch(fetchGamificationProfileSuccess(profileData));

        // Charger les badges
        dispatch(fetchBadgesStart());
        const badgesData = await badgesService.getUserBadges();
        dispatch(fetchBadgesSuccess(badgesData));

        // Charger les niveaux
        dispatch(fetchLevelsStart());
        const levelsData = await gamificationService.getLevels();
        dispatch(fetchLevelsSuccess(levelsData));

        // Mettre à jour le streak
        await gamificationService.updateStreak();

        // Charger les activités (première page)
        loadActivities(1);
      } catch (error: any) {
        dispatch(fetchGamificationProfileFailure(error.message));
        dispatch(addNotification({
          message: 'Erreur lors du chargement des données de gamification',
          type: 'error'
        }));
      }
    };

    loadGamificationData();
  }, [dispatch, loadActivities]); // Maintenant loadActivities est défini avant d'être utilisé ici

  // Changer de page d'activités
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadActivities(page);
  };

  // Formater la date - Version corrigée
  const formatDate = (dateStr: any): string => {
    if (!dateStr) return 'N/A';

    try {
      // Utiliser la fonction safeDate pour éviter l'erreur TypeScript
      const dateObj = safeDate(dateStr);
      return dateObj.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Obtenir le niveau suivant
  const getNextLevel = () => {
    if (!levels || levels.length === 0) return null;
    return levels.find(l => l.level === level + 1);
  };

  // Calculer le pourcentage d'expérience pour le niveau suivant
  const calculateExperiencePercentage = () => {
    if (!levels || levels.length === 0) return 0;

    const currentLevelData = levels.find(l => l.level === level);
    const nextLevelData = levels.find(l => l.level === level + 1);

    if (!currentLevelData || !nextLevelData) return 0;

    const currentLevelXP = currentLevelData.experienceRequired;
    const nextLevelXP = nextLevelData.experienceRequired;
    const xpNeeded = nextLevelXP - currentLevelXP;
    const xpProgress = experience - currentLevelXP;

    return Math.min(100, Math.max(0, Math.floor((xpProgress / xpNeeded) * 100)));
  };

  // Obtenir la couleur en fonction de la rareté du badge
  const getBadgeRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'commun':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'rare':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'épique':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'légendaire':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  // Obtenir l'icône en fonction du type d'activité
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'tâche_complétée':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'badge_obtenu':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        );
      case 'niveau_augmenté':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        );
      case 'points_action_gagnés':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        );
      case 'experience_gagnée':
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  if (loading && !badges.length && !activities.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gamification</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Suivez votre progression et vos récompenses</p>
      </div>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Points d'action</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Utilisables pour des bonus</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">{actionPoints}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total gagné: {totalPointsEarned}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-300 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Niveau</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Votre progression</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-secondary-600 dark:text-secondary-400">{level}</div>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span>Progression</span>
              <span>{calculateExperiencePercentage()}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-secondary-500 rounded-full"
                style={{ width: `${calculateExperiencePercentage()}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getNextLevel() ? `Prochain niveau: ${getNextLevel()?.name}` : 'Niveau maximum atteint'}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
        >
          <div className="flex items-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success-100 text-success-600 dark:bg-success-900 dark:text-success-300 mr-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Streak</h2>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Jours consécutifs d'activité</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-success-600 dark:text-success-400">{currentStreak} jours</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Record: {longestStreak} jours</div>
        </motion.div>
      </div>

      {/* Onglets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'overview'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('overview')}
          >
            Vue d'ensemble
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'badges'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('badges')}
          >
            Badges
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'activities'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            onClick={() => setActiveTab('activities')}
          >
            Activités
          </button>
        </div>

        <div className="p-6">
          {/* Vue d'ensemble */}
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Votre progression</h2>

              {/* Niveaux */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Niveaux et récompenses</h3>
                <div className="space-y-6">
                  {levels.map((levelData) => (
                    <div
                      key={levelData.level}
                      className={`p-4 rounded-lg border ${levelData.level === level
                          ? 'border-secondary-500 bg-secondary-50 dark:bg-secondary-900/20'
                          : levelData.level < level
                            ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full ${levelData.level <= level
                              ? 'bg-secondary-100 text-secondary-600 dark:bg-secondary-900 dark:text-secondary-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            } mr-3`}>
                            <span className="text-lg font-bold">{levelData.level}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{levelData.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {levelData.level <= level ? 'Débloqué' : `Requis: ${levelData.experienceRequired} XP`}
                            </p>
                          </div>
                        </div>
                        {levelData.level === level && (
                          <span className="px-3 py-1 text-xs rounded-full bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-200">
                            Niveau actuel
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges récents */}
              {badges.length > 0 && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Badges récents</h3>
                    <button
                      onClick={() => setActiveTab('badges')}
                      className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      Voir tous les badges
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {badges.slice(0, 4).map((badge) => (
                      <div key={badge._id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                        <img
                          src={badge.icon}
                          alt={badge.name}
                          className="w-16 h-16 mx-auto mb-2 object-contain"
                        />
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">{badge.name}</h4>
                        <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getBadgeRarityColor(badge.rarity)}`}>
                          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          {activeTab === 'badges' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Vos badges ({badges.length})
              </h2>

              {badges.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun badge pour le moment</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Complétez des tâches et relevez des défis pour gagner des badges !
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {badges.map((badge) => (
                    <motion.div
                      key={badge._id}
                      whileHover={{ y: -5, transition: { duration: 0.2 } }}
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 text-center"
                    >
                      <img
                        src={badge.icon}
                        alt={badge.name}
                        className="w-20 h-20 mx-auto mb-3 object-contain"
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{badge.name}</h3>
                      <div className="flex flex-col space-y-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getBadgeRarityColor(badge.rarity)}`}>
                          {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {/* Utiliser formatDate avec une assertion de type pour éviter l'erreur */}
                          Obtenu le {formatDate((badge as any).date || (badge as any).earnedAt || (badge as any).createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activités */}
          {activeTab === 'activities' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Historique d'activités
              </h2>

              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucune activité récente</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Vos activités récentes apparaîtront ici.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 flex">
                      {getActivityIcon(activity.type)}
                      <div className="ml-4 flex-1">
                        <div className="flex justify-between">
                          {/* Utiliser une assertion de type pour éviter l'erreur */}
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {(activity as any).name || (activity as any).title || "Activité"}
                          </h3>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {/* Utiliser formatDate avec une assertion de type pour éviter l'erreur */}
                            {formatDate((activity as any).date || (activity as any).createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.description}</p>
                        {/* Utiliser une assertion de type pour éviter l'erreur */}
                        {((activity as any).reward > 0 || (activity as any).points > 0) && (
                          <div className="mt-2 text-sm font-medium text-primary-600 dark:text-primary-400">
                            +{(activity as any).reward || (activity as any).points} points
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <nav className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md ${currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                      Précédent
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 rounded-md ${currentPage === page
                            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                          }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md ${currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                        }`}
                    >
                      Suivant
                    </button>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gamification;
