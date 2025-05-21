// === Ce fichier s'occupe de récompenser l'utilisateur quand il atteint ses objectifs financiers avec ses clients === /workspaces/TaskManagerLatestVersion/frontend/src/services/profitabilityRewardService.ts
// Explication simple : Ce fichier contient des fonctions qui vérifient si tu as bien gagné ton argent avec tes clients et qui te donnent des points quand tu y arrives.
// Explication technique : Module de service TypeScript qui encapsule la logique des récompenses de gamification liées à la rentabilité des clients, avec vérifications périodiques et attribution de points.
// Utilisé dans : Le service de gamification général, les composants de tableau de bord financier, et programmé pour s'exécuter automatiquement à la fin de chaque mois.
// Connecté à : API backend via le service api.ts, gamificationService pour l'attribution des points, et indirectement aux composants d'interface qui affichent les récompenses.

import api from './api';
import { gamificationService } from './api';

// === Début : Définition du service de récompenses de rentabilité ===
// Explication simple : C'est comme une boîte qui contient tous les outils pour vérifier si tu as bien travaillé et te donner des points en récompense.
// Explication technique : Objet singleton qui expose une API pour vérifier la rentabilité des clients et gérer l'attribution des récompenses de gamification correspondantes.
// Service pour gérer les récompenses liées à la rentabilité des clients
export const profitabilityRewardService = {
  /**
   * Vérifie le respect des taux horaires pour tous les clients sur le mois écoulé
   * et attribue des points de gamification si les objectifs sont atteints
   */
  // === Début : Fonction de vérification mensuelle de la rentabilité ===
  // Explication simple : Cette fonction vérifie à la fin du mois si tu as gagné suffisamment d'argent avec tes clients et te donne des points bonus si c'est le cas.
  // Explication technique : Méthode asynchrone qui effectue une requête API pour analyser les métriques de rentabilité du mois écoulé et attribue des points de gamification basés sur le nombre de clients rentables.
  checkMonthlyProfitabilityTargets: async (): Promise<{
    totalPointsEarned: number;
    targetsReached: number;
    totalClients: number;
  }> => {
    try {
      // Appel API pour vérifier les cibles de rentabilité du mois
      const response = await api.get('/api/profitability/monthly-check');
      
      // Si des cibles ont été atteintes, attribuer des points
      if (response.data.targetsReached > 0) {
        // Points attribués en fonction du nombre de clients rentables
        const pointsToAward = response.data.targetsReached * 50;
        
        // Ajouter les points au compte de l'utilisateur via le service de gamification
        await gamificationService.addActionPoints(
          pointsToAward,
          'monthly_profitability',
          `Objectif mensuel atteint : ${response.data.targetsReached} client(s) rentable(s)`
        );
        
        // Mettre à jour le total des points gagnés
        response.data.totalPointsEarned = pointsToAward;
      }
      
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la vérification des objectifs de rentabilité mensuels:", error);
      throw error;
    }
  },
  // === Fin : Fonction de vérification mensuelle de la rentabilité ===
  
  /**
   * Vérifie manuellement la rentabilité du mois courant pour un client spécifique
   * Utile pour des vérifications ponctuelles ou pour tester
   */
  // === Début : Fonction de vérification de la rentabilité d'un client spécifique ===
  // Explication simple : Cette fonction vérifie si tu as bien gagné ton argent avec un client particulier et te récompense si c'est le cas.
  // Explication technique : Méthode asynchrone qui interroge l'API pour évaluer la rentabilité d'un client spécifique et attribue des points de gamification si les objectifs de taux horaire sont atteints.
  checkClientProfitability: async (clientId: string): Promise<{
    isOnTarget: boolean;
    currentRate: number;
    targetRate: number;
    hoursSpent: number;
    pointsEarned: number;
  }> => {
    try {
      const response = await api.get(`/api/profitability/check-client/${clientId}`);
      
      // Si le client est rentable, attribuer des points
      if (response.data.isOnTarget) {
        // Points attribués pour un client rentable individuel
        const pointsToAward = 25;
        
        // Ajouter les points au compte de l'utilisateur
        await gamificationService.addActionPoints(
          pointsToAward,
          'client_profitability',
          `Client rentable : ${response.data.clientName}`
        );
        
        // Mettre à jour les points gagnés dans la réponse
        response.data.pointsEarned = pointsToAward;
      }
      
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la vérification de la rentabilité du client:", error);
      throw error;
    }
  },
  // === Fin : Fonction de vérification de la rentabilité d'un client spécifique ===
  
  /**
   * Planifie une vérification automatique à la fin du mois
   * Cette fonction utilise setTimeout pour déclencher la vérification
   * lors du dernier jour du mois courant
   */
  // === Début : Fonction de planification de vérification en fin de mois ===
  // Explication simple : Cette fonction est comme une alarme qui te rappelle de vérifier tes comptes à la fin de chaque mois, comme un parent qui te rappellerait de compter ta tirelire.
  // Explication technique : Méthode qui calcule le temps restant jusqu'à la fin du mois courant et programme une exécution différée de la vérification de rentabilité via setTimeout, avec re-planification récursive.
  scheduleMonthEndCheck: (): void => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    lastDayOfMonth.setHours(23, 59, 59, 999);
    
    const timeUntilEndOfMonth = lastDayOfMonth.getTime() - now.getTime();
    
    // Planifier la vérification pour la fin du mois
    setTimeout(async () => {
      try {
        const result = await profitabilityRewardService.checkMonthlyProfitabilityTargets();
        console.log("Vérification de fin de mois effectuée:", result);
        
        // Re-planifier pour le mois suivant
        profitabilityRewardService.scheduleMonthEndCheck();
      } catch (error) {
        console.error("Erreur lors de la vérification de fin de mois:", error);
      }
    }, timeUntilEndOfMonth);
    
    console.log(`Vérification de rentabilité planifiée pour le ${lastDayOfMonth.toLocaleDateString()}`);
  }
  // === Fin : Fonction de planification de vérification en fin de mois ===
};
// === Fin : Définition du service de récompenses de rentabilité ===

// === Début : Exportation du service ===
// Explication simple : Cette ligne rend ce service disponible pour que d'autres parties de l'application puissent l'utiliser.
// Explication technique : Exportation par défaut du service, permettant son importation nominative dans d'autres modules tout en conservant l'exportation nommée pour des imports spécifiques.
export default profitabilityRewardService;
// === Fin : Exportation du service ===
