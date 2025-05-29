// === Ce fichier affiche une liste de clients avec possibilité de filtrage, recherche et navigation === /workspaces/TaskManagerLatestVersion/frontend/src/pages/Clients.tsx
// Explication simple : C'est comme une page d'annuaire qui montre tous les clients de l'entreprise. Tu peux chercher un client, voir son statut et cliquer dessus pour avoir plus d'informations.
// Explication technique : Composant React fonctionnel qui utilise Redux pour la gestion d'état, React Router pour la navigation, et affiche une liste filtrée de clients avec des animations via Framer Motion.
// Utilisé dans : Probablement dans un Router principal comme composant de page
// Connecté à : clientsSlice.ts (Redux), uiSlice.ts (notifications), clientsService.ts (API), et le composant ClientLogo

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchClientsStart, fetchClientsSuccess, fetchClientsFailure } from '../store/slices/clientsSlice';
import { clientsService, profitabilityService, timerService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Configuration API
const getApiUrl = () => {
  if (window.location.hostname === 'localhost') return 'http://localhost:5000';
  if (window.location.hostname.includes('github.dev')) {
    return window.location.origin.replace('-3000.', '-5000.');
  }
  return process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
};

const API_URL = getApiUrl();

interface ClientWithMetrics {
  _id: string;
  name: string;
  description?: string;
  logo?: string;
  status: string;
  hourlyRate?: number;
  monthlyHours?: number;
  monthlyRevenue?: number;
  monthlyBudget?: number; // Ajout du budget mensuel
  targetHours?: number;
  tasksCount?: number;
  completedTasks?: number;
  activeTasks?: number;
}

const Clients: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { clients, loading, error } = useAppSelector(state => state.clients);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clientsWithMetrics, setClientsWithMetrics] = useState<ClientWithMetrics[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'actif',
    logo: '',
    website: '',
    contactEmail: ''
  });
  const [formLoading, setFormLoading] = useState(false);

  // Charger les clients et leurs métriques
  useEffect(() => {
    loadClientsWithMetrics();
  }, []);

  const loadClientsWithMetrics = async () => {
    try {
      dispatch(fetchClientsStart());
      
      // Charger clients
      const clientsData = await clientsService.getClients();
      dispatch(fetchClientsSuccess(clientsData));
      
      // Charger profitabilité et timers pour calculer les métriques
      const [profitabilityData, timersData] = await Promise.all([
        profitabilityService.getAllProfitability(),
        timerService.getAllTimers()
      ]);
      
      // Calculer les métriques pour chaque client
      const currentMonth = new Date().toISOString().slice(0, 7);
      const enrichedClients = clientsData.map((client: any) => {
        // Trouver la profitabilité du client ou utiliser celle stockée dans le client
        const clientProf = profitabilityData.find((p: any) => p.clientId?._id === client._id) || client.profitability;
        
        // Calculer les heures du mois
        const monthlyTimers = timersData.filter((timer: any) => {
          return timer.clientId === client._id && 
                 timer.startTime?.startsWith(currentMonth);
        });
        
        const monthlySeconds = monthlyTimers.reduce((sum: number, timer: any) => {
          return sum + (timer.duration || 0);
        }, 0);
        
        const monthlyHours = monthlySeconds / 3600;
        const hourlyRate = clientProf?.hourlyRate || client.profitability?.hourlyRate || 100;
        const monthlyBudget = clientProf?.monthlyBudget || client.profitability?.monthlyBudget || 0;
        const targetHours = clientProf?.targetHours || client.profitability?.targetHours || 40;
        
        return {
          ...client,
          hourlyRate,
          monthlyBudget,
          monthlyHours: Math.round(monthlyHours * 10) / 10,
          monthlyRevenue: Math.round(monthlyHours * hourlyRate),
          targetHours,
          tasksCount: 0,
          completedTasks: 0,
          activeTasks: 0
        };
      });
      
      setClientsWithMetrics(enrichedClients);
      setLoadingMetrics(false);
    } catch (error: any) {
      console.error('Erreur chargement:', error);
      dispatch(fetchClientsFailure(error.message));
      setLoadingMetrics(false);
    }
  };

  // Gestion du formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      dispatch(addNotification({
        message: 'Le logo ne doit pas dépasser 2MB',
        type: 'error'
      }));
      return;
    }

    // Convertir en base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, logo: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      dispatch(addNotification({
        message: 'Le nom du client est obligatoire',
        type: 'error'
      }));
      return;
    }

    try {
      setFormLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios({
        method: 'post',
        url: `${API_URL}/api/clients`,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });

      dispatch(addNotification({
        message: '✅ Client créé avec succès!',
        type: 'success'
      }));

      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        status: 'actif',
        logo: '',
        website: '',
        contactEmail: ''
      });
      
      // Recharger les clients
      loadClientsWithMetrics();
    } catch (error: any) {
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la création',
        type: 'error'
      }));
    } finally {
      setFormLoading(false);
    }
  };

  // Filtrage
  const filteredClients = clientsWithMetrics.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'tous' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcul des totaux
  const totals = filteredClients.reduce((acc, client) => ({
    clients: acc.clients + 1,
    monthlyHours: acc.monthlyHours + (client.monthlyHours || 0),
    monthlyRevenue: acc.monthlyRevenue + (client.monthlyRevenue || 0),
    activeClients: acc.activeClients + (client.status === 'actif' ? 1 : 0)
  }), { clients: 0, monthlyHours: 0, monthlyRevenue: 0, activeClients: 0 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header avec statistiques */}
        <div className="bg-gradient-to-br from-[#026aa1] via-[#0487d9] to-[#06b6d4] rounded-2xl shadow-xl p-8 mb-8 text-white">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Clients actifs</p>
                  <p className="text-3xl font-bold">{totals.activeClients}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Heures ce mois</p>
                  <p className="text-3xl font-bold">{totals.monthlyHours.toFixed(1)}h</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Revenus du mois</p>
                  <p className="text-3xl font-bold">{totals.monthlyRevenue.toLocaleString()}€</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Taux horaire moyen</p>
                  <p className="text-3xl font-bold">
                    {totals.monthlyHours > 0 ? Math.round(totals.monthlyRevenue / totals.monthlyHours) : 0}€
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gestion des Clients</h1>
              <p className="text-blue-100">
                Gérez vos clients et suivez leur rentabilité
              </p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/clients/new')}
              className="bg-white text-[#026aa1] px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nouveau Client
            </motion.button>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher un client..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="tous">Tous les statuts</option>
              <option value="actif">Actifs</option>
              <option value="inactif">Inactifs</option>
              <option value="archivé">Archivés</option>
            </select>

            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-[#026aa1]' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 002-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-[#026aa1]' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Liste des clients */}
        {loading || loadingMetrics ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#026aa1] border-t-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {searchTerm || statusFilter !== 'tous' 
                ? 'Aucun client trouvé' 
                : 'Commencez par ajouter un client'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchTerm || statusFilter !== 'tous'
                ? 'Essayez de modifier vos critères de recherche'
                : 'Créez votre premier client pour démarrer'}
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un client
            </button>
          </motion.div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client, index) => (
              <motion.div
                key={client._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        {client.logo ? (
                          <img 
                            src={client.logo} 
                            alt={client.name}
                            className="w-16 h-16 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-md">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          client.status === 'actif' ? 'bg-green-500' : 
                          client.status === 'inactif' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-[#026aa1] transition-colors">
                          {client.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                          {client.description || 'Pas de description'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Métriques financières améliorées */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">💰</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Taux horaire cible</span>
                      </div>
                      <span className="font-bold text-lg text-blue-700 dark:text-blue-300">
                        {client.hourlyRate || 100}€/h
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">📅</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Budget mensuel</span>
                      </div>
                      <span className="font-bold text-lg text-green-700 dark:text-green-300">
                        {(client.monthlyBudget || 0).toLocaleString()}€
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">⏱️</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Heures effectuées</span>
                      </div>
                      <span className="font-bold text-lg text-purple-700 dark:text-purple-300">
                        {client.monthlyHours || 0}h / {client.targetHours || 0}h
                      </span>
                    </div>
                  </div>

                  {/* Barre de progression du budget avec plus d'infos */}
                  <div className="mb-6">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Heures consommées</span>
                      <span>{client.monthlyHours || 0}h sur {client.targetHours || 0}h max</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (client.monthlyHours || 0) / (client.targetHours || 1) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-2 rounded-full ${
                          (client.monthlyHours || 0) / (client.targetHours || 1) > 0.9 
                            ? 'bg-gradient-to-r from-red-500 to-red-600' 
                            : (client.monthlyHours || 0) / (client.targetHours || 1) > 0.7
                            ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                            : 'bg-gradient-to-r from-green-500 to-green-600'
                        }`}
                      />
                    </div>
                    {(client.targetHours && client.targetHours > 0) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        {Math.max(0, client.targetHours - (client.monthlyHours || 0)).toFixed(1)}h restantes ce mois
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/clients/${client._id}`)}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-lg font-medium hover:from-[#0487d9] hover:to-[#026aa1] transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Voir détails
                    </button>
                    <button
                      onClick={() => navigate(`/clients/${client._id}/edit`)}
                      className="p-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Vue liste
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Taux horaire cible
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Budget mensuel
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Heures (effectuées/max)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {client.logo ? (
                          <img 
                            src={client.logo} 
                            alt={client.name}
                            className="w-10 h-10 rounded-lg object-cover mr-3"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-[#026aa1] to-[#0487d9] rounded-lg flex items-center justify-center text-white font-bold mr-3">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.description || 'Pas de description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        client.status === 'actif' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                          : client.status === 'inactif' 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {client.hourlyRate || 100}€/h
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {(client.monthlyBudget || 0).toLocaleString()}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {client.monthlyHours || 0}h / {client.targetHours || 0}h
                        </span>
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (client.monthlyHours || 0) / (client.targetHours || 1) > 0.9 
                                ? 'bg-red-500' 
                                : (client.monthlyHours || 0) / (client.targetHours || 1) > 0.7
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, (client.monthlyHours || 0) / (client.targetHours || 1) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => navigate(`/clients/${client._id}`)}
                        className="text-[#026aa1] hover:text-[#0487d9] font-medium"
                      >
                        Voir détails →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Suppression de la modal de création rapide - on redirige vers le formulaire complet */}
        {showCreateModal && (() => {
          navigate('/clients/new');
          return null;
        })()}
      </div>
    </div>
  );
};

export default Clients;
