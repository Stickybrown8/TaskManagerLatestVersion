/*
 * WIDGET DE RENTABILITÉ MENSUELLE - frontend/src/components/profitability/MonthlyProfitabilityWidget.tsx
 *
 * Explication simple:
 * Ce fichier crée une boîte spéciale qui affiche combien d'argent tes clients te rapportent 
 * chaque mois. Elle te montre quels clients atteignent leurs objectifs et lesquels non. 
 * Tu peux cliquer sur un bouton pour vérifier, et si beaucoup de clients sont rentables, 
 * tu gagnes des points et des confettis apparaissent pour fêter ça! C'est comme un tableau 
 * de score qui te récompense quand ton entreprise va bien.
 *
 * Explication technique:
 * Composant React fonctionnel qui affiche et calcule les métriques de rentabilité des clients 
 * sur une base mensuelle. Il interagit avec l'API de profitabilité, déclenche des récompenses 
 * gamifiées via Redux et peut être affiché en mode compact ou complet avec des visualisations 
 * de données.
 *
 * Où ce fichier est utilisé:
 * Intégré dans le tableau de bord principal et potentiellement dans des pages de reporting 
 * financier, offrant une vue d'ensemble de la rentabilité des projets clients.
 *
 * Connexions avec d'autres fichiers:
 * - Utilise les hooks Redux personnalisés depuis '../../hooks'
 * - Importe le composant ConfettiEffect depuis '../gamification/ConfettiEffect'
 * - Consomme les services profitabilityRewardService et soundService
 * - Interagit avec l'API backend via axios pour récupérer les données de rentabilité
 * - Dispatch des actions au slice uiSlice pour les notifications
 */

// === Début : Importation des dépendances ===
// Explication simple : On prend tous les outils dont on a besoin pour faire fonctionner notre widget, comme quand tu prépares tous tes matériaux avant de construire quelque chose.
// Explication technique : Importation des bibliothèques et modules requis, notamment React pour les hooks, Framer Motion pour les animations, les hooks Redux personnalisés, et divers services pour la gestion des API et des effets.
// src/components/profitability/MonthlyProfitabilityWidget.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { addNotification } from '../../store/slices/uiSlice';
import ConfettiEffect from '../gamification/ConfettiEffect';
import { profitabilityRewardService } from '../../services/profitabilityRewardService';
import { soundService } from '../../services/soundService';
import axios from 'axios';
// === Fin : Importation des dépendances ===

// === Début : Configuration de l'URL API ===
// Explication simple : On définit l'adresse où notre application va chercher les informations sur internet, comme quand tu mémorises l'adresse de ton école.
// Explication technique : Déclaration de la constante d'URL de l'API en utilisant une variable d'environnement avec une valeur de fallback, pour permettre des environnements de déploiement flexibles.
// Ajouter cette ligne après les imports
const API_URL = process.env.REACT_APP_API_URL || 'https://task-manager-api-yx13.onrender.com';
// === Fin : Configuration de l'URL API ===

// === Début : Définition des interfaces TypeScript ===
// Explication simple : On explique à l'ordinateur à quoi ressemblent les informations qu'on va utiliser, comme quand tu décris la forme d'un jouet à quelqu'un.
// Explication technique : Déclaration des interfaces TypeScript qui définissent la structure des props du composant et des données de rentabilité reçues de l'API, assurant la sécurité de type.
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
// === Fin : Définition des interfaces TypeScript ===

// === Début : Déclaration du composant principal ===
// Explication simple : On commence à créer notre boîte spéciale qui affichera les informations sur l'argent gagné, comme quand tu dessines le contour d'une maison avant de la construire.
// Explication technique : Définition du composant fonctionnel React avec typage TypeScript, déstructuration des props avec valeur par défaut pour le mode d'affichage.
const MonthlyProfitabilityWidget: React.FC<MonthlyProfitabilityWidgetProps> = ({
  displayMode = 'full'
}) => {
// === Fin : Déclaration du composant principal ===

  // === Début : Initialisation des hooks ===
  // Explication simple : On prépare des boîtes spéciales pour stocker et changer les informations dont notre widget a besoin, comme des tiroirs où tu ranges différentes choses.
  // Explication technique : Configuration des hooks React et Redux - dispatcher pour les actions, états locaux pour gérer le chargement, les erreurs, les données de rentabilité et les effets visuels.
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
  // === Fin : Initialisation des hooks ===

  // === Début : Fonction de détection de fin de mois ===
  // Explication simple : Cette fonction vérifie si on est proche de la fin du mois pour te rappeler de vérifier la rentabilité, comme quand maman te rappelle qu'il est bientôt l'heure de ranger ta chambre.
  // Explication technique : Méthode qui calcule si la date courante est à 3 jours ou moins de la fin du mois calendaire, pour déclencher une notification visuelle incitant l'utilisateur à vérifier les données avant la clôture mensuelle.
  // Vérifier si nous sommes à la fin du mois pour afficher un badge de notification
  const isEndOfMonth = () => {
    const today = new Date();
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const daysUntilEnd = lastDayOfMonth.getDate() - today.getDate();
    return daysUntilEnd <= 3;
  };
  // === Fin : Fonction de détection de fin de mois ===

  // === Début : Fonction de formatage de date ===
  // Explication simple : Cette fonction transforme une date technique en mots faciles à comprendre, comme quand on écrit "10 juin 2023" au lieu de "10/06/2023".
  // Explication technique : Fonction utilitaire qui convertit une chaîne de date ISO en format localisé pour l'affichage, avec gestion des cas d'absence de date et des erreurs de parsing.
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
  // === Fin : Fonction de formatage de date ===

  // === Début : Fonction de vérification de rentabilité ===
  // Explication simple : Cette fonction va vérifier sur internet combien d'argent chaque client te rapporte, compte les clients rentables, te donne des points et fait apparaître des confettis si c'est une bonne nouvelle.
  // Explication technique : Fonction asynchrone qui effectue une requête HTTP vers l'API de rentabilité, calcule les métriques, met à jour l'état local, dispatch des notifications et déclenche des effets visuels/sonores conditionnels selon les résultats.
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
  // === Fin : Fonction de vérification de rentabilité ===

  // === Début : Rendu en mode compact ===
  // Explication simple : Si on choisit d'afficher une petite version du widget (comme une mini-carte), cette partie dessine une boîte simple avec juste un titre et un bouton.
  // Explication technique : Bloc conditionnel de rendu qui retourne une version simplifiée de l'interface avec un minimum d'éléments UI lorsque le mode compact est sélectionné, optimisé pour les espaces restreints.
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
  // === Fin : Rendu en mode compact ===

  // === Début : Rendu en mode complet ===
  // Explication simple : C'est la grande version de notre widget qui montre beaucoup plus d'informations, avec des jolies couleurs et animations pour célébrer quand tu as de bons résultats.
  // Explication technique : Rendu principal du widget en mode complet, comprenant l'effet de confettis, l'en-tête avec alerte de fin de mois, la grille des métriques clés avec styling contextuel, la gestion des erreurs et le bouton d'action principal avec indicateur de chargement.
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
  // === Fin : Rendu en mode complet ===
};

// === Début : Export du composant ===
// Explication simple : On rend notre widget disponible pour que d'autres parties de l'application puissent l'utiliser, comme quand tu partages ton jouet avec tes amis.
// Explication technique : Export par défaut du composant pour permettre son importation dans d'autres modules de l'application.
export default MonthlyProfitabilityWidget;
// === Fin : Export du composant ===