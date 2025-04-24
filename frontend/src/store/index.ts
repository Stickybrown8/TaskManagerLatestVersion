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

// Définir le store Redux
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

// Définir des types explicites pour les états des slices
export interface AuthState {
  user?: {
    name?: string;
    email?: string;
    profile?: {
      avatar?: string;
    };
  } | null;
  isAuthenticated?: boolean;
  token?: string | null;
  loading?: boolean;
  error?: string | null;
}

export interface GamificationState {
  level?: number;
  experience?: number;
  actionPoints?: number;
  badges?: any[];
}

export interface UIState {
  darkMode?: boolean;
  sidebarOpen?: boolean;
}
