import { store } from '../store';

// Type pour les sons disponibles
type SoundType = 
  | 'task_complete' 
  | 'challenge_complete' 
  | 'badge_earned' 
  | 'level_up' 
  | 'celebration' 
  | 'notification' 
  | 'error' 
  | 'success' 
  | 'monthly_reward';

// URLs des fichiers audio
const SOUNDS: Record<SoundType, string> = {
  task_complete: '/sounds/task_complete.mp3',
  challenge_complete: '/sounds/challenge_complete.mp3',
  badge_earned: '/sounds/badge_earned.mp3',
  level_up: '/sounds/level_up.mp3',
  celebration: '/sounds/celebration.mp3',
  notification: '/sounds/notification.mp3',
  error: '/sounds/error.mp3',
  success: '/sounds/success.mp3',
  monthly_reward: '/sounds/monthly_reward.mp3',
};

// Cache pour les éléments audio préchargés
const audioCache: Record<SoundType, HTMLAudioElement> = {} as Record<SoundType, HTMLAudioElement>;

/**
 * Service pour gérer les sons dans l'application
 */
export const soundService = {
  /**
   * Précharger tous les sons pour une utilisation ultérieure
   */
  preloadSounds: () => {
    Object.entries(SOUNDS).forEach(([type, url]) => {
      try {
        const audio = new Audio(url);
        audio.load();
        audioCache[type as SoundType] = audio;
      } catch (error) {
        console.error(`Erreur lors du préchargement du son "${type}":`, error);
      }
    });
  },

  /**
   * Jouer un son spécifique
   * @param type Type de son à jouer
   * @param volume Volume du son (0 à 1)
   * @returns Promise qui se résout lorsque le son est terminé ou rejeté en cas d'erreur
   */
  play: (type: SoundType, volume: number = 0.5): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Vérifier si le son est activé dans les paramètres
        const { soundEnabled } = store.getState().ui || { soundEnabled: true };
        
        if (!soundEnabled) {
          resolve();
          return;
        }
        
        // Utiliser le son préchargé ou créer un nouvel élément audio
        let audio = audioCache[type];
        if (!audio) {
          audio = new Audio(SOUNDS[type]);
          audioCache[type] = audio;
        }
        
        // Configurer le volume et jouer le son
        audio.volume = Math.max(0, Math.min(1, volume));
        
        // Gérer la fin de la lecture
        audio.onended = () => resolve();
        audio.onerror = (error) => reject(error);
        
        // Réinitialiser la position de lecture et jouer le son
        audio.currentTime = 0;
        audio.play().catch(error => {
          console.error(`Erreur lors de la lecture du son "${type}":`, error);
          reject(error);
        });
      } catch (error) {
        console.error(`Erreur lors de la lecture du son "${type}":`, error);
        reject(error);
      }
    });
  },

  /**
   * Arrêter un son spécifique
   * @param type Type de son à arrêter
   */
  stop: (type: SoundType): void => {
    try {
      const audio = audioCache[type];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    } catch (error) {
      console.error(`Erreur lors de l'arrêt du son "${type}":`, error);
    }
  },

  /**
   * Arrêter tous les sons
   */
  stopAll: (): void => {
    try {
      Object.values(audioCache).forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de tous les sons:', error);
    }
  },

  /**
   * Jouer une séquence de sons
   * @param sequence Tableau de types de sons à jouer dans l'ordre
   * @param volume Volume des sons (0 à 1)
   * @returns Promise qui se résout lorsque tous les sons sont terminés
   */
  playSequence: async (sequence: SoundType[], volume: number = 0.5): Promise<void> => {
    try {
      for (const soundType of sequence) {
        await soundService.play(soundType, volume);
      }
    } catch (error) {
      console.error('Erreur lors de la lecture de la séquence de sons:', error);
    }
  },

  /**
   * Jouer un son d'accomplissement basé sur l'importance de l'événement
   * @param importance Niveau d'importance de l'événement (1-5)
   * @returns Promise qui se résout lorsque le son est terminé
   */
  playAchievement: async (importance: number = 3): Promise<void> => {
    try {
      const soundMap: Record<number, SoundType> = {
        1: 'task_complete',
        2: 'success',
        3: 'challenge_complete',
        4: 'badge_earned',
        5: 'celebration'
      };
      
      const soundType = soundMap[Math.min(5, Math.max(1, Math.round(importance)))] || 'success';
      const volume = 0.3 + (importance * 0.1); // Volume croissant avec l'importance
      
      await soundService.play(soundType, volume);
    } catch (error) {
      console.error('Erreur lors de la lecture du son d\'accomplissement:', error);
    }
  }
};

export default soundService;
