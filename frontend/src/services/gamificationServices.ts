// Import des services de gamification
import { gamificationService } from './api';
import { profitabilityRewardService } from './profitabilityRewardService';

/**
 * Point d'entrée central pour tous les services liés à la gamification
 * Ce fichier regroupe tous les services nécessaires pour la gestion
 * de la gamification dans l'application.
 */
// Define the SoundService class or object
export const soundService = {
  play: (soundName: string, volume: number) => {
    // Implementation for playing a sound
  },
  preloadSounds: () => {
    // Implementation for preloading sounds
    console.log('Sounds preloaded successfully.');
  }
};

const gamificationServices = {
  /**
   * Initialiser tous les services de gamification
   */
  initialize: () => {
    // Précharger les sons pour une utilisation ultérieure
    soundService.preloadSounds();
    
    // Planifier la vérification de rentabilité mensuelle
    profitabilityRewardService.scheduleMonthEndCheck();
    
    console.log('Services de gamification initialisés avec succès.');
  },
  
  /**
   * Service principal de gamification (API)
   */
  gamification: gamificationService,
  
  /**
   * Service pour les récompenses basées sur la rentabilité
   */
  profitabilityReward: profitabilityRewardService,
  
  /**
   * Service pour la gestion des sons
   */
  sound: soundService,
  
  /**
   * Récompenser l'utilisateur pour avoir terminé une tâche
   * @param taskName Nom de la tâche
   * @param points Points à attribuer
   * @param isHighImpact Indique si la tâche est à fort impact
   */
  rewardTaskCompletion: async (taskName: string, points: number, isHighImpact: boolean = false) => {
    try {
      // Ajouter les points d'action à l'utilisateur
      const response = await gamificationService.addActionPoints(
        points,
        'task_completion',
        `Tâche terminée: ${taskName}`
      );
      
      // Jouer un son en fonction de l'importance de la tâche
      if (isHighImpact) {
        soundService.play('challenge_complete', 0.6);
      } else {
        soundService.play('task_complete', 0.5);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récompense pour complétion de tâche:', error);
      throw error;
    }
  },
  
  /**
   * Célébrer un accomplissement spécial (niveau supérieur, badge, etc.)
   * @param type Type de célébration
   * @param message Message à afficher
   */
  celebrate: (type: 'level_up' | 'badge_earned' | 'streak' | 'special', message: string) => {
    // Jouer un son différent selon le type de célébration
    switch (type) {
      case 'level_up':
        soundService.play('level_up', 0.7);
        break;
      case 'badge_earned':
        soundService.play('badge_earned', 0.6);
        break;
      case 'streak':
        soundService.play('challenge_complete', 0.5);
        break;
      case 'special':
        soundService.play('celebration', 0.8);
        break;
    }
    
    // Ici, on pourrait également déclencher une animation spécifique
    // ou ajouter d'autres effets selon le type de célébration
  }
};

export default gamificationServices;
