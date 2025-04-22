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
  timerPopupSize: "medium" as "medium", // Types explicites
  timerPopupPosition: "bottom-right" as "bottom-right",
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
  // S'assurer que les états initiaux critiques sont correctement définis
  preloadedState: {
    auth: initialAuthState,
    timer: initialTimerState,
    // D'autres états initiaux pourraient être ajoutés ici
  }
});

// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
