// === Ce fichier définit à quoi ressemble un utilisateur dans l'application === /workspaces/TaskManagerLatestVersion/frontend/src/types/User.ts
// Explication simple : Ce fichier est comme une carte d'identité qui décrit toutes les informations qu'on garde sur chaque personne qui utilise l'application - son nom, son email, ses préférences et ses points dans le jeu.
// Explication technique : Module TypeScript qui définit l'interface User, établissant le contrat de type pour les objets utilisateur à travers l'application.
// Utilisé dans : Les composants d'authentification, le profil utilisateur, les réducteurs d'authentification et partout où les données utilisateur sont affichées ou manipulées.
// Connecté à : Store Redux (slices/authSlice.ts), services d'API utilisateur, composants de profil, et indirectement aux fonctionnalités de gamification.

// frontend/src/types/User.ts

// === Début : Définition de l'interface utilisateur ===
// Explication simple : Cette partie décrit toutes les informations que nous gardons sur une personne qui utilise l'application, comme une fiche avec son nom, son email, sa date de naissance, son avatar et ses préférences.
// Explication technique : Interface TypeScript qui définit la structure complète d'un objet utilisateur, incluant les propriétés d'identification, les préférences de profil et les métriques de gamification, avec des champs facultatifs dénotés par le modificateur '?'.
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
// === Fin : Définition de l'interface utilisateur ===