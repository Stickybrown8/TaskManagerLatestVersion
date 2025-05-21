// frontend/src/store/initialStates.ts
// This file defines the initial states for all Redux reducers, now with TypeScript types.

import { User } from '../types/User'; // Adjusted path for User type
import { AuthState } from './slices/authSlice';
import { UIState } from './slices/uiSlice';
import { GamificationState } from './slices/gamificationSlice';
import { TasksState } from './slices/tasksSlice';
import { ClientsState } from './slices/clientsSlice';
import { TimerState } from './slices/timerSlice';
import { TaskImpactState } from './slices/taskImpactSlice';
import { ProfitabilityState } from './slices/profitabilitySlice';
import { ObjectivesState } from './slices/objectivesSlice';

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: { // This structure should conform to the imported User type
    id: "fake-user-id",
    name: 'Utilisateur',
    email: 'utilisateur@exemple.com',
    // birthDate is optional in User type
    profile: {
      avatar: '/default-avatar.png',
      theme: 'default',
      settings: {
        notifications: true,
        language: 'fr',
        soundEffects: true
      }
    },
    gamification: {
      level: 1,
      experience: 0,
      actionPoints: 0,
      badges: [] // Conforms to any[] in User.gamification
    }
  },
  loading: false,
  error: null,
  rehydrated: false, // Added as per AuthState definition in authSlice.ts
};

export const initialUiState: UIState = {
  // settings is part of UIState, ensure it's included if not already
  settings: { // Added based on UIState definition in uiSlice.ts
    soundEnabled: true,
  },
  darkMode: false,
  sidebarOpen: true,
  currentTheme: 'default',
  notifications: [],
  modalOpen: false,
  modalContent: {
    type: null,
    data: null
  },
  loading: {
    global: false,
    tasks: false,
    clients: false,
    auth: false,
    gamification: false
  },
  soundEnabled: true // This was in initialStates.js, also in UIState
};

export const initialGamificationState: GamificationState = {
  level: 1,
  experience: 0,
  actionPoints: 0,
  totalPointsEarned: 0,
  currentStreak: 0,
  longestStreak: 0,
  badges: [],
  activities: [],
  levels: [], // Assuming Level[] type based on GamificationState
  loading: false,
  error: null,
  rewardAnimation: {
    show: false,
    type: null, // Matches 'experience' | 'badge' | 'level' | 'points' | null
    data: null
  }
};

export const initialTasksState: TasksState = {
  tasks: [],
  filteredTasks: [],
  currentTask: null,
  filters: {}, // Conforms to TasksState['filters']
  loading: false,
  error: null,
  lastFetched: null, // Added as per TasksState definition in tasksSlice.ts
};

export const initialClientsState: ClientsState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null
};

export const initialTimerState: TimerState = {
  runningTimer: null,
  clientTimers: {}, // Record<string, Timer>
  taskTimers: {},   // Record<string, Timer>
  currentTimer: null,
  showTimerPopup: false,
  timerPopupSize: "medium", // Conforms to 'small' | 'medium' | 'large'
  timerPopupPosition: "bottom-right", // Conforms to 'top-right' | 'bottom-right' | 'center'
  loading: false,
  error: null
};

export const initialTaskImpactState: TaskImpactState = {
  highImpactTasks: [], // Task[]
  impactAnalysis: null, // ImpactAnalysis | null
  loading: false,
  applyingAnalysis: false,
  analysisApplied: false,
  error: null
};

export const initialProfitabilityState: ProfitabilityState = {
  clientsProfitability: [], // ClientProfitability[]
  currentClientProfitability: null, // ClientProfitability | null
  globalSummary: null, // GlobalSummary | null
  clientTasks: {}, // Record<string, any[]>
  loading: false,
  error: null
};

export const initialObjectivesState: ObjectivesState = {
  objectives: {}, // Record<string, Objective>
  highImpactObjectives: {}, // Record<string, Objective>
  currentObjective: null, // Objective | null
  loading: false,
  error: null
};
