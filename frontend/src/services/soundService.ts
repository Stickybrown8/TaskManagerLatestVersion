// === Ce fichier gère tous les sons et effets sonores de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/services/soundService.ts
// Explication simple : C'est comme un DJ qui joue les sons appropriés au bon moment - quand tu termines une tâche, gagnes un badge ou reçois une notification.
// Explication technique : Module de service TypeScript qui implémente le pattern Singleton pour gérer le préchargement, la lecture et la configuration des effets sonores dans l'application.
// Utilisé dans : Les services de gamification, les composants qui gèrent les réactions aux actions utilisateur (TaskComplete, BadgeEarned, etc.), et potentiellement le système de notifications.
// Connecté à : Store Redux pour récupérer les préférences sonores de l'utilisateur, fichiers audio MP3 stockés dans le dossier public/sounds, et indirectement aux composants qui déclenchent des sons.

import { store } from '../store';

// === Début : Définition des types de sons disponibles ===
// Explication simple : C'est comme une liste de tous les sons différents que l'application peut jouer, chacun avec un nom facile à retenir.
// Explication technique : Objet constant en TypeScript qui définit l'ensemble des types de sons disponibles, avec la syntaxe 'as const' pour créer un type littéral immuable.
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
// === Fin : Définition des types de sons disponibles ===

// === Début : Classe de gestion des sons ===
// Explication simple : C'est comme une boîte magique qui peut charger et jouer tous les sons de l'application quand on lui demande.
// Explication technique : Classe TypeScript qui implémente le pattern Singleton pour gérer les effets sonores, avec des méthodes pour précharger, jouer et configurer la lecture des fichiers audio.
// Classe pour gérer les sons de l'application
class SoundService {
  // === Début : Propriétés privées de la classe ===
  // Explication simple : Ce sont les tiroirs secrets où la classe garde ses sons et se souvient si elle a déjà chargé les sons ou pas.
  // Explication technique : Propriétés privées qui stockent les références aux éléments audio préchargés et l'état d'initialisation du service, garantissant l'encapsulation des données.
  private sounds: Map<SoundType, HTMLAudioElement | null> = new Map();
  private initialized: boolean = false;
  // === Fin : Propriétés privées de la classe ===

  // === Début : Méthode d'initialisation ===
  // Explication simple : Cette fonction prépare tous les sons au début pour qu'ils soient prêts à être joués rapidement quand on en a besoin.
  // Explication technique : Méthode publique qui initialise le service en préchargeant tous les fichiers audio définis dans SoundTypes, avec vérification pour éviter les initialisations multiples.
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
  // === Fin : Méthode d'initialisation ===

  // === Début : Méthode de préchargement de son ===
  // Explication simple : Cette fonction va chercher un son spécifique et le met en mémoire pour qu'il soit prêt à jouer rapidement.
  // Explication technique : Méthode privée qui crée et précharge un élément Audio pour un type de son spécifique, avec gestion des erreurs si le fichier n'est pas trouvé.
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
  // === Fin : Méthode de préchargement de son ===

  // === Début : Méthode de lecture de son ===
  // Explication simple : Cette fonction joue un son spécifique, comme quand tu appuies sur le bouton play de ton lecteur de musique.
  // Explication technique : Méthode publique qui lit un son préchargé, vérifie les préférences utilisateur, clone l'élément audio pour permettre des lectures simultanées, et gère les erreurs.
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
  // === Fin : Méthode de lecture de son ===

  // === Début : Méthode de lecture séquentielle ===
  // Explication simple : Cette fonction joue plusieurs sons l'un après l'autre, comme quand un DJ fait une suite de musiques dans une playlist.
  // Explication technique : Méthode publique qui orchestre la lecture séquentielle de plusieurs sons avec un délai configurable, utilisant setTimeout pour créer l'effet de séquence.
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
  // === Fin : Méthode de lecture séquentielle ===
}
// === Fin : Classe de gestion des sons ===

// === Début : Exportation du service singleton ===
// Explication simple : Ces lignes créent une seule instance du service pour toute l'application, comme avoir un seul DJ responsable de tous les sons.
// Explication technique : Implémentation du pattern Singleton via l'exportation d'une instance unique de SoundService, permettant un accès global à ce service depuis n'importe quel composant.
// Exporter une instance unique du service
export const soundService = new SoundService();
export default soundService;
// === Fin : Exportation du service singleton ===
