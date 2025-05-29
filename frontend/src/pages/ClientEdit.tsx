import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks';
import { clientsService } from '../services/api';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';

const getApiUrl = () => {
  if (window.location.hostname === 'localhost') return 'http://localhost:5000';
  if (window.location.hostname.includes('github.dev')) {
    return window.location.origin.replace('-3000.', '-5000.');
  }
  return process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
};

const API_URL = getApiUrl();

const ClientEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [client, setClient] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'actif',
    logo: '',
    contactEmail: '',
    website: ''
  });
  const [profitabilityData, setProfitabilityData] = useState({
    hourlyRate: 100,
    targetHours: 0,
    monthlyBudget: 0,
  });

  useEffect(() => {
    loadClient();
  }, [id]);

  const loadClient = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/clients/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      });
      
      const clientData = response.data;
      setClient(clientData);
      setFormData({
        name: clientData.name || '',
        description: clientData.description || '',
        status: clientData.status || 'actif',
        logo: clientData.logo || '',
        contactEmail: clientData.contactEmail || '',
        website: clientData.website || ''
      });
      
      // Charger les données de rentabilité si elles existent
      if (clientData.profitability) {
        setProfitabilityData({
          hourlyRate: clientData.profitability.hourlyRate || 100,
          monthlyBudget: clientData.profitability.monthlyBudget || 0,
          targetHours: clientData.profitability.targetHours || 0
        });
      }
      
      setLoading(false);
    } catch (error) {
      dispatch(addNotification({
        message: 'Erreur lors du chargement du client',
        type: 'error'
      }));
      navigate('/clients');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfitabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    if (name === 'monthlyBudget') {
      const targetHours = profitabilityData.hourlyRate > 0 
        ? Math.round((numValue / profitabilityData.hourlyRate) * 10) / 10
        : 0;
      setProfitabilityData({
        ...profitabilityData,
        monthlyBudget: numValue,
        targetHours: targetHours,
      });
    } else if (name === 'hourlyRate') {
      const targetHours = profitabilityData.monthlyBudget > 0 && numValue > 0
        ? Math.round((profitabilityData.monthlyBudget / numValue) * 10) / 10
        : 0;
      setProfitabilityData({
        ...profitabilityData,
        hourlyRate: numValue,
        targetHours: targetHours,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const updateData = {
        ...formData,
        profitability: profitabilityData
      };
      
      await axios.put(`${API_URL}/api/clients/${id}`, updateData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      
      dispatch(addNotification({
        message: '✅ Client mis à jour avec succès!',
        type: 'success'
      }));
      
      navigate('/clients');
    } catch (error: any) {
      dispatch(addNotification({
        message: error.response?.data?.message || 'Erreur lors de la mise à jour',
        type: 'error'
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#026aa1] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/clients')}
              className="mb-4 inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux clients
            </button>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-transparent bg-clip-text mb-2">
              Modifier le client
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Mettez à jour les informations et la rentabilité
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Informations générales
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du client
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="actif">Actif</option>
                  <option value="inactif">Inactif</option>
                  <option value="archivé">Archivé</option>
                </select>
              </div>
            </div>

            {/* Configuration de la rentabilité */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Configuration de la rentabilité
              </h2>

              {/* Explication claire de la logique */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Comment ça fonctionne ?
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Définissez combien le client vous paye par mois et votre taux horaire souhaité. 
                      L'application calculera automatiquement le nombre d'heures maximum à effectuer.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💰 Budget mensuel du client
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-500">€</span>
                  <input
                    type="number"
                    name="monthlyBudget"
                    value={profitabilityData.monthlyBudget}
                    onChange={handleProfitabilityChange}
                    placeholder="Ex: 1000"
                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#026aa1] focus:border-transparent dark:bg-gray-700 dark:text-white font-bold text-lg"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Montant total que le client vous verse chaque mois
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ⏱️ Taux horaire souhaité
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={profitabilityData.hourlyRate}
                    onChange={(e) => handleProfitabilityChange({ 
                      target: { name: 'hourlyRate', value: e.target.value }
                    } as any)}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #dc2626 0%, #f59e0b 50%, #10b981 100%)`
                    }}
                  />
                  <input
                    type="number"
                    name="hourlyRate"
                    value={profitabilityData.hourlyRate}
                    onChange={handleProfitabilityChange}
                    className="w-24 px-3 py-2 text-right border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#026aa1] dark:bg-gray-700 dark:text-white font-bold"
                  />
                  <span className="text-gray-500">€/h</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Votre objectif de rémunération horaire pour ce client
                </p>
              </div>

              {/* Résultat du calcul avec visualisation claire */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border-2 border-green-200 dark:border-green-800">
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100 mb-4">
                  📊 Résultat du calcul
                </h3>
                
                {profitabilityData.monthlyBudget > 0 && profitabilityData.hourlyRate > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                        Heures maximum à effectuer par mois :
                      </p>
                      <p className="text-5xl font-bold text-green-600 dark:text-green-400">
                        {profitabilityData.targetHours}h
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        soit environ {Math.round(profitabilityData.targetHours / 8 * 10) / 10} jours de travail
                      </p>
                    </div>

                    <div className="pt-4 border-t border-green-200 dark:border-green-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Budget mensuel</span>
                        <span className="font-bold">{profitabilityData.monthlyBudget}€</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">÷ Taux horaire</span>
                        <span className="font-bold">{profitabilityData.hourlyRate}€/h</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-700">
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">= Heures max</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{profitabilityData.targetHours}h</span>
                      </div>
                    </div>

                    {/* Alertes selon le nombre d'heures */}
                    {profitabilityData.targetHours > 80 && (
                      <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-300 dark:border-red-700">
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                          ⚠️ Attention : {profitabilityData.targetHours}h représentent beaucoup de temps pour un seul client. 
                          Considérez d'augmenter votre taux horaire ou de négocier un budget plus élevé.
                        </p>
                      </div>
                    )}
                    
                    {profitabilityData.targetHours < 10 && (
                      <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-300 dark:border-green-700">
                        <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                          ✅ Excellent ! Avec seulement {profitabilityData.targetHours}h par mois, ce client est très rentable.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Remplissez le budget mensuel et votre taux horaire pour voir le calcul
                    </p>
                  </div>
                )}
              </div>

              {/* Exemple pratique */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <span>💭</span> Exemple
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Si un client vous paye <strong>1000€/mois</strong> et que vous souhaitez un taux de <strong>100€/h</strong>, 
                  vous devrez faire maximum <strong>10 heures</strong> pour ce client chaque mois.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-gradient-to-r from-[#026aa1] to-[#0487d9] text-white rounded-xl font-medium hover:from-[#0487d9] hover:to-[#026aa1] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientEdit;
