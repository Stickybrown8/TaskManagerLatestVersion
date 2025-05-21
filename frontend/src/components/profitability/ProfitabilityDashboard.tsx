/*
 * TABLEAU DE BORD DE RENTABILITÉ - frontend/src/components/profitability/ProfitabilityDashboard.tsx
 *
 * Explication simple:
 * Ce fichier crée un grand tableau de bord qui te montre si tes clients te rapportent de l'argent 
 * ou t'en font perdre. Tu peux voir pour chaque client combien d'heures tu as passées sur ses projets,
 * combien il te reste à faire, et si tu es en train de gagner ou perdre de l'argent avec lui.
 * Tu peux aussi modifier le prix que tu factures à l'heure pour chaque client.
 *
 * Explication technique:
 * Composant React fonctionnel qui affiche un dashboard complet de suivi de rentabilité client,
 * avec des métriques globales et individuelles, des visualisations par barres de progression,
 * et la possibilité de modifier dynamiquement les taux horaires via un modal.
 *
 * Où ce fichier est utilisé:
 * Intégré dans la page de rentabilité de l'application, accessible via le menu principal
 * dans la section finance/administration pour les gestionnaires et administrateurs.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les actions du slice profitabilitySlice pour récupérer et modifier les données
 * - Interagit avec le store Redux via useSelector et useDispatch
 * - Utilise la bibliothèque Framer Motion pour les animations du modal
 * - Se connecte indirectement via le slice aux API endpoints de profitabilité du backend
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour construire notre tableau de bord, comme quand tu rassembles tes crayons et tes règles avant de dessiner.
// Explication technique : Importation des bibliothèques React core, des hooks Redux, des actions du slice de profitabilité, des types pour le store et de la bibliothèque d'animation.
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllProfitability,
  fetchGlobalProfitabilitySummary,
  updateClientHourlyRate
} from '../../store/slices/profitabilitySlice';
import { RootState, AppDispatch } from '../../store';
import { motion } from 'framer-motion';
// === Fin : Importation des dépendances ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur à quoi ressemblent nos informations, comme quand tu décris à quelqu'un la forme d'un jouet avant qu'il ne le voie.
// Explication technique : Déclaration des interfaces TypeScript qui définissent la structure des données de rentabilité globale et par client, assurant la sécurité de type et l'auto-complétion.
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
// === Fin : Définition des interfaces TypeScript ===

// === Début : Déclaration du composant principal ===
// Explication simple : On commence à créer notre grand tableau qui va afficher toutes les informations sur l'argent gagné ou perdu avec les clients.
// Explication technique : Définition du composant fonctionnel React qui sera responsable de l'affichage et des interactions du tableau de bord de rentabilité.
const ProfitabilityDashboard: React.FC = () => {
// === Fin : Déclaration du composant principal ===

  // === Début : Initialisation des hooks Redux et des états locaux ===
  // Explication simple : On prépare des boîtes spéciales pour stocker et changer les informations dont notre tableau a besoin, comme des tiroirs où on range différentes choses.
  // Explication technique : Configuration du dispatcher Redux, sélection des données du store avec useSelector, et définition des états locaux avec useState pour gérer l'UI du composant.
  const dispatch = useDispatch<AppDispatch>();
  const { clientsProfitability, globalSummary, loading, error } = useSelector(
    (state: RootState) => state.profitability
  );

  const [globalHourlyRate, setGlobalHourlyRate] = useState<number>(75);
  const [showHourlyRateModal, setShowHourlyRateModal] = useState<boolean>(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [newHourlyRate, setNewHourlyRate] = useState<number>(0);
  // === Fin : Initialisation des hooks Redux et des états locaux ===

  // === Début : Effet de chargement des données initiales ===
  // Explication simple : Quand notre tableau s'affiche pour la première fois, il va automatiquement aller chercher toutes les informations dont il a besoin sur internet.
  // Explication technique : Hook useEffect qui déclenche les actions Redux pour récupérer les données de rentabilité et le résumé global depuis l'API au montage du composant.
  useEffect(() => {
    dispatch(fetchAllProfitability());
    dispatch(fetchGlobalProfitabilitySummary());
  }, [dispatch]);
  // === Fin : Effet de chargement des données initiales ===

  // === Début : Fonctions de gestion du modal de taux horaire ===
  // Explication simple : Ces fonctions contrôlent la petite fenêtre qui apparaît quand tu veux changer le prix de l'heure pour un client - comme ouvrir, fermer et sauvegarder.
  // Explication technique : Gestionnaires d'événements pour l'ouverture, la fermeture et la soumission du modal de modification du taux horaire, avec mise à jour des états locaux correspondants.
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
  // === Fin : Fonctions de gestion du modal de taux horaire ===

  // === Début : Fonctions utilitaires pour l'affichage ===
  // Explication simple : Ces fonctions aident à choisir les bonnes couleurs pour montrer si un client est rentable (vert), pas rentable (rouge) ou entre les deux (jaune), et à afficher les heures correctement.
  // Explication technique : Utilitaires de formatage et de style conditionnels qui déterminent les classes CSS en fonction des valeurs de rentabilité et formatent les durées en heures et minutes.
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
  // === Fin : Fonctions utilitaires pour l'affichage ===

  // === Début : Gestion de l'état de chargement ===
  // Explication simple : Si notre tableau est encore en train de chercher les informations, on montre un petit cercle qui tourne pour dire "attendez, ça arrive".
  // Explication technique : Rendu conditionnel qui affiche un indicateur de chargement (spinner) lorsque les données sont en cours de récupération et qu'aucun résultat n'est encore disponible.
  if (loading && !clientsProfitability.length && !globalSummary) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  // === Fin : Gestion de l'état de chargement ===

  // === Début : Rendu principal du dashboard ===
  // Explication simple : C'est ici qu'on dessine réellement notre grand tableau sur l'écran, avec toutes ses parties : le résumé global en haut, et la liste des clients en bas.
  // Explication technique : Rendu du JSX principal du composant, structuré en plusieurs sections : conteneur principal, section de résumé global, et tableau détaillé par client.
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Suivi de rentabilité</h2>

        {/* === Début : Section du taux horaire global === */}
        {/* Explication simple : Cette partie te permet de voir et changer le prix que tu demandes en général pour une heure de travail. */}
        {/* Explication technique : Section UI permettant de visualiser et modifier le taux horaire global utilisé comme référence, avec un input numérique contrôlé. */}
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
        {/* === Fin : Section du taux horaire global === */}

          {/* === Début : Résumé global de rentabilité === */}
          {/* Explication simple : Cette grille montre les grandes informations importantes : combien de clients sont rentables, combien d'heures vous avez travaillées, et si en moyenne vous gagnez de l'argent. */}
          {/* Explication technique : Rendu conditionnel du résumé global avec affichage des métriques clés dans une grille responsive, n'apparaissant que si les données globalSummary sont disponibles. */}
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
          {/* === Fin : Résumé global de rentabilité === */}
        </div>

        {/* === Début : Tableau de rentabilité par client === */}
        {/* Explication simple : Ce grand tableau liste tous tes clients un par un. Pour chacun, tu vois combien tu factures à l'heure, combien d'heures tu as travaillé, et s'il te fait gagner ou perdre de l'argent. */}
        {/* Explication technique : Section affichant un tableau détaillé des données de rentabilité par client, avec rendu conditionnel pour l'absence de données et une table complète avec colonnes triables lorsque des données existent. */}
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
        {/* === Fin : Tableau de rentabilité par client === */}
      </div>

      {/* === Début : Modal de modification du taux horaire === */}
      {/* Explication simple : Cette petite fenêtre pop-up apparaît quand tu veux changer le prix que tu demandes à l'heure pour un client spécifique. */}
      {/* Explication technique : Composant modal conditionnel avec animation Framer Motion, formulaire pour la modification du taux horaire et boutons d'action, affiché uniquement lorsque showHourlyRateModal est vrai. */}
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
      {/* === Fin : Modal de modification du taux horaire === */}
    </div>
  );
  // === Fin : Rendu principal du dashboard ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre tableau de bord disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default ProfitabilityDashboard;
// === Fin : Export du composant ===
