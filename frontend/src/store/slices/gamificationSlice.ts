// === Ce fichier gère tous les éléments amusants comme les points, badges et niveaux de l'application === /workspaces/TaskManagerLatestVersion/frontend/src/store/slices/gamificationSlice.ts
// Explication simple : Ce fichier est comme le tableau de score d'un jeu vidéo qui garde en mémoire tes points, tes badges, ton niveau et toutes tes récompenses dans l'application.
// Explication technique : Module Redux Toolkit qui définit un "slice" pour gérer l'état de gamification, utilisant l'API createSlice pour encapsuler la logique de réduction des actions liées aux récompenses et accomplissements.
// Utilisé dans : Les composants qui affichent ou modifient les éléments de gamification comme ProfileBadges, LevelProgress, UserDashboard, et tous les endroits qui attribuent des récompenses.
// Connecté à : Store Redux principal, actions de gamification, service de gamification (API), et composants React qui affichent ou interagissent avec les éléments de gamification.

// frontend/src/store/slices/gamificationSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// === Début : Définition des types de gamification ===
// Explication simple : Ces lignes décrivent tous les éléments amusants de l'application - comme les points, les niveaux, les badges - pour que l'ordinateur sache comment les ranger.
// Explication technique : Interfaces TypeScript qui définissent la structure complète de l'état de gamification et ses entités associées (badges, activités, niveaux), établissant un contrat type pour toute l'application.
// Types
interface GamificationState {
  level: number;
  experience: number;
  actionPoints: number;
  totalPointsEarned: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  activities: Activity[];
  levels: Level[];
  loading: boolean;
  error: string | null;
  rewardAnimation: {
    show: boolean;
    type: 'experience' | 'badge' | 'level' | 'points' | null;
    data: any;
  };
}

interface Badge {
  _id: string;
  name: string;
  description: string;
  category: string;
  level: number;
  icon: string;
  rarity: 'commun' | 'rare' | 'épique' | 'légendaire';
  earnedAt?: string;
  displayed?: boolean;
}

interface Activity {
  _id: string;
  type: string;
  description: string;
  timestamp: string;
  details: {
    taskId?: string;
    clientId?: string;
    badgeId?: string;
    pointsEarned?: number;
    experienceEarned?: number;
    levelUp?: boolean;
  };
}

interface Level {
  _id: string;
  level: number;
  name: string;
  experienceRequired: number;
  rewards: {
    actionPoints: number;
    features: string[];
    themes: string[];
    avatars: string[];
  };
  icon: string;
}
// === Fin : Définition des types de gamification ===

// === Début : Configuration de l'état initial ===
// Explication simple : Ces lignes préparent l'état de départ - au début, tu es niveau 1, tu n'as pas de points ni de badges, comme quand tu commences un nouveau jeu vidéo.
// Explication technique : Objet définissant l'état initial du slice de gamification avec toutes les propriétés à leurs valeurs par défaut, exporté pour permettre sa réutilisation dans d'autres modules.
// État initial - Exporté pour être utilisé dans initialStates.js
export const initialGamificationState: GamificationState = {
  level: 1,
  experience: 0,
  actionPoints: 0,
  totalPointsEarned: 0,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  activities: [],
  levels: [],
  loading: false,
  error: null,
  rewardAnimation: {
    show: false,
    type: null,
    data: null,
  },
};
// === Fin : Configuration de l'état initial ===

// === Début : Création du slice de gamification ===
// Explication simple : Ce morceau crée une grande boîte magique qui contient toutes les actions possibles pour gérer tes points, badges et niveaux - comme le moteur d'un jeu vidéo.
// Explication technique : Utilisation de createSlice de Redux Toolkit pour définir un ensemble de reducers qui modifient l'état de gamification en réponse à diverses actions, organisés par fonctionnalité.
// Slice
const gamificationSlice = createSlice({
  name: 'gamification',
  initialState: initialGamificationState,
  reducers: {
    // === Début : Actions pour récupérer le profil de gamification ===
    // Explication simple : Ces actions gèrent quand tu demandes à voir ton tableau de score - elles disent "je cherche", puis "voici tes scores" ou "je n'ai pas pu les trouver".
    // Explication technique : Trio de reducers qui gèrent le cycle de vie d'une requête asynchrone pour récupérer le profil de gamification complet de l'utilisateur.
    fetchGamificationProfileStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchGamificationProfileSuccess: (state, action: PayloadAction<Partial<GamificationState>>) => {
      return {
        ...state,
        ...action.payload,
        loading: false,
      };
    },
    fetchGamificationProfileFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer le profil de gamification ===
    
    // === Début : Actions pour récupérer les badges ===
    // Explication simple : Ces actions gèrent quand tu veux voir tous tes badges - comme quand tu regardes ta collection de trophées.
    // Explication technique : Ensemble de reducers qui gèrent la récupération de la liste des badges de l'utilisateur, avec états de chargement, succès et erreur.
    fetchBadgesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchBadgesSuccess: (state, action: PayloadAction<Badge[]>) => {
      state.badges = action.payload;
      state.loading = false;
    },
    fetchBadgesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer les badges ===
    
    // === Début : Actions pour récupérer l'historique d'activités ===
    // Explication simple : Ces actions gèrent quand tu veux voir l'histoire de tout ce que tu as fait et gagné - comme un journal de tes aventures.
    // Explication technique : Groupe de reducers qui contrôlent la récupération de l'historique des activités de gamification de l'utilisateur.
    fetchActivitiesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchActivitiesSuccess: (state, action: PayloadAction<Activity[]>) => {
      state.activities = action.payload;
      state.loading = false;
    },
    fetchActivitiesFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer l'historique d'activités ===
    
    // === Début : Actions pour récupérer les niveaux ===
    // Explication simple : Ces actions gèrent quand tu veux voir tous les niveaux que tu peux atteindre - comme regarder une carte des mondes à débloquer dans un jeu.
    // Explication technique : Ensemble de reducers qui gèrent la récupération des données de progression des niveaux et leurs récompenses associées.
    fetchLevelsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchLevelsSuccess: (state, action: PayloadAction<Level[]>) => {
      state.levels = action.payload;
      state.loading = false;
    },
    fetchLevelsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour récupérer les niveaux ===
    
    // === Début : Actions pour ajouter de l'expérience ===
    // Explication simple : Ces actions s'occupent de te donner des points d'expérience quand tu fais quelque chose de bien, et te font monter de niveau quand tu en as assez.
    // Explication technique : Groupe de reducers qui gèrent l'ajout d'expérience, la vérification du franchissement de niveau, et le déclenchement d'animations de récompense correspondantes.
    addExperienceStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    addExperienceSuccess: (state, action: PayloadAction<{
      newExperience: number;
      newLevel: number;
      levelUp: boolean;
    }>) => {
      state.experience = action.payload.newExperience;
      state.level = action.payload.newLevel;
      state.loading = false;
      
      // Afficher l'animation de récompense si level up
      if (action.payload.levelUp) {
        state.rewardAnimation = {
          show: true,
          type: 'level',
          data: {
            level: action.payload.newLevel,
          },
        };
      }
    },
    addExperienceFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour ajouter de l'expérience ===
    
    // === Début : Actions pour ajouter des points d'action ===
    // Explication simple : Ces actions gèrent quand tu gagnes des points que tu peux dépenser pour des choses spéciales - comme gagner des pièces dans un jeu.
    // Explication technique : Ensemble de reducers qui contrôlent l'ajout de points d'action, la mise à jour du compteur total, et le déclenchement d'animations de récompense.
    addActionPointsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    addActionPointsSuccess: (state, action: PayloadAction<{
      newActionPoints: number;
      totalPointsEarned: number;
    }>) => {
      state.actionPoints = action.payload.newActionPoints;
      state.totalPointsEarned = action.payload.totalPointsEarned;
      state.loading = false;
      
      // Afficher l'animation de récompense
      state.rewardAnimation = {
        show: true,
        type: 'points',
        data: {
          points: action.payload.newActionPoints - state.actionPoints,
        },
      };
    },
    addActionPointsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour ajouter des points d'action ===
    
    // === Début : Actions pour mettre à jour les séries de jours consécutifs ===
    // Explication simple : Ces actions suivent combien de jours de suite tu as utilisé l'application - comme un compteur de jours où tu n'as pas oublié de faire tes devoirs.
    // Explication technique : Groupe de reducers qui gèrent la mise à jour du streak actuel et du record historique de jours consécutifs d'utilisation.
    updateStreakStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    updateStreakSuccess: (state, action: PayloadAction<{
      currentStreak: number;
      longestStreak: number;
    }>) => {
      state.currentStreak = action.payload.currentStreak;
      state.longestStreak = action.payload.longestStreak;
      state.loading = false;
    },
    updateStreakFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour mettre à jour les séries de jours consécutifs ===
    
    // === Début : Actions pour gagner un badge ===
    // Explication simple : Ces actions s'occupent de te donner un nouveau badge quand tu accomplis quelque chose de spécial - comme recevoir une médaille.
    // Explication technique : Ensemble de reducers qui gèrent l'attribution d'un nouveau badge, son ajout à la collection, et le déclenchement d'une animation célébrant cette récompense.
    earnBadgeStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    earnBadgeSuccess: (state, action: PayloadAction<Badge>) => {
      state.badges.push(action.payload);
      state.loading = false;
      
      // Afficher l'animation de récompense
      state.rewardAnimation = {
        show: true,
        type: 'badge',
        data: action.payload,
      };
    },
    earnBadgeFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    // === Fin : Actions pour gagner un badge ===
    
    // === Début : Action pour masquer l'animation de récompense ===
    // Explication simple : Cette action fait disparaître le dessin animé qui apparaît quand tu gagnes quelque chose, une fois que tu l'as bien vu.
    // Explication technique : Reducer simple qui réinitialise l'état d'affichage de l'animation de récompense, généralement appelé après que l'animation a été présentée à l'utilisateur.
    hideRewardAnimation: (state) => {
      state.rewardAnimation.show = false;
    },
    // === Fin : Action pour masquer l'animation de récompense ===
  },
});
// === Fin : Création du slice de gamification ===

// === Début : Exportation des actions ===
// Explication simple : Ces lignes rendent toutes les actions disponibles pour le reste de l'application, comme une liste de commandes que tout le monde peut utiliser.
// Explication technique : Destructuration et exportation des créateurs d'actions générés automatiquement par createSlice, permettant leur utilisation dans les composants via useDispatch.
// Actions
export const {
  fetchGamificationProfileStart,
  fetchGamificationProfileSuccess,
  fetchGamificationProfileFailure,
  fetchBadgesStart,
  fetchBadgesSuccess,
  fetchBadgesFailure,
  fetchActivitiesStart,
  fetchActivitiesSuccess,
  fetchActivitiesFailure,
  fetchLevelsStart,
  fetchLevelsSuccess,
  fetchLevelsFailure,
  addExperienceStart,
  addExperienceSuccess,
  addExperienceFailure,
  addActionPointsStart,
  addActionPointsSuccess,
  addActionPointsFailure,
  updateStreakStart,
  updateStreakSuccess,
  updateStreakFailure,
  earnBadgeStart,
  earnBadgeSuccess,
  earnBadgeFailure,
  hideRewardAnimation,
} = gamificationSlice.actions;
// === Fin : Exportation des actions ===

// === Début : Exportation du reducer ===
// Explication simple : Cette ligne rend tout le système de gestion des points et badges disponible pour le reste de l'application.
// Explication technique : Exportation par défaut du reducer généré par createSlice, qui sera combiné avec d'autres reducers dans le store Redux principal.
// Reducer
export default gamificationSlice.reducer;
// === Fin : Exportation du reducer ===
