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

// Importations nécessaires pour le typage du middleware
import { Middleware, MiddlewareAPI, Dispatch, AnyAction } from '@reduxjs/toolkit';

// Ajout des types explicites au middleware
const timerActionMiddleware: Middleware = 
  (store: MiddlewareAPI) => 
  (next: Dispatch) => 
  (action: AnyAction) => {
    if (action.type.startsWith('timer/')) {
      console.log('⚡ Action timer détectée:', action);
      console.log('📊 État avant:', store.getState().timer);
      const result = next(action);
      console.log('📊 État après:', store.getState().timer);
      return result;
    }
    return next(action);
  };

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
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware().concat(timerActionMiddleware)
});

// Après la définition du store, ajoutez:
// Force une réinitialisation du store pour s'assurer que tous les slices sont correctement instanciés
export function resetStore() {
  store.dispatch({ type: 'RESET_STORE' });
  console.log("Store réinitialisé", store.getState());
}

// Export des types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

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
