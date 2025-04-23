// frontend/src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import tasksReducer from './slices/tasksSlice';
import clientsReducer from './slices/clientsSlice';
import gamificationReducer from './slices/gamificationSlice';
import timerReducer from './slices/timerSlice';
import taskImpactReducer from './slices/taskImpactSlice';
import profitabilityReducer from './slices/profitabilitySlice';
import objectivesReducer from './slices/objectivesSlice';

// États initiaux importés ou définis directement ici pour éviter les erreurs
const initialAuthState = {
  isAuthenticated: true, // Forcé à true pour le développement
  user: {
    id: "dev-user-id",
    name: 'Utilisateur Test',
    email: 'test@example.com',
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
      actionPoints: 15,
      badges: []
    }
  },
  token: "fake-token-for-development",
  loading: false,
  error: null,
};

const initialTimerState = {
  runningTimer: null,
  clientTimers: {},
  taskTimers: {},
  currentTimer: null,
  showTimerPopup: false,
  timerPopupSize: "medium" as "small" | "medium" | "large",
  timerPopupPosition: "bottom-right" as "top-right" | "bottom-right" | "center",
  loading: false,
  error: null
};

const initialUiState = {
  sidebarOpen: true,
  darkMode: false,
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
  soundEnabled: true
};

const initialTasksState = {
  tasks: [],
  filteredTasks: [],
  currentTask: null,
  filters: {},
  loading: false,
  error: null
};

// Ajout des états initiaux pour les autres reducers
const initialGamificationState = {
  level: 1,
  experience: 0,
  actionPoints: 10,
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
    data: null
  }
};

const initialClientsState = {
  clients: [],
  currentClient: null,
  loading: false,
  error: null
};

const initialTaskImpactState = {
  highImpactTasks: [],
  impactAnalysis: null,
  loading: false,
  applyingAnalysis: false,
  analysisApplied: false,
  error: null
};

const initialProfitabilityState = {
  clientsProfitability: [],
  currentClientProfitability: null,
  globalSummary: null,
  clientTasks: {},
  loading: false,
  error: null
};

const initialObjectivesState = {
  objectives: {},
  highImpactObjectives: {},
  currentObjective: null,
  loading: false,
  error: null
};

// Configuration du store Redux
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    tasks: tasksReducer,
    clients: clientsReducer,
    gamification: gamificationReducer,
    timer: timerReducer,
    taskImpact: taskImpactReducer,
    profitability: profitabilityReducer,
    objectives: objectivesReducer
  },
});

// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
