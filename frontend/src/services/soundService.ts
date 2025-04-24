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

// Classe pour gérer les sons de l'application
class SoundService {
  private sounds: Map<SoundType, HTMLAudioElement | null> = new Map();
  private initialized: boolean = false;
  
  // Initialiser le service audio
  public initialize(): void {
    if (this.initialized) return;
    
    // Liste des sons à précharger
    const soundTypes: SoundType[] = [
      'task_complete',
      'challenge_complete',
      'badge_earned',
      'level_up',
      'celebration',
      'notification',
      'error',
      'success',
      'monthly_reward'
    ];
    
    // Précharger tous les sons
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
      
      // Gérer l'erreur si le fichier n'est pas trouvé
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
    // Vérifier si les sons sont activés dans les paramètres
    const { soundEnabled } = store.getState().ui?.settings || { soundEnabled: true };
    
    if (!soundEnabled) return;
    
    // Vérifier si le service est initialisé
    if (!this.initialized) {
      this.initialize();
    }
    
    // Vérifier si le son existe
    const sound = this.sounds.get(type);
    
    if (!sound) {
      console.warn(`Le son "${type}" n'est pas disponible.`);
      return;
    }
    
    try {
      // Cloner le son pour permettre des lectures simultanées
      const audioClone = sound.cloneNode() as HTMLAudioElement;
      audioClone.volume = volume;
      
      // Jouer le son
      audioClone.play().catch(error => {
        // Gérer l'erreur si la lecture échoue (par exemple, si l'utilisateur n'a pas interagi avec la page)
        console.warn(`Erreur lors de la lecture du son ${type}:`, error);
      });
    } catch (error) {
      console.warn(`Erreur lors de la lecture du son ${type}:`, error);
    }
  }
  
  // Jouer une séquence de sons avec délai
  public playSequence(types: SoundType[], volume: number = 0.5, delay: number = 500): void {
    // Vérifier si les sons sont activés
    const { soundEnabled } = store.getState().ui?.settings || { soundEnabled: true };
    
    if (!soundEnabled) return;
    
    // Jouer les sons en séquence
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
