// src/components/profitability/MonthlyProfitabilityWidget.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addNotification } from '../../store/slices/uiSlice';
import ConfettiEffect from '../gamification/ConfettiEffect';
import { profitabilityRewardService } from '../../services/profitabilityRewardService';
import { soundService } from '../../services/soundService';
import axios from 'axios';

// Ajouter cette ligne après les imports
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';

interface MonthlyProfitabilityWidgetProps {
  displayMode?: 'compact' | 'full';
}

// Ajouter cette interface après MonthlyProfitabilityWidgetProps
interface ProfitabilityData {
  _id: string;
  clientId: string;
  clientName?: string;
  targetHours: number;
  actualHours: number;
  profitabilityPercentage: number;
}

const MonthlyProfitabilityWidget: React.FC<MonthlyProfitabilityWidgetProps> = ({
  displayMode = 'full'
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profitabilityData, setProfitabilityData] = useState<{
    targetsReached: number;
    totalClients: number;
    totalPointsEarned: number;
    lastChecked: string | null;
  }>({
    targetsReached: 0,
    totalClients: 0,
    totalPointsEarned: 0,
    lastChecked: null
  });
  const [showConfetti, setShowConfetti] = useState(false);

  // 🟢 Hook utilisé DIRECTEMENT dans le composant :
  const { soundEnabled } = useAppSelector(state => state.ui || { soundEnabled: true });

  // Vérifier si nous sommes à la fin du mois pour afficher un badge de notification
  const isEndOfMonth = () => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysUntilEnd = lastDayOfMonth.getDate() - today.getDate();
    return daysUntilEnd <= 3;
  };

  // Formater la date de dernier contrôle
  const formatLastChecked = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Remplacer cette fonction dans MonthlyProfitabilityWidget.tsx
  const checkMonthlyProfitability = async (soundEnabled: boolean) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Utiliser l'endpoint GET /api/profitability qui existe réellement
      const result = await axios.get<ProfitabilityData[]>(`${API_URL}/api/profitability`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      // Calculer manuellement les statistiques côté client
      const allProfitabilityData: ProfitabilityData[] = result.data || [];
      
      // Corriger le filtre avec un typage explicite
      const profitableClients = allProfitabilityData.filter(
        (client: ProfitabilityData) => client.profitabilityPercentage >= 0
      ).length;
      
      // Mettre à jour les données d'interface
      setProfitabilityData({
        targetsReached: profitableClients,
        totalClients: allProfitabilityData.length,
        totalPointsEarned: profitableClients * 5, // 5 points par client rentable
        lastChecked: new Date().toISOString()
      });
      
      // Notification de succès
      dispatch(addNotification({
        message: 'Vérification de rentabilité effectuée avec succès',
        type: 'success'
      }));
      
      // Si des clients sont rentables, déclencher des confettis
      if (profitableClients > 0 && soundEnabled) {
        setShowConfetti(true);
        soundService.play('success');
      }
      
    } catch (error: any) {
      console.error("Erreur détaillée lors de la vérification:", error);
      setError(error.response?.data?.message || error.message || "Erreur lors de la vérification");
    } finally {
      setLoading(false);
    }
  };

  // Version compacte
  if (displayMode === 'compact') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Rentabilité mensuelle
          </h3>
          {isEndOfMonth() && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Fin du mois
            </span>
          )}
        </div>
        <div className="mt-2">
          <button
            onClick={() => checkMonthlyProfitability(soundEnabled)}
            disabled={loading}
            className="w-full px-3 py-1 bg-primary-600 text-white text-sm rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Vérification...' : 'Vérifier la rentabilité'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfettiEffect 
        show={showConfetti}
        duration={5000}
        particleCount={150}
        onComplete={() => setShowConfetti(false)}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Rentabilité mensuelle des clients
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vérifiez si vos clients atteignent leurs objectifs de rentabilité
            </p>
          </div>
          {isEndOfMonth() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full text-sm"
            >
              Fin du mois : Vérifiez maintenant !
            </motion.div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-primary-50 dark:bg-primary-900/30 p-4 rounded-lg">
            <div className="text-sm text-primary-600 dark:text-primary-400 mb-1">Clients rentables</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profitabilityData.targetsReached} / {profitabilityData.totalClients}
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 mb-1">Points gagnés</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {profitabilityData.totalPointsEarned}
            </div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Dernière vérification</div>
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {formatLastChecked(profitabilityData.lastChecked)}
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={() => checkMonthlyProfitability(soundEnabled)}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Vérification en cours...
              </div>
            ) : 'Vérifier la rentabilité maintenant'}
          </button>
        </div>
      </div>
    </>
  );
};

export default MonthlyProfitabilityWidget;