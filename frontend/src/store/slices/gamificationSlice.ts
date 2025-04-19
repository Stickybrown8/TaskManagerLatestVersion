import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

// État initial
const initialState: GamificationState = {
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

// Slice
const gamificationSlice = createSlice({
  name: 'gamification',
  initialState,
  reducers: {
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
    hideRewardAnimation: (state) => {
      state.rewardAnimation.show = false;
    },
  },
});

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

// Reducer
export default gamificationSlice.reducer;
