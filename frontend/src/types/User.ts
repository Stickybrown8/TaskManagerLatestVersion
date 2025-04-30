// frontend/src/types/User.ts
export interface User {
  id: string;
  name: string;
  email: string;
  birthDate?: string; // <-- Ajoute birthDate ici
  profile?: {
    avatar: string;
    theme: string;
    settings: {
      notifications: boolean;
      language: string;
      soundEffects: boolean;
    };
  };
  gamification?: {
    level: number;
    experience: number;
    actionPoints: number;
    badges: any[];
  };
}