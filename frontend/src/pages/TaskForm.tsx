import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { createTaskStart, createTaskSuccess, createTaskFailure } from '../store/slices/tasksSlice';
import { fetchClientsStart, fetchClientsSuccess, fetchClientsFailure } from '../store/slices/clientsSlice';
import { addNotification } from '../store/slices/uiSlice';
import { clientsService } from '../services/api';
import { motion } from 'framer-motion';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

const TaskForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // Récupérer les clients depuis le state
  const { clients, loading: clientsLoading } = useAppSelector(state => state.clients);
  
  // État local pour le formulaire
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    dueDate: '',
    priority: 'moyenne',
    category: 'autre',
    status: 'à faire',
    estimatedTime: 60, // En minutes
    actionPoints: 5,
    isHighImpact: false,
    impactScore: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  
  // Charger les clients s'ils ne sont pas déjà chargés
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
  
  // Mettre à jour le client sélectionné quand clientId change
  useEffect(() => {
    if (formData.clientId) {
      const client = clients.find(c => c._id === formData.clientId);
      setSelectedClient(client);
    } else {
      setSelectedClient(null);
    }
  }, [formData.clientId, clients]);
  
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
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      // Appel API direct pour la création de la tâche
      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/tasks`,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      
      console.log("Réponse de création de tâche:", response.data);
      
      const createdTask = response.data.task || response.data;
      dispatch(createTaskSuccess(createdTask));
      
      dispatch(addNotification({
        message: 'Tâche créée avec succès!',
        type: 'success'
      }));
      
      navigate('/tasks');
    } catch (error: any) {
      console.error("Erreur complète lors de la création de la tâche:", error);
      
      // Message d'erreur détaillé
      const errorMessage = error.response?.data?.message || error.message || 'Erreur lors de la création de la tâche';
      
      dispatch(createTaskFailure(errorMessage));
      dispatch(addNotification({
        message: errorMessage,
        type: 'error'
      }));
      
      // Logs supplémentaires
      if (error.response) {
        console.error("Réponse d'erreur:", error.response.data);
        console.error("Statut:", error.response.status);
      } else if (error.request) {
        console.error("Pas de réponse reçue:", error.request);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Obtenir la liste des catégories
  const categories = [
    { value: 'campagne', label: 'Campagne Marketing' },
    { value: 'landing', label: 'Landing Page' },
    { value: 'rapport', label: 'Rapport Analytics' },
    { value: 'email', label: 'Email Marketing' },
    { value: 'reunion', label: 'Réunion' },
    { value: 'tracking', label: 'Tracking & Analytics' },
    { value: 'cro', label: 'Optimisation de Conversion (CRO)' },
    { value: 'autre', label: 'Autre' }
  ];
  
  return (
    <div className="container mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle tâche</h1>
          <button
            onClick={() => navigate('/tasks')}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Annuler
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="space-y-6">
            {/* Informations principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label htmlFor="title" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              
              <div className="col-span-2">
                <label htmlFor="description" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>
              
              <div>
                <label htmlFor="clientId" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Client *
                </label>
                <div className="relative">
                  <select
                    id="clientId"
                    name="clientId"
                    value={formData.clientId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client._id} value={client._id}>{client.name}</option>
                    ))}
                  </select>
                  {clientsLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="w-4 h-4 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                
                {/* Affichage du logo du client si sélectionné */}
                {selectedClient && selectedClient.logo && (
                  <div className="mt-2 flex items-center">
                    <div className="w-10 h-10 mr-2 border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
                      <img 
                        src={selectedClient.logo} 
                        alt={`Logo de ${selectedClient.name}`} 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedClient.name}
                    </span>
                  </div>
                )}
              </div>
              
              <div>
                <label htmlFor="category" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Catégorie
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="dueDate" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Date d'échéance
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="priority" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Priorité
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="basse">Basse</option>
                  <option value="moyenne">Moyenne</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              
              <div>
                <label htmlFor="estimatedTime" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Temps estimé (minutes)
                </label>
                <input
                  type="number"
                  id="estimatedTime"
                  name="estimatedTime"
                  value={formData.estimatedTime}
                  onChange={handleNumberChange}
                  min="0"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              
              <div>
                <label htmlFor="actionPoints" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                  Points d'action
                </label>
                <input
                  type="number"
                  id="actionPoints"
                  name="actionPoints"
                  value={formData.actionPoints}
                  onChange={handleNumberChange}
                  min="1"
                  max="25"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Les points gagnés quand cette tâche est complétée.
                </p>
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isHighImpact"
                    name="isHighImpact"
                    checked={formData.isHighImpact}
                    onChange={handleCheckboxChange}
                    className="h-5 w-5 text-primary-600"
                  />
                  <label htmlFor="isHighImpact" className="ml-2 block text-gray-700 dark:text-gray-300">
                    Tâche à fort impact (principe 80/20)
                  </label>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-7">
                  Les tâches à fort impact représentent 20% des tâches qui apportent 80% des résultats.
                </p>
              </div>
              
              {formData.isHighImpact && (
                <div className="md:col-span-2">
                  <label htmlFor="impactScore" className="block text-gray-700 dark:text-gray-300 font-medium mb-2">
                    Score d'impact (1-100)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      id="impactScore"
                      name="impactScore"
                      value={formData.impactScore}
                      onChange={handleNumberChange}
                      min="0"
                      max="100"
                      step="5"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-lg font-semibold text-primary-600 w-12 text-center">
                      {formData.impactScore}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>Impact faible</span>
                    <span>Impact élevé</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end mt-6">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création en cours...
                </div>
              ) : 'Créer la tâche'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default TaskForm;
