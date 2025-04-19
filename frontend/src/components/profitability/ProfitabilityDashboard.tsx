import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllProfitability,
  fetchGlobalProfitabilitySummary,
  updateClientHourlyRate
} from '../../store/slices/profitabilitySlice';
import { RootState, AppDispatch } from '../../store';
import { motion } from 'framer-motion';

// Définition des interfaces pour le typage
interface GlobalSummary {
  averageProfitability: number;
  profitableClients: number;
  totalClients: number;
  totalHoursSpent: number;
  totalRemainingHours: number;
  totalHoursTarget?: number;
  unprofitableClients?: number;
  averageHourlyRate?: number;
}

interface ClientProfitability {
  _id: string;
  clientId: {
    _id: string;
    name: string;
  };
  hourlyRate: number;
  spentHours: number;
  remainingHours: number;
  profitabilityPercentage: number;
  targetHours?: number;
  isProfitable?: boolean;
}

const ProfitabilityDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { clientsProfitability, globalSummary, loading, error } = useSelector(
    (state: RootState) => state.profitability
  );

  const [globalHourlyRate, setGlobalHourlyRate] = useState<number>(75);
  const [showHourlyRateModal, setShowHourlyRateModal] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newHourlyRate, setNewHourlyRate] = useState<number>(0);

  useEffect(() => {
    dispatch(fetchAllProfitability());
    dispatch(fetchGlobalProfitabilitySummary());
  }, [dispatch]);

  const handleOpenHourlyRateModal = (clientId: string, currentRate: number) => {
    setSelectedClientId(clientId);
    setNewHourlyRate(currentRate);
    setShowHourlyRateModal(true);
  };

  const handleCloseHourlyRateModal = () => {
    setShowHourlyRateModal(false);
    setSelectedClientId('');
    setNewHourlyRate(0);
  };

  const handleUpdateHourlyRate = () => {
    if (selectedClientId && newHourlyRate > 0) {
      dispatch(updateClientHourlyRate({ clientId: selectedClientId, hourlyRate: newHourlyRate }));
      handleCloseHourlyRateModal();
    }
  };

  const getProfitabilityColorClass = (percentage: number) => {
    if (percentage >= 15) return 'text-green-600';
    if (percentage >= 0) return 'text-green-500';
    if (percentage >= -15) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressBarColorClass = (percentage: number) => {
    if (percentage >= 15) return 'bg-green-600';
    if (percentage >= 0) return 'bg-green-500';
    if (percentage >= -15) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatHours = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (minutes === 0) {
      return `${wholeHours}h`;
    }

    return `${wholeHours}h ${minutes}min`;
  };

  if (loading && !clientsProfitability.length && !globalSummary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Suivi de rentabilité</h2>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-700">Taux horaire global</h3>
            <div className="flex items-center">
              <input
                type="number"
                value={globalHourlyRate}
                onChange={(e) => setGlobalHourlyRate(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-md mr-2"
                min="0"
              />
              <span className="text-gray-600">€/heure</span>
            </div>
          </div>

          {globalSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Rentabilité moyenne</div>
                <div className={`text-2xl font-bold ${getProfitabilityColorClass((globalSummary as GlobalSummary).averageProfitability)}`}>
                  {(globalSummary as GlobalSummary).averageProfitability.toFixed(1)}%
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Clients rentables</div>
                <div className="text-2xl font-bold text-green-600">
                  {(globalSummary as GlobalSummary).profitableClients} / {(globalSummary as GlobalSummary).totalClients}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Heures passées</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatHours((globalSummary as GlobalSummary).totalHoursSpent)}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Heures restantes</div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatHours((globalSummary as GlobalSummary).totalRemainingHours)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-700 mb-4">Rentabilité par client</h3>

          {clientsProfitability.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
              Aucune donnée de rentabilité disponible. Commencez à suivre le temps passé sur vos clients pour voir apparaître des statistiques ici.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                    <th className="py-3 px-6 text-left">Client</th>
                    <th className="py-3 px-6 text-center">Taux horaire</th>
                    <th className="py-3 px-6 text-center">Heures passées</th>
                    <th className="py-3 px-6 text-center">Heures restantes</th>
                    <th className="py-3 px-6 text-center">Rentabilité</th>
                    <th className="py-3 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {(clientsProfitability as ClientProfitability[]).map((client) => (
                    <tr key={client._id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-6 text-left">
                        <div className="font-medium">{client.clientId.name}</div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        {client.hourlyRate}€/h
                      </td>
                      <td className="py-3 px-6 text-center">
                        {formatHours(client.spentHours)}
                      </td>
                      <td className="py-3 px-6 text-center">
                        {client.remainingHours > 0 ? (
                          <span className="text-red-500">{formatHours(client.remainingHours)}</span>
                        ) : (
                          <span className="text-green-500">0h</span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className={`font-semibold ${getProfitabilityColorClass(client.profitabilityPercentage)}`}>
                          {client.profitabilityPercentage.toFixed(1)}%
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className={`${getProgressBarColorClass(client.profitabilityPercentage)} h-2 rounded-full`}
                            style={{
                              width: `${Math.min(100, Math.max(0, client.profitabilityPercentage + 50))}%`
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-center">
                        <div className="flex justify-center items-center space-x-2">
                          <button
                            onClick={() => handleOpenHourlyRateModal(client.clientId._id, client.hourlyRate)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Modifier le taux horaire"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            className="text-green-500 hover:text-green-700"
                            title="Chronométrer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal pour modifier le taux horaire */}
      {showHourlyRateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-96"
          >
            <h3 className="text-lg font-semibold mb-4">Modifier le taux horaire</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau taux horaire (€/h)
              </label>
              <input
                type="number"
                value={newHourlyRate}
                onChange={(e) => setNewHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCloseHourlyRateModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateHourlyRate}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                disabled={newHourlyRate <= 0}
              >
                Enregistrer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProfitabilityDashboard;
