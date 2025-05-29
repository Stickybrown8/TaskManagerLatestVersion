// === Ce fichier crée le formulaire de création d'une nouvelle tâche dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/pages/TaskForm.tsx

// Explication simple : C'est comme une fiche à remplir pour ajouter une nouvelle tâche, avec différents champs comme le titre, la description, la date limite, etc.
// Explication technique : Composant React fonctionnel qui gère le formulaire de création de tâche avec validation des entrées, communication API, et gestion d'état Redux.
// Utilisé dans : Le routeur principal de l'application, accessible via la route /tasks/new ou un bouton "Nouvelle tâche" depuis la liste des tâches
// Connecté à : Store Redux (tasksSlice, clientsSlice, uiSlice), services API (clientsService), axios pour les requêtes HTTP directes

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { createTaskStart, createTaskSuccess, createTaskFailure } from '../store/slices/tasksSlice';
import { fetchClientsStart, fetchClientsSuccess, fetchClientsFailure } from '../store/slices/clientsSlice';
import { addNotification } from '../store/slices/uiSlice';
import { clientsService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Détection automatique de l'URL pour GitHub Codespaces
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') {
    return 'http://localhost:5000';
  }
  if (window.location.hostname.includes('github.dev')) {
    return window.location.origin.replace('-3000.', '-5000.');
  }
  return process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
};


// === Début : Configuration de l'URL de l'API ===
// Explication simple : On définit l'adresse du serveur avec lequel notre application va communiquer.
// Explication technique : Constante qui stocke l'URL de base de l'API, récupérée depuis les variables d'environnement ou utilisant une valeur par défaut si non définie.
const API_URL = getApiUrl();
// === Fin : Configuration de l'URL de l'API ===

// === Début : Composant principal TaskForm ===
// Explication simple : C'est toute la page du formulaire avec tous les champs pour créer une nouvelle tâche.
// Explication technique : Composant React fonctionnel qui gère l'affichage et la logique du formulaire de création de tâche, avec état local, requêtes API et validation.
const TaskForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const { clients, loading: clientsLoading } = useAppSelector(state => state.clients);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    dueDate: '',
    priority: 'moyenne',
    category: 'autre',
    status: 'à faire',
    estimatedTime: 60,
    actionPoints: 5,
    isHighImpact: false,
    impactReason: '' // Nouveau champ pour expliquer l'impact
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1); // Pour un formulaire en étapes
  
  // === Début : Chargement initial des clients ===
  // Explication simple : Cette partie va chercher la liste des clients si on ne l'a pas déjà, comme préparer une liste des personnes pour qui on peut travailler.
  // Explication technique : Hook useEffect qui déclenche le chargement des clients depuis l'API si la liste est vide, avec gestion des états Redux associés.
  useEffect(() => {
    const loadClients = async () => {
      if (clients.length === 0) {
        try {
          dispatch(fetchClientsStart());
          const clientsData = await clientsService.getClients();
          dispatch(fetchClientsSuccess(clientsData));
        } catch (error: any) {
          dispatch(fetchClientsFailure(error.message));
          dispatch(addNotification({
            message: 'Erreur lors du chargement des clients',
            type: 'error'
          }));
        }
      }
    };
    
    loadClients();
  }, [dispatch, clients.length]);
  // === Fin : Chargement initial des clients ===
  
  // === Début : Mise à jour du client sélectionné ===
  // Explication simple : Quand on choisit un client dans la liste déroulante, cette partie trouve toutes ses informations détaillées.
  // Explication technique : Hook useEffect qui réagit aux changements de l'ID client sélectionné pour mettre à jour l'objet client complet avec ses détails.
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c._id === formData.clientId);
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [formData.clientId, clients]);
  // === Fin : Mise à jour du client sélectionné ===
  
  // === Début : Calcul automatique des points d'action ===
  // Explication simple : On calcule automatiquement combien de points d'action cette tâche va rapporter, selon son impact et sa priorité.
  // Explication technique : useEffect qui surveille les changements de priorité, d'impact et de catégorie pour recalculer les points d'action de manière intelligente.
  useEffect(() => {
    let points = 5; // Base
    
    // Bonus selon la priorité
    if (formData.priority === 'urgente') points += 3;
    else if (formData.priority === 'haute') points += 2;
    else if (formData.priority === 'moyenne') points += 1;
    
    // Gros bonus pour les tâches 80/20
    if (formData.isHighImpact) {
      points *= 2; // Double les points !
      points += 5; // Bonus supplémentaire
    }
    
    // Bonus selon la catégorie
    if (['campagne', 'cro', 'landing'].includes(formData.category)) {
      points += 2;
    }
    
    setFormData(prev => ({ ...prev, actionPoints: Math.min(points, 25) }));
  }, [formData.priority, formData.isHighImpact, formData.category]);
  // === Fin : Calcul automatique des points d'action ===
  
  // === Début : Gestionnaires de changements des champs du formulaire ===
  // Explication simple : Ces fonctions s'occupent de mettre à jour les informations quand tu tapes ou sélectionnes quelque chose dans le formulaire.
  // Explication technique : Ensemble de fonctions handler qui gèrent les différents types de changements dans le formulaire (texte/select, nombre, case à cocher).
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) }));
  };
  
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  // === Fin : Gestionnaires de changements des champs du formulaire ===
  
  // === Début : Soumission du formulaire ===
  // Explication simple : Cette fonction s'occupe d'envoyer toutes les informations de la nouvelle tâche au serveur quand tu cliques sur le bouton "Créer la tâche".
  // Explication technique : Fonction asynchrone qui gère la soumission du formulaire avec validation des entrées, communication API via axios, et gestion des états de succès ou d'erreur.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.clientId) {
      dispatch(addNotification({
        message: 'Veuillez remplir tous les champs obligatoires',
        type: 'error'
      }));
      return;
    }
    
    try {
      setLoading(true);
      dispatch(createTaskStart());
      
      const token = localStorage.getItem('token');
      
      // Préparer les données avec score d'impact automatique si 80/20
      const taskData = {
        ...formData,
        impactScore: formData.isHighImpact ? 80 : 0
      };
      
      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/tasks`,
        data: taskData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      const createdTask = response.data.task || response.data;
      dispatch(createTaskSuccess(createdTask));
      
      dispatch(addNotification({
        message: formData.isHighImpact 
          ? '🎯 Excellente tâche à fort impact créée! +' + formData.actionPoints + ' points!'
          : '✅ Tâche créée avec succès! +' + formData.actionPoints + ' points!',
        type: 'success'
      }));
      
      navigate('/tasks');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la tâche';
      dispatch(createTaskFailure(errorMessage));
      dispatch(addNotification({
        message: errorMessage,
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'campagne', label: '🚀 Campagne Marketing', impact: true },
    { value: 'landing', label: '🎯 Landing Page', impact: true },
    { value: 'cro', label: '📈 Optimisation (CRO)', impact: true },
    { value: 'email', label: '✉️ Email Marketing', impact: false },
    { value: 'rapport', label: '📊 Rapport Analytics', impact: false },
    { value: 'reunion', label: '👥 Réunion', impact: false },
    { value: 'tracking', label: '📍 Tracking', impact: false },
    { value: 'autre', label: '📌 Autre', impact: false }
  ];

  const priorityOptions = [
    { value: 'basse', label: 'Basse', color: 'gray', icon: '🟢' },
    { value: 'moyenne', label: 'Moyenne', color: 'yellow', icon: '🟡' },
    { value: 'haute', label: 'Haute', color: 'orange', icon: '🟠' },
    { value: 'urgente', label: 'Urgente', color: 'red', icon: '🔴' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header moderne */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/tasks')}
              className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux tâches
            </button>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-transparent bg-clip-text mb-2">
              Créer une nouvelle tâche
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Concentrez-vous sur les tâches à fort impact qui font vraiment la différence 🎯
            </p>
          </div>

          {/* Indicateur de progression */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${currentStep >= 1 ? 'bg-gradient-to-br from-[#026aa1] to-[#0487d9]' : 'bg-gray-300'}`}>
                  1
                </div>
                <span className={`font-medium ${currentStep >= 1 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  Informations de base
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                  ${currentStep >= 2 ? 'bg-gradient-to-br from-[#026aa1] to-[#0487d9]' : 'bg-gray-300'}`}>
                  2
                </div>
                <span className={`font-medium ${currentStep >= 2 ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                  Impact & Priorité
                </span>
              </div>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#026aa1] to-[#0487d9]"
                initial={{ width: '0%' }}
                animate={{ width: currentStep === 1 ? '50%' : '100%' }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Titre avec compteur de caractères */}
                  <div>
                    <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Titre de la tâche *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Ex: Créer une campagne Google Ads pour le Black Friday"
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        required
                      />
                      <span className={`absolute right-3 top-3.5 text-sm ${formData.title.length > 60 ? 'text-red-500' : 'text-gray-400'}`}>
                        {formData.title.length}/60
                      </span>
                    </div>
                  </div>
                  
                  {/* Client avec avatar */}
                  <div>
                    <label htmlFor="clientId" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Pour quel client ? *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {clients.map(client => (
                        <motion.button
                          key={client._id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, clientId: client._id }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.clientId === client._id
                              ? 'border-[#026aa1] bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg
                              ${formData.clientId === client._id ? 'bg-gradient-to-br from-[#026aa1] to-[#0487d9]' : 'bg-gray-400'}`}>
                              {client.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {client.name}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Catégorie avec indicateur d'impact */}
                  <div>
                    <label htmlFor="category" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Type de tâche
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {categories.map(category => (
                        <motion.button
                          key={category.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: category.value }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            formData.category === category.value
                              ? 'border-[#026aa1] bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category.label}</span>
                            {category.impact && (
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                Fort impact
                              </span>
                            )}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Description optionnelle */}
                  <div>
                    <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Ajoutez des détails importants..."
                      className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      disabled={!formData.title || !formData.clientId}
                      className="px-6 py-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-xl font-medium 
                        hover:from-[#0487d9] hover:to-[#026aa1] disabled:opacity-50 disabled:cursor-not-allowed
                        transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                      Continuer →
                    </button>
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Section Impact 80/20 */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border-2 border-orange-200 dark:border-orange-800">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">🎯</span>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 mb-2">
                          Est-ce une tâche à fort impact (80/20) ?
                        </h3>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                          Les tâches 80/20 sont celles qui demandent peu d'effort mais génèrent des résultats importants pour le client.
                        </p>
                        
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            name="isHighImpact"
                            checked={formData.isHighImpact}
                            onChange={handleCheckboxChange}
                            className="w-6 h-6 text-orange-600 rounded-lg focus:ring-orange-500"
                          />
                          <span className="font-medium text-orange-800 dark:text-orange-200">
                            Oui, cette tâche aura un fort impact!
                          </span>
                        </label>

                        <AnimatePresence>
                          {formData.isHighImpact && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="mt-4"
                            >
                              <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                                Pourquoi cette tâche aura-t-elle un fort impact ? *
                              </label>
                              <textarea
                                name="impactReason"
                                value={formData.impactReason}
                                onChange={handleChange}
                                placeholder="Ex: Cette campagne peut générer 50% du CA mensuel du client avec seulement 2h de travail"
                                className="w-full px-4 py-3 border-2 border-orange-200 dark:border-orange-700 rounded-xl 
                                  focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent 
                                  dark:bg-orange-900/20 dark:text-white transition-all resize-none"
                                rows={3}
                                required={formData.isHighImpact}
                              />
                              
                              <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                <span className="font-medium">
                                  Points bonus: {formData.actionPoints} points seront gagnés!
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Priorité avec emojis */}
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                      Niveau de priorité
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {priorityOptions.map(priority => (
                        <motion.button
                          key={priority.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, priority: priority.value }))}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            formData.priority === priority.value
                              ? `border-${priority.color}-500 bg-${priority.color}-50 dark:bg-${priority.color}-900/20`
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{priority.icon}</span>
                            <span className="font-medium">{priority.label}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Date et temps estimé */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="dueDate" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                        Date limite
                      </label>
                      <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent 
                          dark:bg-gray-700 dark:text-white transition-all"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="estimatedTime" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                        Temps estimé
                      </label>
                      <select
                        id="estimatedTime"
                        name="estimatedTime"
                        value={formData.estimatedTime}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl 
                          focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent 
                          dark:bg-gray-700 dark:text-white transition-all"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes</option>
                        <option value="45">45 minutes</option>
                        <option value="60">1 heure</option>
                        <option value="90">1h30</option>
                        <option value="120">2 heures</option>
                        <option value="180">3 heures</option>
                        <option value="240">4 heures</option>
                        <option value="480">1 journée</option>
                      </select>
                    </div>
                  </div>

                  {/* Résumé des points */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-1">
                          Points à gagner
                        </h4>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          {formData.isHighImpact && "Bonus 80/20 appliqué! 🎯"}
                        </p>
                      </div>
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-4xl font-bold text-blue-700 dark:text-blue-300"
                        >
                          +{formData.actionPoints}
                        </motion.div>
                        <span className="text-sm text-blue-600 dark:text-blue-400">points</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 
                        rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                      ← Retour
                    </button>
                    
                    <button
                      type="submit"
                      disabled={loading || (formData.isHighImpact && !formData.impactReason)}
                      className="px-8 py-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-xl font-medium 
                        hover:from-[#0487d9] hover:to-[#026aa1] disabled:opacity-50 disabled:cursor-not-allowed
                        transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Création...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Créer la tâche
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Tips en bas de page */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
          >
            <h3 className="font-bold text-purple-800 dark:text-purple-200 mb-2 flex items-center gap-2">
              <span className="text-2xl">💡</span>
              Astuce productivité
            </h3>
            <p className="text-purple-700 dark:text-purple-300">
              Concentrez-vous sur les tâches qui apportent 80% des résultats avec 20% d'effort. 
              Ces tâches à fort impact vous rapportent plus de points et maximisent votre valeur client!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TaskForm;
