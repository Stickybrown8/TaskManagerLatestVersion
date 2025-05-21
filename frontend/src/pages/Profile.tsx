// === Ce fichier crée la page profil où l'utilisateur peut voir et modifier ses informations personnelles === /workspaces/TaskManagerLatestVersion/frontend/src/pages/Profile.tsx
// Explication simple : C'est comme ta carte d'identité dans l'application où tu peux voir ton nom, ton email, changer tes préférences comme le mode sombre ou les sons, et gérer les options de sécurité.
// Explication technique : Composant React fonctionnel qui permet à l'utilisateur de consulter et modifier son profil, avec gestion d'état local et global via Redux, et communication avec l'API backend pour persister les modifications.
// Utilisé dans : Le routeur principal de l'application, accessible via la navigation utilisateur (probablement un menu ou une icône de profil)
// Connecté à : Store Redux (authSlice et uiSlice), API utilisateur via axios, localStorage pour stockage du token

import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { updateUserProfile } from '../store/slices/authSlice';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';

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
  
  // Accès sécurisé à l'état Redux
  const authState = useAppSelector(state => state.auth || {});
  const { user = null, loading: authLoading = false } = authState;
  
  // État local pour le loading
  const [loading, setLoading] = useState(false);
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
  }), []); // Utiliser useMemo pour éviter les re-renders inutiles
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
      // S'assurer que settings est toujours défini
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
  const [activeTab, setActiveTab] = useState('info');
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
      
      console.log("Données du profil à mettre à jour:", formData);
      
      // Récupérer le token d'authentification depuis localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié");
      }
      
      // Appel API direct avec les headers d'authentification
      const response = await axios({
        method: 'put',
        url: `${API_URL}/api/users/profile`,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("Réponse de mise à jour du profil:", response.data);
      
      // Mettre à jour le state Redux
      dispatch(updateUserProfile({
        ...formData,
        profile: {
          ...formData.profile,
          avatar: formData.profile.avatar || '',
          theme: formData.profile.theme || 'default', // Valeur par défaut pour theme
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
      
      // Ajouter des logs supplémentaires pour diagnostiquer le problème
      if (error.response) {
        console.error("Détails de l'erreur:", error.response.data);
        console.error("Statut HTTP:", error.response.status);
      } else if (error.request) {
        console.error("Aucune réponse reçue:", error.request);
      }
      
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la mise à jour du profil: ' + error.message,
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Soumission du formulaire et sauvegarde des changements ===
  
  // === Début : Rendu conditionnel pendant le chargement ===
  // Explication simple : Si on n'a pas encore les informations de l'utilisateur, on montre une animation de chargement en attendant.
  // Explication technique : Condition de rendu qui affiche un indicateur de chargement lorsque les données utilisateur ne sont pas encore disponibles.
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  // === Fin : Rendu conditionnel pendant le chargement ===
  
  // === Début : Rendu principal de l'interface utilisateur ===
  // Explication simple : C'est la partie qui dessine toute la page avec les onglets, les formulaires et les boutons.
  // Explication technique : Rendu JSX principal du composant, comprenant l'animation d'entrée via Framer Motion, les onglets de navigation, et le contenu conditionnel basé sur l'onglet actif.
  return (
    <div className="container mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Mon Profil</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'info'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              onClick={() => setActiveTab('info')}
            >
              Informations
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'settings'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              onClick={() => setActiveTab('settings')}
            >
              Préférences
            </button>
            <button
              className={`px-6 py-3 text-sm font-medium ${activeTab === 'security'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              onClick={() => setActiveTab('security')}
            >
              Sécurité
            </button>
          </div>
          
          <div className="p-6">
            {/* Onglet Informations */}
            {activeTab === 'info' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0 mr-6">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white text-3xl font-bold">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute bottom-0 right-0 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-300 cursor-pointer" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div>
                      <label htmlFor="name" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white bg-gray-100 dark:bg-gray-600"
                    disabled
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">L'email ne peut pas être modifié.</p>
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading || authLoading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Mise à jour...
                      </div>
                    ) : 'Enregistrer les modifications'}
                  </button>
                </div>
              </form>
            )}
            
            {/* Onglet Préférences */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Préférences d'affichage</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Mode sombre</span>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                      <input
                        type="checkbox"
                        id="darkMode"
                        className="absolute w-6 h-6 rounded-full bg-white dark:bg-gray-300 appearance-none cursor-pointer peer checked:right-0 border border-gray-300 dark:border-gray-600"
                        checked={formData.profile.theme === 'dark'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          profile: {
                            ...prev.profile,
                            theme: e.target.checked ? 'dark' : 'default'
                          }
                        }))}
                      />
                      <label
                        htmlFor="darkMode"
                        className="block h-full bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer peer-checked:bg-primary-500"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Notifications</span>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                      <input
                        type="checkbox"
                        id="notifications"
                        className="absolute w-6 h-6 rounded-full bg-white dark:bg-gray-300 appearance-none cursor-pointer peer checked:right-0 border border-gray-300 dark:border-gray-600"
                        checked={formData.profile.settings.notifications}
                        onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                      />
                      <label
                        htmlFor="notifications"
                        className="block h-full bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer peer-checked:bg-primary-500"
                      ></label>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Effets sonores</span>
                    <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                      <input
                        type="checkbox"
                        id="soundEffects"
                        className="absolute w-6 h-6 rounded-full bg-white dark:bg-gray-300 appearance-none cursor-pointer peer checked:right-0 border border-gray-300 dark:border-gray-600"
                        checked={formData.profile.settings.soundEffects}
                        onChange={(e) => handleSettingChange('soundEffects', e.target.checked)}
                      />
                      <label
                        htmlFor="soundEffects"
                        className="block h-full bg-gray-300 dark:bg-gray-600 rounded-full cursor-pointer peer-checked:bg-primary-500"
                      ></label>
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="language" className="block text-gray-700 dark:text-gray-300 mb-2">
                      Langue
                    </label>
                    <select
                      id="language"
                      value={formData.profile.settings.language}
                      onChange={(e) => handleSettingChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || authLoading}
                    className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Mise à jour...
                      </div>
                    ) : 'Enregistrer les préférences'}
                  </button>
                </div>
              </div>
            )}
            
            {/* Onglet Sécurité */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sécurité du compte</h3>
                
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Pour des raisons de sécurité, la fonctionnalité de modification du mot de passe est temporairement indisponible.
                  </p>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      Si vous avez besoin de réinitialiser votre mot de passe, veuillez contacter l'administrateur du système.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
  // === Fin : Rendu principal de l'interface utilisateur ===
};
// === Fin : Composant principal Profile ===

export default Profile;
