import api from './api';
import { gamificationService } from './api';

// Service pour gérer les récompenses liées à la rentabilité des clients
export const profitabilityRewardService = {
  /**
   * Vérifie le respect des taux horaires pour tous les clients sur le mois écoulé
   * et attribue des points de gamification si les objectifs sont atteints
   */
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
  
  /**
   * Vérifie manuellement la rentabilité du mois courant pour un client spécifique
   * Utile pour des vérifications ponctuelles ou pour tester
   */
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
  
  /**
   * Planifie une vérification automatique à la fin du mois
   * Cette fonction utilise setTimeout pour déclencher la vérification
   * lors du dernier jour du mois courant
   */
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
};

export default profitabilityRewardService;
