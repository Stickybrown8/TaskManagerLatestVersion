/*
 * PAGE D'ANALYSE DE RENTABILITÉ CLIENT - frontend/src/pages/ClientProfitability.tsx
 *
 * Explication simple:
 * Ce fichier crée une page qui te montre si un client te rapporte suffisamment d'argent 
 * par rapport au temps que tu passes à travailler pour lui. C'est comme une calculatrice 
 * spéciale qui compare ce que tu gagnes avec ce client et le temps que tu y consacres. 
 * Tu peux voir des graphiques colorés qui montrent quels jours tu as travaillé le plus,
 * combien d'argent tu as gagné, et si tu devrais peut-être facturer plus ou travailler moins.
 *
 * Explication technique:
 * Composant React fonctionnel qui implémente une page d'analyse de rentabilité client,
 * avec calculs dynamiques basés sur le taux horaire, les temps facturables vs non-facturables,
 * et les objectifs de rentabilité. Il fournit des visualisations temporelles, des métriques 
 * agrégées et une ventilation détaillée des entrées de temps pour analyse commerciale.
 *
 * Où ce fichier est utilisé:
 * Affiché comme page dédiée dans l'application lorsque l'utilisateur navigue vers 
 * la route '/clients/:id/profitability' ou une route similaire pour analyser la 
 * rentabilité d'un client spécifique.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks personnalisés useAppDispatch depuis '../hooks'
 * - Importe l'action addNotification depuis '../store/slices/uiSlice'
 * - Communique avec l'API backend via axios pour récupérer les données de temps et de rentabilité
 * - Utilise la bibliothèque framer-motion pour les animations d'interface
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour créer notre page, comme quand tu rassembles tes crayons et ta règle avant de dessiner.
// Explication technique : Importation des hooks React pour la gestion d'état et du cycle de vie, des composants de routage, des hooks Redux, des actions Redux, et des bibliothèques externes pour les requêtes HTTP et les animations.
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { addNotification } from '../store/slices/uiSlice';
import { motion } from 'framer-motion';
import axios from 'axios';
// === Fin : Importation des dépendances ===

// === Début : Configuration de l'API ===
// Explication simple : On définit l'adresse du serveur où on va chercher les informations, comme quand tu notes l'adresse d'un magasin avant d'y aller.
// Explication technique : Définition d'une constante pour l'URL de l'API avec une valeur de repli en cas d'absence de variable d'environnement.
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Configuration de l'API ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur à quoi ressemblent les données qu'on va utiliser, comme quand tu décris à quelqu'un l'apparence d'un objet qu'il n'a jamais vu.
// Explication technique : Déclaration des interfaces TypeScript qui définissent la structure des objets de données manipulés dans le composant, avec typage strict des propriétés.
interface TimerEntry {
  _id: string;
  description: string;
  startTime: string;
  endTime: string;
  duration: number; // en secondes
  billable: boolean;
}

interface ProfitabilityData {
  clientId: string;
  hourlyRate: number;
  targetHours: number;
  spentHours: number;
  revenue: number;
  profitabilityPercentage: number;
  isProfitable: boolean;
  remainingHours: number;
}
// === Fin : Définition des interfaces TypeScript ===

// === Début : Composant principal ClientProfitability ===
// Explication simple : C'est le grand chef d'orchestre qui va organiser toute la page de rentabilité, comme le chef d'un restaurant qui supervise tous les plats.
// Explication technique : Définition du composant fonctionnel React avec typage explicite, qui encapsule toute la logique et l'interface utilisateur de la page d'analyse de rentabilité client.
const ClientProfitability: React.FC = () => {
// === Fin : Composant principal ClientProfitability ===

  // === Début : Initialisation des hooks et récupération des états ===
  // Explication simple : On prépare des outils spéciaux pour parler avec le "cerveau" de l'application et pour savoir quel client on est en train d'examiner.
  // Explication technique : Configuration des hooks React et React Router pour récupérer l'identifiant client depuis l'URL et initialiser le dispatcher Redux pour les actions.
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  // === Fin : Initialisation des hooks et récupération des états ===
  
  // === Début : Définition des états locaux ===
  // Explication simple : On crée des boîtes pour ranger toutes nos informations importantes, comme quand tu as différentes boîtes pour ranger tes jouets par catégorie.
  // Explication technique : Initialisation des états locaux via useState pour gérer les données du client, les données de rentabilité, les timers, le chargement, les erreurs et les filtres de dates.
  const [timers, setTimers] = useState<TimerEntry[]>([]);
  const [profitability, setProfitability] = useState<ProfitabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [client, setClient] = useState<any>(null);
  
  // Période pour le filtre
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], // 30 jours en arrière
    endDate: new Date().toISOString().split('T')[0] // Aujourd'hui
  });
  
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  // === Fin : Définition des états locaux ===

  // === Début : Fonction de récupération des données ===
  // Explication simple : Cette fonction va chercher toutes les informations dont on a besoin sur le client et son temps de travail, comme quand tu vas à la bibliothèque chercher des livres sur un sujet précis.
  // Explication technique : Fonction asynchrone qui effectue plusieurs appels API pour récupérer les données du client, sa configuration de rentabilité et les entrées de temps, avec gestion des erreurs et des états de chargement.
  const fetchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Charger les informations du client
      const clientResponse = await axios.get(`${API_URL}/api/clients/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setClient(clientResponse.data);
      
      // Charger les données de rentabilité
      try {
        const profitabilityResponse = await axios.get(`${API_URL}/api/profitability/client/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setProfitability(profitabilityResponse.data);
      } catch (err) {
        console.log('Pas de données de rentabilité pour ce client');
      }
      
      // Charger les timers pour ce client avec le filtre de date
      const timersResponse = await axios.get(`${API_URL}/api/timers`, {
        params: {
          clientId: id,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setTimers(timersResponse.data);
    } catch (error: any) {
      console.error("Erreur lors du chargement des données:", error);
      setError(error.message || "Une erreur est survenue lors du chargement des données");
      dispatch(addNotification({
        message: 'Erreur lors du chargement des données de rentabilité',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction de récupération des données ===

  // === Début : Effet de chargement initial des données ===
  // Explication simple : Cette partie s'assure que les données sont chargées automatiquement quand tu ouvres la page ou changes la période de temps, comme quand la télévision s'allume tout de suite sur ta chaîne préférée.
  // Explication technique : Hook useEffect qui déclenche la fonction de récupération des données au montage du composant et lors des changements des dépendances clés comme l'ID client ou la période.
  useEffect(() => {
    fetchData();
  }, [id, period, fetchData]);  // Utiliser 'id' qui est extrait via useParams
  // === Fin : Effet de chargement initial des données ===

  // === Début : Fonction de calcul de rentabilité ===
  // Explication simple : Cette fonction fait tous les calculs pour savoir si le client te rapporte assez d'argent par rapport au temps que tu passes, comme quand tu calcules si ton argent de poche est suffisant pour acheter ce que tu veux.
  // Explication technique : Fonction qui calcule la rentabilité à partir des données de temps facturé et de la configuration de rentabilité, incluant le pourcentage de rentabilité, la rentabilité positive/négative et les heures restantes pour atteindre l'équilibre.
  const calculateProfitability = () => {
    if (!profitability || !timers.length) return null;
    
    // Calculer le temps total passé (en heures)
    const totalDurationSeconds = timers.reduce((total, timer) => {
      return timer.billable ? total + timer.duration : total;
    }, 0);
    
    const totalHoursSpent = totalDurationSeconds / 3600;
    
    // Calculer le revenu basé sur le taux horaire
    const revenue = profitability.hourlyRate * totalHoursSpent;
    
    // Calculer la rentabilité
    let profitabilityPercentage = 0;
    let isProfitable = false;
    let remainingHours = 0;
    
    if (profitability.targetHours > 0) {
      // Calculer la rentabilité par rapport aux heures cibles
      profitabilityPercentage = ((revenue / (profitability.targetHours * profitability.hourlyRate)) - 1) * 100;
      isProfitable = profitabilityPercentage >= 0;
      
      if (!isProfitable) {
        // Calculer les heures restantes pour atteindre la rentabilité
        remainingHours = Math.max(0, (profitability.targetHours * profitability.hourlyRate - revenue) / profitability.hourlyRate);
      }
    }
    
    return {
      totalHoursSpent,
      revenue,
      profitabilityPercentage,
      isProfitable,
      remainingHours
    };
  };
  // === Fin : Fonction de calcul de rentabilité ===
  
  // === Début : Calcul des données agrégées ===
  // Explication simple : Cette partie analyse toutes les entrées de temps pour créer un résumé facile à comprendre, comme quand tu fais un résumé d'un livre pour te souvenir des choses importantes.
  // Explication technique : Hook useMemo qui calcule et mémorise les métriques agrégées à partir des données de timers, incluant les regroupements par date, les calculs de totaux facturables/non-facturables, et les conversions en heures et pourcentages.
  const aggregatedData = React.useMemo(() => {
    if (!timers.length) return null;
    
    // Regrouper les timers par jour
    const entriesByDate: { [date: string]: { total: number, billable: number, nonBillable: number } } = {};
    
    // Initialiser toutes les dates dans la plage
    const startDate = new Date(dateRange.startDate);
    const endDate = new Date(dateRange.endDate);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      entriesByDate[dateString] = { total: 0, billable: 0, nonBillable: 0 };
    }
    
    // Remplir avec les données réelles
    timers.forEach(timer => {
      const date = new Date(timer.startTime).toISOString().split('T')[0];
      if (!entriesByDate[date]) {
        entriesByDate[date] = { total: 0, billable: 0, nonBillable: 0 };
      }
      
      // Ajouter au total
      entriesByDate[date].total += timer.duration;
      
      // Ajouter au facturable ou non facturable
      if (timer.billable) {
        entriesByDate[date].billable += timer.duration;
      } else {
        entriesByDate[date].nonBillable += timer.duration;
      }
    });
    
    // Calcul des totaux
    const totalSeconds = Object.values(entriesByDate).reduce((sum, day) => sum + day.total, 0);
    const billableSeconds = Object.values(entriesByDate).reduce((sum, day) => sum + day.billable, 0);
    const nonBillableSeconds = Object.values(entriesByDate).reduce((sum, day) => sum + day.nonBillable, 0);
    
    // Convertir en heures
    const totalHours = totalSeconds / 3600;
    const billableHours = billableSeconds / 3600;
    const nonBillableHours = nonBillableSeconds / 3600;
    
    // Pourcentage de temps facturable
    const billablePercentage = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
    
    return {
      entriesByDate,
      totalSeconds,
      billableSeconds,
      nonBillableSeconds,
      totalHours,
      billableHours,
      nonBillableHours,
      billablePercentage
    };
  }, [timers, dateRange]);
  // === Fin : Calcul des données agrégées ===
  
  // === Début : Fonction de gestion du changement de période ===
  // Explication simple : Cette fonction te permet de choisir si tu veux voir les données d'aujourd'hui, de la semaine ou du mois, comme quand tu choisis de regarder les photos d'aujourd'hui ou celles de toutes tes vacances.
  // Explication technique : Fonction qui met à jour la période sélectionnée et calcule dynamiquement les dates de début et de fin correspondantes pour filtrer les données temporelles.
  const handlePeriodChange = (newPeriod: 'day' | 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    
    const today = new Date();
    let startDate = new Date();
    
    switch (newPeriod) {
      case 'day':
        // Aujourd'hui
        startDate = new Date(today);
        break;
      case 'week':
        // 7 derniers jours
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        // 30 derniers jours
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 30);
        break;
      case 'custom':
        // Ne rien faire, garder les dates actuelles
        return;
    }
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    });
  };
  // === Fin : Fonction de gestion du changement de période ===
  
  // === Début : Fonction de formatage de la durée ===
  // Explication simple : Cette fonction transforme des secondes en un format plus facile à lire, comme quand tu transformes 90 minutes en 1 heure et 30 minutes pour mieux comprendre la durée.
  // Explication technique : Fonction utilitaire qui convertit une durée en secondes en une chaîne de caractères formatée en heures et minutes, avec gestion des cas particuliers.
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes} min`;
    }
    
    return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
  };
  // === Fin : Fonction de formatage de la durée ===
  
  // === Début : Calcul des résultats de rentabilité ===
  // Explication simple : On récupère tous les calculs de rentabilité pour les utiliser dans notre page, comme quand tu reçois le résultat d'un examen pour savoir si tu as réussi.
  // Explication technique : Appel de la fonction de calcul de rentabilité pour obtenir les résultats et les rendre disponibles pour l'affichage dans l'interface.
  const profitabilityResults = calculateProfitability();
  // === Fin : Calcul des résultats de rentabilité ===

  // === Début : Fonction de vérification manuelle de la rentabilité ===
  // Explication simple : Cette fonction permet de vérifier à nouveau la rentabilité en appuyant sur un bouton, comme quand tu recalcules ton budget pour être sûr de ne pas avoir fait d'erreur.
  // Explication technique : Fonction asynchrone qui effectue une requête à l'API pour rafraîchir les données de rentabilité, avec gestion des états de chargement, des erreurs et des notifications.
  const verifyProfitability = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error("Token d'authentification manquant");
      }
      
      // Log pour debug
      console.log("Vérification de la rentabilité pour le client:", id);
      
      // Utiliser l'endpoint existant au lieu de /verify
      const response = await axios.get(
        `${API_URL}/profitability/client/${id}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      console.log("Réponse données de rentabilité:", response.data);
      
      // Mettre à jour l'état avec les données
      setProfitability(response.data);
      
      dispatch(addNotification({
        message: 'Données de rentabilité actualisées',
        type: 'success'
      }));
      
      // Recharger les données complètes
      await fetchData();
      
    } catch (error: any) {
      console.error("Erreur détaillée:", error);
      setError(error.response?.data?.message || error.message || "Erreur lors de la vérification");
      dispatch(addNotification({
        message: `Erreur: ${error.response?.status || error.message}`,
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };
  // === Fin : Fonction de vérification manuelle de la rentabilité ===

  // === Début : Rendu de l'interface utilisateur ===
  // Explication simple : C'est la partie qui dessine toute la page avec les graphiques, les chiffres et les tableaux, comme quand tu assembles un puzzle pour voir l'image complète.
  // Explication technique : Retour du JSX qui structure l'interface utilisateur complète de la page, organisée en sections distinctes (filtres, indicateurs, graphique, tableau détaillé) avec gestion conditionnelle des états de chargement, d'erreur et d'absence de données.
  return (
    <div className="container mx-auto px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Rentabilité: {client?.name || 'Client'}
          </h1>
        </div>
        
        {/* Filtres de date */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center mb-4 space-y-4 md:space-y-0">
            <div className="flex flex-wrap gap-2 md:mr-6">
              <button
                onClick={() => handlePeriodChange('day')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'day'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Aujourd'hui
              </button>
              <button
                onClick={() => handlePeriodChange('week')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'week'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                7 derniers jours
              </button>
              <button
                onClick={() => handlePeriodChange('month')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'month'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                30 derniers jours
              </button>
              <button
                onClick={() => handlePeriodChange('custom')}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === 'custom'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                Personnalisé
              </button>
            </div>
            
            {period === 'custom' && (
              <div className="flex flex-col sm:flex-row gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Période: <span className="font-medium text-gray-800 dark:text-gray-200">{dateRange.startDate} - {dateRange.endDate}</span>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded-md">
            {error}
          </div>
        ) : (
          <>
            {/* Indicateurs de rentabilité */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Temps total</h2>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {aggregatedData ? formatDuration(aggregatedData.totalSeconds) : '0h'}
                </div>
                <div className="mt-1 flex items-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{aggregatedData ? formatDuration(aggregatedData.billableSeconds) : '0h'}</span> facturable
                  </div>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">|</span>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">{aggregatedData ? formatDuration(aggregatedData.nonBillableSeconds) : '0h'}</span> non-facturable
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Taux horaire</h2>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {profitability?.hourlyRate || 0}€/h
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Budget mensuel: <span className="font-medium">{profitability?.targetHours || 0}h</span>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Revenus générés</h2>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {profitabilityResults ? Math.round(profitabilityResults.revenue) : 0}€
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Basé sur le temps facturable
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Rentabilité</h2>
                <div className={`text-3xl font-bold ${
                  profitabilityResults && profitabilityResults.isProfitable 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {profitabilityResults ? Math.round(profitabilityResults.profitabilityPercentage) : 0}%
                </div>
                  
                  {/* Axe Y (heures) */}
                  <div className="absolute top-0 bottom-8 left-0 w-10 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                    {(() => {
                      const maxHours = aggregatedData
                        ? Math.max(...Object.values(aggregatedData.entriesByDate).map(d => d.total / 3600), 1)
                        : 1;
                      const step = Math.ceil(maxHours / 5);

                      return Array.from({ length: 6 }, (_, i) => i * step).map(hours => (
                        <div key={hours} className="text-right pr-2">{hours}h</div>
                      )).reverse();
                    })()}
                  </div>
                </div>
              <div className="flex justify-center mt-8 space-x-4">
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Facturable</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Non-facturable</span>
                </div>
              </div>
            </div>
            
            {/* Liste des entrées de temps */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Détail des temps</h2>
              
              {timers.length === 0 ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-center">
                  <p className="text-gray-600 dark:text-gray-400">Aucune entrée de temps pour la période sélectionnée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Durée
                        </th>
                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Facturable
                        </th>
                        <th className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Montant
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {timers
                        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                        .map((timer) => {
                          const date = new Date(timer.startTime);
                          const durationHours = timer.duration / 3600;
                          const amount = timer.billable ? durationHours * (profitability?.hourlyRate || 0) : 0;
                          
                          return (
                            <tr key={timer._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {date.toLocaleDateString()} <span className="text-gray-500 dark:text-gray-400">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {timer.description || 'Sans description'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {formatDuration(timer.duration)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {timer.billable ? (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    Oui
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                    Non
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                {timer.billable ? (
                                  <span className="font-medium">{Math.round(amount * 100) / 100}€</span>
                                ) : (
                                  <span className="text-gray-500 dark:text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          Total
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {formatDuration(aggregatedData?.totalSeconds || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {aggregatedData ? Math.round(aggregatedData.billablePercentage) : 0}% facturable
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                          {profitabilityResults ? Math.round(profitabilityResults.revenue) : 0}€
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
            {/* Bouton de vérification de rentabilité - à placer dans le JSX */}
            <button
              onClick={verifyProfitability}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Vérification...
                </span>
              ) : (
                'Vérifier la rentabilité maintenant'
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default ClientProfitability;
