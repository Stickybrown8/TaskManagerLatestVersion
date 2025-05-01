import { store } from '../store';

// Objet constant pour les sons disponibles (pour vérification dynamique)
export const SoundTypes = {
  TaskComplete: 'task_complete',
  ChallengeComplete: 'challenge_complete',
  BadgeEarned: 'badge_earned',
  LevelUp: 'level_up',
  Celebration: 'celebration',
  Notification: 'notification',
  Error: 'error',
  Success: 'success',
  MonthlyReward: 'monthly_reward'
} as const;

// Type TypeScript dérivé de l'objet
export type SoundType = typeof SoundTypes[keyof typeof SoundTypes];

// Classe pour gérer les sons de l'application
class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement | null> = new Map();
  private initialized: boolean = false;

  // Initialiser le service audio
  public initialize(): void {
    if (this.initialized) return;
    const soundTypes = Object.values(SoundTypes);
    soundTypes.forEach(type => {
      this.preloadSound(type);
    });
    this.initialized = true;
    console.log('Service audio initialisé');
  }

  // Précharger un son spécifique
  private preloadSound(type: SoundType): void {
    try {
      const audio = new Audio(`/sounds/${type}.mp3`);
      audio.addEventListener('error', () => {
        console.warn(`Fichier audio non trouvé: ${type}.mp3`);
        this.sounds.set(type, null);
      });
      this.sounds.set(type, audio);
    } catch (error) {
      console.warn(`Erreur lors du préchargement du son ${type}:`, error);
      this.sounds.set(type, null);
    }
  }

  // Jouer un son
  public play(type: SoundType, volume: number = 0.5): void {
    const { soundEnabled } = store.getState().ui?.settings || { soundEnabled: true };
    if (!soundEnabled) return;
    if (!this.initialized) {
      this.initialize();
    }
    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Le son "${type}" n'est pas disponible.`);
      return;
    }
    try {
      const audioClone = sound.cloneNode() as HTMLAudioElement;
      audioClone.volume = volume;
      audioClone.play().catch(error => {
        console.warn(`Erreur lors de la lecture du son ${type}:`, error);
      });
    } catch (error) {
      console.warn(`Erreur lors de la lecture du son ${type}:`, error);
    }
  }

  // Jouer une séquence de sons avec délai
  public playSequence(types: SoundType[], volume: number = 0.5, delay: number = 500): void {
    const { soundEnabled } = store.getState().ui?.settings || { soundEnabled: true };
    if (!soundEnabled) return;
    types.forEach((type, index) => {
      setTimeout(() => {
        this.play(type, volume);
      }, index * delay);
    });
  }
}

// Exporter une instance unique du service
export const soundService = new SoundService();
export default soundService;
