// === Ce fichier crée la page profil où l'utilisateur peut voir et modifier ses informations personnelles === /workspaces/TaskManagerLatestVersion/frontend/src/pages/Profile.tsx
// Explication simple : C'est comme ta carte d'identité dans l'application où tu peux voir ton nom, ton email, changer tes préférences comme le mode sombre ou les sons, et gérer les options de sécurité.
// Explication technique : Composant React fonctionnel qui permet à l'utilisateur de consulter et modifier son profil, avec gestion d'état local et global via Redux, et communication avec l'API backend pour persister les modifications.
// Utilisé dans : Le routeur principal de l'application, accessible via la navigation utilisateur (probablement un menu ou une icône de profil)
// Connecté à : Store Redux (authSlice et uiSlice), API utilisateur via axios, localStorage pour stockage du token

import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { updateUserProfile } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import AvatarUploader from '../components/UI/AvatarUploader';
import { useNavigate } from 'react-router-dom';

// === Début : Configuration de l'URL de l'API ===
// Explication simple : On définit l'adresse du serveur avec lequel notre application va communiquer.
// Explication technique : Constante qui stocke l'URL de base de l'API, définie soit depuis les variables d'environnement, soit avec une valeur par défaut pour le développement.
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Configuration de l'URL de l'API ===

// === Début : Composant principal Profile ===
// Explication simple : C'est toute la page du profil avec ses formulaires et ses onglets.
// Explication technique : Composant React fonctionnel qui gère l'affichage et la logique de la page de profil utilisateur, incluant plusieurs onglets et formulaires.
const Profile: React.FC = () => {
  // === Début : Configuration du Redux et accès aux données utilisateur ===
  // Explication simple : On se connecte à la mémoire centrale de l'application pour récupérer les informations de l'utilisateur.
  // Explication technique : Initialisation du dispatcher Redux et extraction des données utilisateur depuis le store avec gestion défensive des propriétés potentiellement undefined.
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  // Accès sécurisé à l'état Redux
  const authState = useAppSelector(state => state.auth || {});
  const { user = null, loading: authLoading = false } = authState;
  
  // Récupérer les données de gamification
  const gamificationState = useAppSelector(state => state.gamification || {});
  const { level = 1, experience = 0, actionPoints = 0, badges = [], currentStreak = 0 } = gamificationState;

  // Utiliser experience dans l'UI
  const experienceProgress = useMemo(() => {
    const nextLevelXP = (level + 1) * 1000;
    return Math.round((experience / nextLevelXP) * 100);
  }, [level, experience]);

  // État local pour le loading
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // Retirer uploadProgress car AvatarUploader ne supporte pas cette prop
  // const [uploadProgress, setUploadProgress] = useState(0);
  // === Fin : Configuration du Redux et accès aux données utilisateur ===

  // === Début : Définition des valeurs par défaut du profil ===
  // Explication simple : On prépare un modèle vide qui servira si certaines informations du profil sont manquantes.
  // Explication technique : Utilisation de useMemo pour créer un objet de profil par défaut qui ne sera recalculé que si nécessaire, optimisant ainsi les performances.
  // Valeurs par défaut pour le profil utilisateur
  const defaultProfile = useMemo(() => ({
    name: '',
    email: '',
    role: '',
    points: 0,
    level: 1,
    streakDays: 0,
    badges: [],
    avatar: '',
  }), []);
  // === Fin : Définition des valeurs par défaut du profil ===

  // === Début : Initialisation du formulaire avec les données utilisateur ===
  // Explication simple : On prépare le formulaire avec les informations actuelles de l'utilisateur, ou des valeurs vides si on n'a pas encore ces informations.
  // Explication technique : État React qui contient les données du formulaire, initialisé avec les valeurs de l'utilisateur ou des valeurs par défaut, avec une structure imbriquée pour gérer le profil et ses paramètres.
  // Initialiser formData avec des valeurs par défaut complètes
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profile: {
      ...defaultProfile,
      ...(user?.profile || {}),
      settings: {
        notifications: true,
        language: 'fr',
        soundEffects: true,
        ...(user?.profile?.settings || {})
      }
    }
  });
  // === Fin : Initialisation du formulaire avec les données utilisateur ===

  // === Début : Mise à jour du formulaire quand les données utilisateur changent ===
  // Explication simple : Si les informations de l'utilisateur changent ailleurs dans l'application, on met à jour notre formulaire pour rester synchronisé.
  // Explication technique : Hook useEffect qui surveille les changements dans l'objet user et met à jour le formData en conséquence, garantissant la cohérence des données affichées.
  // Mettre à jour formData lorsque user change
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        profile: {
          ...defaultProfile,
          ...(user.profile || {}),
          settings: {
            notifications: true,
            language: 'fr',
            soundEffects: true,
            ...(user?.profile?.settings || {})
          }
        }
      });
    }
  }, [user, defaultProfile]);
  // === Fin : Mise à jour du formulaire quand les données utilisateur changent ===

  // === Début : Gestion des onglets de l'interface ===
  // Explication simple : On garde en mémoire quel onglet est actuellement ouvert (Informations, Préférences ou Sécurité).
  // Explication technique : État React qui maintient l'onglet actif, permettant un affichage conditionnel des différentes sections de l'interface.
  const [activeTab, setActiveTab] = useState('overview');
  // === Fin : Gestion des onglets de l'interface ===

  // === Début : Gestion des changements dans le formulaire ===
  // Explication simple : Cette fonction s'occupe de mettre à jour les informations quand tu modifies quelque chose dans le formulaire.
  // Explication technique : Fonction qui gère les événements onChange des champs de formulaire, mettant à jour le state formData avec les nouvelles valeurs.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSettingChange = (setting: string, value: boolean | string) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        settings: {
          ...prev.profile.settings,
          [setting]: value
        }
      }
    }));
  };
  // === Fin : Gestion des changements dans le formulaire ===

  // === Début : Soumission du formulaire et sauvegarde des changements ===
  // Explication simple : Cette fonction envoie tes modifications au serveur pour les sauvegarder quand tu cliques sur le bouton "Enregistrer".
  // Explication technique : Fonction asynchrone qui gère la soumission du formulaire, incluant la gestion des états de chargement, la communication avec l'API via axios, et les notifications de succès ou d'erreur.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié");
      }

      const dataForBackend = {
        username: formData.name,
        profile: formData.profile
      };

      const response = await axios({
        method: 'put',
        url: `${API_URL}/api/users/profile`,
        data: dataForBackend,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Utiliser la réponse pour valider le succès
      if (response.data && response.data.success) {
        console.log('Profil mis à jour avec succès:', response.data);
      }

      dispatch(updateUserProfile({
        ...formData,
        profile: {
          ...formData.profile,
          avatar: formData.profile.avatar || '',
          theme: formData.profile.theme || 'default',
          settings: {
            notifications: !!formData.profile.settings?.notifications,
            language: formData.profile.settings?.language || 'fr',
            soundEffects: !!formData.profile.settings?.soundEffects
          }
        }
      }));

      dispatch(addNotification({
        message: 'Profil mis à jour avec succès!',
        type: 'success'
      }));
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la mise à jour du profil',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Soumission du formulaire et sauvegarde des changements ===

  // Fonction pour calculer le pourcentage de complétion du profil
  const calculateProfileCompletion = () => {
    let completed = 0;
    const total = 5;
    
    if (formData.name) completed++;
    if (formData.email) completed++;
    if (formData.profile.avatar) completed++;
    if (formData.profile.settings.language) completed++;
    if (Object.keys(formData.profile.settings).length > 0) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // === Début : Rendu conditionnel pendant le chargement ===
  // Explication simple : Si on n'a pas encore les informations de l'utilisateur, on montre une animation de chargement en attendant.
  // Explication technique : Condition de rendu qui affiche un indicateur de chargement lorsque les données utilisateur ne sont pas encore disponibles.
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#026aa1]"></div>
      </div>
    );
  }
  // === Fin : Rendu conditionnel pendant le chargement ===

  // === Début : Rendu principal de l'interface utilisateur ===
  // Explication simple : C'est la partie qui dessine toute la page avec les onglets, les formulaires et les boutons.
  // Explication technique : Rendu JSX principal du composant, comprenant l'animation d'entrée via Framer Motion, les onglets de navigation, et le contenu conditionnel basé sur l'onglet actif.
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Mon Profil
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Gérez vos informations personnelles et vos préférences
          </p>
        </motion.div>

        {/* Carte de résumé du profil */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-[#026aa1] to-[#0487d9] rounded-2xl shadow-xl p-8 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <AvatarUploader
                currentAvatar={formData.profile.avatar}
                userName={formData.name}
                onAvatarChange={(avatarPath) => {
                  setFormData(prev => ({
                    ...prev,
                    profile: {
                      ...prev.profile,
                      avatar: avatarPath
                    }
                  }));
                }}
                size="large"
                className="ring-4 ring-white/30 w-32 h-32"
                // onUploadProgress={setUploadProgress} // Supprimé car n'existe pas
              />
              {/* Suppression de l'indicateur de progression car on n'a pas accès à cette info */}
              {/* {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <div className="text-white text-lg font-bold">{uploadProgress}%</div>
                </div>
              )} */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-bold mb-2">{formData.name || 'Utilisateur'}</h2>
              <p className="text-white/80 mb-4">{formData.email}</p>
              
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  <div className="text-xs text-white/60">Niveau</div>
                  <div className="text-xl font-bold">{level}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  <div className="text-xs text-white/60">Points</div>
                  <div className="text-xl font-bold">{actionPoints}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  <div className="text-xs text-white/60">Badges</div>
                  <div className="text-xl font-bold">{badges.length}</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  <div className="text-xs text-white/60">Série</div>
                  <div className="text-xl font-bold">{currentStreak}j</div>
                </div>
                <div className="bg-white/20 backdrop-blur rounded-lg px-4 py-2">
                  <div className="text-xs text-white/60">XP</div>
                  <div className="text-xl font-bold">{experience}</div>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-white/60 mb-2">Profil complété à</div>
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - calculateProfileCompletion() / 100)}`}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{calculateProfileCompletion()}%</span>
                </div>
              </div>
              <div className="text-xs text-white/60 mt-2">
                XP: {experienceProgress}% vers Nv.{level + 1}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Onglets modernes */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Vue d\'ensemble', icon: '👤' },
                { id: 'info', label: 'Informations', icon: '📝' },
                { id: 'settings', label: 'Préférences', icon: '⚙️' },
                { id: 'security', label: 'Sécurité', icon: '🔐' }
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

          <div className="p-8">
            <AnimatePresence mode="wait">
              {/* Onglet Vue d'ensemble */}
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Tableau de bord personnel
                  </h3>

                  {/* Statistiques rapides */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📅</span>
                        </div>
                        <span className="text-sm text-purple-600 dark:text-purple-400">+12%</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Membre depuis</h4>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {/* Utiliser une propriété alternative ou une date de création simulée */}
                        {(() => {
                          // Si l'utilisateur a une date de création dans son profil
                          const createdAt = (user as any)?.createdAt || 
                                          (user as any)?.profile?.createdAt || 
                                          (user as any)?.dateCreated ||
                                          // Sinon, utiliser une date par défaut (il y a 30 jours)
                                          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                          
                          return new Date(createdAt).toLocaleDateString('fr-FR', { 
                            year: 'numeric', 
                            month: 'long' 
                          });
                        })()}
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🎯</span>
                        </div>
                        <span className="text-sm text-blue-600 dark:text-blue-400">Actif</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Dernière activité</h4>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        Aujourd'hui
                      </p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -5 }}
                      className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-6"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">✅</span>
                        </div>
                        <span className="text-sm text-green-600 dark:text-green-400">100%</span>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Statut du compte</h4>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        Vérifié
                      </p>
                    </motion.div>
                  </div>

                  {/* Actions rapides */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Actions rapides
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => navigate('/gamification')}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🏆</span>
                        </div>
                        <div className="text-left">
                          <h5 className="font-medium text-gray-900 dark:text-white">Voir mes récompenses</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Badges et accomplissements</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => navigate('/tasks')}
                        className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-all"
                      >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📋</span>
                        </div>
                        <div className="text-left">
                          <h5 className="font-medium text-gray-900 dark:text-white">Mes tâches</h5>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Gérer mes projets</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Onglet Informations */}
              {activeTab === 'info' && (
                <motion.div
                  key="info"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                      Informations personnelles
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="Entrez votre nom"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Adresse email
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600"
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          L'email ne peut pas être modifié pour des raisons de sécurité
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100">Astuce</h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Gardez vos informations à jour pour une meilleure expérience
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="submit"
                        disabled={loading || authLoading}
                        className="px-6 py-3 bg-[#026aa1] text-white rounded-lg hover:bg-[#0487d9] transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Mise à jour...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Enregistrer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Onglet Préférences */}
              {activeTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Préférences d'application
                  </h3>

                  <div className="space-y-6">
                    {/* Notifications */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Notifications</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Gérez vos préférences de notifications
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🔔</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-700 dark:text-gray-300">Notifications push</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={formData.profile.settings.notifications}
                              onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#026aa1]"></div>
                          </div>
                        </label>
                        
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-700 dark:text-gray-300">Notifications par email</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={true}
                              onChange={() => {}}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#026aa1]"></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Apparence */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Apparence</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Personnalisez l'interface de l'application
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🎨</span>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-700 dark:text-gray-300">Mode sombre</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={formData.profile.theme === 'dark'}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                profile: {
                                  ...prev.profile,
                                  theme: e.target.checked ? 'dark' : 'default'
                                }
                              }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#026aa1]"></div>
                          </div>
                        </label>
                        
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-gray-700 dark:text-gray-300">Effets sonores</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={formData.profile.settings.soundEffects}
                              onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#026aa1]"></div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Langue */}
                    <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">Langue</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Choisissez votre langue préférée
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🌍</span>
                        </div>
                      </div>
                      
                      <select
                        value={formData.profile.settings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-600 dark:text-white"
                      >
                        <option value="fr">🇫🇷 Français</option>
                        <option value="en">🇬🇧 English</option>
                        <option value="es">🇪🇸 Español</option>
                        <option value="de">🇩🇪 Deutsch</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        // Réinitialiser aux valeurs par défaut
                        setFormData(prev => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            theme: 'default',
                            settings: {
                              notifications: true,
                              language: 'fr',
                              soundEffects: true
                            }
                          }
                        }));
                      }}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Réinitialiser
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={loading || authLoading}
                      className="px-6 py-3 bg-[#026aa1] text-white rounded-lg hover:bg-[#0487d9] transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enregistrement...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Enregistrer les préférences
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Onglet Sécurité */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Sécurité du compte
                  </h3>

                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">Mot de passe</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Dernière modification il y a 3 mois
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    
                    <button className="w-full py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      Changer le mot de passe
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-700 rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">Authentification à deux facteurs</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Ajoutez une couche de sécurité supplémentaire
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                    </div>
                    
                    <button className="w-full py-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors">
                      Activer la 2FA
                    </button>
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-red-900 dark:text-red-100 mb-2">
                      Zone dangereuse
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                      Une fois votre compte supprimé, toutes vos données seront définitivement effacées.
                    </p>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Supprimer mon compte
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Modal de suppression */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Êtes-vous sûr ?
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Cette action est irréversible. Toutes vos données seront supprimées définitivement.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
  // === Fin : Rendu principal de l'interface utilisateur ===
};
// === Fin : Composant principal Profile ===

export default Profile;