/*
 * PAGE DE GAMIFICATION - src/pages/Gamification.tsx
 * 
 * Explication simple:
 * Ce fichier crée la page où l'utilisateur peut voir tous ses accomplissements dans l'application:
 * ses points, son niveau, ses badges gagnés et l'historique de ses activités.
 * C'est comme un tableau de bord personnel qui montre sa progression et ses récompenses.
 * 
 * Explication technique:
 * Composant React fonctionnel qui implémente une interface utilisateur pour visualiser
 * les métriques de gamification de l'utilisateur. Utilise Redux pour la gestion d'état,
 * Framer Motion pour les animations, et s'intègre avec les services d'API de gamification
 * pour récupérer le profil, les badges, les activités, et les niveaux.
 * 
 * Où ce fichier est utilisé:
 * Ce composant est intégré dans le système de routage de l'application, probablement
 * accessible depuis le menu principal ou depuis le tableau de bord utilisateur.
 * 
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks Redux (useAppDispatch, useAppSelector) 
 * - Importe et dispatche des actions depuis gamificationSlice et uiSlice
 * - Appelle des services API (gamificationService, badgesService)
 * - Utilise la bibliothèque Framer Motion pour les animations
 */

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
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// === Début : Composant principal Gamification ===
// Explication simple : Cette fonction crée toute la page qui montre les récompenses et la progression de l'utilisateur.
// Explication technique : Composant fonctionnel React qui gère l'affichage et la logique de l'interface de gamification, servant de conteneur principal pour tous les sous-composants et fonctionnalités.
const Gamification: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // === Début : Récupération des états Redux ===
  // Explication simple : On va chercher toutes les informations de l'utilisateur qui sont stockées dans la "mémoire" de l'application.
  // Explication technique : Extraction des données de l'état global Redux avec valeurs par défaut pour éviter les erreurs en cas de données manquantes ou durant le chargement initial.
  const gamificationState = useAppSelector(state => state.gamification || {});
  const {
    level = 1,
    experience = 0,
    actionPoints = 0,
    totalPointsEarned = 0,
    currentStreak = 0,
    longestStreak = 0,
    badges = [],
    activities = [],
    levels = [],
    loading = false,
    error = null
  } = gamificationState;
  // === Fin : Récupération des états Redux ===

  // === Début : États locaux ===
  // Explication simple : On crée des "boîtes" pour stocker des informations qui peuvent changer pendant que l'utilisateur utilise la page.
  // Explication technique : Déclaration des états locaux avec useState pour gérer l'onglet actif et la pagination des activités.
  const [activeTab, setActiveTab] = useState('overview');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  // === Fin : États locaux ===

  // === Début : Fonction utilitaire pour les dates ===
  // Explication simple : Cette fonction aide à éviter les erreurs quand on manipule des dates qui pourraient être manquantes.
  // Explication technique : Fonction de sécurisation qui renvoie un objet Date valide même si la valeur d'entrée est undefined ou invalide, évitant ainsi les crashs potentiels.
  const safeDate = (dateStr: any): Date => {
    if (!dateStr) return new Date();
    try {
      return new Date(dateStr);
    } catch (error) {
      return new Date();
    }
  };
  // === Fin : Fonction utilitaire pour les dates ===

  // === Début : Fonction de chargement des activités ===
  // Explication simple : Cette fonction va chercher la liste des activités de l'utilisateur sur le serveur, page par page.
  // Explication technique : Fonction mémoïsée avec useCallback qui interroge l'API pour récupérer les activités de l'utilisateur avec pagination, et met à jour le store Redux en conséquence.
  const loadActivities = useCallback(async (page: number) => {
    try {
      dispatch(fetchActivitiesStart());
      const activitiesData = await gamificationService.getActivities(page, 10);
      dispatch(fetchActivitiesSuccess(activitiesData.activities));
      setTotalPages(activitiesData.totalPages);
    } catch (error: any) {
      dispatch(fetchActivitiesFailure(error.message));
      dispatch(addNotification({
        message: 'Erreur lors du chargement des activités',
        type: 'error'
      }));
    }
  }, [dispatch]);
  // === Fin : Fonction de chargement des activités ===

  // === Début : Chargement initial des données de gamification ===
  // Explication simple : Au démarrage de la page, on va chercher toutes les informations nécessaires comme le niveau, les badges, etc.
  // Explication technique : Effet de côté qui s'exécute au montage du composant pour récupérer via API toutes les données de gamification et mettre à jour le store Redux.
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
  }, [dispatch, loadActivities]);
  // === Fin : Chargement initial des données de gamification ===

  // === Début : Gestion du changement de page ===
  // Explication simple : Cette fonction permet à l'utilisateur de naviguer entre différentes pages d'activités.
  // Explication technique : Gestionnaire d'événement qui met à jour l'état local de pagination et déclenche le rechargement des activités pour la page sélectionnée.
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadActivities(page);
  };
  // === Fin : Gestion du changement de page ===

  // === Début : Formatage des dates ===
  // Explication simple : Cette fonction transforme les dates en format lisible pour l'utilisateur.
  // Explication technique : Fonction utilitaire qui convertit les chaînes de date en format localisé français, avec gestion des erreurs pour les dates invalides.
  const formatDate = (dateStr: any): string => {
    if (!dateStr) return 'N/A';

    try {
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
  // === Fin : Formatage des dates ===

  // === Début : Récupération du niveau suivant ===
  // Explication simple : Cette fonction trouve le prochain niveau que l'utilisateur peut atteindre.
  // Explication technique : Fonction utilitaire qui recherche dans le tableau des niveaux l'entrée correspondant au niveau actuel + 1.
  const getNextLevel = () => {
    if (!levels || levels.length === 0) return null;
    return levels.find(l => l.level === level + 1);
  };
  // === Fin : Récupération du niveau suivant ===

  // === Début : Calcul du pourcentage d'expérience ===
  // Explication simple : Cette fonction calcule combien l'utilisateur a progressé vers le niveau suivant, en pourcentage.
  // Explication technique : Fonction qui détermine la progression entre deux niveaux en calculant le ratio entre l'XP actuelle et l'XP requise pour le niveau suivant.
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
  // === Fin : Calcul du pourcentage d'expérience ===

  // === Début : Gestion des couleurs de badge ===
  const getBadgeRarityGradient = (rarity: string) => {
    switch (rarity) {
      case 'commun':
        return 'from-gray-400 to-gray-600';
      case 'rare':
        return 'from-blue-400 to-blue-600';
      case 'épique':
        return 'from-purple-400 to-purple-600';
      case 'légendaire':
        return 'from-yellow-400 to-yellow-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

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
  // === Fin : Gestion des couleurs de badge ===

  // === Début : Gestion des icônes d'activité ===
  const getActivityIcon = (type: string) => {
    const iconMap: { [key: string]: { icon: JSX.Element; color: string } } = {
      'tâche_complétée': {
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />,
        color: 'from-green-400 to-green-600'
      },
      'badge_obtenu': {
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
        color: 'from-purple-400 to-purple-600'
      },
      'niveau_augmenté': {
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
        color: 'from-blue-400 to-blue-600'
      },
      'points_action_gagnés': {
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
        color: 'from-[#026aa1] to-[#0487d9]'
      },
      'experience_gagnée': {
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />,
        color: 'from-yellow-400 to-yellow-600'
      }
    };

    const config = iconMap[type] || {
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      color: 'from-gray-400 to-gray-600'
    };

    return (
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {config.icon}
        </svg>
      </div>
    );
  };
  // === Fin : Gestion des icônes d'activité ===

  // Fonction pour ouvrir la modal de badge
  const handleBadgeClick = (badge: any) => {
    setSelectedBadge(badge);
    setShowBadgeModal(true);
  };

  // === Début : Rendu des états de chargement et d'erreur ===
  // Explication simple : Ces blocs affichent soit une animation de chargement, soit un message d'erreur si quelque chose ne fonctionne pas.
  // Explication technique : Rendus conditionnels qui interceptent les cas de chargement initial ou d'erreur avant de tenter d'afficher le contenu principal.
  if (loading && !badges.length && !activities.length) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#026aa1]"></div>
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
  // === Fin : Rendu des états de chargement et d'erreur ===

  // === Début : Rendu principal du composant ===
  // Explication simple : C'est ici que tous les éléments de la page sont assemblés et affichés à l'utilisateur.
  // Explication technique : Structure JSX complète du composant avec mise en page responsive, système d'onglets, et rendus conditionnels pour chaque section de contenu.
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec titre */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Centre de Récompenses 🏆
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Suivez votre progression et débloquez de nouvelles récompenses
          </p>
        </motion.div>

        {/* Cartes principales avec statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Carte Niveau */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-2xl">⭐</span>
                </div>
                <span className="text-3xl font-bold">Nv.{level}</span>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Niveau actuel</h3>
              <p className="text-2xl font-bold mb-3">{levels.find(l => l.level === level)?.name || 'Débutant'}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-white/60">
                  <span>Progression</span>
                  <span>{calculateExperiencePercentage()}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${calculateExperiencePercentage()}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="bg-white h-2 rounded-full"
                  />
                </div>
                <p className="text-xs text-white/60">
                  {experience} / {getNextLevel()?.experienceRequired || experience} XP
                </p>
              </div>
            </div>
          </motion.div>

          {/* Carte Points d'Action */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
          >
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-2xl">💎</span>
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Points d'action</h3>
              <p className="text-3xl font-bold mb-2">{actionPoints.toLocaleString()}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Total gagné</span>
                <span className="font-medium">{totalPointsEarned.toLocaleString()}</span>
              </div>
              <button
                onClick={() => navigate('/store')}
                className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur rounded-lg text-sm font-medium transition-colors"
              >
                Utiliser les points →
              </button>
            </div>
          </motion.div>

          {/* Carte Streak */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 left-1/2 w-20 h-20 bg-white/10 rounded-full -ml-10 -mt-10" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🔥</span>
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Série actuelle</h3>
              <p className="text-3xl font-bold mb-2">{currentStreak} jours</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Record</span>
                <span className="font-medium">{longestStreak} jours</span>
              </div>
              <div className="mt-3 text-xs text-white/60">
                {currentStreak > 0 ? "Continue comme ça ! 💪" : "Commencez une nouvelle série !"}
              </div>
            </div>
          </motion.div>

          {/* Carte Badges */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 w-28 h-28 bg-white/10 rounded-full -mr-14 -mb-14" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏅</span>
                </div>
              </div>
              <h3 className="text-white/80 text-sm font-medium mb-1">Badges collectés</h3>
              <p className="text-3xl font-bold mb-2">{badges.length}</p>
              <div className="flex -space-x-2 mt-3">
                {badges.slice(0, 4).map((badge, index) => (
                  <img
                    key={badge._id}
                    src={badge.icon}
                    alt={badge.name}
                    className="w-8 h-8 rounded-full border-2 border-white bg-white p-1"
                    style={{ zIndex: 4 - index }}
                  />
                ))}
                {badges.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur border-2 border-white flex items-center justify-center text-xs font-medium">
                    +{badges.length - 4}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Système d'onglets moderne */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: '📊' },
                { id: 'badges', label: 'Badges', icon: '🏅' },
                { id: 'activities', label: 'Activités', icon: '📝' },
                { id: 'levels', label: 'Niveaux', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-all ${
                    activeTab === tab.id
                      ? 'text-[#026aa1] border-b-2 border-[#026aa1] bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Vue d'ensemble */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Tableau de bord de progression
                  </h2>

                  {/* Statistiques rapides */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 dark:text-purple-400">Tâches complétées</p>
                          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                            {activities.filter(a => a.type === 'tâche_complétée').length}
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                          <span className="text-xl">✅</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Temps total</p>
                          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">124h</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                          <span className="text-xl">⏱️</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600 dark:text-green-400">Productivité</p>
                          <p className="text-2xl font-bold text-green-900 dark:text-green-100">89%</p>
                        </div>
                        <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-lg flex items-center justify-center">
                          <span className="text-xl">📈</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-orange-600 dark:text-orange-400">Rang global</p>
                          <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">#42</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-200 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🌍</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progression vers le prochain niveau */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Progression vers le niveau {level + 1}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                            {level}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {levels.find(l => l.level === level)?.name || 'Niveau actuel'}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {experience} XP accumulés
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Il vous reste</p>
                          <p className="text-xl font-bold text-gray-900 dark:text-white">
                            {(getNextLevel()?.experienceRequired || 0) - experience} XP
                          </p>
                        </div>
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateExperiencePercentage()}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-4 rounded-full relative"
                          >
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-white font-medium">
                              {calculateExperiencePercentage()}%
                            </div>
                          </motion.div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Derniers badges obtenus */}
                  {badges.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Derniers badges obtenus
                        </h3>
                        <button
                          onClick={() => setActiveTab('badges')}
                          className="text-sm text-[#026aa1] hover:text-[#0487d9] font-medium"
                        >
                          Voir tous →
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {badges.slice(0, 4).map((badge) => (
                          <motion.div
                            key={badge._id}
                            whileHover={{ y: -5 }}
                            onClick={() => handleBadgeClick(badge)}
                            className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-4 cursor-pointer hover:shadow-xl transition-all"
                          >
                            <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${getBadgeRarityGradient(badge.rarity)} p-1`}>
                              <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                                <img
                                  src={badge.icon}
                                  alt={badge.name}
                                  className="w-12 h-12 object-contain"
                                />
                              </div>
                            </div>
                            <h4 className="font-medium text-gray-900 dark:text-white text-center text-sm">
                              {badge.name}
                            </h4>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Onglet Badges */}
              {activeTab === 'badges' && (
                <motion.div
                  key="badges"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Collection de badges ({badges.length})
                  </h2>

                  {badges.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl">🏅</span>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        Aucun badge pour le moment
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Complétez des tâches et relevez des défis pour gagner vos premiers badges !
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {badges.map((badge) => (
                        <motion.div
                          key={badge._id}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleBadgeClick(badge)}
                          className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-2xl transition-all"
                        >
                          <div className={`relative w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br ${getBadgeRarityGradient(badge.rarity)} p-1`}>
                            <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <img
                                src={badge.icon}
                                alt={badge.name}
                                className="w-16 h-16 object-contain"
                              />
                            </div>
                            {badge.rarity === 'légendaire' && (
                              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                                <span className="text-sm">⭐</span>
                              </div>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-white text-center mb-2">
                            {badge.name}
                          </h3>
                          <div className="flex justify-center">
                            <span className={`px-3 py-1 text-xs rounded-full font-medium ${getBadgeRarityColor(badge.rarity)}`}>
                              {badge.rarity.charAt(0).toUpperCase() + badge.rarity.slice(1)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Onglet Activités */}
              {activeTab === 'activities' && (
                <motion.div
                  key="activities"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Historique d'activités
                  </h2>

                  {activities.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl">📝</span>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        Aucune activité récente
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Vos activités récentes apparaîtront ici
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activities.map((activity, index) => (
                        <motion.div
                          key={activity._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-white dark:bg-gray-700 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            {getActivityIcon(activity.type)}
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {(activity as any).name || (activity as any).title || "Activité"}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {activity.description}
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-4">
                                  {formatDate((activity as any).date || (activity as any).createdAt)}
                                </span>
                              </div>
                              {((activity as any).reward > 0 || (activity as any).points > 0) && (
                                <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm font-medium">
                                  <span className="mr-1">+</span>
                                  {(activity as any).reward || (activity as any).points} points
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === 1
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                              : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                          }`}
                        >
                          ← Précédent
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                                currentPage === page
                                  ? 'bg-[#026aa1] text-white'
                                  : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          ))}
                        </div>

                        <button
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === totalPages
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700'
                              : 'bg-white hover:bg-gray-50 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'
                          }`}
                        >
                          Suivant →
                        </button>
                      </nav>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Onglet Niveaux */}
              {activeTab === 'levels' && (
                <motion.div
                  key="levels"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Système de niveaux
                  </h2>

                  <div className="space-y-4">
                    {levels.map((levelData, index) => (
                      <motion.div
                        key={levelData.level}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative p-6 rounded-xl border-2 transition-all ${
                          levelData.level === level
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                            : levelData.level < level
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                              levelData.level <= level
                                ? 'bg-gradient-to-br from-purple-500 to-purple-700'
                                : 'bg-gradient-to-br from-gray-400 to-gray-600'
                            }`}>
                              {levelData.level}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {levelData.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {levelData.experienceRequired} XP requis
                              </p>
                            </div>
                          </div>
                          {levelData.level === level && (
                            <span className="px-4 py-2 bg-purple-500 text-white rounded-full text-sm font-medium animate-pulse">
                              Niveau actuel
                            </span>
                          )}
                          {levelData.level < level && (
                            <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium">
                              ✓ Débloqué
                            </span>
                          )}
                          {levelData.level > level && (
                            <span className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                              Verrouillé
                            </span>
                          )}
                        </div>
                        {levelData.level === level + 1 && (
                          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between text-sm mb-2">
                              <span className="text-gray-600 dark:text-gray-400">Progression</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {experience - (levels.find(l => l.level === level)?.experienceRequired || 0)} / 
                                {levelData.experienceRequired - (levels.find(l => l.level === level)?.experienceRequired || 0)} XP
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full"
                                style={{ width: `${calculateExperiencePercentage()}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal Badge */}
      <AnimatePresence>
        {showBadgeModal && selectedBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowBadgeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br ${getBadgeRarityGradient(selectedBadge.rarity)} p-2`}>
                <div className="w-full h-full bg-white dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <img
                    src={selectedBadge.icon}
                    alt={selectedBadge.name}
                    className="w-20 h-20 object-contain"
                  />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                {selectedBadge.name}
              </h3>
              <div className="flex justify-center mb-4">
                <span className={`px-4 py-2 text-sm rounded-full font-medium ${getBadgeRarityColor(selectedBadge.rarity)}`}>
                  {selectedBadge.rarity.charAt(0).toUpperCase() + selectedBadge.rarity.slice(1)}
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                {selectedBadge.description || "Un badge spécial pour récompenser vos efforts"}
              </p>
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                Obtenu le {formatDate((selectedBadge as any).date || (selectedBadge as any).earnedAt || (selectedBadge as any).createdAt)}
              </div>
              <button
                onClick={() => setShowBadgeModal(false)}
                className="mt-6 w-full py-3 bg-[#026aa1] hover:bg-[#0487d9] text-white rounded-xl font-medium transition-colors"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  // === Fin : Rendu principal du composant ===
};
// === Fin : Composant principal Gamification ===

export default Gamification;